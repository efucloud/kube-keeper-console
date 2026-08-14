import { CloseCircleOutlined, DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, InsertRowBelowOutlined, MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Dropdown, Modal, message, Popconfirm, Popover, Space, Tag, Typography, Divider, Drawer } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import type { IIngressClass, IngressClassList } from 'kubernetes-models/networking.k8s.io/v1';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';
import { useK8sWatchStream } from '@/hooks/useK8sWatchStream';

import { getColorPrimary, getCurrentViewInfo, normalizeKubernetesPath } from '@/utils/global';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { getClusterResource } from '@/utils/cluster';

import AICopilot from '@/pages/kubernetes/components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance>(undefined);
  const access = useAccess();
  const { cluster } = getCurrentViewInfo();
  const [selectedRowsState, setSelectedRows] = useState<IIngressClass[]>([]);
  const [dataSource, setDataSource] = useState<IIngressClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [watch, setWatch] = useState<boolean>(false);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [patchIngressClass, setPatchIngressClass] = useState<IIngressClass>();
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false); // 资源抽屉可见性
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false); // 是否编辑资源
  const intl = useIntl();
  const address = `apis/networking.k8s.io/v1/ingressclasses`;
  const [searchName, setSearchName] = useState<string>('');
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const BaseAddress = `/kubernetes/cluster/${cluster}/networks/ingressclasses`;
  const listIngresss = async () => {
    setLoading(true);
    try {
      const params = { cluster, address: address } as Record<string, any>;
      const fieldSelector = {} as Record<string, string>;

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
      const data = (await clusterGetProxy(params)) as IngressClassList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'IngressClass';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    listIngresss();

  }, []);


  const handleRemove = async (
    intl: IntlShape,
    selectedRows: IIngressClass[],
  ) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: IIngressClass) => {
      const params = { cluster, address: `apis/rbac.authorization.k8s.io/v1/ingressclasses/${entity.metadata?.name}` };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };
  const moreItems = (record: IIngressClass) => {
    const nodes = [
      {
        key: 'view-yaml',
        label: (
          <a
            onClick={() => {
              setPatchIngressClass(record);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.view.yaml" />
          </a>
        ),
      },
      {
        key: 'edit-yaml',
        label: (
          <a
            onClick={() => {
              setPatchIngressClass(record);
              setEditorResource(true);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.edit.yaml" />
          </a>
        ),
      }
    ];
    return nodes;
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
  const columns: ProColumns<IIngressClass>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'name',
      search: { transform: (value: string) => setSearchName(value) },
      render: (dom, entity) => {
        return <a onClick={() => {
          setPatchIngressClass(entity);
          setResourceDrawerVisible(true);
        }}>{entity?.metadata?.name}</a>;
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
      render: (dom, entity: IIngressClass) => {
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
      render: (dom, entity: IIngressClass) => {
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
      title={intl.formatMessage({ id: 'cluster.resource.ingressClass' })}
      subTitle={'IngressClass'}
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IIngressClass>
        key='ingress-class'
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        rowKey={(record: IIngressClass) =>
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
                  listIngresss();


                }}
              >
                {searchText}
              </Button>,
            ];
          },
        }}
        options={{
          reload: () => {
            listIngresss();


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
            <Access accessible={true} key={'create'}>
              <Button
                type="primary"
                key="create"
                onClick={() => {
                  window.location.href = normalizeKubernetesPath(`${BaseAddress}/create/text`);
                }}
              >
                <FormattedMessage id="cluster.resource.create.text" />
              </Button>
            </Access> </Space>,
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
            {getClusterResource('IngressClass')}:&nbsp;&nbsp;
            {patchIngressClass?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={patchIngressClass?.metadata?.resourceVersion || 'edit'}
          edit={editorResource}
          address={`apis/networking.k8s.io/v1/ingressclasses/${patchIngressClass?.metadata?.name}`}
          kind="IngressClass"
          name={patchIngressClass?.metadata?.name || ''}

          cluster={cluster}
          content={patchIngressClass}
        />
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        kind="IngressClass"
        apiVersion='networking.k8s.io/v1'
      />
    </PageContainer>
  );
};

export default IndexDashboard;
