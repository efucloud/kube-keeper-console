import { DeleteOutlined, EyeOutlined, RocketOutlined } from '@ant-design/icons';
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
import ReadOnlyYamlEditor from '@/pages/kubernetes/components/read_only_yaml_editor';
import type { ApplicationDetail } from '@/services/application';
import { deleteApplication, listApplication } from '@/services/application.api';
import { deployMarketApplication } from '@/services/market_application.api';
import { getCurrentViewInfo } from '@/utils/global';

const statusColor: Record<string, string> = {
  Running: 'green',
  Failed: 'red',
  Deploying: 'processing',
  Deleted: 'default',
};

const statusMessageId: Record<string, string> = {
  Running: 'application.status.running',
  Failed: 'application.status.failed',
  Deploying: 'application.status.deploying',
  Deleted: 'application.status.deleted',
};

const resultMessageId: Record<string, string> = {
  pending: 'application.result.pending',
  success: 'application.result.success',
  partial: 'application.result.partial',
  failed: 'application.result.failed',
  deleted: 'application.status.deleted',
};

const ApplicationDeployments: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const { cluster, namespace } = getCurrentViewInfo();
  const [detail, setDetail] = useState<ApplicationDetail>();
  const [redeploying, setRedeploying] = useState<string>();
  const confirmText = intl.formatMessage({ id: 'pages.operation.confirm' });
  const cancelText = intl.formatMessage({ id: 'pages.operation.cancel' });

  const redeploy = async (record: ApplicationDetail) => {
    setRedeploying(record.id);
    try {
      const deployed = await deployMarketApplication(
        {
          cluster,
          namespace,
          id: record.marketApplicationId,
        },
        {
          releaseName: record.releaseName,
          description: record.description,
          params: record.params || {},
        },
      );
      message.success(
        intl.formatMessage({ id: 'application.redeploy.success' }),
      );
      if (detail?.id === record.id) setDetail(deployed);
      actionRef.current?.reload();
    } finally {
      setRedeploying(undefined);
    }
  };

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
        Running: {
          text: intl.formatMessage({ id: statusMessageId.Running }),
        },
        Failed: {
          text: intl.formatMessage({ id: statusMessageId.Failed }),
        },
        Deploying: {
          text: intl.formatMessage({ id: statusMessageId.Deploying }),
        },
        Deleted: {
          text: intl.formatMessage({ id: statusMessageId.Deleted }),
        },
      },
      render: (_, record) => (
        <Tag color={statusColor[record.status]}>
          {intl.formatMessage({ id: statusMessageId[record.status] })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'application.result' }),
      dataIndex: 'result',
      search: false,
      render: (_, record) => (
        <Tag>{intl.formatMessage({ id: resultMessageId[record.result] })}</Tag>
      ),
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
          {record.status === 'Deleted' ? (
            <Popconfirm
              okText={confirmText}
              cancelText={cancelText}
              title={intl.formatMessage({
                id: 'application.redeploy.confirm',
              })}
              onConfirm={() => redeploy(record)}
            >
              <Button
                type="text"
                icon={<RocketOutlined />}
                loading={redeploying === record.id}
              >
                {intl.formatMessage({ id: 'application.redeploy' })}
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              okText={confirmText}
              cancelText={cancelText}
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
        extra={
          detail?.status === 'Deleted' ? (
            <Popconfirm
              okText={confirmText}
              cancelText={cancelText}
              title={intl.formatMessage({
                id: 'application.redeploy.confirm',
              })}
              onConfirm={() => redeploy(detail)}
            >
              <Button
                type="primary"
                icon={<RocketOutlined />}
                loading={redeploying === detail.id}
              >
                {intl.formatMessage({ id: 'application.redeploy' })}
              </Button>
            </Popconfirm>
          ) : undefined
        }
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
                      {intl.formatMessage({
                        id: statusMessageId[detail.status],
                      })}
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
                    {resource.deployStatus
                      ? intl.formatMessage({
                          id:
                            resultMessageId[resource.deployStatus] ||
                            'application.result.pending',
                        })
                      : '-'}
                  </Tag>
                </Space>
                {resource.message && (
                  <Alert
                    type="error"
                    message={resource.message}
                    style={{ marginTop: 8 }}
                  />
                )}
                <div
                  style={{
                    marginTop: 10,
                    overflow: 'hidden',
                    borderRadius: 8,
                  }}
                >
                  <ReadOnlyYamlEditor content={resource.content || ''} />
                </div>
              </div>
            ))}
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};
export default ApplicationDeployments;
