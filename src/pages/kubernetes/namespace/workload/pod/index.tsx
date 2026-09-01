import { CloseCircleOutlined, CodeOutlined, DeleteOutlined, EditOutlined, InsertRowBelowOutlined, LineChartOutlined, MoreOutlined, ProfileOutlined, SaveOutlined, SettingOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useIntl } from '@umijs/max';
import { Button, Divider, Drawer, Flex, Modal, message, Popconfirm, Popover, Select, Space, Tag, Typography, Empty, Dropdown, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import type { IContainer, IPod, Pod, PodList } from 'kubernetes-models/v1';
import debounce from 'lodash/debounce';
import type { IntlShape } from 'react-intl';
import PodContainerLog from '@/pages/kubernetes/components/container_log';
import PodContainerTerminal from '@/pages/kubernetes/components/container_terminal';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import { RenderPodMetrics } from '@/pages/kubernetes/components/pod_metrics';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';

import { canAccessClusterNamespaces } from '@/services/personal.api';
import { getClusterResource, isK8sVersionSupported } from '@/utils/cluster';
import { appendKubernetesViewQuery, getClusterVersion, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { syncClusterNamespace } from '@/services/cluster.api';
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import OwnerReferencesView from '@/pages/kubernetes/components/owner_references';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';

import AICopilot from '@/pages/kubernetes/components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance>(undefined);
  const { cluster, namespace } = getCurrentViewInfo();
  const [selectedRowsState, setSelectedRows] = useState<IPod[]>([]);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const address = namespace ? `api/v1/namespaces/${namespace}/pods` : `api/v1/pods`;
  const [searchName, setSearchName] = useState<string>('');
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const [drawerSize, setDrawerSize] = useState<number>(800)
  const [status, setStatus] = useState<string>('');
  const intl = useIntl();

  const [dataSource, setDataSource] = useState<IPod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [logDrawerVisible, setLogDrawerVisible] = useState<boolean>(false);
  const [monitorDrawerVisible, setMonitorDrawerVisible] = useState<boolean>(false);
  const [terminalDrawerVisible, setTerminalDrawerVisible] = useState<boolean>(false);
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchModalKey, setPatchModalKey] = useState<string>('');
  const [patchAnnotationsVisible, setPatchAnnotationsVisible] = useState<boolean>(false);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [ownerVisible, setOwnerVisible] = useState<boolean>(false);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const [patchPod, setPatchPod] = useState<IPod>();
  const resourceResizeSupport = isK8sVersionSupported('1.35', getClusterVersion(cluster));
  let BaseAddress = `/kubernetes/namespace/workload/pods`;
  if (!namespace || namespace === '' || namespace === '-') {
    BaseAddress = `/kubernetes/cluster/workload/pods`;
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
  useEffect(() => {
    listPods();

  }, []);

  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };

  const listPods = async () => {
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
      const data = (await clusterGetProxy(params)) as PodList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'Pod';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };
  const handleRemove = async (intl: IntlShape, selectedRows: IPod[]) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: IPod) => {
      const params = {

        cluster,
        address: `api/v1/namespaces/${entity.metadata?.namespace}/pods/${entity.metadata?.name}`,
      };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };
  const moreItems = (record: IPod) => {
    const nodes = [
      {
        key: 'view-yaml',
        label: (
          <a
            onClick={() => {
              setPatchPod(record);
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
                setPatchPod(record);
                setPatchModalKey('labels-' + record.metadata?.name);
                setPatchLabelVisible(true);
              }}
              style={{ color: colorPrimary }}
            >
              <FormattedMessage id="cluster.patch.labels" />
            </a>
          ),
        }, {
        key: 'edit-yaml',
        label: (
          <a
            onClick={() => {
              setPatchPod(record);
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
                setPatchPod(record);
                setPatchAnnotationsVisible(true);
                setPatchModalKey('annotations-' + record.metadata?.name);
              }}
              style={{ color: colorPrimary }}
            >
              <FormattedMessage id="cluster.patch.annotations" />
            </a>
          ),
        }

      )
    } else {
      nodes.push(
        {
          key: 'owner-reference',
          label: (
            <a
              onClick={() => {
                setPatchPod(record);
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




  const columns: ProColumns<IPod>[] = [
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
            key='namespace-select'
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
                  appendKubernetesViewQuery(`/kubernetes/namespace/workload/pods`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
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
        const hasStorage = entity.spec?.volumes?.filter((item) => item.persistentVolumeClaim).length || 0 ? true : false;
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
                  window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/workload/pods/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace });
                } else {
                  window.open(
                    appendKubernetesViewQuery(`/kubernetes/namespace/workload/pods/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
                    '_blank',
                  );
                }
              }}
            >
              {entity?.metadata?.name}
            </a>
          </>
        );
      },
    },

    {
      title: intl.formatMessage({ id: 'cluster.resource.status' }),
      align: 'center',
      renderFormItem: (item, { defaultRender }) => {
        return (
          <>
            <Select
              key='status-select'
              onChange={(value) => {
                setStatus(value);
              }}
              defaultValue={status}
              options={[
                {
                  label: intl.formatMessage({ id: 'cluster.pod.status.All' }),
                  value: '',
                },
                {
                  label: intl.formatMessage({
                    id: 'cluster.pod.status.Running',
                  }),
                  value: 'Running',
                },
                {
                  label: intl.formatMessage({
                    id: 'cluster.pod.status.Pending',
                  }),
                  value: 'Pending',
                },
                {
                  label: intl.formatMessage({
                    id: 'cluster.pod.status.Succeeded',
                  }),
                  value: 'Succeeded',
                },
                {
                  label: intl.formatMessage({
                    id: 'cluster.pod.status.Failed',
                  }),
                  value: 'Failed',
                },
                {
                  label: intl.formatMessage({
                    id: 'cluster.pod.status.Unknown',
                  }),
                  value: 'Unknown',
                },
              ]}
            />
          </>
        );
      },
      render: (dom, entity: IPod) => {
        // "Failed" | "Pending" | "Running" | "Succeeded" | "Unknown";
        const phase = entity?.status?.phase || 'Unknown';
        if (phase === 'Running') {
          return (
            <Tag style={{ border: 0 }} color="green">
              <FormattedMessage id="cluster.pod.status.Running" />
            </Tag>
          );
        } else if (phase === 'Pending') {
          return (
            <Tag style={{ border: 0 }} color="orange">
              <FormattedMessage id="cluster.pod.status.Pending" />
            </Tag>
          );
        } else if (phase === 'Succeeded') {
          return (
            <Tag style={{ border: 0 }} color="blue">
              <FormattedMessage id="cluster.pod.status.Succeeded" />
            </Tag>
          );
        } else if (phase === 'Failed') {
          return (
            <Tag style={{ border: 0 }} color="red">
              <FormattedMessage id="cluster.pod.status.Failed" />
            </Tag>
          );
        } else {
          return (
            <Tag style={{ border: 0 }} color="red">
              <FormattedMessage id="cluster.pod.status.Unknown" />
            </Tag>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.workload.container.number' }),
      search: false,
      render: (dom, entity: IPod) => {
        const containers = entity.spec?.containers;
        const initContainers = entity.spec?.initContainers;
        const ephemeralContainers = entity.spec?.ephemeralContainers;
        const containersNumber = entity.spec?.containers?.length || 0;
        const initContainersNumber = entity.spec?.initContainers?.length || 0;
        const ephemeralContainerNumber = entity.spec?.ephemeralContainers?.length || 0;
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
                      <Tag style={{ border: 0 }} key={item.name}>
                        {item.name}={item.image}
                      </Tag>
                    ))}
                  </Space>
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
              {ephemeralContainerNumber > 0 && (
                <>
                  <Divider style={{ margin: '0 0', fontSize: '12px' }}>
                    <FormattedMessage id="cluster.workload.ephemeralContainers" />
                  </Divider>
                  <Space orientation='vertical' size='small'>
                    {ephemeralContainers?.map((item: IContainer) => (
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
          if (ephemeralContainerNumber > 0) {
            tags.push(
              <Tag style={{ border: 0 }} key="ephemeralContainerNumber">
                <FormattedMessage id="cluster.workload.ephemeralContainers" />
                &nbsp;:&nbsp;{ephemeralContainerNumber}
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
                  {ephemeralContainerNumber > 0 && (
                    <>
                      <Divider style={{ margin: '0 0', fontSize: '12px' }}>
                        <FormattedMessage id="cluster.workload.ephemeralContainers" />
                      </Divider>
                      {ephemeralContainers?.map((item: IContainer) => (
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
      title: intl.formatMessage({ id: 'cluster.resource.container.restartCount' }),
      search: false,
      align: 'center',
      render: (dom, entity: IPod) => {
        const status = entity?.status?.containerStatuses;
        let restartCount = 0;
        status?.forEach((item) => {
          restartCount += item.restartCount;
        });
        return <span>{restartCount}</span>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.node' }),
      search: false,
      align: 'center',
      render: (dom, entity: IPod) => {
        return <span>{entity.spec?.nodeName}</span>;
      },
    },

    {
      title: 'IP',
      search: false,
      align: 'center',
      hideInTable: !expandInfo,
      render: (dom, entity: IPod) => {
        return <span>{entity.status?.podIP}</span>;
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
          <Space key='labels'>
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
      render: (dom, entity: IPod) => {
        const keys = Object.keys(entity?.metadata?.labels || {});
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
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: IPod) => {
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
          <Space key='fieldSelector'>
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
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      render: (_, record) => {
        const nodes = [] as React.ReactElement[];
        if (record?.status?.phase === 'Running') {
          if (resourceResizeSupport) {
            nodes.unshift(<Tooltip color={colorPrimary} title={intl.formatMessage({ id: "cluster.resource.pod.resource.resize" })}> <SettingOutlined style={{ color: colorPrimary }} /></Tooltip>)
          }
          nodes.unshift(
            <span
              onClick={() => {
                setPatchPod(record);
                setMonitorDrawerVisible(true);
              }}
            >
              <LineChartOutlined style={{ color: colorPrimary }} />
            </span>,
            <span
              style={{ color: colorPrimary }}
              onClick={() => {
                setPatchPod(record);
                setTerminalDrawerVisible(true);
              }}
            >
              <CodeOutlined />
            </span>,
          );
        }

        nodes.unshift(<span
          onClick={() => {
            setPatchPod(record);
            setLogDrawerVisible(true);
          }}
        >
          <ProfileOutlined style={{ color: colorPrimary }} />
        </span>);
        if (!record.metadata?.ownerReferences) {
          nodes.unshift(
            <a
              onClick={() => {
                window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/workload/pods/${record?.metadata?.name}/update`, { cluster: cluster, namespace: record?.metadata?.namespace });
              }}
            >
              <EditOutlined style={{ color: colorPrimary }} />
            </a>,
          );
        }
        nodes.push(<Popconfirm
          key={record.metadata?.resourceVersion + '-delete'}
          description={intl.formatMessage({
            id: 'cluster.resource.pod.delete.description',
          })}
          title={
            intl.formatMessage({ id: 'pages.operation.delete.description' }) +
            getClusterResource('Pod') +
            '【' +
            record.metadata?.name +
            '】'
          }
          onConfirm={() => {
            handleRemove(intl, [record]);
          }}
          okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
          cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
        >
          <DeleteOutlined style={{ color: 'red' }} />
        </Popconfirm>);
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
  const patchVisibleReflash = (visible: boolean) => {
    setPatchAnnotationsVisible(false);
    setPatchLabelVisible(false);
    setEditorResource(false);
    setResourceDrawerVisible(false);
    setMonitorDrawerVisible(false);
    setOwnerVisible(false)
    actionRef.current?.reload();
  };
  const [externalAiMessage, setExternalAiMessage] = useState<{ message: string; questionType: 'log'; }>();
  const handleLogSelect = (logQuestion: string) => {
    setExternalAiMessage({ message: logQuestion, questionType: 'log' });
  };
  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'menu.workload.pod' })}
      subTitle="Pod"
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IPod>
        key='pod'
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        rowKey={(record: IPod) => `${record?.metadata?.name}-${record.metadata?.resourceVersion}`}
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


                  listPods();
                }}
              >
                {searchText}
              </Button>,
            ];
          },
        }}
        options={{
          reload: () => {


            listPods();
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
                  id: 'cluster.resource.pod.delete.description',
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
      {logDrawerVisible && <Drawer
        destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={logDrawerVisible}
        onClose={() => setLogDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('Pod')}:&nbsp;&nbsp;{patchPod?.metadata?.name}
            &nbsp;
            <FormattedMessage id="cluster.resource.container.log" />
          </>
        }
      >
        {logDrawerVisible && (
          <PodContainerLog
            running={patchPod?.status?.phase === 'Running'}
            cluster={cluster}
            namespace={patchPod?.metadata?.namespace || ''}
            pod={patchPod?.metadata?.name || ''}
            containers={[
              ...(patchPod?.spec?.initContainers?.map(c => c.name) ?? []),
              ...(patchPod?.spec?.containers?.map(c => c.name) ?? [])
            ]}
            onSelectLog={handleLogSelect}
          />
        )}
      </Drawer>}
      {terminalDrawerVisible && <Drawer
        destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={terminalDrawerVisible}
        onClose={() => setTerminalDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('Pod')}:&nbsp;&nbsp;{patchPod?.metadata?.name}
            &nbsp;
            <FormattedMessage id="cluster.resource.container.terminal" />
          </>
        }
      >
        {patchPod && (
          <PodContainerTerminal

            cluster={cluster}
            namespace={patchPod?.metadata?.namespace || ''}
            pod={patchPod?.metadata?.name || ''}
            containers={
              patchPod?.spec?.containers.map((item) => item.name) || []
            }
          />
        )}
      </Drawer>}
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
            {getClusterResource('Pod')}:&nbsp;&nbsp;{patchPod?.metadata?.name}
            &nbsp;
            <FormattedMessage id="cluster.resource.monitor" />
          </>
        }
      >
        {patchPod && (
          <RenderPodMetrics
            cluster={cluster}
            namespace={patchPod.metadata?.namespace || ''}
            pod={patchPod.metadata?.name || ''}
          />
        )}
      </Drawer>
      {patchLabelVisible && (
        <PatchLabels
          setVisible={patchVisibleReflash}
          patchType="labels"
          title={<FormattedMessage id="cluster.patch.labels" />}
          key={patchModalKey}
          kind="Pod"
          address={`apis/apps/v1/namespaces/${patchPod?.metadata?.namespace}/statefulsets/${patchPod?.metadata?.name}`}

          cluster={cluster}
          name={patchPod?.metadata?.name || ''}
          visible={patchLabelVisible}
          labels={patchPod?.metadata?.labels || {}}
        />
      )}
      {patchAnnotationsVisible && (
        <PatchLabels
          setVisible={patchVisibleReflash}
          patchType="annotations"
          title={<FormattedMessage id="cluster.patch.annotations" />}
          key={'annotations-' + patchModalKey}
          kind="Pod"
          address={`apis/apps/v1/namespaces/${patchPod?.metadata?.namespace}/statefulsets/${patchPod?.metadata?.name}`}

          cluster={cluster}
          name={patchPod?.metadata?.name || ''}
          visible={patchAnnotationsVisible}
          labels={patchPod?.metadata?.annotations || {}}
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
      {resourceDrawerVisible && <Drawer
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
            {getClusterResource('Pod')}:&nbsp;&nbsp;
            {patchPod?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={patchPod?.metadata?.resourceVersion || 'edit'}
          edit={editorResource}
          address={`apis/apps/v1/namespaces/${patchPod?.metadata?.namespace}/statefulsets/${patchPod?.metadata?.name}`}
          kind="Pod"
          name={patchPod?.metadata?.name || ''}

          cluster={cluster}
          content={patchPod}
        />
      </Drawer>}
      {monitorDrawerVisible && <Drawer
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
            {getClusterResource('Pod')}:&nbsp;&nbsp;
            {patchPod?.metadata?.name}&nbsp;
            <FormattedMessage id="cluster.resource.monitor" />
          </>
        }
      >
        {patchPod && (
          <RenderPodMetrics cluster={cluster} namespace={patchPod.metadata?.namespace || ''} pod={patchPod.metadata?.name || ''} />
        )}
      </Drawer>}
      {ownerVisible && <OwnerReferencesView

        cluster={cluster}
        namespace={patchPod?.metadata?.namespace || ''}
        visibleView={ownerVisible}
        ownerReferences={patchPod?.metadata?.ownerReferences || []}
        setVisible={setOwnerVisible}
        api='apis'
      />}
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="Pod"
        externalMessage={externalAiMessage}
        externalSkills={['k8s-troubleshoot']}
      />
    </PageContainer>
  );
};
export default IndexDashboard;
