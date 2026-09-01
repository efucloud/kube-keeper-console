import { CloseCircleOutlined, DeleteOutlined, EditOutlined, InsertRowBelowOutlined, MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, type ProFormInstance, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Divider, Drawer, Dropdown, Flex, Modal, message, Popconfirm, Popover, Select, Space, Tag, Typography, Empty } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import type { IReplicaSet, ReplicaSetList } from 'kubernetes-models/apps/v1';
import type { IContainer } from 'kubernetes-models/v1';
import debounce from 'lodash/debounce';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import PatchReplicas from '@/pages/kubernetes/components/patch_replicas';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';

import { canAccessClusterNamespaces } from '@/services/personal.api';
import { getClusterResource } from '@/utils/cluster';
import { appendKubernetesViewQuery, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { syncClusterNamespace } from '@/services/cluster.api';
import OwnerReferencesView from '@/pages/kubernetes/components/owner_references';

import AICopilot from '@/pages/kubernetes/components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance>(undefined);
  const access = useAccess();
  const { cluster, namespace } = getCurrentViewInfo();
  const [selectedRowsState, setSelectedRows] = useState<IReplicaSet[]>([]);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchReplicaSet, setPatchReplicaSet] = useState<IReplicaSet>();
  const [patchModalKey, setPatchModalKey] = useState<string>('');
  const [patchAnnotationsVisible, setPatchAnnotationsVisible] = useState<boolean>(false);
  const [patchReplicasVisible, setPatchReplicasVisible] = useState<boolean>(false);
  const [ownerVisible, setOwnerVisible] = useState<boolean>(false);

  const [searchName, setSearchName] = useState<string>('');
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const address = namespace ? `apis/apps/v1/namespaces/${namespace}/replicasets` : `apis/apps/v1/replicasets`;
  const intl = useIntl();
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);

  const [dataSource, setDataSource] = useState<IReplicaSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  let BaseAddress = `/kubernetes/namespace/workload/replicasets`;
  if (!namespace || namespace === '' || namespace === '-') {
    BaseAddress = `/kubernetes/cluster/workload/replicasets`;
  }
  const debouncedNamespaceChange = debounce((value) => { setSearchNamespace(value); }, 1000);
  const [selectedNamespace, setSelectedNamespace] = useState<string>(namespace);
  const [userNamespaces, setUserNamespaces] = useState<ClusterNamespaceDetail[]>([]);
  const [searchNamespace, setSearchNamespace] = useState<string>('');
  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };
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
  const listReplicaSets = async () => {
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
      const data = (await clusterGetProxy(params)) as ReplicaSetList;

      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'ReplicaSet';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };

  const patchVisibleReflash = (visible: boolean) => {
    setPatchAnnotationsVisible(false);
    setPatchReplicasVisible(false);
    setPatchLabelVisible(false);
    setEditorResource(false);
    setResourceDrawerVisible(false);
    actionRef.current?.reload();
  };
  const handleRemove = async (intl: IntlShape, selectedRows: IReplicaSet[]) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: IReplicaSet) => {
      const params = { cluster, address: `apis/apps/v1/namespaces/${entity.metadata?.namespace}/replicasets/${entity.metadata?.name}` };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };
  const moreItems = (record: IReplicaSet) => {
    const nodes = [
      {
        key: 'view-yaml',
        label: (
          <a
            onClick={() => {
              setPatchReplicaSet(record);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.view.yaml" />
          </a>
        ),
      },
    ];
    if (!record?.metadata?.ownerReferences) {
      nodes.push({
        key: 'edit-yaml',
        label: (
          <a
            onClick={() => {
              setPatchReplicaSet(record);
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
              setPatchReplicaSet(record);
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
        key: 'replicas',
        label: (
          <a
            onClick={() => {
              setPatchReplicaSet(record);
              setPatchReplicasVisible(true);
              setPatchModalKey('replicas-' + record.metadata?.name);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.patch.replicas" />
          </a>
        ),
      });
    } else {
      nodes.push(
        {
          key: 'owner-reference',
          label: (
            <a
              onClick={() => {
                setPatchReplicaSet(record);
                setOwnerVisible(true)
              }}
              style={{ color: colorPrimary }}
            >
              <FormattedMessage id="cluster.view.ownerReferences" />
            </a>
          ),
        })
    }

    return nodes;
  };
  useEffect(() => {
    listReplicaSets();

  }, []);





  const columns: ProColumns<IReplicaSet>[] = [
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
                  appendKubernetesViewQuery(`/kubernetes/namespace/workload/replicasets`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
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
        const description =
          entity?.metadata?.annotations?.['efucloud.com/description'] || '';
        if (description !== '') {
          return (
            <Popover
              placement="right"
              title={<span style={{ fontSize: '12px' }}>{description}</span>}
            >
              <a
                onClick={() => {
                  if (namespace) {
                    window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/workload/replicasets/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace });
                  } else {
                    window.open(
                      appendKubernetesViewQuery(`/kubernetes/namespace/workload/replicasets/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
                      '_blank',
                    );
                  }
                }}
              >
                {entity?.metadata?.name}
              </a>
              {expandInfo && (
                <>
                  <br />
                  <span style={{ fontSize: '12px' }}>{description}</span>
                </>
              )}
            </Popover>
          );
        } else {
          return (
            <>
              <a
                onClick={() => {
                  if (namespace) {
                    window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/workload/replicasets/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace });
                  } else {
                    window.open(
                      appendKubernetesViewQuery(`/kubernetes/namespace/workload/replicasets/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
                      '_blank',
                      'noreferrer',
                    );
                  }
                }}
              >
                {entity?.metadata?.name}
              </a>
            </>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.workload.replicas' }),
      search: false,
      render: (dom, entity: IReplicaSet) => {
        const health =
          entity?.status?.availableReplicas ||
          entity?.status?.replicas - entity?.status?.unavailableReplicas ||
          0;
        if (health > 0) {
          return (
            <>
              <a style={{ color: '#52c41a' }}>{health}&nbsp;</a>
              {'/ ' + entity.spec?.replicas}
            </>
          );
        } else {
          return (
            <>
              <a style={{ color: 'red' }}>0&nbsp;</a>
              {'/ ' + entity.spec?.replicas}
            </>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.status' }),
      search: false,
      render: (dom, entity: IReplicaSet) => {
        const readyReplicas = entity?.status?.readyReplicas || 0;
        const tags = [] as React.ReactNode[];
        if (readyReplicas > 0) {
          tags.push(
            <Tag style={{ border: 0 }} key="Available" color="green">
              <FormattedMessage id="cluster.resource.Available" />
            </Tag>,
          );
        } else if (readyReplicas === 0) {
          tags.push(
            <Tag style={{ border: 0 }} key="UnAvailable" color="red">
              <FormattedMessage id="cluster.resource.UnAvailable" />
            </Tag>,
          );
        } else if (readyReplicas < entity?.spec?.replicas || 0) {
          tags.push(
            <Tag style={{ border: 0 }} key="notReadyReplicas" color="orange">
              <FormattedMessage id="cluster.resource.SomeAvailable" />
            </Tag>,
          );
        }
        return (
          <Flex gap="4px 0" wrap>

            {tags}
          </Flex>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.workload.container.number' }),
      search: false,
      render: (dom, entity: IReplicaSet) => {
        const containers = entity.spec?.template?.spec?.containers;
        const initContainers = entity.spec?.template?.spec?.initContainers;
        const containersNumber =
          entity.spec?.template?.spec?.containers?.length || 0;
        const initContainersNumber =
          entity.spec?.template?.spec?.initContainers?.length || 0;
        if (expandInfo) {
          return (
            <div>
              {initContainersNumber > 0 && (
                <>
                  <Divider style={{ margin: '0 0', fontSize: '12px' }}>

                    <FormattedMessage id="cluster.workload.initContainers" />
                  </Divider>
                  <Space orientation='vertical' size='small'>
                    {initContainers?.map((item: IContainer) => (
                      <>
                        <Tag style={{ border: 0 }} key={item.name}>
                          {item.name}={item.image}
                        </Tag>
                      </>
                    ))}
                  </Space>
                </>
              )}
              {containersNumber > 0 && (
                <>
                  <Divider style={{ margin: '0 0', fontSize: '12px' }}>
                    <FormattedMessage id="cluster.workload.containers" />
                  </Divider>
                  <Space orientation='vertical' size='small'>
                    {containers?.map((item: IContainer) => (
                      <>
                        <Tag style={{ border: 0 }} key={item.name}>
                          {item.name}={item.image}
                        </Tag>
                      </>
                    ))}
                  </Space>
                </>
              )}
            </div>
          );
        } else {
          const tags = [] as React.ReactNode[];
          if (containersNumber > 0) {
            tags.push(
              <Tag style={{ border: 0 }} key="containers">
                <FormattedMessage id="cluster.workload.containers" />
                &nbsp;:&nbsp;{containersNumber}
              </Tag>,
            );
          }
          if (initContainersNumber > 0) {
            tags.push(
              <Tag style={{ border: 0 }} key="initContainersNumber">
                <FormattedMessage id="cluster.workload.initContainers" />
                &nbsp;:&nbsp;{initContainersNumber}
              </Tag>,
            );
          }
          return (
            <Popover
              placement="right"
              title={
                <div>
                  {initContainersNumber > 0 && (
                    <>
                      <Divider style={{ margin: '0 0', fontSize: '12px' }}>

                        <FormattedMessage id="cluster.workload.initContainers" />
                      </Divider>
                      {initContainers?.map((item: IContainer) => (
                        <>
                          <Tag style={{ border: 0 }} key={item.name}>
                            {item.name}={item.image}
                          </Tag>
                          <br />
                        </>
                      ))}
                    </>
                  )}
                  {containersNumber > 0 && (
                    <>
                      <Divider style={{ margin: '0 0', fontSize: '12px' }}>
                        <FormattedMessage id="cluster.workload.containers" />
                      </Divider>
                      {containers?.map((item: IContainer) => (
                        <>
                          <Tag style={{ border: 0 }} key={item.name}>
                            {item.name}={item.image}
                          </Tag>
                          <br />
                        </>
                      ))}
                    </>
                  )}
                </div>
              }
            >
              <Flex gap="4px 0" wrap>

                {tags}
              </Flex>
            </Popover>
          );
        }
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
      render: (dom, entity: IReplicaSet) => {
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
      render: (dom, entity: IReplicaSet) => {
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
              id: 'cluster.resource.replicaset.delete.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              getClusterResource('ReplicaSet') + `【${record.metadata?.name}】`
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
        if (!record?.metadata?.ownerReferences) {
          nodes.unshift(
            <a
              onClick={() => {
                window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/workload/replicasets/${record?.metadata?.name}/update`, { cluster: cluster, namespace: record?.metadata?.namespace });
              }}
            >
              <EditOutlined style={{ color: colorPrimary }} />
            </a>,
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
      title={intl.formatMessage({ id: 'menu.workload.replicaset' })}
      subTitle="ReplicaSet"
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IReplicaSet>
        key='replica-set'
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        rowKey={(record: IReplicaSet) =>
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


                  listReplicaSets();
                }}
              >

                {searchText}
              </Button>,
            ];
          },
        }}
        options={{
          reload: () => {


            listReplicaSets();
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
                  window.location.href = appendKubernetesViewQuery(`${BaseAddress}/create/text`);
                }}
              >
                <FormattedMessage id="cluster.resource.create.text" />
              </Button>
            </Access>
          </Space>
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
              <FormattedMessage id="pages.operation.selected.term" defaultMessage="项" />
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
                  id: 'cluster.resource.replicaset.delete.description',
                }),
                okText: intl.formatMessage({ id: 'pages.operation.confirm' }),
                cancelText: intl.formatMessage({
                  id: 'pages.operation.cancel',
                }),
                onOk: async () => {
                  await handleRemove(intl, selectedRowsState);
                  setSelectedRows([]);
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
          kind="ReplicaSet"
          address={`apis/apps/v1/namespaces/${patchReplicaSet?.metadata?.namespace}/replicasets/${patchReplicaSet?.metadata?.name}`}

          cluster={cluster}
          name={patchReplicaSet?.metadata?.name || ''}
          visible={patchLabelVisible}
          labels={patchReplicaSet?.metadata?.labels || {}}
        />
      )}
      {patchAnnotationsVisible && (
        <PatchLabels
          setVisible={patchVisibleReflash}
          patchType="annotations"
          title={<FormattedMessage id="cluster.patch.annotations" />}
          key={'annotations-' + patchModalKey}
          kind="ReplicaSet"
          address={`apis/apps/v1/namespaces/${patchReplicaSet?.metadata?.namespace}/replicasets/${patchReplicaSet?.metadata?.name}`}

          cluster={cluster}
          name={patchReplicaSet?.metadata?.name || ''}
          visible={patchAnnotationsVisible}
          labels={patchReplicaSet?.metadata?.annotations || {}}
        />
      )}
      {patchReplicasVisible && (
        <PatchReplicas
          setVisible={patchVisibleReflash}
          key={'replicas-' + patchModalKey}
          kind="ReplicaSet"
          address={`apis/apps/v1/namespaces/${patchReplicaSet?.metadata?.namespace}/replicasets/${patchReplicaSet?.metadata?.name}`}

          cluster={cluster}
          name={patchReplicaSet?.metadata?.name || ''}
          visible={patchReplicasVisible}
          replicas={patchReplicaSet?.spec?.replicas || 0}
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
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('ReplicaSet')}:&nbsp;&nbsp;
            {patchReplicaSet?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={patchReplicaSet?.metadata?.resourceVersion || 'edit'}
          edit={editorResource}
          address={`apis/apps/v1/namespaces/${patchReplicaSet?.metadata?.namespace}/replicasets/${patchReplicaSet?.metadata?.name}`}
          kind="ReplicaSet"
          name={patchReplicaSet?.metadata?.name || ''}

          cluster={cluster}
          content={patchReplicaSet}
        />
      </Drawer>
      {ownerVisible && <OwnerReferencesView

        cluster={cluster}
        namespace={patchReplicaSet?.metadata?.namespace || ''}
        visibleView={ownerVisible}
        ownerReferences={patchReplicaSet?.metadata?.ownerReferences || []}
        setVisible={setOwnerVisible}
        api='apis'
      />}
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="ReplicaSet"
        externalSkills={['k8s-troubleshoot']}
      />
    </PageContainer>
  );
};

export default IndexDashboard;
