import { getColorPrimary, normalizeKubernetesPath } from '@/utils/global';
import { useIntl } from "@umijs/max";
import { Button, Card, List, Space } from "antd";
import { useEffect, useState } from "react";
import useStyles from "@/pages/kubernetes/workplace/style.style";
import { WorkspaceDetail, WorkspaceDetailList } from "@/services/workspace";
import { ExportOutlined } from "@ant-design/icons";
import WorkspaceOverView from "@/pages/kubernetes/workplace/workspace/overview";
import { canAccessWorkspaces } from "@/services/personal.api";
import { PageContainer } from "@ant-design/pro-components";
import { Welcome } from "@ant-design/x";

const WorkspaceView: React.FC = () => {
  const { styles } = useStyles();
  const intl = useIntl();

  const [accessWorkspaces, setAccessWorkspaces] = useState<WorkspaceDetail[]>([]);
  const colorPrimary = getColorPrimary();
  useEffect(() => {
    listWorkspaces();
  }, []);
  const listWorkspaces = async () => {
    const data = await canAccessWorkspaces({}) as WorkspaceDetailList;
    if (data?.data && data?.data.length > 0) {
      setAccessWorkspaces([...data.data]);
    } else {
      setAccessWorkspaces([]);
    }
  };
  return (<>
    <PageContainer title={false}

    >
      <Welcome
        variant="borderless"
        title={intl.formatMessage({ id: 'workplace.welcome.title' })}
        description={intl.formatMessage({ id: 'workplace.welcome.description' })}
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
              <Button type='primary' onClick={() => {
                window.location.href = normalizeKubernetesPath(`/kubernetes/cluster`);
              }}>{intl.formatMessage({ id: 'cluster.can.access' })}</Button>
            </div>
          </Space>
        }
      />

      <div className={styles.cardList} style={{ marginTop: 16 }}>
        <List<WorkspaceDetail>
          locale={{
            emptyText: intl.formatMessage({ id: 'pages.not.found.data' })
          }}
          rowKey="id"
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
          dataSource={accessWorkspaces}
          renderItem={(item) => {
            return (
              <List.Item key={item.id}>
                <Card hoverable className={styles.card}
                  key={item.id}
                  title={<Space orientation='horizontal'>
                    <>{`${item.name}(${item.code})`}</>
                  </Space>}
                  styles={{
                    header: {
                      padding: '8px 16px', // 默认是 16px 24px，可减小
                      minHeight: 'auto',   // 移除最小高度限制
                      lineHeight: 1.5,     // 减小行高
                    },
                  }}
                  extra={<Space size='middle'>
                    <ExportOutlined onClick={() => {
                      window.location.href = normalizeKubernetesPath(`/kubernetes/workspace/${item.code}`);
                    }} style={{ color: colorPrimary }} />
                  </Space>}
                >
                  <WorkspaceOverView key={item.id} workspace={item.code!} />
                </Card>
              </List.Item>
            );
          }}
        />

      </div>
    </PageContainer>
  </>)
}
export default WorkspaceView;