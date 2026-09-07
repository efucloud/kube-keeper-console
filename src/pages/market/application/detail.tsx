import {
  AppstoreOutlined,
  ExportOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import XMarkdown from '@ant-design/x-markdown';
import { history, useIntl, useParams } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import Code from '@/components/MarkdownPlugins/Code';
import type { MarketApplicationDetail } from '@/services/market_application';
import { getMarketApplication } from '@/services/market_application.api';
import DeployApplicationModal from './deploy';

const ApplicationDetailPage: React.FC = () => {
  const intl = useIntl();
  const params = useParams();
  const [info, setInfo] = useState<MarketApplicationDetail>();
  const [loading, setLoading] = useState(true);
  const [deploy, setDeploy] = useState(false);
  useEffect(() => {
    getMarketApplication({ id: params.id || '' })
      .then(setInfo)
      .finally(() => setLoading(false));
  }, [params.id]);
  if (loading) return <Spin fullscreen />;
  if (!info) return <Empty />;
  return (
    <PageContainer
      title={info.name}
      onBack={() => history.back()}
      extra={
        <Space>
          {info.home && (
            <Button icon={<ExportOutlined />} href={info.home} target="_blank">
              {intl.formatMessage({ id: 'application.home' })}
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={() => setDeploy(true)}
          >
            {intl.formatMessage({ id: 'application.deploy' })}
          </Button>
        </Space>
      }
    >
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card>
            <Space align="start" size={16}>
              {info.logo ? (
                <Avatar shape="square" size={64} src={info.logo} />
              ) : (
                <Avatar shape="square" size={64} icon={<AppstoreOutlined />} />
              )}
              <div>
                <Typography.Title level={3} style={{ marginTop: 0 }}>
                  {info.name}
                </Typography.Title>
                <Space wrap>
                  {(info.tags || []).map((tag) => (
                    <Tag color="blue" key={tag}>
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            </Space>
            <Typography.Title level={4} style={{ marginTop: 30 }}>
              {intl.formatMessage({ id: 'application.introduction' })}
            </Typography.Title>
            {info.description ? (
              <div className="markdown-wrapper">
                <XMarkdown
                  className="ant-x-markdown"
                  components={{ code: Code }}
                  paragraphTag="div"
                >
                  {info.description}
                </XMarkdown>
              </div>
            ) : (
              <Typography.Text type="secondary">-</Typography.Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={intl.formatMessage({ id: 'application.specification' })}>
            <Descriptions
              column={1}
              size="small"
              items={[
                {
                  key: 'category',
                  label: intl.formatMessage({ id: 'application.category' }),
                  children: info.category,
                },
                {
                  key: 'templates',
                  label: intl.formatMessage({ id: 'application.resources' }),
                  children: info.templates.length,
                },
                {
                  key: 'parameters',
                  label: intl.formatMessage({ id: 'application.parameters' }),
                  children: info.parameters?.length || 0,
                },
                {
                  key: 'crd',
                  label: 'CRD',
                  children: info.hasCrd
                    ? intl.formatMessage({ id: 'application.yes' })
                    : intl.formatMessage({ id: 'application.no' }),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
      <DeployApplicationModal
        application={info}
        open={deploy}
        onClose={() => setDeploy(false)}
      />
    </PageContainer>
  );
};
export default ApplicationDetailPage;
