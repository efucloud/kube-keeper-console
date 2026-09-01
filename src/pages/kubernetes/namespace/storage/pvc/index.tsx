import { CloseCircleOutlined, DeleteOutlined, InsertRowBelowOutlined, MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, type ProFormInstance, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Drawer, Dropdown, Modal, message, Popconfirm, Popover, Select, Space, Tag, Typography, Empty, Divider } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import { IPersistentVolumeClaim, type PersistentVolumeClaimList } from 'kubernetes-models/v1';
import debounce from 'lodash/debounce';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
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
  const [selectedRowsState, setSelectedRows] = useState<IPersistentVolumeClaim[]>([]);
  const [dataSource, setDataSource] = useState<IPersistentVolumeClaim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const formRef = useRef<ProFormInstance>(undefined);
  // kubectl get pods --all-namespaces -o wide --field-selector 'jsonPath($.spec.volumes[*].persistentVolumeClaim.claimName)==my-persistent-volume-claim'
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchPersistentVolumeClaim, setPatchPersistentVolumeClaim] = useState<IPersistentVolumeClaim>();
  const [patchModalKey, setPatchModalKey] = useState<string>('');
  const [patchAnnotationsVisible, setPatchAnnotationsVisible] = useState<boolean>(false);
  const [searchName, setSearchName] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const address = namespace ? `api/v1/namespaces/${namespace}/persistentvolumeclaims` : `api/v1/persistentvolumeclaims`;
  const intl = useIntl();
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
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
  const listPersistentVolumeClaims = async () => {
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
      if (status !== '') {
        fieldSelector['status.phase'] = status;
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
      const data = (await clusterGetProxy(params)) as PersistentVolumeClaimList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'PersistentVolumeClaim';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    listPersistentVolumeClaims();

  }, []);


  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };

  const patchVisibleReflash = (visible: boolean) => {
    setPatchAnnotationsVisible(false);
    setPatchLabelVisible(false);
    actionRef.current?.reload();
  };

  const handleRemove = async (
    intl: IntlShape,
    selectedRows: IPersistentVolumeClaim[],
  ) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: IPersistentVolumeClaim) => {
      const params = { cluster, address: `api/v1/namespaces/${entity.metadata?.namespace}/persistentvolumeclaims/${entity.metadata?.name}` };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };
  const moreItems = (record: IPersistentVolumeClaim) => {
    const nodes = [
      {
        key: 'edit-labels',
        label: (
          <a
            onClick={() => {
              setPatchPersistentVolumeClaim(record);
              setPatchModalKey('labels-' + record?.metadata?.name);
              setPatchLabelVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.patch.labels" />
          </a>
        ),
      },
    ];

    nodes.push({
      key: 'annotation',
      label: (
        <a
          onClick={() => {
            setPatchPersistentVolumeClaim(record);
            setPatchAnnotationsVisible(true);
            setPatchModalKey('annotations-' + record.metadata?.name);
          }}
          style={{ color: colorPrimary }}
        >
          <FormattedMessage id="cluster.patch.annotations" />
        </a>
      ),
    });

    return nodes;
  };





  const columns: ProColumns<IPersistentVolumeClaim>[] = [
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
                  appendKubernetesViewQuery(`/kubernetes/namespace/storage/persistentvolumeclaim`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
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
            onClick={() => {
              setPatchPersistentVolumeClaim(entity);
              setResourceDrawerVisible(true);
            }}
          >
            {entity?.metadata?.name}
          </a>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.storage.size' }),
      key: 'storageSize',
      search: false,
      render: (dom, entity) => {
        if (entity?.spec?.resources?.limits?.storage) {
          return (
            <>
              {entity?.spec?.resources?.requests?.storage}-
              {entity?.spec?.resources?.limits?.storage}
            </>
          );
        } else {
          return <>{entity?.spec?.resources?.requests?.storage}</>;
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.persistentVolume' }),
      key: 'persistentVolume',
      search: false,
      render: (dom, entity) => {
        return <>{entity?.spec?.volumeName}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.status' }),
      key: 'status',
      align: 'center',
      renderFormItem: (item, { defaultRender }) => {
        return (
          <Select
            value={status}
            onChange={(value) => {
              setStatus(value || '');
            }}
            options={[
              {
                label: intl.formatMessage({ id: 'cluster.resource.persistentVolumeClaim.status.All' }),
                value: '',
              },
              {
                label: intl.formatMessage({ id: 'cluster.resource.persistentVolumeClaim.status.Pending' }),
                value: 'Pending',
              },
              {
                label: intl.formatMessage({ id: 'cluster.resource.persistentVolumeClaim.status.Bound' }),
                value: 'Bound',
              },
              {
                label: intl.formatMessage({ id: 'cluster.resource.persistentVolumeClaim.status.Lost' }),
                value: 'Lost',
              },
              {
                label: intl.formatMessage({ id: 'cluster.resource.persistentVolumeClaim.status.Unknown' }),
                value: 'Unknown',
              },
            ]}
          />
        );
      },
      render: (dom, entity: IPersistentVolumeClaim) => {
        const phase = entity?.status?.phase || 'Unknown';
        let color: string | undefined;
        if (phase === 'Bound') {
          color = 'blue';
        } else if (phase === 'Pending') {
          color = 'orange';
        } else if (phase === 'Lost') {
          color = 'red';
        }
        return (
          <Tag style={{ border: 0 }} color={color}>
            {intl.formatMessage({
              id: `cluster.resource.persistentVolumeClaim.status.${phase}`,
            })}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.persistentVolume.accessModes' }),
      key: 'accessModes',
      search: false,
      render: (dom, entity) => {
        return (
          <>
            {entity?.spec?.accessModes?.map((item) => (
              <Tag>{item}</Tag>
            ))}
          </>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.storageClass' }),
      key: 'storageClass',
      search: false,
      render: (dom, entity) => {
        return <>{entity?.spec?.storageClassName}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.labels' }),
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
      render: (dom, entity: IPersistentVolumeClaim) => {
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
                      {key}={entity?.metadata?.labels?.[key] ?? ''}
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
                        {key}={entity?.metadata?.labels?.[key] ?? ''}
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
      title: intl.formatMessage({ id: 'cluster.fieldSelector' }),

      dataIndex: 'hiddenFieldSelector',
      hideInTable: true, // 在表格中隐藏这个字段
      renderFormItem: (item, { defaultRender }) => {
        const labels = [] as string[];
        const keys = Object.keys(searchFields);
        if (keys.length > 0) {
          for (const key in searchFields) {
            labels.push(`${key}=${searchFields[key]}`);
          }
        }
        return (
          <Space>
            <div
              onClick={() => {
                if (labelSelectorVisible) {
                  setFieldSelectorVisible(false);
                }
                setFieldSelectorVisible(true);
              }}
            >
              <Popover
                placement="top"
                title={
                  <div>
                    <span style={{ color: colorPrimary, fontSize: '10px' }}>

                      <FormattedMessage id="cluster.fieldSelector.click" />
                    </span>
                    <div>
                      {keys?.map((key: string) => (
                        <>
                          <Tag style={{ border: 0 }} key={key}>
                            {key}={searchFields[key]}
                          </Tag>
                          <br />
                        </>
                      ))}
                    </div>
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
                onClick={() => setSearchFields({})}
              />
            )}
          </Space>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: IPersistentVolumeClaim) => {
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
        const nodes = [
          <Popconfirm
            key={record.metadata?.resourceVersion + '-delete'}
            description={intl.formatMessage({
              id: 'cluster.persistentVolumeClaim.delete.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              getClusterResource('PersistentVolumeClaim') + `【${record.metadata?.name}】`
            }
            onConfirm={() => {
              handleRemove(intl, [record]);
            }}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <DeleteOutlined style={{ color: 'red' }} />
          </Popconfirm>,
        ];
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
      title={intl.formatMessage({ id: 'cluster.persistentVolumeClaim' })}
      subTitle="PersistentVolumeClaim"
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IPersistentVolumeClaim>
        key='pvc'
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        rowKey={(record: IPersistentVolumeClaim) =>
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
                  setStatus('');
                  formRef?.current?.resetFields();


                }}
              >

                {resetText}
              </Button>,
              <Button
                key="search"
                type="primary"
                onClick={() => {


                  listPersistentVolumeClaims();
                }}
              >

                {searchText}
              </Button>,
            ];
          },
        }}
        options={{
          reload: () => {


            listPersistentVolumeClaims();
          },
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
              {expandInfo ? (
                <FormattedMessage id="cluster.node.shrink" />
              ) : (
                <FormattedMessage id="cluster.node.expand" />
              )}
            </a>
            <Access accessible={true} key={'create'}>
              <Button
                type="primary"
                key="create"
                onClick={() => {
                  window.location.href = appendKubernetesViewQuery(namespace
                    ? appendKubernetesViewQuery(`/kubernetes/namespace/storage/pvc/create/text`, { cluster: cluster, namespace: namespace })
                    : appendKubernetesViewQuery(`/kubernetes/cluster/storage/persistentvolumeclaim/create/text`, { cluster: cluster }));
                }}
              >
                <FormattedMessage id="pages.operation.create" />
              </Button>
            </Access>
          </Space>,
        ]}
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              <FormattedMessage id="pages.operation.selected" />
              <a style={{ fontWeight: 600 }} >
                {selectedRowsState.length}
              </a>
              <FormattedMessage id="pages.operation.selected.term" />
            </div>
          }
        >
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: intl.formatMessage({
                  id: 'pages.operation.delete.confirm.title',
                }),
                content: intl.formatMessage({
                  id: 'cluster.persistentVolumeClaim.delete.description',
                }),
                okText: intl.formatMessage({ id: 'pages.operation.confirm' }),
                cancelText: intl.formatMessage({
                  id: 'pages.operation.cancel',
                }),
                onOk: async () => {
                  await handleRemove(intl, selectedRowsState);
                  setSelectedRows([]);
                  actionRef.current?.reloadAndRest?.();
                },
              });
            }}
          >
            <FormattedMessage id="pages.operation.batch.delete" />
          </Button>
        </FooterToolbar>
      )}
      {patchLabelVisible && (
        <PatchLabels
          setVisible={patchVisibleReflash}
          patchType="labels"
          title={<FormattedMessage id="cluster.patch.labels" />}
          key={patchModalKey}
          kind="PersistentVolumeClaim"
          address={`api/v1/namespaces/${patchPersistentVolumeClaim?.metadata?.namespace}/persistentvolumeclaims/${patchPersistentVolumeClaim?.metadata?.name}`}

          cluster={cluster}
          name={patchPersistentVolumeClaim?.metadata?.name || ''}
          visible={patchLabelVisible}
          labels={patchPersistentVolumeClaim?.metadata?.labels || {}}
        />
      )}
      {patchAnnotationsVisible && (
        <PatchLabels
          setVisible={patchVisibleReflash}
          patchType="annotations"
          title={<FormattedMessage id="cluster.patch.annotations" />}
          key={'annotations-' + patchModalKey}
          kind="PersistentVolumeClaim"
          address={`apis/apps/v1/namespaces/${patchPersistentVolumeClaim?.metadata?.namespace}/persistentvolumeclaims/${patchPersistentVolumeClaim?.metadata?.name}`}

          cluster={cluster}
          name={patchPersistentVolumeClaim?.metadata?.name || ''}
          visible={patchAnnotationsVisible}
          labels={patchPersistentVolumeClaim?.metadata?.annotations || {}}
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
        key="resource-view"
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('PersistentVolumeClaim')}:&nbsp;&nbsp;
            {patchPersistentVolumeClaim?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={patchPersistentVolumeClaim?.metadata?.resourceVersion || 'edit'}
          edit={false}
          address={`apis/apps/v1/namespaces/${patchPersistentVolumeClaim?.metadata?.namespace}/persistentvolumeclaims/${patchPersistentVolumeClaim?.metadata?.name}`}
          kind="PersistentVolumeClaim"
          name={patchPersistentVolumeClaim?.metadata?.name || ''}

          cluster={cluster}
          content={patchPersistentVolumeClaim}
        />
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="PersistentVolumeClaim"
      />
    </PageContainer>
  );
};

export default IndexDashboard;
