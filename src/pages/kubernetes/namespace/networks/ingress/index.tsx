import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Modal, message, Popconfirm, Select, Space, Empty, Divider } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import type { IIngress, IngressList } from 'kubernetes-models/networking.k8s.io/v1';
import debounce from 'lodash/debounce';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';
import { useK8sWatchStream } from '@/hooks/useK8sWatchStream';

import { canAccessClusterNamespaces } from '@/services/personal.api';
import { getClusterApiVersions, getColorPrimary, getCurrentViewInfo, normalizeKubernetesPath } from '@/utils/global';
import { syncClusterNamespace } from '@/services/cluster.api';

import AICopilot from '@/pages/kubernetes/components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const { cluster, namespace } = getCurrentViewInfo();
  const [selectedRowsState, setSelectedRows] = useState<IIngress[]>([]);
  const formRef = useRef<ProFormInstance>(undefined);
  const [dataSource, setDataSource] = useState<IIngress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [watch, setWatch] = useState<boolean>(false);
  let BaseAddress = `/kubernetes/cluster/${cluster}/namespace/${namespace}/networks/ingresses`;
  if (!namespace || namespace === '' || namespace === '-') {
    BaseAddress = `/kubernetes/cluster/${cluster}/networks/ingresses`;
  }
  const resourceGroup = getClusterApiVersions(cluster, ['networking.k8s.io/v1', 'extensions/v1', 'extensions/v1beta1'], 'Ingress');
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const intl = useIntl();
  const address = namespace ? `apis/${resourceGroup.groupVersion}/namespaces/${namespace}/ingresses` : `apis/${resourceGroup.groupVersion}/ingresses`;
  const [searchName, setSearchName] = useState<string>('');
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
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
  const listIngresss = async () => {
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
      const data = (await clusterGetProxy(params)) as IngressList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'Ingress';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listIngresss();

  }, []);

  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };




  const handleRemove = async (intl: IntlShape, selectedRows: IIngress[]) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: IIngress) => {
      const params = {

        cluster,
        address: `apis/${resourceGroup.groupVersion}/namespaces/${entity.metadata?.namespace}/ingresses/${entity.metadata?.name}`,
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

  const columns: ProColumns<IIngress>[] = [
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
                  normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${entity?.metadata?.namespace}/networks/ingresses`),
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
        return <a href={`/kubernetes/cluster/${cluster}/namespace/${entity?.metadata?.namespace}/networks/ingresses/${entity?.metadata?.name}`}>{entity?.metadata?.name}</a>
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.ingressClass' }),
      search: false,
      render: (dom, entity: IIngress) => {
        return <div>{entity.spec?.ingressClassName}</div>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.ingress.rules' }),
      search: false,
      render: (dom, entity: IIngress) => {
        if (!expandInfo) {
          return (
            <>
              <FormattedMessage id="cluster.resource.number" />
              :&nbsp;{entity.spec?.rules?.length || ''}
            </>
          );
        } else {
          const nodes = [];
          const tls = entity.spec?.tls ? true : false;
          entity.spec?.rules?.map((rule, index) => {
            rule.http?.paths?.map((path) => {
              let address = `http://${rule.host}${path.path}`;
              if (tls) {
                address = `https://${rule.host}${path.path}`;
              }
              nodes.push(
                <div key={index}>
                  <span>
                    {path.backend?.service?.name}:
                    {path.backend?.service?.port?.number}&nbsp;
                  </span>
                  <a onClick={() => window.open(normalizeKubernetesPath(address))}>{address}</a>
                </div>,
              );
            });
          });
          return nodes;
        }
      },
    },

    {
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: IIngress) => {
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
          <a
            onClick={() => {
              window.location.href = normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${record?.metadata?.namespace}/networks/ingresses/${record?.metadata?.name}/update`);
            }}
          >
            <EditOutlined style={{ color: colorPrimary }} />
          </a>,
          <Popconfirm
            key={record.metadata?.resourceVersion + '-delete'}
            description={intl.formatMessage({
              id: 'cluster.resource.ingress.delete.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              intl.formatMessage({ id: 'cluster.resource.ingress' }) + `【${record.metadata?.name}】`
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

        return <Space>{nodes}</Space>;
      },
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.resource.ingress' })}
      subTitle={'Ingress'}
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IIngress>
        key='ingress'
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        rowKey={(record: IIngress) =>
          `${record?.metadata?.name}-${record.metadata?.resourceVersion}`
        }
        search={{
          showHiddenNum: true,
          optionRender: ({ searchText, resetText }) => {
            return [
              <Button
                key="reset"
                onClick={() => {
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


                  listIngresss();
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


            listIngresss();
          },
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
                key="create-text"
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
                  window.location.href = normalizeKubernetesPath(`${BaseAddress}/form/create`);
                }}
              >
                <FormattedMessage id="cluster.resource.create.form" />
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
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="Ingress"
      />
    </PageContainer>
  );
};

export default IndexDashboard;
