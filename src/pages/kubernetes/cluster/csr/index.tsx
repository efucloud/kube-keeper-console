import { CloseCircleOutlined, DeleteOutlined, InsertRowBelowOutlined, MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, message, Popconfirm, Popover, Space, Tag, Typography, Divider, Dropdown, Drawer } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';

import { getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import type { ICertificateSigningRequest, CertificateSigningRequestList } from 'kubernetes-models/certificates.k8s.io/v1';
import { getClusterResource } from '@/utils/cluster';
import AICopilot from '../../components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const { cluster } = getCurrentViewInfo();
  const [dataSource, setDataSource] = useState<ICertificateSigningRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const formRef = useRef<ProFormInstance>(undefined);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [patchCertificateSigningRequest, setPatchCertificateSigningRequest] = useState<ICertificateSigningRequest>();
  const intl = useIntl();
  const [searchName, setSearchName] = useState<string>('');
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);

  const listCertificateSigningRequests = async () => {
    setLoading(true);
    try {
      const params = { cluster, address: 'apis/certificates.k8s.io/v1/certificatesigningrequests' } as Record<string, any>;
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
      const data = (await clusterGetProxy(params)) as CertificateSigningRequestList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'CertificateSigningRequest';
      }
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    listCertificateSigningRequests();

  }, []);
  const handleRemove = async (
    intl: IntlShape,
    selectedRows: ICertificateSigningRequest[],
  ) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: ICertificateSigningRequest) => {
      const params = {

        cluster,
        address: `apis/certificates.k8s.io/v1/certificatesigningrequests/${entity.metadata?.name}`,
      };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };

  const moreItems = (record: ICertificateSigningRequest) => {
    const nodes = [
      {
        key: 'view-yaml',
        label: (
          <a
            onClick={() => {
              setPatchCertificateSigningRequest(record);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.view.yaml" />
          </a>
        ),
      },
    ];

    return nodes;
  };




  const columns: ProColumns<ICertificateSigningRequest>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'name',
      search: { transform: (value: string) => setSearchName(value) },
      render: (dom, entity) => {
        return <>{entity?.metadata?.name}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'model.user.username' }),
      search: false,
      dataIndex: 'username',
      render: (dom, entity: ICertificateSigningRequest) => {
        if (
          entity?.metadata?.annotations &&
          entity?.metadata?.annotations['efucloud.com/account.username']
        ) {
          return (
            <>
              {entity?.metadata?.annotations['efucloud.com/account.username'] ||
                ''}
            </>
          );
        }
        return null;
      },
    },
    {
      title: intl.formatMessage({ id: 'model.user.email' }),
      search: false,
      dataIndex: 'email',
      render: (dom, entity: ICertificateSigningRequest) => {
        if (
          entity?.metadata?.annotations &&
          entity?.metadata?.annotations['efucloud.com/account.email']
        ) {
          return (
            <>
              {entity?.metadata?.annotations['efucloud.com/account.email'] ||
                ''}
            </>
          );
        }
        return null;
      },
    },
    {
      title: intl.formatMessage({ id: 'model.cluster.expireTime' }),
      search: false,
      dataIndex: 'expirationTime',
      render: (dom, entity: ICertificateSigningRequest) => {
        if (
          entity?.metadata?.annotations &&
          entity?.metadata?.annotations['efucloud.com/csr.expirationTime']
        ) {
          const expirTime =
            entity?.metadata?.annotations['efucloud.com/csr.expirationTime'] ||
            '';
          if (expirTime && expirTime !== '') {
            return <>{dayjs(expirTime).format('YYYY-MM-DD HH:mm:ss')}</>;
          } else {
            return null;
          }
        }
        return null;
      },
    },
    {
      title: intl.formatMessage({ id: 'model.creator' }),
      search: false,
      render: (dom, entity: ICertificateSigningRequest) => {
        return <>{entity?.spec.username}</>;
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
      render: (dom, entity: ICertificateSigningRequest) => {
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
      render: (dom, entity: ICertificateSigningRequest) => {
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
              id: 'cluster.resource.CertificateSigningRequest.delete.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              intl.formatMessage({
                id: 'cluster.resource.CertificateSigningRequest',
              }) + `【${record.metadata?.name}】`
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
      title={intl.formatMessage({
        id: 'cluster.resource.CertificateSigningRequest',
      })}
      subTitle="CertificateSigningRequest"
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<ICertificateSigningRequest>
        key='csr'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey={(record: ICertificateSigningRequest) =>
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
                  listCertificateSigningRequests();


                }}
              >

                {searchText}
              </Button>,
            ];
          },
        }}
        options={{
          reload: () => {
            listCertificateSigningRequests();


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
            </a> </Space>,
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
            {getClusterResource('CertificateSigningRequest')}:&nbsp;&nbsp;
            {patchCertificateSigningRequest?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={
            patchCertificateSigningRequest?.metadata?.resourceVersion || 'edit'
          }
          edit={false}
          address={`apis/certificates.k8s.io/v1/certificatesigningrequests/${patchCertificateSigningRequest?.metadata?.name}`}
          kind="CertificateSigningRequest"
          name={patchCertificateSigningRequest?.metadata?.name || ''}

          cluster={cluster}
          content={patchCertificateSigningRequest}
        />
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        kind="CertificateSigningRequest"
        apiVersion='certificates.k8s.io/v1'
      />
    </PageContainer>
  );
};

export default IndexDashboard;
