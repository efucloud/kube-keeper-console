import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Flex, Modal, message, Popconfirm, Select, Space, Tag, Empty, Divider, Tooltip, Drawer } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { IService, type IIoK8sApiCoreV1ServicePort, type ServiceList } from 'kubernetes-models/v1';
import debounce from 'lodash/debounce';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';

import { canAccessClusterNamespaces } from '@/services/personal.api';
import { appendKubernetesViewQuery, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { syncClusterNamespace } from '@/services/cluster.api';
import { RenderPods } from '@/pages/kubernetes/components/pod';

import AICopilot from '@/pages/kubernetes/components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const { cluster, namespace } = getCurrentViewInfo();
  const [selectedRowsState, setSelectedRows] = useState<IService[]>([]);
  const formRef = useRef<ProFormInstance>(undefined);
  const [dataSource, setDataSource] = useState<IService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [podVisible, setPodVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [selectedService, setSelectedService] = useState<IService | undefined>(undefined);
  let BaseAddress = `/kubernetes/namespace/networks/services`;
  if (!namespace || namespace === '' || namespace === '-') {
    BaseAddress = `/kubernetes/cluster/networks/services`;
  }
  const intl = useIntl();
  const address = namespace ? `api/v1/namespaces/${namespace}/services` : `api/v1/services`;
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
  const listServices = async () => {
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
      const data = (await clusterGetProxy(params)) as ServiceList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data?.items?.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'Service';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listServices();

  }, []);


  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };
  const handleRemove = async (intl: IntlShape, selectedRows: IService[]) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: IService) => {
      const params = {

        cluster,
        address: `api/v1/namespaces/${entity.metadata?.namespace}/services/${entity.metadata?.name}`,
      };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };





  const columns: ProColumns<IService>[] = [
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
                  appendKubernetesViewQuery(`/kubernetes/namespace/networks/services`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
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
        return <a href={appendKubernetesViewQuery(`/kubernetes/namespace/networks/services/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace })}>{entity?.metadata?.name}</a>
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.service.type' }),
      dataIndex: ['spec', 'type'],
      valueEnum: {
        'LoadBalancer': {
          text: intl.formatMessage({ id: 'cluster.resource.service.type.LoadBalancer' }),
        },
        'ClusterIP': {
          text: intl.formatMessage({ id: 'cluster.resource.service.type.ClusterIP' }),
        },
        'NodePort': {
          text: intl.formatMessage({ id: 'cluster.resource.service.type.NodePort' }),
        },
        'ExternalName': {
          text: intl.formatMessage({ id: 'cluster.resource.service.type.ExternalName' }),
        }
      }
    },

    {
      title: intl.formatMessage({ id: 'cluster.service.port' }),
      width: '30%',
      search: false,
      render: (dom, entity: IService) => {
        const tags = [] as React.ReactNode[];
        if (expandInfo && entity.spec?.ports) {
          for (let i = 0; i < entity.spec?.ports?.length; i++) {
            const item = entity.spec?.ports[i] as IIoK8sApiCoreV1ServicePort;
            tags.push(
              <Tag style={{ border: 0 }}>
                <FormattedMessage id="cluster.service.port.protocol" />
                :&nbsp;{item.protocol || 'TCP'}&nbsp;
                {item.name && (
                  <>
                    <FormattedMessage id="cluster.service.port.name" />
                    :&nbsp;{item.name}&nbsp;
                  </>
                )}
                {item.port && (
                  <>
                    <FormattedMessage id="cluster.service.port.port" />
                    :&nbsp;{item.port}&nbsp;
                  </>
                )}
                {item.targetPort && (
                  <>
                    <FormattedMessage id="cluster.service.port.targetPort" />
                    :&nbsp;{item.targetPort}&nbsp;
                  </>
                )}
                {item.nodePort && (
                  <>
                    <FormattedMessage id="cluster.service.port.nodePort" />
                    :&nbsp;{item.nodePort}&nbsp;
                  </>
                )}
                <br />
              </Tag>,
            );
          }
        } else {
          for (let i = 0; i < entity.spec?.ports?.length; i++) {
            const item = entity.spec?.ports[i] as IIoK8sApiCoreV1ServicePort;
            tags.push(
              <Tag style={{ border: 0 }}>
                {item.name && (
                  <>
                    <FormattedMessage id="cluster.service.port.name" />
                    :&nbsp;{item.name}&nbsp;
                  </>
                )}
                {item.port && (
                  <>
                    <FormattedMessage id="cluster.service.port.port" />
                    :&nbsp;{item.port}&nbsp;
                  </>
                )}
                <br />
              </Tag>,
            );
          }
        }
        return (
          <Flex gap="4px 0" wrap>
            {tags}
          </Flex>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      hideInTable: !expandInfo,
      search: false,
      render: (dom, entity: IService) => {
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
          <Tooltip color={colorPrimary} title={intl.formatMessage({ id: 'cluster.resource.backend.service' })}>
            <EyeOutlined style={{ color: colorPrimary }} onClick={() => {
              setSelectedService(record);
              setPodVisible(true);
            }} />
          </Tooltip>,
          <a
            onClick={() => {
              window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/networks/services/${record?.metadata?.name}/update`, { cluster: cluster, namespace: record?.metadata?.namespace });
            }}
          >
            <EditOutlined style={{ color: colorPrimary }} />
          </a>,
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
          </Popconfirm>,
        ];

        return <Space>{nodes}</Space>;
      },
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.resource.service' })}
      subTitle={'Service'}
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IService>
        key='service'
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        rowKey={(record: IService) =>
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
                  listServices();
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
            listServices();
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
                key="create-text"
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
                  window.location.href = appendKubernetesViewQuery(`${BaseAddress}/form/create`);
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

      <Drawer destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        key='pods'
        className='ant-drawer-body-no-padding'
        open={podVisible}
        onClose={() => setPodVisible(false)}
        closable={true}
        title={intl.formatMessage({ id: 'cluster.resource.backend.service' }) + ': ' + intl.formatMessage({ id: 'cluster.resource.pod' })}
      >
        {selectedService && <RenderPods key='pods' cluster={cluster} namespace={selectedService.metadata?.namespace || ''} labelSelectors={selectedService.spec?.selector || {}} ownerReferenceName='' />}
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="Service"
      />
    </PageContainer>
  );
};

export default IndexDashboard;
