import {
  AppstoreOutlined,
  ExportOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Welcome } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { history, useIntl, useParams } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import Code from '@/components/MarkdownPlugins/Code';
import type { DictionaryLine } from '@/services/data_dictionary';
import { getDataDictionary } from '@/services/data_dictionary.api';
import {
  MARKET_APPLICATION_CATEGORY_DICTIONARY,
  MARKET_APPLICATION_TAG_DICTIONARY,
} from '@/services/data_dictionary.constants';
import type { MarketApplicationDetail } from '@/services/market_application';
import { getMarketApplication } from '@/services/market_application.api';
import DeployApplicationModal from './deploy';

const ApplicationDetailPage: React.FC = () => {
  const intl = useIntl();
  const params = useParams();
  const [info, setInfo] = useState<MarketApplicationDetail>();
  const [loading, setLoading] = useState(true);
  const [deploy, setDeploy] = useState(false);
  const [categories, setCategories] = useState<DictionaryLine[]>([]);
  const [tags, setTags] = useState<DictionaryLine[]>([]);

  const dictionaryLabel = (lines: DictionaryLine[], value: string) =>
    lines.find((line) => line.value === value)?.label || value;

  useEffect(() => {
    Promise.all([
      getMarketApplication({ id: params.id || '' }),
      getDataDictionary({ code: MARKET_APPLICATION_CATEGORY_DICTIONARY }),
      getDataDictionary({ code: MARKET_APPLICATION_TAG_DICTIONARY }),
    ])
      .then(([application, categoryDictionary, tagDictionary]) => {
        setInfo(application);
        setCategories(categoryDictionary.lines || []);
        setTags(tagDictionary.lines || []);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <PageContainer
      title={intl.formatMessage({ id: 'application.market' })}
      header={{ breadcrumb: {}, onBack: () => history.back() }}
      content={<Divider style={{ margin: 0 }} />}
    >
      {loading ? (
        <Card variant="borderless">
          <Spin />
        </Card>
      ) : !info ? (
        <Card variant="borderless">
          <Empty />
        </Card>
      ) : (
        <Card>
          <Welcome
            variant="borderless"
            icon={
              <Avatar
                shape="square"
                size={48}
                src={info.logo}
                icon={!info.logo ? <AppstoreOutlined /> : undefined}
              />
            }
            title={info.name}
            description={
              <div>
                <Typography.Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ maxWidth: 760, marginBottom: 12 }}
                >
                  {info.description ||
                    intl.formatMessage({ id: 'application.no.description' })}
                </Typography.Paragraph>
                <Flex gap={4} wrap>
                  {(info.tags || []).map((tag) => (
                    <Tag key={tag}>{dictionaryLabel(tags, tag)}</Tag>
                  ))}
                </Flex>
              </div>
            }
            extra={
              <Space>
                {info.home && (
                  <Button
                    icon={<ExportOutlined />}
                    href={info.home}
                    target="_blank"
                  >
                    {intl.formatMessage({ id: 'application.home' })}
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<RocketOutlined />}
                  onClick={() => setDeploy(true)}
                >
                  {intl.formatMessage({ id: 'application.deploy' })}
                </Button>
              </Space>
            }
          />

          <Tabs
            style={{ marginTop: 24 }}
            items={[
              {
                key: 'readme',
                label: intl.formatMessage({ id: 'application.introduction' }),
                children: info.description ? (
                  <div className="markdown-wrapper">
                    <XMarkdown
                      className="ant-x-markdown"
                      style={{ whiteSpace: 'normal' }}
                      components={{ code: Code }}
                      paragraphTag="div"
                    >
                      {info.description}
                    </XMarkdown>
                  </div>
                ) : (
                  <Typography.Text type="secondary">-</Typography.Text>
                ),
              },
              {
                key: 'specification',
                label: intl.formatMessage({
                  id: 'application.specification',
                }),
                children: (
                  <Descriptions
                    bordered
                    size="small"
                    column={{ xs: 1, sm: 2 }}
                    items={[
                      {
                        key: 'category',
                        label: intl.formatMessage({
                          id: 'application.category',
                        }),
                        children: dictionaryLabel(categories, info.category),
                      },
                      {
                        key: 'templates',
                        label: intl.formatMessage({
                          id: 'application.resources',
                        }),
                        children: info.templates.length,
                      },
                      {
                        key: 'parameters',
                        label: intl.formatMessage({
                          id: 'application.parameters',
                        }),
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
                ),
              },
            ]}
          />
        </Card>
      )}

      <DeployApplicationModal
        application={info}
        open={deploy}
        onClose={() => setDeploy(false)}
      />
    </PageContainer>
  );
};

export default ApplicationDetailPage;
