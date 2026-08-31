import { CloseCircleOutlined, DeleteOutlined, EditOutlined, InsertRowBelowOutlined, MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Drawer, Dropdown, message, Popconfirm, Popover, Select, Space, Tag, Typography, Empty, Divider } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import type { IIoK8sApiRbacV1Subject, IRoleBinding, RoleBindingList } from 'kubernetes-models/rbac.authorization.k8s.io/v1';
import debounce from 'lodash/debounce';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import { RenderRoleBinding } from '@/pages/kubernetes/components/policy';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';

import { canAccessClusterNamespaces } from '@/services/personal.api';
import { getClusterResource } from '@/utils/cluster';
import { appendKubernetesViewQuery, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { syncClusterNamespace } from '@/services/cluster.api';

import AICopilot from '@/pages/kubernetes/components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const { cluster, namespace } = getCurrentViewInfo();
  const [dataSource, setDataSource] = useState<IRoleBinding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const formRef = useRef<ProFormInstance>(undefined);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchAnnotationsVisible, setPatchAnnotationsVisible] = useState<boolean>(false);
  const [patchRoleBinding, setPatchRoleBinding] = useState<IRoleBinding>();
  const [patchModalKey, setPatchModalKey] = useState<string>('');
  const intl = useIntl();
  const address = namespace ? `apis/rbac.authorization.k8s.io/v1/namespaces/${namespace}/rolebindings` : `apis/rbac.authorization.k8s.io/v1/rolebindings`;
  const [searchName, setSearchName] = useState<string>('');
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState<boolean>(false);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  let BaseAddress = `/kubernetes/namespace/access/rolebindings`;
  if (!namespace || namespace === '' || namespace === '-') {
    BaseAddress = `/kubernetes/cluster/access/rolebindings`;
  }
  const style = { fontSize: '10px', marginBottom: '0' };
  const debouncedNamespaceChange = debounce((value) => { setSearchNamespace(value); }, 1000);
  const [selectedNamespace, setSelectedNamespace] = useState<string>(namespace);
  const [userNamespaces, setUserNamespaces] = useState<ClusterNamespaceDetail[]>([]);
  const [searchNamespace, setSearchNamespace] = useState<string>('');
  const listNamespaces = async () => {
    const params = { cluster, search: searchNamespace } as Record<string, any>;
    const data = (await canAccessClusterNamespaces(params)) as ClusterNamespaceDetailList;
    setUserNamespaces(data.data || []);
  };
  useEffect(() => {
    if (!namespace || namespace === '' || namespace === '-') {
      listNamespaces();
    }
  }, [searchNamespace]);
  const listRoleBindings = async () => {
    setLoading(true);
    try {
      const params = { cluster, address: address } as Record<string, any>;
      const fieldSelector = {} as Record<string, string>;
      if (namespace && namespace) {
        fieldSelector['metadata.namespace'] = namespace;
      } else if (selectedNamespace && selectedNamespace !== '') {
        fieldSelector['metadata.namespace'] = selectedNamespace;
      }
      if (searchName !== '') {
        fieldSelector['metadata.name'] = searchName;
      }
      if (Object.keys(searchFields).length > 0) {
        for (const key in searchFields) {
          fieldSelector[key] = searchFields[key];
        }
      }
      if (Object.keys(fieldSelector).length > 0) {
        const fieldSelectors = [] as string[];
        for (const key in fieldSelector) {
          fieldSelectors.push(`${key}=${fieldSelector[key]}`);
        }
        params['fieldSelector'] = fieldSelectors.join(',');
      }
      if (Object.keys(searchLabels).length > 0) {
        const labelSelectors = [] as string[];
        for (const key in searchLabels) {
          labelSelectors.push(`${key}=${searchLabels[key]}`);
        }
        params['labelSelector'] = labelSelectors.join(',');
      }
      const data = (await clusterGetProxy(params)) as RoleBindingList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'RoleBinding';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listRoleBindings();

  }, []);


  const patchVisibleReflash = (visible: boolean) => {
    setPatchAnnotationsVisible(false);
    setPatchLabelVisible(false);
    setDetailDrawerVisible(false);
    setResourceDrawerVisible(false);
    setEditorResource(false);
    actionRef.current?.reload();
  };
  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };
  const handleRemove = async (intl: IntlShape, selectedRow: IRoleBinding) => {
    if (!selectedRow) return true;
    // 判断是系统创建还是直接调用apiserver创建
    if (selectedRow.metadata?.labels && selectedRow.metadata?.labels['efucloud.com/source'] === 'efucloud') {
      // todo 调用系统接口先删除系统中的记录，再删除集群中的记录
    } else {
      // 直接调用apiserver删除
      const params = {

        cluster,
        address: `apis/rbac.authorization.k8s.io/v1/namespaces/${selectedRow.metadata?.namespace}/rolebindings/${selectedRow.metadata?.name}`,
      };
      await clusterDeleteProxy(params);
    }
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };
  const moreItems = (record: IRoleBinding) => {
    const nodes = [
      {
        key: 'view-yaml',
        label: (
          <a
            onClick={() => {
              setPatchRoleBinding(record);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.view.yaml" />
          </a>
        ),
      },
    ];
    if (
      !(
        record.metadata?.labels &&
        record.metadata?.labels['kubernetes.io/bootstrapping']
      )
    ) {
      nodes.push({
        key: 'edit-yaml',
        label: (
          <a
            onClick={() => {
              setPatchRoleBinding(record);
              setEditorResource(true);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.edit.yaml" />
          </a>
        ),
      });
      nodes.push({
        key: 'annotation',
        label: (
          <a
            onClick={() => {
              setPatchRoleBinding(record);
              setPatchAnnotationsVisible(true);
              setPatchModalKey('annotations-' + record.metadata?.name);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.patch.annotations" />
          </a>
        ),
      });
      nodes.push({
        key: 'label',
        label: (
          <a
            onClick={() => {
              setPatchRoleBinding(record);
              setPatchLabelVisible(true);
              setPatchModalKey('labels-' + record.metadata?.name);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.patch.labels" />
          </a>
        ),
      });
    }

    return nodes;
  };




  const columns: ProColumns<IRoleBinding>[] = [
    {
      title: <FormattedMessage id="cluster.namespace" />,
      dataIndex: 'namespace',
      hidden: !!namespace,
      search: !namespace,
      onFilter: true,
      valueType: 'select',
      renderFormItem: (_, { defaultRender }) => {
        return (
          <Select
            allowClear
            showSearch={{
              filterOption: false,
              onSearch(value) {
                debouncedNamespaceChange(value);
              },
            }}
            onChange={(value) => {
              setSelectedNamespace(value);
            }}
            popupRender={(menu) => {
              if (userNamespaces.length == 0) {
                return (
                  <div style={{ padding: 16, textAlign: 'center' }}>
                    <Empty description={intl.formatMessage({ id: 'pages.no.data' })} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    <Button
                      type="primary"
                      onClick={syncNamespace}
                    >
                      <FormattedMessage id='cluster.namespace.sync' />
                    </Button>
                  </div>
                );
              }
              return menu
            }}
          >
            {userNamespaces?.map((item: ClusterNamespaceDetail) => {
              return (
                <Select.Option key={item.namespace} value={item.namespace}>
                  {item.namespace}
                </Select.Option>
              );
            })}
          </Select>
        );
      },
      render: (dom, entity) => {
        return (
          <>
            <a
              onClick={() => {
                window.open(
                  appendKubernetesViewQuery(`/kubernetes/namespace/access/rolebindings`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
                );
              }}
            >
              {entity?.metadata?.namespace}
            </a>
          </>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'name',
      search: { transform: (value: string) => setSearchName(value) },
      render: (dom, entity) => {
        return (
          <a
            onClick={(e) => {
              e.preventDefault();
              setPatchRoleBinding(entity);
              setDetailDrawerVisible(true);
            }}
          >
            {entity?.metadata?.name}
          </a>
        );
      },
    },

    {
      title: intl.formatMessage({ id: 'cluster.resource.labels' }),
      hideInTable: !expandInfo,
      renderFormItem: (item, { defaultRender }) => {
        const labels = [] as string[];
        const keys = Object.keys(searchLabels);
        if (keys.length > 0) {
          for (const key in searchLabels) {
            labels.push(`${key}=${searchLabels[key]}`);
          }
        }
        return (
          <Space>
            <div
              onClick={() => {
                if (labelSelectorVisible) {
                  setLabelSelectorVisible(false);
                }
                setLabelSelectorVisible(true);
              }}
            >
              <Popover
                placement="top"
                title={
                  <div>
                    <span style={{ color: colorPrimary, fontSize: '10px' }}>

                      <FormattedMessage id="cluster.labelSelector.click" />
                    </span>
                    <Space orientation='vertical' size='small'>
                      {keys?.map((key: string) => (
                        <>
                          <Tag style={{ border: 0 }} key={key}>
                            {key}={searchLabels[key]}
                          </Tag>
                        </>
                      ))}
                    </Space>
                  </div>
                }
              >
                <InsertRowBelowOutlined style={{ color: colorPrimary }} />
                {labels.length > 0 && (
                  <Text ellipsis>
                    &nbsp;&nbsp;{labels.join(',').substring(0, 10) + '...'}
                  </Text>
                )}
              </Popover>
            </div>
            {keys.length > 0 && (
              <CloseCircleOutlined
                style={{ color: 'red' }}
                onClick={() => setSearchLabels({})}
              />
            )}
          </Space>
        );
      },
      render: (dom, entity: IRoleBinding) => {
        const keys = Object.keys(entity?.metadata?.labels || {});
        if (keys.length === 0) {
          return <span>-</span>;
        }
        if (expandInfo) {
          return (
            <Space orientation='vertical' size='small'>
              {Object.keys(entity?.metadata?.labels || {})?.map(
                (key: string) => (
                  <>
                    <Tag style={{ border: 0 }} key={key}>
                      {key}={entity?.metadata?.labels[key]}
                    </Tag>
                  </>
                ),
              )}
            </Space>
          );
        } else {
          return (
            <Popover
              placement="right"
              title={
                <div>
                  {keys?.map((key: string) => (
                    <>
                      <Tag style={{ border: 0 }} key={key}>
                        {key}={entity?.metadata?.labels[key]}
                      </Tag>
                      <br />
                    </>
                  ))}
                </div>
              }
            >
              <UnorderedListOutlined style={{ color: colorPrimary }} />
            </Popover>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.binding.subjects' }),
      search: false,
      dataIndex: 'subjects',
      render: (dom, entity: IRoleBinding) => {
        return (
          <>
            {entity.subjects?.map((item: IIoK8sApiRbacV1Subject) => {
              let kind = '' as string;
              let namespace = '' as string;
              let account = '' as string;
              if (item.kind === 'User') {
                kind = intl.formatMessage({
                  id: 'cluster.resource.binding.subjects.User',
                });
              } else if (item.kind === 'Group') {
                kind = intl.formatMessage({
                  id: 'cluster.resource.binding.subjects.Group',
                });
              } else if (item.kind === 'ServiceAccount') {
                kind = intl.formatMessage({
                  id: 'cluster.resource.binding.subjects.ServiceAccount',
                });
              }
              if (item.name.startsWith('system:serviceaccount:')) {
                const list = item.name.split(':');
                namespace =
                  intl.formatMessage({ id: 'cluster.namespace' }) +
                  `:${list[2]}`;
                account =
                  intl.formatMessage({
                    id: 'cluster.resource.binding.subjects.ServiceAccount',
                  }) + `:${list[3]}`;
              } else if (item.name.startsWith('system:')) {
                account =
                  intl.formatMessage({
                    id: 'cluster.resource.binding.subjects.system.namespace',
                  }) + `:${item.name}`;
              } else {
                account = item.name;
              }
              if (namespace === '' && item.namespace) {
                namespace =
                  intl.formatMessage({ id: 'cluster.namespace' }) +
                  `:${item.namespace}`;
                account =
                  intl.formatMessage({
                    id: 'cluster.resource.binding.subjects.ServiceAccount',
                  }) + `:${account}`;
              }
              if (namespace) {
                return (
                  <div>
                    <p style={style}>{kind}</p>
                    <p style={style}>{namespace}</p>
                    <p style={style}>{account}</p>
                  </div>
                );
              } else {
                return (
                  <div>
                    <p style={style}>{kind}</p>
                    <p style={style}>{account}</p>
                  </div>
                );
              }
            })}
          </>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.role' }),
      search: false,
      width: 200,
      dataIndex: 'roleRef',
      render: (dom, entity: IRoleBinding) => {
        return (
          <div>
            <Text copyable> {entity.roleRef?.name}</Text>
          </div>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: IRoleBinding) => {
        return (
          <span>
            {dayjs(entity.metadata?.creationTimestamp).format(
              'YYYY-MM-DD HH:mm:ss',
            )}
          </span>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      render: (_, record) => {
        const nodes = [];
        if (!(record.metadata?.labels && record.metadata?.labels['kubernetes.io/bootstrapping'])) {
          nodes.push(
            <a
              key="edit"
              onClick={() => {
                window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/access/rolebindings/${record?.metadata?.name}/update`, { cluster: cluster, namespace: record?.metadata?.namespace });
              }}
            >
              <EditOutlined style={{ color: colorPrimary }} />
            </a>,
          );
          nodes.push(
            <Popconfirm
              key={record.metadata?.resourceVersion + '-delete'}
              description={intl.formatMessage({
                id: 'cluster.rolebinding.delete.description',
              })}
              title={
                intl.formatMessage({
                  id: 'pages.operation.delete.description',
                }) +
                intl.formatMessage({ id: 'cluster.rolebinding' }) +
                '【' +
                record.metadata?.name +
                '】'
              }
              onConfirm={() => {
                handleRemove(intl, record);
              }}
              okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
              cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
            >
              <DeleteOutlined style={{ color: 'red' }} />
            </Popconfirm>,
          );
        }

        nodes.push(
          <Dropdown menu={{ items: moreItems(record) }} key="more">
            <a
              style={{ color: colorPrimary }}
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              <Space>
                <MoreOutlined style={{ color: colorPrimary }} />
              </Space>
            </a>
          </Dropdown>,
        );
        return <Space>{nodes}</Space>;
      },
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.rolebinding' })}
      subTitle="RoleBinding"
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IRoleBinding>
        key='role-binding'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey={(record: IRoleBinding) =>
          `${record?.metadata?.name}-${record.metadata?.resourceVersion}`
        }
        search={{
          showHiddenNum: true,
          optionRender: ({ searchText, resetText }) => {
            return [
              <Button
                key="reset"
                onClick={() => {
                  setSearchLabels({});
                  setSearchFields({});
                  setSearchName('');
                  formRef?.current?.resetFields();


                }}
              >

                {resetText}
              </Button>,
              <Button
                key="search"
                type="primary"
                onClick={() => {

                  listRoleBindings();
                }}
              >

                {searchText}
              </Button>,
            ];
          },
        }}
        options={{
          reload: () => {

            listRoleBindings();
          }
        }}
        pagination={{
          showQuickJumper: true,
          showSizeChanger: true,
          locale: {
            items_per_page: intl.formatMessage({
              id: 'pages.pagination.items_per_page',
            }),
            jump_to: intl.formatMessage({ id: 'pages.pagination.jump_to' }),
            page: intl.formatMessage({ id: 'pages.pagination.page' }),
          },
        }}
        locale={{
          emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
        }}
        toolBarRender={() => [
          <Space separator={<Divider orientation="vertical" />}>



            <a style={{ color: colorPrimary }} onClick={() => setExpandInfo(!expandInfo)}  >
              {expandInfo ? (<FormattedMessage id="cluster.node.shrink" />) : (<FormattedMessage id="cluster.node.expand" />)}
            </a>
            <Access accessible={true} key={'create'}>
              <Button
                type="primary"
                key="create"
                onClick={() => {
                  window.location.href = appendKubernetesViewQuery(`${BaseAddress}/create/text`);
                }}
              >
                <FormattedMessage id="cluster.resource.create.text" />
              </Button>
            </Access>
          </Space>,
        ]}
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowSelection={false}
      />

      {patchLabelVisible && (
        <PatchLabels
          setVisible={patchVisibleReflash}
          patchType="labels"
          title={<FormattedMessage id="cluster.patch.labels" />}
          key={'labels-' + patchModalKey}
          kind="RoleBinding"
          address={`apis/rbac.authorization.k8s.io/v1/namespaces/${patchRoleBinding?.metadata?.namespace}/rolebindings/${patchRoleBinding?.metadata?.name}`}

          cluster={cluster}
          name={patchRoleBinding?.metadata?.name || ''}
          visible={patchLabelVisible}
          labels={patchRoleBinding?.metadata?.labels || {}}
        />
      )}
      {patchAnnotationsVisible && (
        <PatchLabels
          setVisible={patchVisibleReflash}
          patchType="annotations"
          title={<FormattedMessage id="cluster.patch.annotations" />}
          key={'annotations-' + patchModalKey}
          kind="RoleBinding"
          address={`apis/rbac.authorization.k8s.io/v1/namespaces/${patchRoleBinding?.metadata?.namespace}/rolebindings/${patchRoleBinding?.metadata?.name}`}

          cluster={cluster}
          name={patchRoleBinding?.metadata?.name || ''}
          visible={patchAnnotationsVisible}
          labels={patchRoleBinding?.metadata?.annotations || {}}
        />
      )}
      {labelSelectorVisible && (
        <FilterSelector
          title={<FormattedMessage id="cluster.labelSelector" />}
          key={Date.now().toString()}
          visible={labelSelectorVisible}
          labels={searchLabels}
          setVisible={setLabelSelectorVisible}
          updateLabels={setSearchLabels}
        />
      )}
      {fieldSelectorVisible && (
        <FilterSelector
          title={<FormattedMessage id="cluster.fieldSelector" />}
          key={Date.now().toString()}
          visible={fieldSelectorVisible}
          labels={searchFields}
          setVisible={setFieldSelectorVisible}
          updateLabels={setSearchFields}
        />
      )}
      <Drawer
        destroyOnHidden={true}
        open={detailDrawerVisible}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        onClose={() => setDetailDrawerVisible(false)}
        closable={true}
        title={patchRoleBinding?.metadata?.name || ''}
      >
        <RenderRoleBinding
          roleRef={patchRoleBinding?.roleRef}
          subjects={patchRoleBinding?.subjects || []}
        />
      </Drawer>
      <Drawer
        destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('RoleBinding')}:&nbsp;&nbsp;
            {patchRoleBinding?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={patchRoleBinding?.metadata?.resourceVersion || 'edit'}
          edit={editorResource}
          address={`apis/rbac.authorization.k8s.io/v1/namespaces/${patchRoleBinding?.metadata?.namespace}/rolebindings/${patchRoleBinding?.metadata?.name}`}
          kind="RoleBinding"
          name={patchRoleBinding?.metadata?.name || ''}

          cluster={cluster}
          content={patchRoleBinding}
        />
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="RoleBinding"
        apiVersion='rbac.authorization.k8s.io/v1'
      />
    </PageContainer>
  );
};

export default IndexDashboard;
