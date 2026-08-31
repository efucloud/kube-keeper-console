import { DeleteOutlined, PartitionOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { FooterToolbar, ModalForm, PageContainer, ProFormDateTimeRangePicker, ProFormSelect, ProFormSwitch, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Col, Modal, message, Popconfirm, Row, Select, Tag, Tooltip, Transfer, type TransferProps, Space } from 'antd';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import React, { useEffect, useRef, useState } from 'react';
import type { IntlShape } from 'react-intl';
import { SystemUser } from '@/components';
import type { ClusterAccountDetail, ClusterAccountDetailList } from '@/services/cluster_account';
import { clusterAccountAuthorizeClusterByTemplate, deleteClusterAccount, listClusterAccount } from '@/services/cluster_account.api';
import type { ClusterAuthorizeByTemplate, ClusterRoleTemplateDetail, ClusterRoleTemplateDetailList } from '@/services/cluster_role_template';
import type { TableListPagination } from '@/services/common.d';
import type { AccountDetailList, SimpleAccountDetail } from '@/services/account';
import { listAccount } from '@/services/account.api';
import { appendKubernetesViewQuery, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { listClusterRoleTemplate } from '@/services/cluster_role_template.api';

interface OrgAccountRecordType {
  key: string;
  account: SimpleAccountDetail;
  chosen: boolean;
}

const OrgAccountTableList: React.FC = () => {
  /** 新建窗口的弹窗 */
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const [selectedRows, setSelectedRows] = useState<ClusterAccountDetail[]>([]);
  const [createVisible, setCreateVisible] = useState(false);
  const [tempVisible, setTempVisible] = useState(false);
  const [wsTransferAccountList, setWsTransferAccountList] = useState<OrgAccountRecordType[]>([]);
  const [searchOrgAccount, setSearchOrgAccount] = useState<string>('');
  const [members, setMembers] = useState<string[]>([]);
  const colorPrimary = getColorPrimary();
  const [isTemp, setIsTemp] = useState<boolean>(false);
  const [selectedClusterAccountId, setSelectedClusterAccountId] = useState<string>('');
  const formRef = useRef<ProFormInstance>(undefined);
  const debouncedClusterAccountChange = debounce((value) => {
    setSearchClusterAccount(value);
    setSelectedClusterAccountId('');
  }, 1000);
  const [searchClusterAccount, setSearchClusterAccount] = useState<string>('');
  const [clusterAccounts, setClusterAccounts] = useState<ClusterAccountDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /** 国际化配置 */
  const intl = useIntl();
  const { cluster } = getCurrentViewInfo();
  const debouncedAccountHandleChange = debounce((value) => {
    setSearchOrgAccount(value);
  }, 1000);
  const listClusterAccounts = async () => {
    setLoading(true);
    try {
      const params = {
        cluster,
        name: searchClusterAccount,
      } as Record<string, any>;
      if (selectedClusterAccountId && selectedClusterAccountId.length > 0) {
        params.accountId = selectedClusterAccountId;
        delete params.name;
      }
      const data = (await listClusterAccount(params)) as ClusterAccountDetailList;
      setClusterAccounts(data.data || []);

    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    listClusterAccounts();
  }, [searchClusterAccount, selectedClusterAccountId]);
  const handleMembersChange: TransferProps['onChange'] = (newTargetKeys) => {
    setMembers(newTargetKeys.map((item) => item.toString()));
  };

  const handleRemove = async (
    intl: IntlShape,
    selectedRows: ClusterAccountDetail[],
  ) => {
    const hide = message.loading(
      intl.formatMessage({ id: 'pages.operation.deleting' }),
    );
    if (!selectedRows) return true;

    try {
      await deleteClusterAccount(
        { cluster },
        {
          ids: selectedRows.map((row) => row.id),
        },
      );
      hide();
      message.success(intl.formatMessage({ id: 'pages.operation.delete.success' }));
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error(intl.formatMessage({ id: 'pages.operation.delete.failed' }));
      return false;
    }
  };

  const listAccounts = async () => {
    const res = await listAccount({

      search: searchOrgAccount,
    });
    const data = res as AccountDetailList;

    if (data && data.data && data.data.length > 0) {
      const list = [] as OrgAccountRecordType[];
      for (let i = 0; i < data.data.length; i++) {
        if (members.includes(data.data[i].id.toString())) {
          list.push({
            key: data.data[i].id.toString(),
            account: data.data[i],
            chosen: true,
          });
        } else {
          list.push({
            key: data.data[i].id.toString(),
            account: data.data[i],
            chosen: false,
          });
        }
      }
      setWsTransferAccountList(list);
    }
  };
  useEffect(() => {
    listAccounts();
  }, []);
  useEffect(() => {
    if (createVisible) {
      listAccounts();
    }
  }, [searchOrgAccount]);
  const columns: ProColumns<ClusterAccountDetail>[] = [
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
            {entity.isSupper ? (
              <>
                <Tag color="red">
                  <FormattedMessage id="cluster.supper.admin" />
                </Tag>
                <Tooltip
                  color={colorPrimary}
                  title={intl.formatMessage({
                    id: 'cluster.supper.admin.description',
                  })}
                >
                  <QuestionCircleOutlined />
                </Tooltip>
              </>
            ) : null}
          </>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'model.cluster.userAccessMethod' }),
      dataIndex: 'userAccessMethod',
      search: false,
      sorter: false,
      valueEnum: {
        csr: {
          text: intl.formatMessage({
            id: 'model.cluster.userAccessMethod.csr',
          }),
        },
        token: {
          text: intl.formatMessage({
            id: 'model.cluster.userAccessMethod.token',
          }),
        },
        impersonation: {
          text: intl.formatMessage({
            id: 'model.cluster.userAccessMethod.impersonation',
          }),
        },
      },
    },
    {
      title: intl.formatMessage({ id: 'model.createdAt' }),
      dataIndex: 'createdAt',
      search: false,
      sorter: false,
      valueType: 'dateTime',
    },
    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      hideInTable: !access.clusterAccess,
      render: (_, record) => {
        const nodes = [
          <>
            <Tooltip color={colorPrimary} title={intl.formatMessage({ id: 'cluster.rbac.view' })} >
              <PartitionOutlined style={{ color: colorPrimary }}
                onClick={() => {
                  window.location.href = appendKubernetesViewQuery(`/kubernetes/cluster/permission/cluster-account/rbac-view/${record.accountId}`, { cluster: cluster });
                }}
              /></Tooltip>
            &nbsp;</>
        ];

        if (!record.isSupper) {
          nodes.push(
            <><Popconfirm
              key={record.id + '-delete'}
              description={intl.formatMessage({
                id: 'cluster.account.delete.description',
              })}
              title={
                intl.formatMessage({
                  id: 'pages.operation.delete.description',
                }) +
                intl.formatMessage({ id: 'cluster.account' }) +
                '【' +
                record.account?.username +
                '】'
              }
              onConfirm={() => {
                handleRemove(intl, [record]);
              }}
              okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
              cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
            >
              <DeleteOutlined style={{ color: 'red' }} />
            </Popconfirm>&nbsp;</>,
          );
        }
        return <Space>{nodes}</Space>;
      },
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.account' })}
    >
      <ProTable<ClusterAccountDetail, TableListPagination>
        key='cluster-account-detail'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        search={{
          showHiddenNum: true,
          optionRender: ({ searchText, resetText }) => {
            return [
              <Button
                key="reset"
                onClick={() => {
                  setSearchClusterAccount('');
                  setSelectedClusterAccountId('');
                  formRef?.current?.resetFields();
                }}
              >

                {resetText}
              </Button>,
              <Button
                key="search"
                type="primary"
                onClick={() => {
                  listClusterAccounts();
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
            listClusterAccounts();
          },
        }}
        toolBarRender={() => [
          <Access accessible={true} key={'create'}>
            <Button
              type="primary"
              key="add"
              onClick={() => {
                setCreateVisible(true);
              }}
            >
              <FormattedMessage id="pages.operation.add" />
            </Button>
          </Access>,
        ]}
        loading={loading}
        dataSource={clusterAccounts}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      />
      {selectedRows?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              <FormattedMessage id="pages.operation.selected" />
              <a
                style={{
                  fontWeight: 600,
                }}
              >
                {selectedRows.length}
              </a>
              <FormattedMessage id="pages.operation.selected.term" />
              &nbsp;&nbsp;
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
                  id: 'pages.operation.delete.confirm.content',
                }),
                okText: intl.formatMessage({ id: 'pages.operation.confirm' }),
                cancelText: intl.formatMessage({
                  id: 'pages.operation.cancel',
                }),
                onOk: async () => {
                  await handleRemove(intl, selectedRows);
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
      <ModalForm
        title={intl.formatMessage({ id: 'cluster.account.csr.account.add' })}
        width="60vw"
        key={`${cluster}`}
        open={createVisible}
        clearOnDestroy={true}
        onOpenChange={setCreateVisible}
        onFinish={async (values: Record<string, any>) => {
          const data = {} as ClusterAuthorizeByTemplate;
          data.accountIds = members;
          data.isTemp = false;
          data.templateId = values['templateId'] || '';
          if (isTemp) {
            data.isTemp = true;
            data.startTime = dayjs(values['time'][0], 'YYYY-MM-DDTHH:mm:ss').format();
            data.endTime = dayjs(values['time'][1], 'YYYY-MM-DDTHH:mm:ss').format();
          }
          await clusterAccountAuthorizeClusterByTemplate({ cluster: cluster }, data);
          setCreateVisible(false);
          listClusterAccounts();
        }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      >
        <Row gutter={24} style={{ marginTop: 16 }}>
          <Col span={24}>
            <ProFormSelect
              showSearch
              label={intl.formatMessage({ id: 'cluster.role' })}
              name="templateId"
              onChange={(value) => {
                if (value) {
                  setTempVisible(true);
                } else {
                  setTempVisible(false);
                }
              }}
              request={async (values: Record<string, string>) => {
                const res = (await listClusterRoleTemplate({

                  search: values?.keyWords || '',
                  category: 'ClusterRole'
                })) as ClusterRoleTemplateDetailList;
                return (
                  res.data?.map((item: ClusterRoleTemplateDetail) => ({
                    label: item.name,
                    value: item.id,
                  })) || []
                );
              }}
            />
          </Col>
          {tempVisible && <Col span={6}>
            <ProFormSwitch
              label={intl.formatMessage({
                id: 'cluster.permission.resource.istemp',
              })}
              name="isTemp"
              onChange={(checked: boolean) => {
                setIsTemp(checked);
              }}
            />
          </Col>}
          {isTemp && (
            <Col span={18}>
              <ProFormDateTimeRangePicker
                label={intl.formatMessage({ id: 'model.time' })}
                placeholder={[
                  intl.formatMessage({ id: 'model.time.start' }),
                  intl.formatMessage({ id: 'model.time.end' }),
                ]}
                name="time"
                rules={[
                  {
                    required: true,
                    message:
                      intl.formatMessage({ id: 'pages.select.text.tips' }) +
                      intl.formatMessage({ id: 'model.time' }),
                  },
                ]}
              />
            </Col>
          )}
          <Col span={24}>
            <p>
              <FormattedMessage id="cluster.account" />
            </p>
            <div style={{ justifyContent: 'center', display: 'flex' }}>
              <Transfer
                listStyle={{
                  width: '25vw',
                  height: '50vh', // 👈 调整列表高度
                }}
                locale={{
                  itemUnit: intl.formatMessage({ id: 'transfer.itemUnit' }),
                  itemsUnit: intl.formatMessage({ id: 'transfer.itemsUnit' }),
                  searchPlaceholder:
                    intl.formatMessage({ id: 'pages.input.text.tips' }) +
                    intl.formatMessage({ id: 'model.user.username' }),
                  notFoundContent: intl.formatMessage({
                    id: 'pages.not.found.data',
                  }),
                }}
                dataSource={wsTransferAccountList}
                showSearch
                onSearch={(direction, value) => {
                  if (direction === 'left') {
                    debouncedAccountHandleChange(value);
                  }
                }}
                filterOption={(inputValue, item) => {
                  return (
                    String(item.account.username)
                      .toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    String(item.account.phone)
                      .toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    String(item.account.email)
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                  );
                }}
                onChange={handleMembersChange}
                targetKeys={members}
                render={(item) => (
                  <SystemUser
                    key={item.account.id}
                    enable={item.account.enable}
                    avatar={item.account.avatar}
                    username={item.account.username}
                    nickname={item.account.nickname}
                    jobNumber={item.account.jobNumber}
                  />
                )}
              ></Transfer>
            </div>
          </Col>
        </Row>
      </ModalForm>

    </PageContainer>
  );
};

export default OrgAccountTableList;
