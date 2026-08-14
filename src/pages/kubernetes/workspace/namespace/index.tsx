import { NamespaceListProps } from "@/pages/kubernetes/workspace";
import { ClusterNamespaceDetail } from "@/services/cluster_namespace";
import { useIntl } from "@umijs/max";
import { Col, Row, Space, Typography } from "antd";
import NamespaceDashboard from "@/pages/kubernetes/workspace/namespace/card";
const { Text } = Typography;

export const NamespaceIndex: React.FC<NamespaceListProps> = (props) => {
  const intl = useIntl();

  return (<div style={{ backgroundColor: 'color-mix(in srgb, var(--ant-primary-color), transparent 70%)' }}>
    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <Text>{intl.formatMessage({ id: 'model.workspace.namespace.limit.description' })}</Text>
      <Space>
      </Space>
    </div>
    <Row gutter={16}>
      {props.clusterNamespaces?.map((item: ClusterNamespaceDetail) => {
        return (<Col key={item.id} lg={8} md={8} sm={24}>
          <NamespaceDashboard key={item.id}  {...item} />
        </Col>)
      })}
    </Row>
  </div>)
}
export default NamespaceIndex;
