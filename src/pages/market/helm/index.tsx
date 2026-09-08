import {
  AppstoreOutlined,
  ExportOutlined,
  RocketOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Drawer,
  Empty,
  Flex,
  Input,
  List,
  Pagination,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  theme,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { StandardFormRow, TagSelect } from '@/components';
import {
  getHelmStoreChart,
  listHelmStoreCharts,
  listHelmStoreRepositories,
} from '@/services/helm_store.api';
import styles from './index.less';
import DeployHelmChartModal from './deploy';
import type {
  HelmChartDetail,
  HelmChartList,
  HelmChartVersion,
  HelmStoreRepository,
} from './types';

const allRepositories = '__all__';

const HelmStorePage: React.FC = () => {
  const intl = useIntl();
  const { token } = theme.useToken();
  const [repositories, setRepositories] = useState<HelmStoreRepository[]>([]);
  const [repository, setRepository] = useState<string>();
  const [search, setSearch] = useState('');
  const [current, setCurrent] = useState(1);
  const [charts, setCharts] = useState<HelmChartVersion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<HelmChartDetail>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [deploying, setDeploying] = useState<HelmChartVersion>();
  const pageSize = 12;

  useEffect(() => {
    listHelmStoreRepositories().then(setRepositories);
  }, []);

  useEffect(() => {
    setLoading(true);
    listHelmStoreCharts<HelmChartList>({
      repository,
      search: search || undefined,
      current,
      pageSize,
    })
      .then((result) => {
        setCharts(result.data || []);
        setTotal(result.total || 0);
      })
      .finally(() => setLoading(false));
  }, [current, repository, search]);

  const openDetail = async (chart: HelmChartVersion) => {
    setDetailLoading(true);
    try {
      setDetail(
        await getHelmStoreChart<HelmChartDetail>({
          repository: chart.repositoryId,
          chart: chart.name,
        }),
      );
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <PageContainer
      className={styles.marketPage}
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'helm.store' })}
      subTitle={intl.formatMessage({ id: 'helm.store.description' })}
      content={
        <div className={styles.searchArea}>
          <Input.Search
            size="large"
            allowClear
            enterButton
            prefix={<TagsOutlined />}
            placeholder={intl.formatMessage({ id: 'helm.search' })}
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
          title={intl.formatMessage({ id: 'helm.repository' })}
          block
          last
        >
          <TagSelect
            hideCheckAll
            expandable
            value={[repository || allRepositories]}
            onChange={(values) => {
              const selected = String(values.at(-1) || allRepositories);
              setRepository(
                selected === allRepositories ? undefined : selected,
              );
              setCurrent(1);
            }}
          >
            {[
              {
                id: allRepositories,
                name: intl.formatMessage({ id: 'helm.repository.all' }),
              },
              ...repositories.filter((item) => item.available),
            ].map((item) => (
              <TagSelect.Option value={item.id} key={item.id}>
                {item.name}
              </TagSelect.Option>
            ))}
          </TagSelect>
        </StandardFormRow>
      </Card>

      {loading ? (
        <Card variant="borderless">
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </Card>
      ) : charts.length === 0 ? (
        <Card variant="borderless">
          <Empty description={intl.formatMessage({ id: 'helm.empty' })} />
        </Card>
      ) : (
        <List<HelmChartVersion>
          rowKey={(item) => `${item.repositoryId}/${item.name}`}
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
          dataSource={charts}
          renderItem={(chart) => (
            <List.Item>
              <Card
                hoverable
                className={styles.chartCard}
                onClick={() => openDetail(chart)}
              >
                <Card.Meta
                  avatar={
                    chart.icon ? (
                      <Avatar shape="square" size={38} src={chart.icon} />
                    ) : (
                      <Avatar
                        shape="square"
                        size={38}
                        icon={<AppstoreOutlined />}
                        className={styles.fallbackIcon}
                      />
                    )
                  }
                  title={
                    <Typography.Text strong ellipsis>
                      {chart.name}
                    </Typography.Text>
                  }
                  description={
                    <Tag bordered={false} color="cyan">
                      {chart.repository}
                    </Tag>
                  }
                />
                <ProDescriptions
                  className={styles.meta}
                  column={2}
                  size="small"
                >
                  <ProDescriptions.Item
                    label={intl.formatMessage({ id: 'helm.chartVersion' })}
                  >
                    {chart.version}
                  </ProDescriptions.Item>
                  <ProDescriptions.Item
                    label={intl.formatMessage({ id: 'helm.appVersion' })}
                  >
                    {chart.appVersion || '-'}
                  </ProDescriptions.Item>
                </ProDescriptions>
                <Typography.Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  className={styles.description}
                >
                  {chart.description ||
                    intl.formatMessage({ id: 'helm.noDescription' })}
                </Typography.Paragraph>
                <Flex gap={4} wrap className={styles.tags}>
                  {(chart.keywords || []).slice(0, 4).map((keyword) => (
                    <Tag key={keyword}>{keyword}</Tag>
                  ))}
                </Flex>
                <Divider className={styles.divider} />
                <div className={styles.footer}>
                  <Typography.Text type="secondary">
                    {chart.created
                      ? dayjs(chart.created).format('YYYY.MM.DD')
                      : ''}
                  </Typography.Text>
                  <Space size={2}>
                    {chart.home && (
                      <Button
                        type="text"
                        size="small"
                        icon={<ExportOutlined />}
                        href={chart.home}
                        target="_blank"
                        onClick={(event) => event.stopPropagation()}
                        style={{ color: token.colorPrimary }}
                      />
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<RocketOutlined />}
                      style={{ color: token.colorPrimary }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeploying(chart);
                      }}
                    >
                      {intl.formatMessage({ id: 'helm.deploy' })}
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

      <Drawer
        width={720}
        open={Boolean(detail) || detailLoading}
        loading={detailLoading}
        onClose={() => setDetail(undefined)}
        title={
          detail
            ? `${detail.name} · ${detail.repository}`
            : intl.formatMessage({ id: 'helm.chartDetail' })
        }
      >
        {detail && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Typography.Paragraph type="secondary">
              {detail.versions[0]?.description}
            </Typography.Paragraph>
            <Table<HelmChartVersion>
              rowKey="version"
              pagination={{ pageSize: 10 }}
              dataSource={detail.versions}
              columns={[
                {
                  title: intl.formatMessage({ id: 'helm.chartVersion' }),
                  dataIndex: 'version',
                },
                {
                  title: intl.formatMessage({ id: 'helm.appVersion' }),
                  dataIndex: 'appVersion',
                  render: (value) => value || '-',
                },
                {
                  title: intl.formatMessage({ id: 'helm.created' }),
                  dataIndex: 'created',
                  render: (value) =>
                    value ? dayjs(value).format('YYYY-MM-DD') : '-',
                },
                {
                  title: intl.formatMessage({ id: 'helm.package' }),
                  render: (_, item) =>
                    item.urls?.[0] ? (
                      <Typography.Text
                        copyable
                        ellipsis
                        style={{ maxWidth: 220 }}
                      >
                        {item.urls[0]}
                      </Typography.Text>
                    ) : (
                      '-'
                    ),
                },
                {
                  title: intl.formatMessage({ id: 'helm.actions' }),
                  width: 100,
                  render: (_, item) => (
                    <Button
                      type="link"
                      icon={<RocketOutlined />}
                      onClick={() => {
                        setDetail(undefined);
                        setDeploying(item);
                      }}
                    >
                      {intl.formatMessage({ id: 'helm.deploy' })}
                    </Button>
                  ),
                },
              ]}
            />
          </Space>
        )}
      </Drawer>
      <DeployHelmChartModal
        chart={deploying}
        open={Boolean(deploying)}
        onClose={() => setDeploying(undefined)}
      />
    </PageContainer>
  );
};

export default HelmStorePage;
