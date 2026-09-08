import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, message, Popconfirm, Space, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import type {
  HelmRepositoryDetail,
  HelmRepositoryInput,
} from '@/services/helm_store';
import {
  createHelmRepository,
  deleteHelmRepository,
  listHelmRepositories,
  syncHelmRepository,
  updateHelmRepository,
} from '@/services/helm_store.api';

const HelmRepositoryManagement: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HelmRepositoryDetail>();

  const columns: ProColumns<HelmRepositoryDetail>[] = [
    {
      title: intl.formatMessage({ id: 'helm.repository.name' }),
      dataIndex: 'name',
    },
    { title: 'URL', dataIndex: 'url', copyable: true, ellipsis: true },
    {
      title: intl.formatMessage({ id: 'helm.repository.status' }),
      search: false,
      width: 120,
      render: (_, record) => (
        <Space size={4}>
          <Tag color={record.enabled ? 'green' : 'default'}>
            {intl.formatMessage({
              id: record.enabled ? 'helm.enabled' : 'helm.disabled',
            })}
          </Tag>
          <Tag color={record.cached ? 'blue' : 'orange'}>
            {intl.formatMessage({
              id: record.cached ? 'helm.cached' : 'helm.notCached',
            })}
          </Tag>
        </Space>
      ),
    },
    {
      title: intl.formatMessage({ id: 'helm.repository.lastSync' }),
      search: false,
      width: 180,
      render: (_, record) =>
        record.lastSyncedAt
          ? dayjs(record.lastSyncedAt).format('YYYY-MM-DD HH:mm:ss')
          : '-',
    },
    {
      title: intl.formatMessage({ id: 'helm.repository.syncResult' }),
      search: false,
      ellipsis: true,
      render: (_, record) =>
        record.lastSyncError ? (
          <Tooltip title={record.lastSyncError}>
            <Tag color="error">
              {intl.formatMessage({ id: 'helm.syncFailed' })}
            </Tag>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: intl.formatMessage({ id: 'helm.actions' }),
      valueType: 'option',
      width: 140,
      render: (_, record) => (
        <Space>
          <Tooltip title={intl.formatMessage({ id: 'helm.sync' })}>
            <Button
              type="text"
              icon={<SyncOutlined />}
              onClick={async () => {
                await syncHelmRepository(record.id);
                message.success(intl.formatMessage({ id: 'helm.syncSuccess' }));
                actionRef.current?.reload();
              }}
            />
          </Tooltip>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              setOpen(true);
            }}
          />
          <Popconfirm
            title={intl.formatMessage({ id: 'helm.repository.deleteConfirm' })}
            onConfirm={async () => {
              await deleteHelmRepository([record.id]);
              message.success(intl.formatMessage({ id: 'helm.saved' }));
              actionRef.current?.reload();
            }}
          >
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<HelmRepositoryDetail>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={false}
        request={async (params) => {
          const result = await listHelmRepositories(params);
          return { data: result.data, total: result.total, success: true };
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            {intl.formatMessage({ id: 'helm.repository.add' })}
          </Button>,
        ]}
      />
      <ModalForm<HelmRepositoryInput>
        key={editing?.id || 'new'}
        open={open}
        onOpenChange={setOpen}
        title={intl.formatMessage({
          id: editing ? 'helm.repository.edit' : 'helm.repository.add',
        })}
        initialValues={
          editing || { enabled: true, insecureSkipTLSVerify: false }
        }
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          if (editing)
            await updateHelmRepository({ ...values, id: editing.id });
          else await createHelmRepository(values);
          message.success(intl.formatMessage({ id: 'helm.saved' }));
          setOpen(false);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label={intl.formatMessage({ id: 'helm.repository.name' })}
          rules={[{ required: true }, { max: 100 }]}
        />
        <ProFormText
          name="url"
          label="URL"
          rules={[{ required: true }, { type: 'url' }]}
          placeholder="https://charts.example.com"
        />
        <ProFormText
          name="username"
          label={intl.formatMessage({ id: 'helm.repository.username' })}
        />
        <ProFormText.Password
          name="password"
          label={intl.formatMessage({ id: 'helm.repository.password' })}
          tooltip={
            editing
              ? intl.formatMessage({ id: 'helm.repository.passwordKeep' })
              : undefined
          }
        />
        <ProFormSwitch
          name="enabled"
          label={intl.formatMessage({ id: 'helm.enabled' })}
        />
        <ProFormSwitch
          name="insecureSkipTLSVerify"
          label={intl.formatMessage({ id: 'helm.repository.insecure' })}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default HelmRepositoryManagement;
