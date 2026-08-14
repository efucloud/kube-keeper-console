import { normalizeKubernetesPath } from '@/utils/global';
import { ClusterNamespaceDetail } from "@/services/cluster_namespace";
import { Card, Col, Row, Space, Typography } from "antd";
import { useIntl } from "@umijs/max";
import dayjs from "dayjs";
import { getClusterNamespaceDashboard } from "@/services/namespace.api";
import { useEffect, useState } from "react";
import { ClusterDashboard } from "@/services/dashboard";
import MetricsColumn from "@/pages/kubernetes/components/metrics_column";
import { ProDescriptions } from "@ant-design/pro-components";
import { getClusterResource } from "@/utils/cluster";
const { Text } = Typography;
export interface NamespaceDashboardProps extends ClusterNamespaceDetail {
}
export const NamespaceDashboard: React.FC<NamespaceDashboardProps> = (props) => {
  const intl = useIntl();
  const [dashboard, setDashboard] = useState<ClusterDashboard>({});
  const [time] = useState<dayjs.Dayjs>(dayjs());
  const getDashboard = async () => {
    const data = (await getClusterNamespaceDashboard({ cluster: props.cluster?.code || '', namespace: props.namespace })) as ClusterDashboard;
    setDashboard(data);
  };
  useEffect(() => {
    if (props.namespace && props.cluster?.code) {
      getDashboard();
    }
  }, [props.namespace]);
  return (<Card hoverable style={{ height: '300px', padding: 2, marginBottom: 16 }}
    styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%', padding: '8px' } }}
    key={props.id}
  >

    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%'
    }}>
      <a onClick={() => {
        window.location.href = normalizeKubernetesPath(`/kubernetes/cluster/${props.cluster?.code}/namespace/${props.namespace}/dashboard/overview`);
      }}> {props.namespace}</a>
    </div>
    {/* 描述区域：可点击跳转 */}
    <div style={{ flex: 1, marginTop: 10 }}>
      <ProDescriptions column={3} >
        <ProDescriptions.Item style={{ padding: 2 }} label={getClusterResource('Pod', false)}>{dashboard.pods}</ProDescriptions.Item>
        <ProDescriptions.Item style={{ padding: 2 }} label={getClusterResource('Deployment', false)}>{dashboard.deployments}</ProDescriptions.Item>
        <ProDescriptions.Item style={{ padding: 2 }} label={getClusterResource('StatefulSet', false)}>{dashboard.statefulSets}</ProDescriptions.Item>
        <ProDescriptions.Item style={{ padding: 2 }} label={getClusterResource('DaemonSet', false)}>{dashboard.daemonSets}</ProDescriptions.Item>
        <ProDescriptions.Item style={{ padding: 2 }} label={getClusterResource('Job', false)}>{dashboard.job}</ProDescriptions.Item>
        <ProDescriptions.Item style={{ padding: 2 }} label={getClusterResource('CronJob', false)}>{dashboard.cronJob}</ProDescriptions.Item>
        <ProDescriptions.Item style={{ padding: 2 }} label={getClusterResource('Ingress', false)}>{dashboard.ingress}</ProDescriptions.Item>
        <ProDescriptions.Item style={{ padding: 2 }} label={getClusterResource('HelmInstance', false)}>{dashboard.helmInstance}</ProDescriptions.Item>
        <ProDescriptions.Item style={{ padding: 2 }} label={getClusterResource('PersistentVolumeClaim', false)}>{dashboard.pvc}</ProDescriptions.Item>
      </ProDescriptions>
      <Row gutter={16}  >
        <Col lg={12} md={12} sm={12}>
          <MetricsColumn

            cluster={props.cluster?.code || ''}
            namespace={props.namespace}
            view="namespace"
            title={intl.formatMessage({ id: 'metrics.cluster.Memory' }) + ' (GiB)'}
            metricsRequests={[
              {
                name: 'Workload Memory Request Total',
                code: 'Workload Memory Request Total',
                metricKey: intl.formatMessage({ id: 'cluster.resource.container.resource.request' }),
                toFixed: 4,
                multiplier: 1 / 1000 / 1000 / 1024,
              },
              {
                name: 'Memory Usage Total',
                code: 'Memory Usage Total',
                metricKey: intl.formatMessage({ id: 'cluster.resource.container.resource.usage' }),
                toFixed: 4,
                multiplier: 1 / 1000 / 1000 / 1024,
              },
              {
                name: 'Workload Memory Limit Total',
                code: 'Workload Memory Limit Total',
                metricKey: intl.formatMessage({ id: 'cluster.resource.container.resource.limit' }),
                toFixed: 4,
                multiplier: 1 / 1000 / 1000 / 1024,
              },

            ]}
            height={100}
            end={time.unix()}
          />
        </Col>
        <Col lg={12} md={12} sm={12}>
          <MetricsColumn

            cluster={props.cluster?.code || ''}
            namespace={props.namespace}
            view="namespace"
            title={intl.formatMessage({ id: 'metrics.cluster.CPU' }) + ' (Core)'}
            metricsRequests={[
              {
                name: 'Workload CPU Request Total',
                code: 'Workload CPU Request Total',
                metricKey: intl.formatMessage({ id: 'cluster.resource.container.resource.request' }),
                toFixed: 4,
                multiplier: 1,
              },
              {
                name: 'CPU Usage Total',
                code: 'CPU Usage Total',
                metricKey: intl.formatMessage({ id: 'cluster.resource.container.resource.usage' }),
                toFixed: 4,
                multiplier: 1,
              },
              {
                name: 'Workload CPU Limit Total',
                code: 'Workload CPU Limit Total',
                metricKey: intl.formatMessage({ id: 'cluster.resource.container.resource.limit' }),
                toFixed: 4,
                multiplier: 1,
              },

            ]}
            height={100}
            end={time.unix()}
          />
        </Col>
      </Row>

    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <Text type="secondary" style={{ fontSize: '12px' }}>
        {props.cluster?.name}({props.cluster?.code})
      </Text>
      <Text type="secondary" style={{ fontSize: '12px' }}>
        {dayjs(props.clusterCreateTime).format('YYYY.MM.DD HH:mm:ss')}
      </Text>
    </div>
  </Card>)
};
export default NamespaceDashboard;