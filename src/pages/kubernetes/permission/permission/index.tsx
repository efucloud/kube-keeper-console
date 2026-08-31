import { DeleteOutlined } from '@ant-design/icons';
import { type ActionType, PageContainer, type ProColumns, type ProFormInstance, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Empty, message, Popconfirm, Select, Space, Tabs, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import { useEffect, useRef, useState } from 'react';
import type { IntlShape } from 'react-intl';
import { SystemUser } from '@/components';
import type { ClusterAccountDetail, ClusterAccountDetailList } from '@/services/cluster_account';
import { listClusterAccount } from '@/services/cluster_account.api';
import type { ClusterAccountRoleDetail, ClusterAccountRoleDetailList } from '@/services/cluster_account_role';
import { deleteClusterAccountRole, listClusterAccountRole } from '@/services/cluster_account_role.api';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { type ClusterNamespaceAccountRoleDetail, ClusterNamespaceAccountRoleDetailList } from '@/services/cluster_namespace_account_role';
import type { ClusterRoleTemplateDetail, ClusterRoleTemplateDetailList } from '@/services/cluster_role_template';
import { listClusterRoleTemplate } from '@/services/cluster_role_template.api';
import { canAccessClusterNamespaces } from '@/services/personal.api';
import { appendKubernetesViewQuery, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { listClusterNamespaceAccountRole } from '@/services/cluster_namespace_account_role.api';
import { TabsProps } from 'antd/lib';
import { syncClusterNamespace } from '@/services/cluster.api';

const { Text } = Typography;

const Index: React.FC = () => {
  /** 国际化配置 */
  const intl = useIntl();
  const access = useAccess();
  const { cluster } = getCurrentViewInfo();
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const [activeKey, setActiveKey] = useState<string>('cluster');
  const debouncedClusterAccountChange = debounce((value) => { setSearchClusterAccount(value); }, 1000);
  const debouncedClusterRoleTemplateNameChange = debounce((value) => { setClusterRoleTemplateName(value); }, 1000);
  const [clusterRoleTemplateName, setClusterRoleTemplateName] = useState<string>('');
  const [clusterAccountRoles, setClusterAccountRoles] = useState<ClusterAccountRoleDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [namespaceAccountRoles, setNamespaceAccountRoles] = useState<ClusterNamespaceAccountRoleDetail[]>([]);
  const [searchClusterAccount, setSearchClusterAccount] = useState<string>('');
  const [clusterAccounts, setClusterAccounts] = useState<ClusterAccountDetail[]>([]);
  const [clusterRoleTempltes, setClusterRoleTemplates] = useState<ClusterRoleTemplateDetail[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedClusterAccountId, setSelectedClusterAccountId] = useState<string>('');
  const clusterFormRef = useRef<ProFormInstance>(undefined);
  const namespaceFormRef = useRef<ProFormInstance>(undefined);
  const debouncedNamespaceChange = debounce((value) => { setSearchNamespace(value); }, 1000);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [userNamespaces, setUserNamespaces] = useState<ClusterNamespaceDetail[]>([]);
  const [searchNamespace, setSearchNamespace] = useState<string>('');
  const listNamespaces = async () => {
    const params = { cluster, search: searchNamespace } as Record<string, any>;
    const data = (await canAccessClusterNamespaces(params)) as ClusterNamespaceDetailList;
    setUserNamespaces(data.data || []);
  };
  useEffect(() => {
    listNamespaces();
  }, [searchNamespace]);
  const listClusterAccounts = async () => {
    const params = {
      cluster,
      name: searchClusterAccount,
    } as Record<string, any>;
    const data = (await listClusterAccount(params)) as ClusterAccountDetailList;
    setClusterAccounts(data.data || []);
  };
  const listClusterRoleTemplates = async () => {
    const params = {
      cluster,
      category: 'ClusterRole',
      search: clusterRoleTemplateName,
    } as Record<string, any>;
    const data = (await listClusterRoleTemplate(
      params,
    )) as ClusterRoleTemplateDetailList;
    setClusterRoleTemplates(data.data || []);
  };
  useEffect(() => {
    listClusterRoleTemplates();
  }, []);
  useEffect(() => {
    listClusterAccounts();
  }, [selectedClusterAccountId]);
  const listClusterAccountRoles = async () => {
    setLoading(true);
    try {
      const params = {
        cluster,
        accountId: selectedClusterAccountId,
      } as Record<string, any>;
      const isTemp = clusterFormRef.current?.getFieldValue('isTemp');
      if (isTemp) {
        params.isTemp = isTemp;
      }
      if (selectedTemplate && selectedTemplate.length > 0) {
        params.roleName = selectedTemplate;
      }
      const data = (await listClusterAccountRole(params)) as ClusterAccountRoleDetailList;
      setClusterAccountRoles(data.data || []);

    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (activeKey === 'cluster') {
      listClusterAccountRoles();
    } else {
      listClusterNamespaceAccountRoles()
    }

  }, [cluster, selectedTemplate, selectedClusterAccountId, activeKey]);
  const listClusterNamespaceAccountRoles = async () => {
    const params = {
      cluster,
      accountId: selectedClusterAccountId,
      namespace: selectedNamespace,
    } as Record<string, any>;
    const isTemp = clusterFormRef.current?.getFieldValue('isTemp');
    if (isTemp) {
      params.isTemp = isTemp;
    }
    if (selectedTemplate && selectedTemplate.length > 0) {
      params.roleName = selectedTemplate;
    }
    const data = (await listClusterNamespaceAccountRole(params)) as ClusterNamespaceAccountRoleDetailList;
    setNamespaceAccountRoles(data.data || []);
  };
  const handleRemove = async (
    intl: IntlShape,
    selectedRow: ClusterAccountRoleDetail,
  ) => {
    const hide = message.loading(
      intl.formatMessage({ id: 'pages.operation.deleting' }),
    );
    if (selectedRow.id === '') return true;
    try {
      await deleteClusterAccountRole(
        { cluster },
        { ids: [selectedRow.id] },
      );
      hide();
      message.success(
        intl.formatMessage({ id: 'pages.operation.disable.success' }),
      );
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error(
        intl.formatMessage({ id: 'pages.operation.disable.failed' }),
      );
      return false;
    }
  };
  const clusterPermission: ProColumns<ClusterAccountRoleDetail>[] = [
    {
      title: <FormattedMessage id="cluster.account" />,
      hidden: true,
      dataIndex: 'username',
      valueType: 'select',
      renderFormItem: (_, { defaultRender }) => {
        return (
          <Select
            notFoundContent={intl.formatMessage({ id: 'pages.no.data' })}
            showSearch={{ filterOption: false, onSearch: (value) => { debouncedClusterAccountChange(value); } }}
            allowClear
            onChange={(value) => {
              setSelectedClusterAccountId(value);
            }}
          >
            {clusterAccounts?.map((item: ClusterAccountDetail) => {
              return (
                <Select.Option key={item.accountId} value={item.accountId}>
                  <SystemUser
                    enable={item.account.enable}
                    avatar={item.account.avatar}
                    username={item.account.username}
                    nickname={item.account.nickname}
                    jobNumber={item.account.jobNumber}
                  />
                </Select.Option>
              );
            })}
          </Select>
        );
      },
    },
    {
      title: <FormattedMessage id="model.user.username" />,
      search: false,
      render: (dom, entity) => {
        return (
          <>
            <a
              onClick={() => {
                window.location.href = appendKubernetesViewQuery(`/kubernetes/cluster/permission/cluster-account/detail/${entity.id}`, { cluster: cluster });
              }}
            >
              <SystemUser
                key={entity?.account?.id}
                enable={entity.account?.enable}
                avatar={entity?.account?.avatar}
                username={entity?.account?.username || ''}
                nickname={entity?.account?.nickname}
                jobNumber={entity?.account?.jobNumber}
              />
            </a>
          </>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.role' }),
      sorter: false,
      dataIndex: 'roleName',
      copyable: true,
      valueType: 'select',
      width: '15%',
      renderFormItem: (_, { defaultRender }) => {
        return (
          <Select
            notFoundContent={intl.formatMessage({ id: 'pages.no.data' })}
            showSearch={{ filterOption: false, onSearch: (value) => { debouncedClusterRoleTemplateNameChange(value); } }}
            allowClear
            onChange={(value) => {
              setSelectedTemplate(value);
            }}
          >
            {clusterRoleTempltes?.map((item: ClusterRoleTemplateDetail) => {
              return (
                <Select.Option key={item.id} value={item.name}>
                  {item.name}
                </Select.Option>
              );
            })}
          </Select>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.rolebinding' }),
      sorter: false,
      dataIndex: 'bindingName',
      width: '15%',
      ellipsis: true,
      search: false,
      render: (dom, entity) => {
        return (
          <Tooltip color={colorPrimary} title={entity.bindingName}>
            <Text ellipsis> {entity.bindingName} </Text>
          </Tooltip>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.account.permission.type' }),
      hideInForm: true,
      dataIndex: 'isTemp',
      valueType: 'select',
      width: '32%',
      valueEnum: {
        true: {
          text: intl.formatMessage({
            id: 'cluster.account.permission.type.isTemp.true',
          }),
          status: 'Error',
        },
        false: {
          text: intl.formatMessage({
            id: 'cluster.account.permission.type.isTemp.false',
          }),
          status: 'Success',
        },
      },
      render: (dom, entity) => {
        if (entity.isTemp) {
          return (
            <>
              <Tag color="red">
                {intl.formatMessage({
                  id: 'cluster.account.permission.type.isTemp.true',
                })}
              </Tag>
              {dayjs(entity.startTime).format('YYYY-MM-DD HH:mm:ss')}
              <>
                <FormattedMessage id="model.time.to" />
              </>
              {dayjs(entity.endTime).format('YYYY-MM-DD HH:mm:ss')}
            </>
          );
        } else {
          return (
            <Tag color="green">
              {intl.formatMessage({
                id: 'cluster.account.permission.type.isTemp.false',
              })}
            </Tag>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'model.status' }),
      dataIndex: 'enable',
      hideInForm: true,
      search: false,
      valueEnum: {
        false: {
          text: intl.formatMessage({ id: 'model.status.disable' }),
          status: 'Error',
        },
        true: {
          text: intl.formatMessage({ id: 'model.status.enable' }),
          status: 'Success',
        },
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      hideInTable: !access.clusterAccess,
      render: (_, record) => {
        const nodes = [];
        nodes.push(
          <Popconfirm
            key={record.id + '-disable'}
            description={intl.formatMessage({
              id: 'cluster.resource.clusterRoleBinding.disable.description',
            })}
            title={
              intl.formatMessage({
                id: 'pages.operation.disable.description',
              }) +
              intl.formatMessage({
                id: 'cluster.resource.clusterRoleBinding',
              }) +
              '【' +
              record.bindingName +
              '】'
            }
            onConfirm={() => {
              handleRemove(intl, record);
            }}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <DeleteOutlined style={{ color: 'red' }} />
          </Popconfirm>,
        );

        return <Space>{nodes}</Space>;
      },
    },
  ];
  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };
  const namespacePermission: ProColumns<ClusterNamespaceAccountRoleDetail>[] = [
    {
      title: <FormattedMessage id="cluster.account" />,
      hidden: true,
      dataIndex: 'username',
      valueType: 'select',
      renderFormItem: (_, { defaultRender }) => {
        return (
          <Select
            notFoundContent={intl.formatMessage({ id: 'pages.no.data' })}
            showSearch={{ filterOption: false, onSearch: (value) => { debouncedClusterAccountChange(value); } }}
            allowClear
            onChange={(value) => {
              setSelectedClusterAccountId(value);
            }}
          >
            {clusterAccounts?.map((item: ClusterAccountDetail) => {
              return (
                <Select.Option key={item.accountId} value={item.accountId}>
                  <SystemUser
                    enable={item.account.enable}
                    avatar={item.account.avatar}
                    username={item.account.username}
                    nickname={item.account.nickname}
                    jobNumber={item.account.jobNumber}
                  />
                </Select.Option>
              );
            })}
          </Select>
        );
      },
    },
    {
      title: <FormattedMessage id="model.user.username" />,
      search: false,
      render: (dom, entity) => {
        return (
          <>
            <a
              onClick={() => {
                window.location.href = appendKubernetesViewQuery(`/kubernetes/cluster/permission/cluster-account/detail/${entity.id}`, { cluster: cluster });
              }}
            >
              <SystemUser
                key={entity?.account?.id}
                enable={entity.account?.enable}
                avatar={entity?.account?.avatar}
                username={entity?.account?.username || ''}
                nickname={entity?.account?.nickname}
                jobNumber={entity?.account?.jobNumber}
              />
            </a>
          </>
        );
      },
    },
    {
      title: <FormattedMessage id="cluster.namespace" />,
      dataIndex: 'namespace',
      search: true,
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
    },
    {
      title: intl.formatMessage({ id: 'cluster.role' }),
      sorter: false,
      dataIndex: 'roleName',
      copyable: true,
      width: 200,
      renderFormItem: (_, { defaultRender }) => {
        return (
          <Select
            showSearch={{ filterOption: false, onSearch: (value) => { debouncedClusterRoleTemplateNameChange(value); } }}
            allowClear
            onChange={(value) => {
              setSelectedTemplate(value);
            }}
          >
            {clusterRoleTempltes?.map((item: ClusterRoleTemplateDetail) => {
              return (
                <Select.Option key={item.id} value={item.name}>
                  {item.name}
                </Select.Option>
              );
            })}
          </Select>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.rolebinding' }),
      sorter: false,
      dataIndex: 'bindingName',
      width: 200,
      ellipsis: true,
      search: false,
      render: (dom, entity) => {
        return (
          <Tooltip color={colorPrimary} title={entity.bindingName}>
            <Text ellipsis> {entity.bindingName} </Text>
          </Tooltip>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.account.permission.type' }),
      hideInForm: true,
      dataIndex: 'isTemp',
      valueType: 'select',
      width: '32%',
      valueEnum: {
        true: {
          text: intl.formatMessage({
            id: 'cluster.account.permission.type.isTemp.true',
          }),
          status: 'Error',
        },
        false: {
          text: intl.formatMessage({
            id: 'cluster.account.permission.type.isTemp.false',
          }),
          status: 'Success',
        },
      },
      render: (dom, entity) => {
        if (entity.isTemp) {
          return (
            <>
              <Tag color="red">
                {intl.formatMessage({
                  id: 'cluster.account.permission.type.isTemp.true',
                })}
              </Tag>
              {dayjs(entity.startTime).format('YYYY-MM-DD HH:mm:ss')}
              <>
                <FormattedMessage id="model.time.to" />
              </>
              {dayjs(entity.endTime).format('YYYY-MM-DD HH:mm:ss')}
            </>
          );
        } else {
          return (
            <Tag color="green">
              {intl.formatMessage({
                id: 'cluster.account.permission.type.isTemp.false',
              })}
            </Tag>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'model.status' }),
      dataIndex: 'enable',
      hideInForm: true,
      search: false,
      valueEnum: {
        false: {
          text: intl.formatMessage({ id: 'model.status.disable' }),
          status: 'Error',
        },
        true: {
          text: intl.formatMessage({ id: 'model.status.enable' }),
          status: 'Success',
        },
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      hideInTable: !access.clusterAccess,
      render: (_, record) => {
        const nodes = [];
        nodes.push(
          <Popconfirm
            key={record.id + '-disable'}
            description={intl.formatMessage({
              id: 'cluster.resource.clusterRoleBinding.disable.description',
            })}
            title={
              intl.formatMessage({
                id: 'pages.operation.disable.description',
              }) +
              intl.formatMessage({
                id: 'cluster.resource.clusterRoleBinding',
              }) +
              '【' +
              record.bindingName +
              '】'
            }
            onConfirm={() => {
              handleRemove(intl, record);
            }}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <DeleteOutlined style={{ color: 'red' }} />
          </Popconfirm>,
        );

        return nodes;
      },
    },
  ];
  const items: TabsProps['items'] = [

    {
      label: intl.formatMessage({ id: 'cluster.account.permission.cluster' }),
      key: 'cluster',
      children: (
        <>
          <ProTable
            key='cluster'
            scroll={{ x: 'max-content' }}
            actionRef={actionRef}
            formRef={clusterFormRef}
            columns={clusterPermission}
            loading={loading}
            dataSource={clusterAccountRoles}
            options={{
              reload: () => {
                listClusterAccountRoles();
              },
            }}
            search={{
              showHiddenNum: true,
              optionRender: ({ searchText, resetText }) => {
                return [
                  <Button
                    key="reset"
                    onClick={() => {
                      setSelectedClusterAccountId('');
                      setSelectedTemplate('');
                      clusterFormRef?.current?.resetFields();
                    }}
                  >
                    {resetText}
                  </Button>,
                  <Button
                    key="search"
                    type="primary"
                    onClick={() => {
                      listClusterAccountRoles();
                    }}
                  >
                    {searchText}
                  </Button>,
                ];
              },
            }}
          />
        </>
      ),
    },
    {
      label: intl.formatMessage({ id: 'cluster.account.permission.namespace' }),
      key: 'namespace',
      children: (
        <>
          <ProTable
            key='namespace'
            scroll={{ x: 'max-content' }}
            actionRef={actionRef}
            formRef={namespaceFormRef}
            columns={namespacePermission}
            dataSource={namespaceAccountRoles}
            options={{
              reload: () => {
                listClusterNamespaceAccountRoles();
              },
            }}
            search={{
              showHiddenNum: true,
              optionRender: ({ searchText, resetText }) => {
                return [
                  <Button
                    key="reset"
                    onClick={() => {
                      setSelectedClusterAccountId('');
                      setSelectedTemplate('');
                      setSelectedNamespace('');
                      namespaceFormRef?.current?.resetFields();
                    }}
                  >
                    {resetText}
                  </Button>,
                  <Button
                    key="search"
                    type="primary"
                    onClick={() => {
                      listClusterNamespaceAccountRoles();
                    }}
                  >
                    {searchText}
                  </Button>,
                ];
              },
            }}
          />
        </>
      ),
    }, //

  ];
  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.account.permission' })}
      content={intl.formatMessage({
        id: 'cluster.account.permission.description',
      })}
    >
      <Tabs
        activeKey={activeKey}
        items={items}
        onChange={(key) => setActiveKey(key)}
      />
    </PageContainer>
  );
};
export default Index;
