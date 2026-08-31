import { CloseCircleOutlined, DeleteOutlined, DockerOutlined, EditOutlined, InsertRowBelowOutlined, LineChartOutlined, MoreOutlined, ReloadOutlined, SaveOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Divider, Drawer, Dropdown, Flex, Modal, message, Popconfirm, Popover, Select, Space, Tag, Typography, Empty } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import type { IDaemonSet, DaemonSetList } from 'kubernetes-models/apps/v1';
import type { IContainer } from 'kubernetes-models/v1';
import debounce from 'lodash/debounce';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { RenderWorkloadMetrics } from '@/pages/kubernetes/components/workload_metrics';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterDeleteProxy, clusterGetProxy, clusterPostProxy } from '@/services/cluster_proxy.api';

import { canAccessClusterNamespaces } from '@/services/personal.api';
import { getClusterResource } from '@/utils/cluster';
import { appendKubernetesViewQuery, getClusterApiVersions, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { syncClusterNamespace } from '@/services/cluster.api';
import OwnerReferencesView from '@/pages/kubernetes/components/owner_references';
import PatchImages from '@/pages/kubernetes/components/patch_image';

import AICopilot from '@/pages/kubernetes/components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance>(undefined);
  const access = useAccess();
  const { cluster, namespace } = getCurrentViewInfo();
  const [selectedRowsState, setSelectedRows] = useState<IDaemonSet[]>([]);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchDaemonSet, setPatchDaemonSet] = useState<IDaemonSet>();
  const [patchModalKey, setPatchModalKey] = useState<string>('');
  const [patchAnnotationsVisible, setPatchAnnotationsVisible] = useState<boolean>(false);
  const [ownerVisible, setOwnerVisible] = useState<boolean>(false);
  const [searchName, setSearchName] = useState<string>('');
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const [monitorDrawerVisible, setMonitorDrawerVisible] = useState<boolean>(false);

  const [dataSource, setDataSource] = useState<IDaemonSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const intl = useIntl();
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const [imageVisible, setImageVisible] = useState<boolean>(false);
  const resourceGroup = getClusterApiVersions(cluster, ['apps/v1', 'apps/v1beta1', 'apps/v1beta2'], 'DaemonSet');
  const address = namespace ? `apis/${resourceGroup.groupVersion}/namespaces/${namespace}/daemonsets` : `apis/${resourceGroup.groupVersion}/daemonsets`;
  let BaseAddress = `/kubernetes/namespace/workload/daemonsets`;
  if (!namespace || namespace === '' || namespace === '-') {
    BaseAddress = `/kubernetes/cluster/workload/daemonsets`;
  }

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
  const listDaemonsets = async () => {
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
      const data = (await clusterGetProxy(params)) as DaemonSetList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'DaemonSet';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    listDaemonsets();

  }, []);

  const patchVisibleReflash = (visible: boolean) => {
    setPatchAnnotationsVisible(false);
    setPatchLabelVisible(false);
    setEditorResource(false);
    setResourceDrawerVisible(false);
    actionRef.current?.reload();
  };
  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };
  const handleRemove = async (intl: IntlShape, selectedRows: IDaemonSet[]) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: IDaemonSet) => {
      const params = { cluster, address: `apis/${resourceGroup.groupVersion}/namespaces/${entity.metadata?.namespace}/daemonsets/${entity.metadata?.name}` };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };
  const moreItems = (record: IDaemonSet) => {
    const nodes = [

      {
        key: 'view-yaml',
        label: (
          <a
            onClick={() => {
              setPatchDaemonSet(record);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.view.yaml" />
          </a>
        ),
      },

    ];
    if (!record.metadata?.ownerReferences) {
      nodes.push(
        {
          key: 'edit-labels',
          label: (
            <a
              onClick={() => {
                setPatchDaemonSet(record);
                setPatchModalKey('labels-' + record.metadata?.name);
                setPatchLabelVisible(true);
              }}
              style={{ color: colorPrimary }}
            >
              <FormattedMessage id="cluster.patch.labels" />
            </a>
          ),
        },
        {
          key: 'edit-yaml',
          label: (
            <a
              onClick={() => {
                setPatchDaemonSet(record);
                setEditorResource(true);
                setResourceDrawerVisible(true);
              }}
              style={{ color: colorPrimary }}
            >
              <FormattedMessage id="cluster.edit.yaml" />
            </a>
          ),
        },
        {
          key: 'annotation',
          label: (
            <a
              onClick={() => {
                setPatchDaemonSet(record);
                setPatchAnnotationsVisible(true);
                setPatchModalKey('annotations-' + record.metadata?.name);
              }}
              style={{ color: colorPrimary }}
            >
              <FormattedMessage id="cluster.patch.annotations" />
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
                setPatchDaemonSet(record);
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
  const reDeploy = async (bodyData: IDaemonSet) => {
    await clusterDeleteProxy({ cluster, address: `apis/${resourceGroup.groupVersion}/namespaces/${bodyData.metadata?.namespace}/daemonsets/${bodyData.metadata?.name}` });
    const requestData = { ...bodyData };
    delete requestData.status;
    delete requestData.metadata?.creationTimestamp;
    delete requestData.metadata?.resourceVersion;
    delete requestData.metadata?.uid;
    await clusterPostProxy({ cluster, address: `apis/${resourceGroup.groupVersion}/namespaces/${requestData.metadata?.namespace}/daemonsets` }, requestData,);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
  };




  const columns: ProColumns<IDaemonSet>[] = [
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
                  appendKubernetesViewQuery(`/kubernetes/namespace/workload/daemonsets`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
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
        const hasStorage =
          entity.spec?.template?.spec?.volumes?.filter(
            (item) => item.persistentVolumeClaim,
          ).length || 0
            ? true
            : false;

        if (description !== '') {
          return (
            <>
              {hasStorage && (
                <>
                  <SaveOutlined style={{ color: colorPrimary }} />
                  &nbsp;
                </>
              )}
              <Popover
                placement="right"
                title={<span style={{ fontSize: '12px' }}>{description}</span>}
              >
                <a
                  onClick={() => {
                    if (namespace) {
                      window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/workload/daemonsets/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace });
                    } else {
                      window.open(
                        appendKubernetesViewQuery(`/kubernetes/namespace/workload/daemonsets/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
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
            </>
          );
        } else {
          return (
            <>
              {hasStorage && (
                <>
                  <SaveOutlined style={{ color: colorPrimary }} />
                  &nbsp;
                </>
              )}
              <a
                onClick={() => {
                  if (namespace) {
                    window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/workload/daemonsets/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace });
                  } else {
                    window.open(
                      appendKubernetesViewQuery(`/kubernetes/namespace/workload/daemonsets/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
                      '_blank',
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
      align: 'center',
      render: (dom, entity: IDaemonSet) => {
        const health = entity?.status?.numberReady || 0;
        if (health > 0) {
          if (health === entity.status?.desiredNumberScheduled) {
            return (
              <>
                <a style={{ color: '#52c41a' }}>{health}&nbsp;</a>
                {'/ ' + entity.status?.desiredNumberScheduled}
              </>
            );
          } else {
            return (
              <>
                <a style={{ color: '#FA8C16' }}>{health}&nbsp;</a>
                {'/ ' + entity.status?.desiredNumberScheduled}
              </>
            );
          }
        } else {
          return (
            <>
              <a style={{ color: 'red' }}>0&nbsp;</a>
              {'/ ' + entity.status?.desiredNumberScheduled}
            </>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.status' }),
      search: false,
      align: 'center',
      render: (dom, entity: IDaemonSet) => {
        const tags = [] as React.ReactNode[];
        const health = entity?.status?.numberReady || 0;
        if (health > 0) {
          if (health === entity.status?.desiredNumberScheduled) {
            tags.push(
              <Tag style={{ border: 0 }} color="green">
                <FormattedMessage id="cluster.resource.AllAvailable" />
              </Tag>,
            );
          } else {
            tags.push(
              <Tag style={{ border: 0 }} color="orange">
                <FormattedMessage id="cluster.resource.SomeAvailable" />
              </Tag>,
            );
          }
        } else {
          tags.push(
            <Tag style={{ border: 0 }} color="red">
              <FormattedMessage id="cluster.resource.UnAvailable" />
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
      render: (dom, entity: IDaemonSet) => {
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
      render: (dom, entity: IDaemonSet) => {
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
      render: (dom, entity: IDaemonSet) => {
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
          <a onClick={() => {
            setImageVisible(true)
            setPatchDaemonSet(record);
          }}><DockerOutlined style={{ color: colorPrimary }} /></a>,
          <Popconfirm
            okText={<FormattedMessage id="pages.operation.confirm" />}
            cancelText={<FormattedMessage id="pages.operation.cancel" />}
            description={intl.formatMessage({
              id: 'cluster.resource.reDeploy.description',
            })}
            onConfirm={() => {
              reDeploy(record);
            }}
            title={<FormattedMessage id="model.reDeploy" />}
          >
            <ReloadOutlined style={{ color: colorPrimary }} />
          </Popconfirm>,
          <span
            onClick={() => {
              setPatchDaemonSet(record);
              setMonitorDrawerVisible(true);
            }}
          >

            <LineChartOutlined style={{ color: colorPrimary }} />
          </span>,
          <Popconfirm
            key={record.metadata?.resourceVersion + '-delete'}
            description={intl.formatMessage({
              id: 'cluster.resource.daemonset.delete.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              getClusterResource('DaemonSet') + `【${record.metadata?.name}】`
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
              key="edit"
              onClick={() => {
                window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/workload/daemonsets/${record?.metadata?.name}/update`, { cluster: cluster, namespace: record?.metadata?.namespace });
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
      title={intl.formatMessage({ id: 'menu.workload.daemonset' })}
      subTitle="DaemonSet"
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IDaemonSet>
        key='daemon-set'
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        rowKey={(record: IDaemonSet) =>
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


                  listDaemonsets();
                }}
              >
                {searchText}
              </Button>,
            ];
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
        options={{
          reload: () => {


            listDaemonsets();
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
            <Access accessible={true} key={'create'}>
              <Button
                type="primary"
                key="create-form"
                onClick={() => {
                  window.location.href = appendKubernetesViewQuery(`${BaseAddress}/create/form/step`);
                }}
              >
                <FormattedMessage id="cluster.resource.create.form" />
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
                  id: 'cluster.resource.daemonset.delete.description',
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
          kind="DaemonSet"
          address={`apis/${resourceGroup.groupVersion}/namespaces/${patchDaemonSet?.metadata?.namespace}/daemonsets/${patchDaemonSet?.metadata?.name}`}

          cluster={cluster}
          name={patchDaemonSet?.metadata?.name || ''}
          visible={patchLabelVisible}
          labels={patchDaemonSet?.metadata?.labels || {}}
        />
      )}
      {patchAnnotationsVisible && (
        <PatchLabels
          setVisible={patchVisibleReflash}
          patchType="annotations"
          title={<FormattedMessage id="cluster.patch.annotations" />}
          key={'annotations-' + patchModalKey}
          kind="DaemonSet"
          address={`apis/${resourceGroup.groupVersion}/namespaces/${patchDaemonSet?.metadata?.namespace}/daemonsets/${patchDaemonSet?.metadata?.name}`}

          cluster={cluster}
          name={patchDaemonSet?.metadata?.name || ''}
          visible={patchAnnotationsVisible}
          labels={patchDaemonSet?.metadata?.annotations || {}}
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
            {getClusterResource('DaemonSet')}:&nbsp;&nbsp;
            {patchDaemonSet?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={patchDaemonSet?.metadata?.resourceVersion || 'edit'}
          edit={editorResource}
          address={`apis/${resourceGroup.groupVersion}/namespaces/${patchDaemonSet?.metadata?.namespace}/daemonsets/${patchDaemonSet?.metadata?.name}`}
          kind="DaemonSet"
          name={patchDaemonSet?.metadata?.name || ''}

          cluster={cluster}
          content={patchDaemonSet}
        />
      </Drawer>
      <Drawer
        destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={monitorDrawerVisible}
        onClose={() => setMonitorDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('DaemonSet')}:&nbsp;&nbsp;
            {patchDaemonSet?.metadata?.name}&nbsp;
            <FormattedMessage id="cluster.resource.monitor" />
          </>
        }
      >
        {patchDaemonSet && (
          <RenderWorkloadMetrics

            cluster={cluster}
            namespace={patchDaemonSet.metadata?.namespace || ''}
            workload={patchDaemonSet.metadata?.name || ''}
            workloadType="daemonset"
          />
        )}
      </Drawer>
      {ownerVisible && <OwnerReferencesView

        cluster={cluster}
        namespace={patchDaemonSet?.metadata?.namespace || ''}
        visibleView={ownerVisible}
        ownerReferences={patchDaemonSet?.metadata?.ownerReferences || []}
        setVisible={setOwnerVisible}
        api='apis'
      />}
      {imageVisible && <>
        <PatchImages
          title={intl.formatMessage({ id: 'cluster.resource.images.change' })}
          key={patchDaemonSet?.metadata?.namespace + '-' + patchDaemonSet?.metadata?.name}
          setVisible={setImageVisible}
          address={`apis/${resourceGroup.groupVersion}/namespaces/${patchDaemonSet?.metadata?.namespace}/daemonsets/${patchDaemonSet?.metadata?.name}`}

          cluster={cluster}
          namespace={patchDaemonSet?.metadata?.namespace || ''}
          kind='DaemonSet'
          name={patchDaemonSet?.metadata?.name || ''}
          visible={imageVisible}
          containers={patchDaemonSet?.spec?.template?.spec?.containers || []}
          initContainers={patchDaemonSet?.spec?.template.spec?.initContainers || []}
        />
      </>}
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="DaemonSet"
        apiVersion={resourceGroup.groupVersion}
        externalSkills={['k8s-troubleshoot']}
      />
    </PageContainer>
  );
};

export default IndexDashboard;
