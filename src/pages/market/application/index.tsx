import {
  AppstoreOutlined,
  DownloadOutlined,
  ExportOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Empty,
  Flex,
  Input,
  List,
  Pagination,
  Skeleton,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { StandardFormRow, TagSelect } from '@/components';
import type { DictionaryLine } from '@/services/data_dictionary';
import { getDataDictionary } from '@/services/data_dictionary.api';
import {
  MARKET_APPLICATION_CATEGORY_DICTIONARY,
  MARKET_APPLICATION_TAG_DICTIONARY,
} from '@/services/data_dictionary.constants';
import type { MarketApplicationDetail } from '@/services/market_application';
import { listMarketApplication } from '@/services/market_application.api';
import { downloadMarketApplicationYaml } from '@/utils/marketApplicationTransfer';
import DeployApplicationModal from './deploy';
import styles from './index.less';

const allCategories = '__all__';

const MarketApplicationPage: React.FC = () => {
  const intl = useIntl();
  const { token } = theme.useToken();
  const [items, setItems] = useState<MarketApplicationDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>();
  const [categories, setCategories] = useState<DictionaryLine[]>([]);
  const [tags, setTags] = useState<DictionaryLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<MarketApplicationDetail>();
  const pageSize = 12;

  useEffect(() => {
    setLoading(true);
    listMarketApplication({
      current,
      pageSize,
      search: search || undefined,
      category,
      state: 1,
    })
      .then((data) => {
        setItems(data.data || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [category, current, search]);

  useEffect(() => {
    Promise.all([
      getDataDictionary({ code: MARKET_APPLICATION_CATEGORY_DICTIONARY }),
      getDataDictionary({ code: MARKET_APPLICATION_TAG_DICTIONARY }),
    ]).then(([categoryDictionary, tagDictionary]) => {
      setCategories(categoryDictionary.lines || []);
      setTags(tagDictionary.lines || []);
    });
  }, []);

  const categoryLabel = (value: string) =>
    categories.find((item) => item.value === value)?.label || value;
  const tagLabel = (value: string) =>
    tags.find((item) => item.value === value)?.label || value;

  const openDetail = (id: string) =>
    history.push(`/market/application/detail/${id}`);

  return (
    <PageContainer
      className={styles.marketPage}
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'application.market' })}
      subTitle={intl.formatMessage({ id: 'application.market.description' })}
      content={
        <div className={styles.searchArea}>
          <Input.Search
            size="large"
            allowClear
            enterButton
            placeholder={intl.formatMessage({ id: 'application.search' })}
            onSearch={(value) => {
              setSearch(value.trim());
              setCurrent(1);
            }}
          />
        </div>
      }
    >
      <Card variant="borderless" className={styles.filterCard}>
        <StandardFormRow
          title={intl.formatMessage({ id: 'application.category' })}
          block
          last
        >
          <TagSelect
            hideCheckAll
            expandable
            value={[category || allCategories]}
            onChange={(values) => {
              const selected = String(values.at(-1) || allCategories);
              setCategory(selected === allCategories ? undefined : selected);
              setCurrent(1);
            }}
          >
            {[
              {
                label: intl.formatMessage({ id: 'application.category.all' }),
                value: allCategories,
                index: 0,
              },
              ...categories,
            ].map((item) => (
              <TagSelect.Option value={item.value} key={item.value}>
                {item.label}
              </TagSelect.Option>
            ))}
          </TagSelect>
        </StandardFormRow>
      </Card>

      {loading ? (
        <Card variant="borderless">
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </Card>
      ) : items.length === 0 ? (
        <Card variant="borderless">
          <Empty />
        </Card>
      ) : (
        <List<MarketApplicationDetail>
          rowKey="id"
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
          dataSource={items}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                className={styles.applicationCard}
                onClick={() => openDetail(item.id)}
              >
                <Card.Meta
                  avatar={
                    item.logo ? (
                      <Avatar shape="square" size={34} src={item.logo} />
                    ) : (
                      <Avatar
                        shape="square"
                        size={34}
                        icon={<AppstoreOutlined />}
                      />
                    )
                  }
                  title={
                    <div className={styles.cardTitle}>
                      <Typography.Text strong ellipsis>
                        {item.name}
                      </Typography.Text>
                      {item.home && (
                        <Button
                          type="text"
                          size="small"
                          icon={<ExportOutlined />}
                          href={item.home}
                          target="_blank"
                          aria-label={intl.formatMessage({
                            id: 'application.home',
                          })}
                          onClick={(event) => event.stopPropagation()}
                        />
                      )}
                    </div>
                  }
                />

                <ProDescriptions
                  className={styles.meta}
                  column={2}
                  size="small"
                >
                  <ProDescriptions.Item
                    label={intl.formatMessage({ id: 'application.category' })}
                  >
                    {categoryLabel(item.category)}
                  </ProDescriptions.Item>
                  <ProDescriptions.Item
                    label={intl.formatMessage({ id: 'application.resources' })}
                  >
                    {item.templates?.length || 0}
                  </ProDescriptions.Item>
                </ProDescriptions>

                <Typography.Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  className={styles.description}
                >
                  {item.description ||
                    intl.formatMessage({ id: 'application.no.description' })}
                </Typography.Paragraph>

                <Flex gap={4} wrap className={styles.tags}>
                  {(item.tags || []).map((tag) => (
                    <Tag key={tag} color={token.colorPrimary}>
                      {tagLabel(tag)}
                    </Tag>
                  ))}
                </Flex>

                <Divider className={styles.cardDivider} />
                <div className={styles.cardFooter}>
                  <Typography.Text type="secondary" className={styles.date}>
                    {item.createdAt
                      ? dayjs(item.createdAt).format('YYYY.MM.DD')
                      : ''}
                  </Typography.Text>
                  <Space size={2}>
                    <Button
                      type="text"
                      size="small"
                      icon={<DownloadOutlined />}
                      aria-label={intl.formatMessage({
                        id: 'application.export',
                      })}
                      title={intl.formatMessage({ id: 'application.export' })}
                      onClick={(event) => {
                        event.stopPropagation();
                        void downloadMarketApplicationYaml(item.id, item.name);
                      }}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<RocketOutlined />}
                      style={{ color: token.colorPrimary }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeploying(item);
                      }}
                    >
                      {intl.formatMessage({ id: 'application.deploy' })}
                    </Button>
                  </Space>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}

      {total > pageSize && (
        <Pagination
          className={styles.pagination}
          current={current}
          pageSize={pageSize}
          total={total}
          showSizeChanger={false}
          onChange={setCurrent}
        />
      )}

      <DeployApplicationModal
        application={deploying}
        open={Boolean(deploying)}
        onClose={() => setDeploying(undefined)}
      />
    </PageContainer>
  );
};

export default MarketApplicationPage;
