import {
  AppstoreOutlined,
  ArrowRightOutlined,
  ExportOutlined,
  RocketOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Pagination,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import type { MarketApplicationDetail } from '@/services/market_application';
import { listMarketApplication } from '@/services/market_application.api';
import DeployApplicationModal from './deploy';
import styles from './index.less';

const MarketApplicationPage: React.FC = () => {
  const intl = useIntl();
  const [items, setItems] = useState<MarketApplicationDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<MarketApplicationDetail>();
  const pageSize = 12;
  const load = async () => {
    setLoading(true);
    try {
      const data = await listMarketApplication({
        current,
        pageSize,
        search: search || undefined,
        category,
        state: 1,
      });
      setItems(data.data || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [category, current, search]);

  useEffect(() => {
    listMarketApplication({ current: 1, pageSize: 200, state: 1 }).then(
      (data) =>
        setCategories(
          Array.from(
            new Set(
              (data.data || []).map((item) => item.category).filter(Boolean),
            ),
          ).sort(),
        ),
    );
  }, []);

  return (
    <PageContainer title={false} breadcrumb={undefined}>
      <section className={styles.hero}>
        <Typography.Text className={styles.eyebrow}>
          {intl.formatMessage({ id: 'application.market.eyebrow' })}
        </Typography.Text>
        <Typography.Title className={styles.title}>
          {intl.formatMessage({ id: 'application.market' })}
        </Typography.Title>
        <Typography.Paragraph
          style={{ color: 'rgba(255,255,255,.76)', maxWidth: 620, margin: 0 }}
        >
          {intl.formatMessage({ id: 'application.market.description' })}
        </Typography.Paragraph>
        <div className={styles.searchBar}>
          <Select
            className={styles.category}
            size="large"
            allowClear
            value={category}
            placeholder={intl.formatMessage({ id: 'application.category.all' })}
            options={categories.map((value) => ({ label: value, value }))}
            onChange={(value) => {
              setCategory(value);
              setCurrent(1);
            }}
          />
          <Input.Search
            className={styles.search}
            size="large"
            allowClear
            prefix={<SearchOutlined />}
            placeholder={intl.formatMessage({ id: 'application.search' })}
            enterButton
            onSearch={(value) => {
              setSearch(value);
              setCurrent(1);
            }}
          />
        </div>
      </section>
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : items.length === 0 ? (
        <Empty />
      ) : (
        <Row gutter={[18, 18]}>
          {items.map((item) => (
            <Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
              <Card
                className={styles.card}
                styles={{
                  body: {
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  },
                }}
              >
                <Space align="start" size={14}>
                  {item.logo ? (
                    <Avatar shape="square" size={54} src={item.logo} />
                  ) : (
                    <div className={styles.logo}>
                      <AppstoreOutlined />
                    </div>
                  )}
                  <div>
                    <Typography.Title level={4} style={{ margin: '2px 0 4px' }}>
                      {item.name}
                      {item.home && (
                        <Button
                          type="link"
                          size="small"
                          icon={<ExportOutlined />}
                          href={item.home}
                          target="_blank"
                          onClick={(event) => event.stopPropagation()}
                        />
                      )}
                    </Typography.Title>
                    <Typography.Text type="secondary">
                      {item.category}
                    </Typography.Text>
                  </div>
                </Space>
                <Typography.Paragraph
                  ellipsis={{ rows: 3 }}
                  style={{ minHeight: 66, margin: '18px 0' }}
                >
                  {item.description ||
                    intl.formatMessage({ id: 'application.no.description' })}
                </Typography.Paragraph>
                <Space size={[4, 4]} wrap style={{ minHeight: 30 }}>
                  {(item.tags || []).map((tag) => (
                    <Tag key={tag} color="blue">
                      {tag}
                    </Tag>
                  ))}
                </Space>
                <Space style={{ marginTop: 'auto', paddingTop: 18 }}>
                  <Button
                    type="primary"
                    icon={<RocketOutlined />}
                    onClick={() => setDeploying(item)}
                  >
                    {intl.formatMessage({ id: 'application.deploy' })}
                  </Button>
                  <Button
                    type="text"
                    icon={<ArrowRightOutlined />}
                    onClick={() =>
                      history.push(`/market/application/${item.id}`)
                    }
                  >
                    {intl.formatMessage({ id: 'application.details' })}
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      {total > pageSize && (
        <Pagination
          style={{ marginTop: 28, textAlign: 'right' }}
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
