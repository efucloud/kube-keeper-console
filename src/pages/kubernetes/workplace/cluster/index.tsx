import { clusterServerGroups } from "@/services/cluster.api";
import { ClusterServerGroup, UserAccessCluster, UserAccessClusterList } from "@/services/kubernetes";
import { canAccessClusters } from "@/services/personal.api";
import { getColorPrimary, saveClusterApiVersions, saveClusterFeatures, saveClusterVersion } from "@/utils/global";
import { FormattedMessage, useIntl } from "@umijs/max";
import { Card, Divider, Input, List, Skeleton, Space, Tag } from "antd";
import { useEffect, useState } from "react";
import InfiniteScroll from 'react-infinite-scroll-component';
import useStyles from "@/pages/kubernetes/workplace/style.style";
import { PageContainer, ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import { ClusterConnect, ClusterOverView } from "@/pages/kubernetes/workplace/cluster/overview";
import { nanoid } from 'nanoid';
import { CreditCardOutlined, ReloadOutlined, TableOutlined } from "@ant-design/icons";

const ClusterView: React.FC = () => {
  const { styles } = useStyles();
  const intl = useIntl();
  const colorPrimary = getColorPrimary();

  const [searchCluster, setSearchCluster] = useState<string>("");
  const [accessClusters, setAccessClusters] = useState<UserAccessCluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [clusterCurrent, setClusterCurrent] = useState(1);
  const [clusterTotal, setClusterTotal] = useState(0);
  const [refreshKeys, setRefreshKeys] = useState<Record<string, string>>({});
  const [viewType, setViewType] = useState<string>("table");
  // 初始化
  useEffect(() => {
    const initialKeys: Record<string, string> = {};
    accessClusters.forEach((cluster) => {
      initialKeys[cluster.id!] = nanoid();
    });
    setRefreshKeys(initialKeys);
  }, [accessClusters]);

  // 在 renderItem 中：
  const handleRefresh = (id: string) => {
    setRefreshKeys((prev) => ({
      ...prev,
      [id]: nanoid(),
    }));
  };
  useEffect(() => {
    loadMoreClusterData();
  }, [searchCluster]);
  const loadMoreClusterData = async () => {
    setLoading(true);
    try {
      const data = (await canAccessClusters({
        search: searchCluster || "",
        current: clusterCurrent,
      })) as UserAccessClusterList;
      if (data?.data && data?.data.length > 0) {
        if (clusterCurrent == 1) {
          setAccessClusters([...data.data]);
        } else {
          setAccessClusters([...accessClusters, ...data.data]);
        }
        data.data.map((item: UserAccessCluster) => {
          saveClusterVersion(item.code, `${item.version?.major || 0}.${item.version?.minor || 0}`)
          saveClusterFeatures(item.code, item?.features || []);
          //获取集群资源
          clusterServerGroups({ cluster: item.code }).then(
            (res) => {
              const groups = res as string;
              saveClusterApiVersions(item.code, groups);
            }
          );
        });
      } else {
        setAccessClusters([]);
      }
      setClusterTotal(data.total || 0);

    } finally {
      setLoading(false);
    }
  };
  const columns: ProColumns<UserAccessCluster>[] = [
    {
      title: <FormattedMessage id="model.cluster.name" />,
      dataIndex: "name",
    },
    {
      title: <FormattedMessage id="model.cluster.code" />,
      dataIndex: "code",
    },
    {
      title: <FormattedMessage id="cluster.platform" />,
      render: (_, record: UserAccessCluster) => {
        if (record.version) {
          return record.version?.platform;
        } else {
          return "-";
        }
      },
    },
    {
      title: <FormattedMessage id="model.cluster.version" />,
      render: (_, record: UserAccessCluster) => {
        if (record.version?.major) {
          return `${record.version.major}.${record.version.minor}`;
        } else {
          return "-";
        }
      },
    },
    {
      title: <FormattedMessage id="cluster.features" />,
      render: (_, record: UserAccessCluster) => {
        if (record.features) {
          return (
            <Space>
              {record.features.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </Space>
          );
        } else {
          return "-";
        }
      },
    },
    {
      title: intl.formatMessage({ id: "pages.operation" }),
      dataIndex: "option",
      search: false,
      align: "center",
      render: (_, record) => {
        return (
          <Space size="middle">
            <ReloadOutlined
              style={{ color: colorPrimary }}
              onClick={() => {
                handleRefresh(record.id!);
              }}
            />
            <ClusterConnect
              key={refreshKeys[record.id!]}
              clusterCode={record.code!}
            />
          </Space>
        );
      },
    },
  ];
  return (
    <>
      <PageContainer
        title={false}
        subTitle={intl.formatMessage({ id: "cluster.welcome.description" })}
        extra={
          viewType === "table" ? (
            <TableOutlined
              onClick={() => setViewType("card")}
              style={{ color: colorPrimary, fontSize: 20 }}
            />
          ) : (
            <CreditCardOutlined
              onClick={() => setViewType("table")}
              style={{ color: colorPrimary, fontSize: 20 }}
            />
          )
        }
      >
        {clusterTotal > 20 && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Input.Search
              placeholder={intl.formatMessage({
                id: "pages.search.cluster.placeholder",
              })}
              enterButton={intl.formatMessage({ id: "pages.search" })}
              size="large"
              allowClear={true}
              onSearch={(value: string) => {
                setClusterCurrent(1);
                setAccessClusters([]);
                setSearchCluster(value);
              }}
              style={{ maxWidth: 522, width: "100%" }}
            />
          </div>
        )}
        <InfiniteScroll
          dataLength={accessClusters.length}
          next={() => {
            setClusterCurrent((prev) => prev + 1);
            loadMoreClusterData();
          }}
          hasMore={accessClusters.length < clusterTotal}
          loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
          endMessage={
            <Divider plain>
              <FormattedMessage id="pages.no.more.data" /> 🤐
            </Divider>
          }
          scrollableTarget="scrollableDiv"
        >
          {viewType === "card" && (
            <div className={styles.cardList}>
              <List<UserAccessCluster>
                locale={{
                  emptyText: intl.formatMessage({ id: "pages.not.found.data" }),
                }}
                rowKey="id"
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
                loading={loading}
                dataSource={accessClusters}
                renderItem={(item) => {
                  return (
                    <List.Item key={item.id}>
                      <Card
                        hoverable
                        className={styles.card}
                        key={item.id}
                        title={
                          <Space orientation="horizontal">
                            <>{`${item.name}(${item.code})`}</>
                          </Space>
                        }
                        styles={{
                          header: {
                            padding: "8px 16px", // 默认是 16px 24px，可减小
                            minHeight: "auto", // 移除最小高度限制
                            lineHeight: 1.5, // 减小行高
                          },
                        }}
                        extra={
                          <Space size="middle">
                            <ReloadOutlined
                              style={{ color: colorPrimary }}
                              onClick={() => {
                                handleRefresh(item.id!);
                              }}
                            />
                            <ClusterConnect
                              key={refreshKeys[item.id!]}

                              clusterCode={item.code!}
                            />
                          </Space>
                        }
                      >
                        {item.version && (
                          <ProDescriptions
                            style={{ marginBottom: 16 }}
                            column={2}
                          >
                            <ProDescriptions.Item
                              label={<FormattedMessage id="cluster.platform" />}
                            >
                              {item.version?.platform}
                            </ProDescriptions.Item>
                            <ProDescriptions.Item
                              label={
                                <FormattedMessage id="model.cluster.version" />
                              }
                            >
                              {item.version?.major}.{item.version?.minor}
                            </ProDescriptions.Item>
                          </ProDescriptions>
                        )}

                        <ClusterOverView
                          key={refreshKeys[item.id!]}

                          clusterCode={item.code!}
                        />
                      </Card>
                    </List.Item>
                  );
                }}
              />
            </div>
          )}
          {viewType === "table" && (
            <Card>
              <ProTable<UserAccessCluster>
                rowKey="id"
                search={false}
                columns={columns}
                toolBarRender={false}
                dataSource={accessClusters}
                pagination={false}
              />
            </Card>
          )}
        </InfiniteScroll>
      </PageContainer>
    </>
  );
};
export default ClusterView;
