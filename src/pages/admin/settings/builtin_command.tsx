import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, message, Popconfirm, Space } from 'antd';
import React, { useRef, useState } from 'react';
import type { IntlShape } from 'react-intl';
import type { BuiltinShellCommandDetail } from '@/services/builtin_shell_command';
import {
  deleteBuiltinShellCommand,
  listBuiltinShellCommand,
} from '@/services/builtin_shell_command.api';
import type { TableListPagination } from '@/services/common.d';
import { getColorPrimary, getCurrentViewInfo } from '@/utils/global';

const BuiltinCommandTableList: React.FC = () => {
  const access = useAccess();
  /** 新建窗口的弹窗 */
  const actionRef = useRef<ActionType>(null);
  const [info, setInfo] = useState<BuiltinShellCommandDetail>();
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  /** 国际化配置 */
  const intl = useIntl();
  const colorPrimary = getColorPrimary();
  const handleRemove = async (
    intl: IntlShape,
    selectedRow: BuiltinShellCommandDetail,
  ) => {
    const hide = message.loading(
      intl.formatMessage({ id: 'pages.operation.deleting' }),
    );

    try {
      await deleteBuiltinShellCommand({ id: selectedRow.id });
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

  const columns: ProColumns<BuiltinShellCommandDetail>[] = [
    {
      title: intl.formatMessage({ id: 'integration.git.name' }),
      dataIndex: 'name',
    },

    {
      title: intl.formatMessage({ id: 'model.createdAt' }),
      dataIndex: 'createdAt',
      search: false,
      sorter: true,
      valueType: 'dateTime',
    },
    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      render: (_, record) => {
        const nodes = [
          <a
            key="edit"
            onClick={() => {
              setInfo(record);
              setModalVisible(true);
            }}
          >
            {intl.formatMessage({ id: 'pages.operation.edit' })}
          </a>,
          <Popconfirm
            key={record.id + '-delete'}
            description={intl.formatMessage({
              id: 'model.user.delete.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              intl.formatMessage({ id: 'user.model.name' }) +
              '【' +
              record.name +
              '】'
            }
            onConfirm={() => {
              handleRemove(intl, record);
            }}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <a className="operation-delete">
              <FormattedMessage id="pages.operation.delete" />
            </a>
          </Popconfirm>,
        ];
        return <Space>{nodes}</Space>;
      },
    },
  ];
  return (
    <PageContainer
      header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title={<FormattedMessage id="integration.builtin.command" />}
    >
      <ProTable<BuiltinShellCommandDetail, TableListPagination>
        key='builtin-shell-command'
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
                setModalVisible(true);
              }}
            >
              <FormattedMessage id="pages.operation.create" />
            </Button>
          </Access>,
        ]}
        request={listBuiltinShellCommand}
        columns={columns}
        rowSelection={false}
      />
      <ModalForm
        title={
          info?.id !== ''
            ? intl.formatMessage({ id: 'pages.operation.edit' })
            : intl.formatMessage({ id: 'pages.operation.create' })
        }
        width="40vw"
        key={info?.id || Date.now().toString()}
        open={modalVisible}
        initialValues={info}
        clearOnDestroy={true}
        onValuesChange={(changeValues) => { }}
        onOpenChange={setModalVisible}
        onFinish={async (values: Record<string, any>) => {
          setModalVisible(false);
          actionRef.current?.reload();
        }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      >
        <ProFormText
          label={intl.formatMessage({ id: 'integration.git.name' })}
          name="name"
          rules={[
            {
              max: 50,
              message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 50 }),
            },
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.input.text.tips' }) +
                intl.formatMessage({ id: 'integration.git.name' }),
            },
          ]}
        />
        <ProFormSelect
          label={intl.formatMessage({ id: 'integration.git.scope' })}
          tooltip={{
            color: colorPrimary,
            title: intl.formatMessage({
              id: 'integration.git.scope.tooltip',
            }),
          }}
          name="scope"
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.select.text.tips' }) +
                intl.formatMessage({ id: 'integration.git.scope' }),
            },
          ]}
          options={[
            {
              label: intl.formatMessage({
                id: 'integration.git.scope.global',
              }),
              value: 'global',
            },
            {
              label: intl.formatMessage({
                id: 'integration.git.scope.tenant',
              }),
              value: 'tenant',
            },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default BuiltinCommandTableList;
