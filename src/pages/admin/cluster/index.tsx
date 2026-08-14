import { DeleteOutlined, EditOutlined, MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { SiKubernetes } from "react-icons/si";
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { FooterToolbar, ModalForm, PageContainer, ProFormSelect, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl, useNavigate } from '@umijs/max';
import { Alert, Button, Col, Drawer, Dropdown, Flex, Modal, message, Popconfirm, Row, Space, Tag, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import type { IntlShape } from 'react-intl';
import { SystemUser } from '@/components';
import type { ClusterAccountDetail } from '@/services/cluster_account';
import { listClusterAccount } from '@/services/cluster_account.api';
import type { ClusterAdmin, TableListPagination } from '@/services/common.d';
import type { AccountDetail, AccountDetailList } from '@/services/account';
import { listAccount } from '@/services/account.api';
import { changeClusterStatus, createClusterSupperUser, deleteCluster, deleteClusterUser, listCluster } from '@/services/cluster.api';
import type { ClusterDetail } from '@/services/cluster.d';
import { getColorPrimary } from '@/utils/global';

const TableList: React.FC = () => {
  /** 新建窗口的弹窗 */
  const actionRef = useRef<ActionType>(null);
  const roleActionRef = useRef<ActionType>(null);
  const access = useAccess();
  const [selectedRowsState, setSelectedRows] = useState<ClusterDetail[]>([]);
  const [clusterInfo, setClusterInfo] = useState<ClusterDetail>();
  const colorPrimary = getColorPrimary();
  const [createVisible, setCreateVisible] = useState(false);
  const [showClusterAdminDrawer, setShowClusterAdminDrawer] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(600);

  /** 国际化配置 */
  const intl = useIntl();
  const navigate = useNavigate();

  const BaseAddress = `/admin/cluster`;

  const handleRemove = async (
    intl: IntlShape,
    selectedRows: ClusterDetail[],
  ) => {
    const hide = message.loading(
      intl.formatMessage({ id: 'pages.operation.deleting' }),
    );
    if (!selectedRows) return true;

    try {
      await deleteCluster(

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
  const handleRemoveClusterAccount = async (
    intl: IntlShape,
    record: ClusterAccountDetail,
  ) => {
    const hide = message.loading(
      intl.formatMessage({ id: 'pages.operation.deleting' }),
    );

    try {
      await deleteClusterUser({

        id: record.id,
        cluster: clusterInfo?.code || '',
      });
      hide();
      message.success(intl.formatMessage({ id: 'pages.operation.delete.success' }));
      roleActionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error(intl.formatMessage({ id: 'pages.operation.delete.failed' }));
      return false;
    }
  };

  const handleEnable = async (
    intl: IntlShape,
    enable: boolean,
    selectedRows: ClusterDetail[],
  ) => {
    const hide = message.loading(
      intl.formatMessage({ id: 'pages.operation.updating' }),
    );
    if (!selectedRows) return true;

    try {
      await changeClusterStatus(

        {
          ids: selectedRows.map((row) => row.id),
          enable: enable,
        },
      );
      hide();
      message.success(intl.formatMessage({ id: 'pages.operation.update.success' }));
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error(intl.formatMessage({ id: 'pages.operation.update.failed' }));
      return false;
    }
  };
  const moreItems = (record: ClusterDetail) => {
    const nodes = [];

    if (record.enable === false) {
      nodes.push({
        key: record.id + '-enable',
        label: (
          <Popconfirm
            key={record.id + '-enable'}
            description={intl.formatMessage({
              id: 'model.cluster.enable.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.enable.description' }) +
              intl.formatMessage({ id: 'cluster' }) +
              '【' +
              record.name +
              '】'
            }
            onConfirm={() => {
              handleEnable(intl, true, [record]);
            }}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <a>
              <FormattedMessage id="pages.operation.enable" />
            </a>
          </Popconfirm>
        ),
      });
    } else {
      nodes.push({
        key: record.id + '-disable',
        label: (
          <Popconfirm
            key={record.id + '-disable'}
            description={intl.formatMessage({
              id: 'model.cluster.enable.disable.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.disable.enable' }) +
              intl.formatMessage({ id: 'cluster' }) +
              '【' +
              record.name +
              '】'
            }
            onConfirm={() => {
              handleEnable(intl, false, [record]);
            }}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <a>
              <FormattedMessage id="pages.operation.disable" />
            </a>
          </Popconfirm>
        ),
      });
    }
    nodes.push({
      key: record.id + '-delete',
      label: (
        <Popconfirm
          key={record.id + '-delete'}
          title={
            intl.formatMessage({ id: 'pages.operation.delete.description' }) +
            intl.formatMessage({ id: 'cluster' }) +
            '【' +
            record.name +
            '】'
          }
          onConfirm={() => {
            handleRemove(intl, [record]);
          }}
          okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
          cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
        >
          <DeleteOutlined style={{ color: 'red' }} />
        </Popconfirm>
      ),
    });

    nodes.unshift({
      key: record.id + '-account',
      label: (
        <a
          onClick={() => {
            setClusterInfo(record);
            setShowClusterAdminDrawer(true);
          }}
        >
          <FormattedMessage id="cluster.supper.admin" />
        </a>
      ),
    });
    return nodes;
  };

  const columns: ProColumns<ClusterDetail>[] = [
    {
      title: intl.formatMessage({ id: 'model.cluster.name' }),
      dataIndex: 'name',
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              navigate(`${BaseAddress}/detail/${entity.id}`);
            }}
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'model.cluster.console' }),
      search: false,
      align: 'center',
      render: (dom, entity) => {
        return (
          <div style={{ alignContent: 'center', textAlign: 'center' }}>
            <Tooltip
              color={colorPrimary}
              title={intl.formatMessage({ id: 'model.cluster.console' })}
            >
              <SiKubernetes
                onClick={() =>
                  window.open(
                    `/kubernetes/cluster/${entity.code}/dashboard/overview`,
                  )
                }
                style={{
                  margin: '0 auto',
                  color: colorPrimary,
                  fontSize: '20px',
                  display: 'flex',
                }}
              />
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'model.cluster.code' }),
      dataIndex: 'code',
      valueType: 'text',
    },
    {
      title: intl.formatMessage({ id: 'model.cluster.cert.expireTime' }),
      dataIndex: 'expireTime',
      search: false,
      sorter: false,
      valueType: 'dateTime',
    },
    {
      title: intl.formatMessage({ id: 'model.cluster.version' }),
      dataIndex: 'version',
      search: false,
      render: (_, record) => {
        if (record.version?.major) {
          return (
            <Flex gap="4px 0" wrap>
              <Tag key={`${record.version?.major}.${record.version?.minor}`}>
                {record.version?.major}.{record.version?.minor}
              </Tag>
              <Tag key={record.version?.platform}>{record.version?.platform}</Tag>
            </Flex>
          );
        }
        return '-';
      },
    },
    {
      title: intl.formatMessage({ id: 'model.cluster.enable' }),
      dataIndex: 'enable',
      hideInForm: true,
      valueEnum: {
        false: {
          text: intl.formatMessage({ id: 'model.enable.false' }),
          status: 'Error',
        },
        true: {
          text: intl.formatMessage({ id: 'model.enable.true' }),
          status: 'Success',
        },
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      hideInTable: !access.adminAccess,
      render: (_, record) => {
        const nodes = [];
        nodes.unshift(
          <a
            key="update"
            onClick={() => {
              window.location.href = `/admin/cluster/update/${record.id}`;
            }}
          >
            <EditOutlined style={{ color: colorPrimary }} />
          </a>,
        );
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
  const clusterAcountColumns: ProColumns<ClusterAccountDetail>[] = [
    {
      title: intl.formatMessage({ id: 'model.user.username' }),
      search: false,
      render: (dom, entity) => {
        return (
          <>
            <a>
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
      title: intl.formatMessage({ id: 'model.user.email' }),
      dataIndex: 'email',
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      hideInTable: !access.adminAccess,
      render: (_, record) => {
        const nodes = [
          <Popconfirm
            key={record.id + '-delete'}
            description={intl.formatMessage({
              id: 'cluster.account.delete.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              intl.formatMessage({ id: 'cluster.account' }) +
              '【' +
              record.account?.username +
              '】'
            }
            onConfirm={() => {
              handleRemoveClusterAccount(intl, record);
            }}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <DeleteOutlined style={{ color: 'red' }} />
          </Popconfirm>,

        ];
        return nodes;
      },
    },
  ];
  return (
    <PageContainer title={intl.formatMessage({ id: 'menu.cluster' })}>
      <ProTable<ClusterDetail, TableListPagination>
        key='org-cluster'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey="id"
        search={{
          showHiddenNum: true,
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
          <Access accessible={access.adminAccess === true} key={'create'}>
            <Button
              type="primary"
              key="create"
              onClick={() => {
                navigate(`${BaseAddress}/create`);
              }}
            >
              <FormattedMessage id="pages.operation.create" />
            </Button>
          </Access>,
        ]}

        request={listCluster}
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

      <ModalForm
        title={intl.formatMessage({ id: 'cluster.supper.admin.add' })}
        width="40vw"
        key={`${clusterInfo?.id}`}
        open={createVisible}
        clearOnDestroy={true}
        onOpenChange={setCreateVisible}
        onFinish={async (values: Record<string, any>) => {
          const data = {} as ClusterAdmin;
          data.accountId = values.accountId;
          await createClusterSupperUser(
            { cluster: clusterInfo?.code || '' },
            data,
          );
          setCreateVisible(false);
          setShowClusterAdminDrawer(true);
          roleActionRef.current?.reload();
        }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      >
        <Row gutter={24} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Alert
              title={intl.formatMessage({
                id: 'cluster.supper.admin.add.description',
              })}
              type="error"
            />
            <br />
          </Col>
          <Col span={24}>
            <ProFormSelect
              showSearch
              label={intl.formatMessage({ id: 'cluster.account' })}
              name="accountId"
              rules={[
                {
                  required: true,
                  message:
                    intl.formatMessage({ id: 'pages.select.text.tips' }) +
                    intl.formatMessage({ id: 'cluster.account' }),
                },
              ]}
              request={async (values: Record<string, string>) => {
                const res = (await listAccount({

                  search: values?.keyWords || '',
                })) as AccountDetailList;
                return (
                  res.data?.map((item: AccountDetail) => ({
                    label: (
                      <SystemUser
                        enable={item.enable}
                        avatar={item.avatar}
                        username={item.username}
                        nickname={item.nickname}
                        jobNumber={item.jobNumber}
                      />
                    ),
                    value: item.id,
                  })) || []
                );
              }}
            />
          </Col>
        </Row>
      </ModalForm>
      <Drawer
        destroyOnHidden={true}
        title={<FormattedMessage id="cluster.supper.admin" />}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={showClusterAdminDrawer}
        onClose={() => setShowClusterAdminDrawer(false)}
        closable={true}
      >
        <ProTable<ClusterAccountDetail, TableListPagination>
          key='cluster-account'
          scroll={{ x: 'max-content' }}
          actionRef={roleActionRef}
          rowKey="id"
          search={false}
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
            <Access
              accessible={access.adminAccess === true}
              key={'create'}
            >
              <Button
                type="primary"
                key="add"
                onClick={() => {
                  setShowClusterAdminDrawer(false);
                  setCreateVisible(true);
                }}
              >
                <FormattedMessage id="cluster.supper.admin.add" />
              </Button>
            </Access>,
          ]}
          params={{
            cluster: clusterInfo?.code,
          }}
          request={listClusterAccount}
          columns={clusterAcountColumns}

        />
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
