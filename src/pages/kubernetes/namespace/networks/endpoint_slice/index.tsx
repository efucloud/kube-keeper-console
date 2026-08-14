import { CloseCircleOutlined, DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, InsertRowBelowOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Modal, message, Popconfirm, Popover, Select, Space, Tag, Typography, Empty, Divider, Drawer, Flex } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import { IEndpointSlice, EndpointSliceList, IIoK8sApiDiscoveryV1Endpoint, IIoK8sApiDiscoveryV1EndpointPort } from "kubernetes-models/discovery.k8s.io/v1";
import debounce from 'lodash/debounce';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';
import { useK8sWatchStream } from '@/hooks/useK8sWatchStream';

import { canAccessClusterNamespaces } from '@/services/personal.api';
import { getClusterApiVersions, getColorPrimary, getCurrentViewInfo, normalizeKubernetesPath } from '@/utils/global';
import { syncClusterNamespace } from '@/services/cluster.api';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { getClusterResource } from '@/utils/cluster';
import OwnerReferencesView from '@/pages/kubernetes/components/owner_references';

import AICopilot from '@/pages/kubernetes/components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance>(undefined);
  const [dataSource, setDataSource] = useState<IEndpointSlice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [watch, setWatch] = useState<boolean>(false);
  const { cluster, namespace } = getCurrentViewInfo();
  const [selectedRowsState, setSelectedRows] = useState<IEndpointSlice[]>([]);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const intl = useIntl();
  const resourceGroup = getClusterApiVersions(cluster, ['discovery.k8s.io/v1beta1', 'discovery.k8s.io/v1'], 'EndpointSlice');
  const address = namespace ? `apis/${resourceGroup.groupVersion}/namespaces/${namespace}/endpointslices` : `apis/${resourceGroup.groupVersion}/endpointslices`;
  const [selectedRow, setSelectedRow] = useState<IEndpointSlice>();
  const [ownerVisible, setOwnerVisible] = useState<boolean>(false);
  const [searchName, setSearchName] = useState<string>('');
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
  const listEndpointSlices = async () => {
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
      const data = (await clusterGetProxy(params)) as EndpointSliceList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'EndpointSlice';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listEndpointSlices();

  }, []);
  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };
  const handleRemove = async (intl: IntlShape, selectedRows: IEndpointSlice[]) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: IEndpointSlice) => {
      const params = {

        cluster,
        address: `apis/discovery.k8s.io/v1/namespaces/${entity.metadata?.namespace}/endpointslices/${entity.metadata?.name}`,
      };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
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

  const columns: ProColumns<IEndpointSlice>[] = [
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
                  normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${entity?.metadata?.namespace}/networks/endpoint_slices`),
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
        return <a onClick={() => {
          setSelectedRow(entity);
          setResourceDrawerVisible(true);
        }}>{entity?.metadata?.name}</a>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'addressType',

    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.service.ports.port' }),
      render: (dom, entity) => {
        return <Space orientation='vertical'>
          {entity?.ports?.map((item: IIoK8sApiDiscoveryV1EndpointPort) => {
            return <div>
              <FormattedMessage id='cluster.resource.service.ports.protocol' />:{item.protocol}&nbsp;&nbsp;
              <FormattedMessage id='cluster.service.port.name' />:{item.name}&nbsp;&nbsp;
              <FormattedMessage id='cluster.resource.service.ports.port' />:{item.port}&nbsp;&nbsp;
            </div>
          })}
        </Space>;
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
      render: (dom, entity: IEndpointSlice) => {
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
      hideInTable: !expandInfo,
      search: false,
      render: (dom, entity: IEndpointSlice) => {
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
              id: 'cluster.serviceaccount.delete.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              intl.formatMessage({ id: 'cluster.serviceaccount' }) + `【${record.metadata?.name}】`
            }
            onConfirm={() => {
              handleRemove(intl, [record]);
            }}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <DeleteOutlined style={{ color: 'red' }} />
          </Popconfirm>
        ];
        if (record?.metadata?.ownerReferences) {
          nodes.push(
            <a
              onClick={() => {
                setSelectedRow(record);
                setOwnerVisible(true)
              }}
              style={{ color: colorPrimary }}
            >
              <FormattedMessage id="cluster.view.ownerReferences" />
            </a>
          )
        }
        return <Space>{nodes}</Space>;
      },
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.serviceaccount' })}
      subTitle={'EndpointSlice'}
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IEndpointSlice>
        key='endpointslices'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey={(record: IEndpointSlice) =>
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


                  listEndpointSlices();
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
        locale={{
          emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
        }}
        options={{
          reload: () => {


            listEndpointSlices();
          }
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
              {expandInfo ? (<FormattedMessage id="cluster.node.shrink" />) : (<FormattedMessage id="cluster.node.expand" />)}
            </a>

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
        expandable={{
          expandedRowRender: (record: IEndpointSlice) => {
            return (<div>
              {record.endpoints?.length > 0 &&
                <div>
                  <ProTable<IIoK8sApiDiscoveryV1Endpoint>
                    key='endpoints'
                    size='small'
                    dataSource={record.endpoints}
                    rowKey="name"
                    columns={[
                      {
                        title: <FormattedMessage id="cluster.node" />,
                        dataIndex: 'nodeName'
                      },
                      {
                        title: <FormattedMessage id="model.status" />,
                        dataIndex: ['conditions', 'ready'],
                        valueEnum: {
                          true: {
                            text: <FormattedMessage id="cluster.resource.status.ready" />,
                            status: 'success',
                          },
                          false: {
                            text: <FormattedMessage id="cluster.resource.status.unready" />,
                            status: 'error',
                          },

                        },
                      },
                      {
                        title: <FormattedMessage id="cluster.resource.status.serving" />,
                        dataIndex: ['conditions', 'serving'],
                        valueEnum: {
                          true: {
                            text: <FormattedMessage id="cluster.boolean.true" />,
                            status: 'success',
                          },
                          false: {
                            text: <FormattedMessage id="cluster.boolean.false" />,
                            status: 'error',
                          },

                        },
                      },
                      {
                        title: <FormattedMessage id="cluster.resource.status.terminating" />,
                        dataIndex: ['conditions', 'terminating'],
                        valueEnum: {
                          true: {
                            text: <FormattedMessage id="cluster.boolean.true" />,
                            status: 'success',
                          },
                          false: {
                            text: <FormattedMessage id="cluster.boolean.false" />,
                            status: 'error',
                          },

                        },
                      },
                      {
                        title: <FormattedMessage id="cluster.node" />,
                        dataIndex: 'addresses',
                        render: (dom, entity) => {
                          return <Flex>{entity.addresses.map((item: string) => <Tag key={item}>{item}</Tag>)}</Flex>
                        },
                      },//
                      {
                        title: <FormattedMessage id="cluster.resource.backend.service" />,
                        render: (dom, entity) => {
                          if (entity.targetRef) {
                            return <>{entity.targetRef?.namespace}/{entity.targetRef?.kind}/{entity.targetRef?.name}</>
                          } else {
                            return '-'
                          }
                        },
                      }
                    ]}
                    search={false}
                    options={false}
                    pagination={false}
                    locale={{
                      emptyText: intl.formatMessage({
                        id: 'pages.not.found.data',
                      }),
                    }}
                  />
                </div>}

            </div>)
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
                  id: 'cluster.role.delete.description',
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
            {getClusterResource('Endpoint')}:&nbsp;&nbsp;
            {selectedRow?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={selectedRow?.metadata?.resourceVersion || 'edit'}
          edit={false}
          address={`apis/discovery.k8s.io/v1/namespaces/${selectedRow?.metadata?.namespace}/endpointslices/${selectedRow?.metadata?.name}`}
          kind="PersistentVolumeClaim"
          name={selectedRow?.metadata?.name || ''}

          cluster={cluster}
          content={selectedRow}
        />
      </Drawer>
      {ownerVisible && <OwnerReferencesView

        cluster={cluster}
        namespace={selectedRow?.metadata?.namespace || ''}
        visibleView={ownerVisible}
        ownerReferences={selectedRow?.metadata?.ownerReferences || []}
        setVisible={setOwnerVisible}
        plural='services'
        api='api'
      />}
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="EndpointSlice"
      />
    </PageContainer>
  );
};

export default IndexDashboard;
