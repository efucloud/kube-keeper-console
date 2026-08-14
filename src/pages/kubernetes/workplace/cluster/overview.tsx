import { clusterConnectCheck } from "@/services/cluster.api";
import { KubernetesVersion } from "@/services/kubernetes";
import { DisconnectOutlined, ExportOutlined } from "@ant-design/icons";
import { useIntl } from "@umijs/max";
import { Col, Row, Tooltip } from "antd";
import { useEffect, useState } from "react";
import MetricsLiquid from "@/pages/kubernetes/components/metrics_liquid";
import dayjs from "dayjs";
import MetricsStatistic from "@/pages/kubernetes/components/metrics_statistic";
import MetricsPie from "@/pages/kubernetes/components/metrics_pie";
import { getColorPrimary, normalizeKubernetesPath } from '@/utils/global';

export interface clusterInfo {
  clusterCode: string;
}

export const ClusterOverView: React.FC<clusterInfo> = (props) => {
  const cluster = props.clusterCode;
  const [time] = useState<dayjs.Dayjs>(dayjs());
  const intl = useIntl();
  return (<>
    <Row>
      <Col span={6}>
        <MetricsStatistic

          cluster={cluster}
          view="cluster"
          unit='Core'
          title={intl.formatMessage({
            id: 'metrics.cluster.CPU.total',
          })}
          metricsRequests={[
            {
              name: 'CPU Total',
              code: 'CPU Total',
              metricKey: 'status',
              toFixed: 0,
              multiplier: 1
            },
          ]}
          fontSize={20}
          height={120}
          start={time.unix()}
          end={time.unix()}
        />
      </Col>
      <Col span={6}>
        <MetricsStatistic

          cluster={cluster}
          view="cluster"
          unit='GiB'
          title={intl.formatMessage({
            id: 'metrics.cluster.Memory.total',
          })}
          metricsRequests={[
            {
              name: 'Memory Total',
              code: 'Memory Total',
              metricKey: 'status',
              toFixed: 0,
              multiplier: 1,

            },
          ]}
          fontSize={20}
          height={120}
          start={time.unix()}
          end={time.unix()}
        />
      </Col>
      <Col span={6}>
        <MetricsPie

          cluster={cluster}
          view="cluster"
          title={intl.formatMessage({
            id: 'metrics.cluster.NamespaceStatus',
          })}
          metricsRequests={[
            {
              name: 'Namespace Status',
              code: 'Namespace Status',
              metricKey: 'phase',
              toFixed: 0,
              multiplier: 1,
              secondKey: `{"Active":"#389e0d","Terminating":"red"}`
            },
          ]}
          fontSize={20}
          height={120}
          start={time.unix()}
          end={time.unix()}
        />
      </Col>
      <Col span={6}>
        <MetricsPie

          cluster={cluster}
          view="cluster"
          title={intl.formatMessage({
            id: 'metrics.cluster.NodeStatus',
          })}
          metricsRequests={[
            {
              name: 'Node Status',
              code: 'Node Status',
              metricKey: 'status',
              toFixed: 0,
              multiplier: 1,
              secondKey: `{"true":"#389e0d","false":"red"}`
            },
          ]}
          fontSize={20}
          height={120}
          start={time.unix()}
          end={time.unix()}
        />
      </Col>
      <Col span={6}>
        <MetricsLiquid

          cluster={cluster}
          view="cluster"
          title={intl.formatMessage({
            id: 'metrics.cluster.CPUUtilisation',
          })}
          metricsRequests={[
            {
              name: 'CPU Utilisation',
              code: 'CPU Utilisation',
              metricKey: '',
              toFixed: 3,
              multiplier: 100,
            },
          ]}
          fontSize={20}
          height={120}
          end={time.unix()}
        />
      </Col>
      <Col span={6}>
        <MetricsLiquid

          cluster={cluster}
          view="cluster"
          title={intl.formatMessage({
            id: 'metrics.cluster.MemoryUtilisation',
          })}
          metricsRequests={[
            {
              name: 'Memory Utilisation',
              code: 'Memory Utilisation',
              metricKey: '',
              toFixed: 3,
              multiplier: 100,
            },
          ]}
          fontSize={20}
          height={120}
          end={time.unix()}
        />
      </Col>
      <Col span={6}>
        <MetricsStatistic

          cluster={cluster}
          view="cluster"
          unit='MB/s'
          title={intl.formatMessage({
            id: 'metrics.cluster.Network.Received',
          })}
          metricsRequests={[
            {
              name: 'Network Received',
              code: 'Network Received',
              metricKey: 'status',
              toFixed: 2,
              multiplier: 1,
            },
          ]}
          fontSize={20}
          height={120}
          start={time.unix()}
          end={time.unix()}
        />
      </Col>
      <Col span={6}>
        <MetricsStatistic

          cluster={cluster}
          view="cluster"
          unit='MB/s'
          title={intl.formatMessage({
            id: 'metrics.cluster.Network.Transmit',
          })}
          metricsRequests={[
            {
              name: 'Network Transmit',
              code: 'Network Transmit',
              metricKey: 'status',
              toFixed: 2,
              multiplier: 1,
            },
          ]}
          fontSize={20}
          height={120}
          start={time.unix()}
          end={time.unix()}
        />
      </Col>
    </Row>

  </>)
};
export interface clusterConnectInfo extends clusterInfo {
  redirectPath?: string;
}

export const ClusterConnect: React.FC<clusterConnectInfo> = ({ clusterCode, redirectPath }) => {
  const [connectedAble, setConnectedAble] = useState<boolean>(false);
  const colorPrimary = getColorPrimary();
  const intl = useIntl();
  const targetPath =
    redirectPath || `/kubernetes/cluster/${clusterCode}/dashboard/overview`;

  const clusterVersion = async () => {
    const data = (await clusterConnectCheck({
      cluster: clusterCode,
    })) as KubernetesVersion;
    setConnectedAble(!!data?.connectAble);
  };

  useEffect(() => {
    clusterVersion();
  }, [clusterCode]);

  return (
    <>
      {connectedAble ? (
        <a
          onClick={() => {
            window.location.href = normalizeKubernetesPath(targetPath);
          }}
        >
          <ExportOutlined />
        </a>
      ) : (
        <Tooltip
          color={colorPrimary}
          title={intl.formatMessage({ id: 'cluster.disconnected' })}
        >
          <DisconnectOutlined style={{ color: 'red' }} />
        </Tooltip>
      )}
    </>
  );
};
