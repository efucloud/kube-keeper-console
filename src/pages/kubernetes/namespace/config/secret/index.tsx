import { AlertFilled, CloseCircleOutlined, DeleteOutlined, EditOutlined, InsertRowBelowOutlined, MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Divider, Dropdown, Modal, message, Popconfirm, Popover, Select, Space, Tag, Typography, Empty, Drawer } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import { type ISecret, type SecretList } from 'kubernetes-models/v1';
import debounce from 'lodash/debounce';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';

import { canAccessClusterNamespaces } from '@/services/personal.api';
import { getClusterResource } from '@/utils/cluster';
import { appendKubernetesViewQuery, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { syncClusterNamespace } from '@/services/cluster.api';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { decodeBase64, getDaysUntilExpiry, parseCertificateExpiry } from '@/utils/crypto';

import AICopilot from '@/pages/kubernetes/components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const { cluster, namespace } = getCurrentViewInfo();
  const [selectedRowsState, setSelectedRows] = useState<ISecret[]>([]);
  const [dataSource, setDataSource] = useState<ISecret[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const formRef = useRef<ProFormInstance>(undefined);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [patchSecret, setPatchSecret] = useState<ISecret>();
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const address = namespace ? `api/v1/namespaces/${namespace}/secrets` : `api/v1/secrets`;
  const [searchName, setSearchName] = useState<string>('');
  const intl = useIntl();
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  let BaseAddress = `/kubernetes/namespace/config/secrets`;
  if (!namespace || namespace === '' || namespace === '-') {
    BaseAddress = `/kubernetes/cluster/config/secrets`;
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
  const listSecrets = async () => {
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
      const data = (await clusterGetProxy(params)) as SecretList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'Secret';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listSecrets();

  }, []);

  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };
  const handleRemove = async (intl: IntlShape, selectedRows: ISecret[]) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: ISecret) => {
      const params = {

        cluster,
        address: `api/v1/namespaces/${entity.metadata?.namespace}/secrets/${entity.metadata?.name}`,
      };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };
  const moreItems = (record: ISecret) => {
    const nodes = [
      {
        key: 'view-yaml',
        label: (
          <a
            onClick={() => {
              const newRecord = { ...record } as ISecret;
              const keys = Object.keys(newRecord?.data || {});
              newRecord.stringData = {}
              for (let i = 0; i < keys.length; i++) {
                if (newRecord && newRecord?.data && newRecord?.data[keys[i]]) {
                  newRecord.stringData[keys[i]] = decodeBase64(newRecord.data[keys[i]]);
                }
              }
              delete newRecord.data;
              setPatchSecret(newRecord);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.view.yaml" />
          </a>
        ),
      }
    ];
    if (['Opaque', 'kubernetes.io/tls', 'IngressTLS', 'kubernetes.io/dockerconfigjson'].includes(record.type || '')) {
      nodes.push({
        key: 'edit-yaml',
        label: (
          <a
            onClick={() => {
              const newRecord = { ...record } as ISecret;
              const keys = Object.keys(newRecord?.data || {});
              newRecord.stringData = {}
              for (let i = 0; i < keys.length; i++) {
                if (newRecord && newRecord?.data && newRecord?.data[keys[i]]) {
                  newRecord.stringData[keys[i]] = decodeBase64(newRecord.data[keys[i]]);
                }
              }
              delete newRecord.data;
              setPatchSecret(newRecord);
              setEditorResource(true);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.edit.yaml" />
          </a>
        ),
      })
    }

    return nodes;
  };




  const columns: ProColumns<ISecret>[] = [
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
                  appendKubernetesViewQuery(`/kubernetes/namespace/config/secrets`, { cluster: cluster, namespace: entity?.metadata?.namespace }),
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
        const keys = Object.keys(entity.data || {})

        let tip = [] as React.ReactNode[];
        if (entity.type === 'cfe/secure-opaque') {
          if (entity.metadata?.annotations) {
            let expTime = ''
            if (entity.metadata.annotations['security-credential-expires-at']) {
              expTime = entity.metadata.annotations['security-credential-expires-at']
            } else if (entity.metadata.annotations['ak-sk-expires-at']) {
              expTime = entity.metadata.annotations['ak-sk-expires-at']
            }
            if (expTime) {
              let color = 'red'
              const day = getDaysUntilExpiry(dayjs(expTime))
              if (day <= 0) {
                color = 'red'
              } else if (day > 30) {
                color = '#52c41a'
              } else {
                color = '#d69105ff'
              }
              tip.push(<span style={{ fontSize: 12 }}><AlertFilled style={{ color: color }} /><FormattedMessage id='model.cluster.cert.expireTime' />:{dayjs(expTime).format('YYYY-MM-DD HH:mm:ss')}</span>)

            }
          }
        }
        if (!entity?.stringData) {
          entity.stringData = {}
        }
        if (entity?.data && keys.length > 0) {
          for (let i = 0; i < keys.length; i++) {
            entity.stringData[keys[i]] = decodeBase64(entity.data[keys[i]]);
          }
        }
        if (entity.stringData && keys.length > 0) {
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const data = entity.stringData[key] || '';
            if (data.includes('-----BEGIN CERTIFICATE-----')) {
              const result = parseCertificateExpiry(data)
              if (result.notAfter) {
                let color = 'red'
                const day = getDaysUntilExpiry(result.notAfter)
                if (day <= 0) {
                  color = 'red'
                } else if (day > 30) {
                  color = '#52c41a'
                } else {
                  color = '#d69105ff'
                }
                tip.push(<span style={{ fontSize: 12 }}>{key}<AlertFilled style={{ color: color }} /><FormattedMessage id='model.cluster.cert.expireTime' />:{dayjs(result.notAfter).format('YYYY-MM-DD HH:mm:ss')}</span>)
              }
            }
          }
        }
        return (
          <Space orientation='vertical'>
            <a
              onClick={() => {
                window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/config/secrets/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace });
              }}
            >
              {entity?.metadata?.name}
            </a>
            {tip}
          </Space>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.type' }),
      search: true,
      dataIndex: 'type',
      onFilter: true,
      valueEnum: {
        'Opaque': {
          text: intl.formatMessage({ id: 'cluster.resource.secret.type.Opaque' }),
        },
        'kubernetes.io/tls': {
          text: intl.formatMessage({ id: 'cluster.resource.secret.type.ingressTLS' }),
        },
        'IngressTLS': {
          text: intl.formatMessage({ id: 'cluster.resource.secret.type.ingressTLS' }),
        },
        'kubernetes.io/dockerconfigjson': {
          text: intl.formatMessage({ id: 'cluster.resource.container.image.pullSecrets' }),
        },
        'helm.sh/release.v1': {
          text: intl.formatMessage({ id: 'cluster.resource.secret.type.helm' }),
        },
        'kubernetes.io/service-account-token': {
          text: intl.formatMessage({ id: 'cluster.resource.secret.type.serviceAccountToken' }),
        },
        'bootstrap.kubernetes.io/token': {
          text: intl.formatMessage({ id: 'cluster.resource.secret.type.bootstrapToken' }),
        },
      },
      renderFormItem: (_, { defaultRender }) => {
        return (
          <Select
            allowClear
            showSearch={{ filterOption: false }}
            onChange={(value) => {
              if (value) {
                setSearchFields((prev) => ({
                  ...prev, // 保留原对象中的所有属性
                  type: value,
                }));
              } else {
                setSearchFields((prev) => {
                  const { type, ...rest } = prev;
                  return rest;
                });
              }
            }}
          >
            <Select.Option
              key="Opaque"
              value="Opaque"
            >
              <FormattedMessage id="cluster.resource.secret.type.Opaque" />
            </Select.Option>
            <Select.Option
              key="imgagepull"
              value="kubernetes.io/dockerconfigjson"
            >
              <FormattedMessage id="cluster.resource.container.image.pullSecrets" />
            </Select.Option>
            <Select.Option key="IngressTLS" value="IngressTLS">
              <FormattedMessage id="cluster.resource.secret.type.ingressTLS" />
            </Select.Option>
            <Select.Option key="tls" value="kubernetes.io/tls">
              <FormattedMessage id="cluster.resource.secret.type.TLS" />
            </Select.Option>
            <Select.Option
              key="serviceAccountToken"
              value="kubernetes.io/service-account-token"
            >
              <FormattedMessage id="cluster.resource.secret.type.serviceAccountToken" />
            </Select.Option>
            <Select.Option
              key="bootstrapToken"
              value="bootstrap.kubernetes.io/token"
            >
              <FormattedMessage id="cluster.resource.secret.type.bootstrapToken" />
            </Select.Option>
            <Select.Option key="helm" value="helm.sh/release.v1">
              <FormattedMessage id="cluster.resource.secret.type.helm" />
            </Select.Option>
          </Select>
        );
      },

    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.labels' }),
      hidden: !expandInfo,
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
      render: (dom, entity: ISecret) => {
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
      render: (dom, entity: ISecret) => {
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
        if (record.type === 'helm.sh/release.v1') {
          return;
        }
        const nodes = [];
        if (record.type !== 'bootstrap.kubernetes.io/token') {
          if (!(record.metadata?.ownerReferences && record.metadata?.ownerReferences?.length > 0)) {
            if (['Opaque', 'kubernetes.io/tls', 'IngressTLS', 'kubernetes.io/dockerconfigjson'].includes(record.type || '')) {
              nodes.push(<a
                key="edit"
                onClick={() => {
                  window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/config/secrets/${record?.metadata?.name}/update`, { cluster: cluster, namespace: record?.metadata?.namespace });
                }}
              >
                <EditOutlined style={{ color: colorPrimary }} />
              </a>,
              );
            }
          }
          nodes.push(
            <Popconfirm
              key={record.metadata?.resourceVersion + '-delete'}
              description={intl.formatMessage({
                id: 'cluster.resource.secret.delete.description',
              })}
              title={
                intl.formatMessage({
                  id: 'pages.operation.delete.description',
                }) +
                getClusterResource('ISecret') +
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
            </Popconfirm>,
          );
        }
        if (
          !(
            record.metadata?.ownerReferences &&
            record.metadata?.ownerReferences?.length > 0
          )
        ) {
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
        }
        return <Space>{nodes}</Space>;
      },
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'menu.config.secret' })}
      subTitle="Secret"
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<ISecret>
        key='secret'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey={(record: ISecret) =>
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

                  listSecrets();
                }}
              >
                {searchText}
              </Button>,
            ];
          },
        }}
        options={{
          reload: () => {

            listSecrets();
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
                  id: 'cluster.resource.secret.delete.description',
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
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('Secret')}:&nbsp;&nbsp;
            {patchSecret?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={patchSecret?.metadata?.resourceVersion || 'edit'}
          edit={editorResource}
          address={`api/v1/namespaces/${patchSecret?.metadata?.namespace}/secrets/${patchSecret?.metadata?.name}`}
          kind="Secret"
          name={patchSecret?.metadata?.name || ''}

          cluster={cluster}
          content={patchSecret}
        />
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="Secret"
      />
    </PageContainer>
  );
};

export default IndexDashboard;
