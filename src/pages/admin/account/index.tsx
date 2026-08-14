import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { FooterToolbar, ModalForm, PageContainer, ProFormSelect, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl, useNavigate } from '@umijs/max';
import { Alert, Button, Modal, message, Popconfirm, Space } from 'antd';
import React, { useRef, useState } from 'react';
import type { IntlShape } from 'react-intl';
import type { TableListPagination } from '@/services/common.d';
import { changeAccountStatus, deleteAccount, listAccount, setAccountRole } from '@/services/account.api';
import type { AccountDetail, AccountRole } from '@/services/account.d';
import { getColorPrimary } from '@/utils/global';

const OrgAccountTableList: React.FC = () => {
  const colorPrimary = getColorPrimary();
  /** 新建窗口的弹窗 */
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const [roleModalVisible, setRoleModalVisible] = useState<boolean>(false);
  const [accountInfo, setAccountInfo] = useState<AccountDetail>();
  /** 国际化配置 */
  const intl = useIntl();
  const navigate = useNavigate();
  const BaseAddress = `/admin/account`;

  const handleEnable = async (
    intl: IntlShape,
    enable: boolean,
    selectedRows: AccountDetail[],
  ) => {
    const hide = message.loading(
      intl.formatMessage({ id: 'pages.operation.updating' }),
    );
    if (!selectedRows) return true;

    try {
      await changeAccountStatus(

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
      message.error(intl.formatMessage({ id: 'pages.operation.update.failed' }),);
      return false;
    }
  };
  const columns: ProColumns<AccountDetail>[] = [
    {
      title: intl.formatMessage({ id: 'model.user.username' }),
      dataIndex: 'username',
      valueType: 'text',
    },
    {
      title: intl.formatMessage({ id: 'model.user.email' }),
      dataIndex: 'email',
      valueType: 'text',
    },
    {
      title: intl.formatMessage({ id: 'model.user.phone' }),
      dataIndex: 'phone',
      valueType: 'text',
    },
    {
      title: intl.formatMessage({ id: 'model.user.role' }),
      dataIndex: 'role',
      valueEnum: {
        admin: {
          text: intl.formatMessage({ id: 'model.user.role.admin' }),
        },
        none: {
          text: intl.formatMessage({ id: 'model.user.role.none' }),
        },
      },
    },
    {
      title: intl.formatMessage({ id: 'model.user.enable' }),
      dataIndex: 'enable',
      hideInForm: true,
      valueEnum: {
        false: {
          text: intl.formatMessage({ id: 'model.user.enable.disable' }),
          status: 'Error',
        },
        true: {
          text: intl.formatMessage({ id: 'model.user.enable.enable' }),
          status: 'Success',
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
      hideInTable: !access.adminAccess,
      render: (_, record) => {
        const nodes = [
          <a
            key="set-role"
            onClick={() => {
              setRoleModalVisible(true);
              setAccountInfo(record);
            }}
          >
            <FormattedMessage id="model.user.set.role" />
          </a>
        ];

        if (record.enable) {
          nodes.push(<Popconfirm
            key={record.id + '-disable'}
            description={intl.formatMessage({
              id: 'model.user.enable.disable.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.disable.enable' }) +
              intl.formatMessage({ id: 'model.account.name' }) +
              '【' +
              record.username +
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
          </Popconfirm>)
        } else {
          nodes.push(<Popconfirm
            key={record.id + '-enable'}
            description={intl.formatMessage({
              id: 'model.user.enable.enable.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.enable.description' }) +
              intl.formatMessage({ id: 'model.account.name' }) +
              '【' +
              record.username +
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
          </Popconfirm>)
        }
        return <Space>{nodes}</Space>;
      },
    },
  ];
  const roles = [
    {
      label: intl.formatMessage({ id: 'model.user.role.admin' }),
      value: 'admin',
    },
    {
      label: intl.formatMessage({ id: 'model.user.role.none' }),
      value: 'none',
    },
  ];
  return (
    <PageContainer
      title={intl.formatMessage({ id: 'menu.account' })}
    >
      <ProTable<AccountDetail, TableListPagination>
        key='org-account-list'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey="id"
        search={{
          showHiddenNum: true,
        }}

        request={listAccount}
        columns={columns}
        rowSelection={false}
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
      />
      <ModalForm
        title={intl.formatMessage({ id: 'model.account.set.role' })}
        width="40vw"
        key={accountInfo?.id}
        open={roleModalVisible}
        onOpenChange={setRoleModalVisible}
        initialValues={{ role: accountInfo?.role }}
        onFinish={async (values) => {
          values['ids'] = [accountInfo?.id as string];
          const res = await setAccountRole(
            values as AccountRole,
          );
          if (res) {
            message.success(intl.formatMessage({ id: 'pages.operation.success' }));
            setRoleModalVisible(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      >
        <Alert
          title={
            intl.formatMessage({ id: 'model.user.username' }) +
            ': ' +
            accountInfo?.username
          }
          type="error"
        />
        <br />

        <ProFormSelect
          label={intl.formatMessage({ id: 'model.user.role' })}
          name="role"
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.select.text.tips' }) +
                intl.formatMessage({ id: 'model.user.role' }),
            },
          ]}
          options={roles}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default OrgAccountTableList;
