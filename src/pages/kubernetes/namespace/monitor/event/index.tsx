import { CloseCircleOutlined, EyeInvisibleOutlined, EyeOutlined, InsertRowBelowOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, message, Popover, Select, Space, Tag, Typography, Empty, Divider, Drawer } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import type { EventList, IEvent } from 'kubernetes-models/v1';
import debounce from 'lodash/debounce';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { useK8sWatchStream } from '@/hooks/useK8sWatchStream';

import { canAccessClusterNamespaces } from '@/services/personal.api';
import { getColorPrimary, getCurrentViewInfo, normalizeKubernetesPath } from '@/utils/global';
import { syncClusterNamespace } from '@/services/cluster.api';

import { getClusterResource } from '@/utils/cluster';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import AICopilot from '@/pages/kubernetes/components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const { cluster, namespace } = getCurrentViewInfo();
  const address = namespace ? `api/v1/namespaces/${namespace}/events` : `api/v1/events`;
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [selectedEvent, setSelectedEvent] = useState<IEvent>({} as IEvent)
  const intl = useIntl();
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [dataSource, setDataSource] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [watch, setWatch] = useState<boolean>(false);
  const formRef = useRef<ProFormInstance>(undefined);
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
  const listEvents = async () => {
    setLoading(true);
    try {
      const params = { cluster, address: address } as Record<string, any>;

      const fieldSelector = {} as Record<string, string>;
      if (namespace && namespace) {
        fieldSelector['metadata.namespace'] = namespace;
      } else if (selectedNamespace && selectedNamespace !== '') {
        fieldSelector['metadata.namespace'] = selectedNamespace;
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
      const data = (await clusterGetProxy(params)) as EventList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'Event';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    listEvents();

  }, []);
  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
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
  const columns: ProColumns<IEvent>[] = [
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
                  normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${entity?.metadata?.namespace}/monitor/events`),
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
      title: intl.formatMessage({ id: 'cluster.resource.event.type' }),
      dataIndex: 'type',
      render: (dom, entity: IEvent) => {
        return <>{entity.type}</>;
      },
    },

    {
      title: intl.formatMessage({ id: 'cluster.resource.event.name' }),
      dataIndex: 'name',
      search: false,
      render: (dom, entity) => {
        return <a onClick={() => {
          setResourceDrawerVisible(true)
          setSelectedEvent(entity)
        }}>{entity?.metadata?.name}</a>;
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
      title: intl.formatMessage({ id: 'cluster.resource.event.reason' }),
      search: false,
      render: (dom, entity: IEvent) => {
        return <>{entity.reason}</>;
      },
    },
    {
      title: intl.formatMessage({
        id: 'cluster.resource.event.reportingComponent',
      }),
      search: false,
      render: (dom, entity: IEvent) => {
        return <>{entity.reportingComponent}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.event.count' }),
      search: false,
      render: (dom, entity: IEvent) => {
        return <>{entity.count}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: IEvent) => {
        return (
          <span>
            {dayjs(entity.metadata?.creationTimestamp).format(
              'YYYY-MM-DD HH:mm:ss',
            )}
          </span>
        );
      },
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.resource.event' })}
      subTitle="Event"
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IEvent>
        key='event'
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        rowKey={(record: IEvent) =>
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
                  formRef?.current?.resetFields();

                  listEvents();
                }}
              >
                {resetText}
              </Button>,
              <Button
                key="search"
                type="primary"
                onClick={() => {

                  listEvents();
                }}
              >
                {searchText}
              </Button>,
            ];
          },
        }}
        options={{
          reload: () => {

            listEvents();
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


          </Space>
        ]}
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowSelection={false}
      />
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
            {getClusterResource('Event')}:&nbsp;&nbsp;
            {selectedEvent?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={selectedEvent.metadata?.uid!}
          edit={false}
          address=''
          kind="Event"
          name={selectedEvent?.metadata?.name || ''}

          cluster={cluster}
          content={selectedEvent}
        />
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="Event"
      />
    </PageContainer>
  );
};

export default IndexDashboard;
