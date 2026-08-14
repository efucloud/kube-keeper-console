import { CloseCircleOutlined, DeleteOutlined, DockerOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, InsertRowBelowOutlined, LineChartOutlined, MoreOutlined, ReloadOutlined, SaveOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Divider, Drawer, Dropdown, Flex, Modal, message, Popconfirm, Popover, Select, Space, Tag, Typography, Empty } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import type { IStatefulSet, StatefulSetList } from 'kubernetes-models/apps/v1';
import type { IContainer } from 'kubernetes-models/v1';
import debounce from 'lodash/debounce';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import PatchReplicas from '@/pages/kubernetes/components/patch_replicas';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { RenderWorkloadMetrics } from '@/pages/kubernetes/components/workload_metrics';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterDeleteProxy, clusterGetProxy, clusterPostProxy } from '@/services/cluster_proxy.api';
import { useK8sWatchStream } from '@/hooks/useK8sWatchStream';

import { canAccessClusterNamespaces } from '@/services/personal.api';
import { getClusterResource } from '@/utils/cluster';
import { getClusterApiVersions, getColorPrimary, getCurrentViewInfo, normalizeKubernetesPath } from '@/utils/global';
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
  const [selectedRowsState, setSelectedRows] = useState<IStatefulSet[]>([]);
  const [monitorDrawerVisible, setMonitorDrawerVisible] = useState<boolean>(false);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchStatefulSet, setPatchStatefulSet] = useState<IStatefulSet>();
  const [patchModalKey, setPatchModalKey] = useState<string>('');
  const [patchAnnotationsVisible, setPatchAnnotationsVisible] = useState<boolean>(false);
  const [patchReplicasVisible, setPatchReplicasVisible] = useState<boolean>(false);
  const [imageVisible, setImageVisible] = useState<boolean>(false);
  const resourceGroup = getClusterApiVersions(cluster, ['apps/v1', 'apps/v1beta1', 'apps/v1beta2'], 'StatefulSet');
  const address = namespace ? `apis/${resourceGroup.groupVersion}/namespaces/${namespace}/statefulsets` : `apis/${resourceGroup.groupVersion}/statefulsets`;
  const [searchName, setSearchName] = useState<string>('');
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const intl = useIntl();
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [ownerVisible, setOwnerVisible] = useState<boolean>(false);
  const [editorResource, setEditorResource] = useState<boolean>(false);

  const [dataSource, setDataSource] = useState<IStatefulSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [watch, setWatch] = useState<boolean>(false);
  let BaseAddress = `/kubernetes/cluster/${cluster}/namespace/${namespace}/workload/statefulsets`;
  if (!namespace || namespace === '' || namespace === '-') {
    BaseAddress = `/kubernetes/cluster/${cluster}/workload/statefulsets`;
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
  const listStatefulsets = async () => {
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
      const data = (await clusterGetProxy(params)) as StatefulSetList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'StatefulSet';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listStatefulsets();

  }, []);

  const patchVisibleReflash = (visible: boolean) => {
    setPatchAnnotationsVisible(false);
    setPatchReplicasVisible(false);
    setPatchLabelVisible(false);
    setEditorResource(false);
    setResourceDrawerVisible(false);
    setMonitorDrawerVisible(false);
    setOwnerVisible(false)
    actionRef.current?.reload();
  };

  const handleRemove = async (intl: IntlShape, selectedRows: IStatefulSet[]) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: IStatefulSet) => {
      const params = {

        cluster,
        address: `apis/${resourceGroup.groupVersion}/namespaces/${entity.metadata?.namespace}/statefulsets/${entity.metadata?.name}`,
      };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };
  const moreItems = (record: IStatefulSet) => {
    const nodes = [
      {
        key: 'view-yaml',
        label: (
          <a
            onClick={() => {
              setPatchStatefulSet(record);
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
                setPatchStatefulSet(record);
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
              setPatchStatefulSet(record);
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
                setPatchStatefulSet(record);
                setPatchAnnotationsVisible(true);
                setPatchModalKey('annotations-' + record.metadata?.name);
              }}
              style={{ color: colorPrimary }}
            >
              <FormattedMessage id="cluster.patch.annotations" />
            </a>
          ),
        },
        {
          key: 'replicas',
          label: (
            <a
              onClick={() => {
                setPatchStatefulSet(record);
                setPatchReplicasVisible(true);
                setPatchModalKey('replicas-' + record.metadata?.name);
              }}
              style={{ color: colorPrimary }}
            >
              <FormattedMessage id="cluster.patch.replicas" />
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
                setPatchStatefulSet(record);
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
  const reDeploy = async (bodyData: IStatefulSet) => {
    await clusterDeleteProxy({ cluster, address: `apis/${resourceGroup.groupVersion}/namespaces/${bodyData.metadata?.namespace}/statefulsets/${bodyData.metadata?.name}` });
    const requestData = { ...bodyData };
    delete requestData.status;
    delete requestData.metadata?.creationTimestamp;
    delete requestData.metadata?.resourceVersion;
    delete requestData.metadata?.uid;
    await clusterPostProxy({ cluster, address: `apis/${resourceGroup.groupVersion}/namespaces/${requestData.metadata?.namespace}/statefulsets` }, requestData,);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
  };
  const {
    data: watchDataSource,
    startWatch,
    stopWatch,
  } = useK8sWatchStream<any>({
    cluster,
    address: address,
    labelSelector: searchLabels,
    fieldSelector: {
      ...(searchName ? { 'metadata.name': searchName } : {}),
      ...searchFields,
    },
  });

  useEffect(() => {
    if (watch) {
      setDataSource(watchDataSource as any);
    }
  }, [watch, watchDataSource]);

  useEffect(() => {
    if (watch) {
      startWatch();
    }
  }, [watch, startWatch]);


  useEffect(() => {
    return () => {
      stopWatch();
    };
  }, [stopWatch]);
  const columns: ProColumns<IStatefulSet>[] = [
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
                  normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${entity?.metadata?.namespace}/workload/statefulsets`),
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
                      window.location.pathname = normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${entity?.metadata?.namespace}/workload/statefulsets/${entity?.metadata?.name}`);
                    } else {
                      window.open(
                        normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${entity?.metadata?.namespace}/workload/statefulsets/${entity?.metadata?.name}`),
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
                    window.location.pathname = normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${entity?.metadata?.namespace}/workload/statefulsets/${entity?.metadata?.name}`);
                  } else {
                    window.open(
                      normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${entity?.metadata?.namespace}/workload/statefulsets/${entity?.metadata?.name}`),
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
      render: (dom, entity: IStatefulSet) => {
        if (entity?.status?.readyReplicas > 0) {
          return (
            <>
              <a style={{ color: '#52c41a' }}>
                {entity?.status?.readyReplicas}&nbsp;
              </a>
              {'/ ' + entity.spec?.replicas}
            </>
          );
        } else {
          return (
            <>
              <a style={{ color: 'red' }}>
                {entity?.status?.readyReplicas || 0}&nbsp;
              </a>
              {'/ ' + entity.spec?.replicas}
            </>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.status' }),
      search: false,
      render: (dom, entity: IStatefulSet) => {
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
      render: (dom, entity: IStatefulSet) => {
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
                    <Space orientation='vertical' size={'small'}>
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
      render: (dom, entity: IStatefulSet) => {
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
      render: (dom, entity: IStatefulSet) => {
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
        let nodes = [
          <a onClick={() => {
            setImageVisible(true)
            setPatchStatefulSet(record);
          }}><DockerOutlined style={{ color: colorPrimary }} /></a>,
          <span
            onClick={() => {
              setPatchStatefulSet(record);
              setMonitorDrawerVisible(true);
            }}
          >
            <LineChartOutlined style={{ color: colorPrimary }} />
          </span>,
          <Popconfirm
            key={record.metadata?.resourceVersion + '-delete'}
            description={intl.formatMessage({
              id: 'cluster.resource.statefulset.delete.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              getClusterResource('StatefulSet') + `【${record.metadata?.name}】`
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
                window.location.href = normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${record?.metadata?.namespace}/workload/statefulsets/${record?.metadata?.name}/update`);
              }}
            >
              <EditOutlined style={{ color: colorPrimary }} />
            </a>,
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
  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'menu.workload.statefulset' })}
      subTitle="StatefulSet"
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IStatefulSet>
        key='stateful-set'
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        rowKey={(record: IStatefulSet) =>
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


                  listStatefulsets();
                }}
              >

                {searchText}
              </Button>,
            ];
          },
        }}
        options={{
          reload: () => {


            listStatefulsets();
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
            {watch && (
              <span className='watch-status-blink' style={{ color: colorPrimary, fontSize: '12px' }}>
                {intl.formatMessage({ id: 'cluster.resource.watch.status' })}
              </span>
            )}

            {watch ? (
              <EyeOutlined
                style={{ color: colorPrimary, fontSize: '20px' }}
                onClick={() => {
                  stopWatch();
                  setWatch(false);
                }}
              />
            ) : (
              <EyeInvisibleOutlined
                style={{ fontSize: '20px' }}
                onClick={() => {
                  setWatch(true);
                  startWatch();
                }}
              />
            )}



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
                key="create-yaml"
                onClick={() => {
                  window.location.href = normalizeKubernetesPath(`${BaseAddress}/create/text`);
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
                  window.location.href = normalizeKubernetesPath(`${BaseAddress}/create/form/step`);
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
                  id: 'cluster.resource.statefulset.delete.description',
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
          kind="StatefulSet"
          address={`apis/${resourceGroup.groupVersion}/namespaces/${patchStatefulSet?.metadata?.namespace}/statefulsets/${patchStatefulSet?.metadata?.name}`}

          cluster={cluster}
          name={patchStatefulSet?.metadata?.name || ''}
          visible={patchLabelVisible}
          labels={patchStatefulSet?.metadata?.labels || {}}
        />
      )}
      {patchAnnotationsVisible && (
        <PatchLabels
          setVisible={patchVisibleReflash}
          patchType="annotations"
          title={<FormattedMessage id="cluster.patch.annotations" />}
          key={'annotations-' + patchModalKey}
          kind="StatefulSet"
          address={`apis/${resourceGroup.groupVersion}/namespaces/${patchStatefulSet?.metadata?.namespace}/statefulsets/${patchStatefulSet?.metadata?.name}`}

          cluster={cluster}
          name={patchStatefulSet?.metadata?.name || ''}
          visible={patchAnnotationsVisible}
          labels={patchStatefulSet?.metadata?.annotations || {}}
        />
      )}
      {patchReplicasVisible && (
        <PatchReplicas
          setVisible={patchVisibleReflash}
          key={'replicas-' + patchModalKey}
          kind="StatefulSet"
          address={`apis/${resourceGroup.groupVersion}/namespaces/${patchStatefulSet?.metadata?.namespace}/statefulsets/${patchStatefulSet?.metadata?.name}`}

          cluster={cluster}
          name={patchStatefulSet?.metadata?.name || ''}
          visible={patchReplicasVisible}
          replicas={patchStatefulSet?.spec?.replicas || 0}
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
            {getClusterResource('StatefulSet')}:&nbsp;&nbsp;
            {patchStatefulSet?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={patchStatefulSet?.metadata?.resourceVersion || 'edit'}
          edit={editorResource}
          address={`apis/${resourceGroup.groupVersion}/namespaces/${patchStatefulSet?.metadata?.namespace}/statefulsets/${patchStatefulSet?.metadata?.name}`}
          kind="StatefulSet"
          name={patchStatefulSet?.metadata?.name || ''}

          cluster={cluster}
          content={patchStatefulSet}
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
            {getClusterResource('StatefulSet')}:&nbsp;&nbsp;
            {patchStatefulSet?.metadata?.name}&nbsp;
            <FormattedMessage id="cluster.resource.monitor" />
          </>
        }
      >
        {patchStatefulSet && (
          <RenderWorkloadMetrics

            cluster={cluster}
            namespace={patchStatefulSet.metadata?.namespace || ''}
            workload={patchStatefulSet.metadata?.name || ''}
            workloadType="statefulset"
          />
        )}
      </Drawer>
      {ownerVisible && <OwnerReferencesView

        cluster={cluster}
        namespace={patchStatefulSet?.metadata?.namespace || ''}
        visibleView={ownerVisible}
        ownerReferences={patchStatefulSet?.metadata?.ownerReferences || []}
        setVisible={setOwnerVisible}
        api='apis'
      />}
      {imageVisible && <>
        <PatchImages
          title={intl.formatMessage({ id: 'cluster.resource.images.change' })}
          key={patchStatefulSet?.metadata?.namespace + '-' + patchStatefulSet?.metadata?.name}
          setVisible={setImageVisible}
          address={`apis/${resourceGroup.groupVersion}/namespaces/${patchStatefulSet?.metadata?.namespace}/deployments/${patchStatefulSet?.metadata?.name}`}
          cluster={cluster}
          namespace={patchStatefulSet?.metadata?.namespace || ''}
          kind='StatefulSet'
          name={patchStatefulSet?.metadata?.name || ''}
          visible={imageVisible}
          containers={patchStatefulSet?.spec?.template?.spec?.containers || []}
          initContainers={patchStatefulSet?.spec?.template.spec?.initContainers || []}
        />
      </>}
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="StatefulSet"
        externalSkills={['k8s-troubleshoot']}
      />
    </PageContainer>
  );
};

export default IndexDashboard;
