import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl, useModel } from '@umijs/max';
import { Avatar, Button, Card, Divider, Input, List, Skeleton, Space } from 'antd';
import { MailOutlined, MobileOutlined, ReloadOutlined } from '@ant-design/icons';
import { Welcome } from '@ant-design/x';
import { clusterServerGroups } from '@/services/cluster.api';
import { canAccessClusters } from '@/services/personal.api';
import type { AuthedUserInfo } from '@/services/common';
import type { UserAccessCluster, UserAccessClusterList } from '@/services/kubernetes';
import { getColorPrimary, saveClusterApiVersions, saveClusterFeatures, saveClusterVersion } from '@/utils/global';
import useStyles from '@/pages/kubernetes/workplace/style.style';
import { ClusterConnect, ClusterOverView } from '@/pages/kubernetes/workplace/cluster/overview';
import InfiniteScroll from 'react-infinite-scroll-component';
import { nanoid } from 'nanoid';
import { useCallback, useEffect, useState, type FC } from 'react';

const Workplace: FC = () => {
  const access = useAccess();
  const intl = useIntl();
  const { styles } = useStyles();
  const colorPrimary = getColorPrimary();
  const { initialState } = useModel('@@initialState');
  const currentUser = (initialState?.currentUser || {}) as AuthedUserInfo;

  const [searchCluster, setSearchCluster] = useState<string>('');
  const [accessClusters, setAccessClusters] = useState<UserAccessCluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [clusterPage, setClusterPage] = useState<number>(1);
  const [clusterTotal, setClusterTotal] = useState<number>(0);
  const [refreshKeys, setRefreshKeys] = useState<Record<string, string>>({});
  const getClusterRedirectPath = (cluster: UserAccessCluster): string | undefined => {
    if (!cluster.code) {
      return undefined;
    }
    const basePath = `/kubernetes/cluster/${cluster.code}/dashboard/overview`;
    if (
      !cluster.builtinMaxClusterRole &&
      cluster.namespaces &&
      cluster.namespaces.length > 0
    ) {
      const namespace = cluster.namespaces[0];
      if (namespace) {
        return `/kubernetes/cluster/${cluster.code}/namespace/${namespace}/dashboard/overview`;
      }
    }
    return basePath;
  };

  useEffect(() => {
    const initialKeys: Record<string, string> = {};
    accessClusters.forEach((cluster) => {
      if (cluster.id) {
        initialKeys[cluster.id] = nanoid();
      }
    });
    setRefreshKeys(initialKeys);
  }, [accessClusters]);

  const handleRefresh = (id: string) => {
    setRefreshKeys((prev) => ({
      ...prev,
      [id]: nanoid(),
    }));
  };

  const loadMoreClusterData = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const data = (await canAccessClusters({
          search: searchCluster || '',
          current: page,
        })) as UserAccessClusterList;
        const clusters = data?.data || [];
        setAccessClusters((prev) =>
          page === 1 ? [...clusters] : [...prev, ...clusters],
        );
        clusters.forEach((item) => {
          if (!item.code) {
            return;
          }
          saveClusterVersion(
            item.code,
            `${item.version?.major || 0}.${item.version?.minor || 0}`,
          );
          saveClusterFeatures(item.code, item?.features || []);
          clusterServerGroups({ cluster: item.code }).then((res) => {
            const groups = res as string;
            saveClusterApiVersions(item.code, groups);
          });
        });
        setClusterTotal(data?.total || 0);
        setClusterPage(page + 1);
      } finally {
        setLoading(false);
      }
    },
    [searchCluster],
  );

  useEffect(() => {
    setAccessClusters([]);
    setClusterPage(1);
    loadMoreClusterData(1);
  }, [searchCluster, loadMoreClusterData]);

  return (
    <PageContainer title={false}>
      <Card key={currentUser.id}>
        {currentUser.id && (
          <Welcome
            variant="borderless"
            icon={currentUser.avatar ? <Avatar size="large" src={currentUser.avatar} /> : null}
            title={currentUser.username}
            description={
              <Space>
                <div>
                  <MobileOutlined />:&nbsp;&nbsp;{currentUser.phone}
                </div>
                <div>
                  <MailOutlined />:&nbsp;&nbsp;{currentUser.email}
                </div>
              </Space>
            }
            extra={
              <Space>
                <div
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    flex: 'auto',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Access accessible={access?.adminAccess === true} key="access">
                    <Button
                      type="primary"
                      style={{ float: 'right' }}
                      onClick={() => {
                        window.location.href = `/admin/account`;
                      }}
                    >
                      <FormattedMessage id="pages.console" />
                    </Button>
                  </Access>
                </div>
              </Space>
            }
          />
        )}
      </Card>

      <div style={{ marginTop: 24 }}>
        {clusterTotal > 20 && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Input.Search
              placeholder={intl.formatMessage({ id: 'pages.search.cluster.placeholder' })}
              enterButton={intl.formatMessage({ id: 'pages.search' })}
              size="large"
              allowClear
              onSearch={(value: string) => {
                setSearchCluster(value);
              }}
              style={{ maxWidth: 522, width: '100%' }}
            />
          </div>
        )}

        <InfiniteScroll
          dataLength={accessClusters.length}
          next={() => {
            loadMoreClusterData(clusterPage);
          }}
          hasMore={accessClusters.length < clusterTotal}
          loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
          endMessage={
            <Divider plain>
              <FormattedMessage id="pages.no.more.data" /> 🤐
            </Divider>
          }
        >
          <div className={styles.cardList}>
            <List<UserAccessCluster>
              locale={{
                emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
              }}
              rowKey="id"
              grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
              loading={loading}
              dataSource={accessClusters}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <Card
                    hoverable
                    className={styles.card}
                    key={item.id}
                    title={
                      <Space>
                        <span>{`${item.name}(${item.code})`}</span>
                      </Space>
                    }
                    extra={
                      <Space size="middle">
                        <ReloadOutlined
                          style={{ color: colorPrimary }}
                          onClick={() => handleRefresh(item.id)}
                        />
                        <ClusterConnect
                          key={refreshKeys[item.id]}
                          clusterCode={item.code!}
                          redirectPath={getClusterRedirectPath(item)}
                        />
                      </Space>
                    }
                  >
                    {item.version && (
                      <ProDescriptions style={{ marginBottom: 16 }} column={2}>
                        <ProDescriptions.Item label={<FormattedMessage id="cluster.platform" />}>
                          {item.version?.platform}
                        </ProDescriptions.Item>
                        <ProDescriptions.Item label={<FormattedMessage id="model.cluster.version" />}>
                          {item.version?.major}.{item.version?.minor}
                        </ProDescriptions.Item>
                      </ProDescriptions>
                    )}

                    <ClusterOverView
                      key={refreshKeys[item.id]}
                      clusterCode={item.code!}
                    />
                  </Card>
                </List.Item>
              )}
            />
          </div>
        </InfiniteScroll>
      </div>
    </PageContainer>
  );
};

export default Workplace;
