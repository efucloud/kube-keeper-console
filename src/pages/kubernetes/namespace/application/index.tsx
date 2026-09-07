import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  message,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useRef, useState } from 'react';
import type { ApplicationDetail } from '@/services/application';
import { deleteApplication, listApplication } from '@/services/application.api';
import { getCurrentViewInfo } from '@/utils/global';

const statusColor: Record<string, string> = {
  Running: 'green',
  Failed: 'red',
  Deploying: 'processing',
  Deleted: 'default',
};

const ApplicationDeployments: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const { cluster, namespace } = getCurrentViewInfo();
  const [detail, setDetail] = useState<ApplicationDetail>();
  const columns: ProColumns<ApplicationDetail>[] = [
    {
      title: intl.formatMessage({ id: 'application.releaseName' }),
      dataIndex: 'releaseName',
      render: (_, record) => (
        <a onClick={() => setDetail(record)}>{record.releaseName}</a>
      ),
    },
    {
      title: intl.formatMessage({ id: 'application.name' }),
      dataIndex: 'applicationName',
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'application.status' }),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        Running: { text: 'Running' },
        Failed: { text: 'Failed' },
        Deploying: { text: 'Deploying' },
        Deleted: { text: 'Deleted' },
      },
      render: (_, record) => (
        <Tag color={statusColor[record.status]}>{record.status}</Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'application.result' }),
      dataIndex: 'result',
      search: false,
      render: (_, record) => <Tag>{record.result}</Tag>,
    },
    {
      title: intl.formatMessage({ id: 'application.resources' }),
      search: false,
      width: 100,
      render: (_, record) => record.resources?.length || 0,
    },
    {
      title: intl.formatMessage({ id: 'application.deployedAt' }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'application.actions' }),
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => setDetail(record)}
          />
          {record.status !== 'Deleted' && (
            <Popconfirm
              title={intl.formatMessage({
                id: 'application.deployment.delete.confirm',
              })}
              onConfirm={async () => {
                await deleteApplication({ cluster, namespace, id: record.id });
                message.success(
                  intl.formatMessage({ id: 'application.deleted' }),
                );
                actionRef.current?.reload();
              }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];
  return (
    <PageContainer
      title={intl.formatMessage({ id: 'application.deployments' })}
      subTitle={`${cluster} / ${namespace}`}
    >
      <ProTable<ApplicationDetail>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        params={{ cluster, namespace }}
        request={(params) =>
          listApplication({
            cluster,
            namespace,
            current: params.current,
            pageSize: params.pageSize,
            search: params.releaseName as string,
            status: params.status as string,
          })
        }
      />
      <Drawer
        title={detail?.releaseName}
        width={760}
        open={Boolean(detail)}
        onClose={() => setDetail(undefined)}
      >
        {detail && (
          <>
            <Descriptions
              column={2}
              items={[
                {
                  key: 'app',
                  label: intl.formatMessage({ id: 'application.name' }),
                  children: detail.applicationName,
                },
                {
                  key: 'status',
                  label: intl.formatMessage({ id: 'application.status' }),
                  children: (
                    <Tag color={statusColor[detail.status]}>
                      {detail.status}
                    </Tag>
                  ),
                },
                {
                  key: 'cluster',
                  label: intl.formatMessage({ id: 'application.cluster' }),
                  children: detail.clusterCode,
                },
                {
                  key: 'namespace',
                  label: intl.formatMessage({ id: 'application.namespace' }),
                  children: detail.namespace,
                },
                {
                  key: 'description',
                  label: intl.formatMessage({
                    id: 'application.deploy.description',
                  }),
                  children: detail.description || '-',
                  span: 2,
                },
              ]}
            />
            <Typography.Title level={5} style={{ marginTop: 28 }}>
              {intl.formatMessage({ id: 'application.resources' })}
            </Typography.Title>
            {detail.resources?.map((resource) => (
              <div key={resource.key} style={{ marginBottom: 18 }}>
                <Space>
                  <Typography.Text strong>
                    {resource.apiResource?.kind} / {resource.resourceName}
                  </Typography.Text>
                  <Tag
                    color={
                      resource.deployStatus === 'success'
                        ? 'green'
                        : resource.deployStatus === 'deleted'
                          ? 'default'
                          : 'red'
                    }
                  >
                    {resource.deployStatus}
                  </Tag>
                </Space>
                {resource.message && (
                  <Alert
                    type="error"
                    message={resource.message}
                    style={{ marginTop: 8 }}
                  />
                )}
                <pre
                  style={{
                    maxHeight: 320,
                    overflow: 'auto',
                    padding: 14,
                    borderRadius: 8,
                    background: '#0f172a',
                    color: '#dbeafe',
                    fontSize: 12,
                  }}
                >
                  {resource.content}
                </pre>
              </div>
            ))}
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};
export default ApplicationDeployments;
