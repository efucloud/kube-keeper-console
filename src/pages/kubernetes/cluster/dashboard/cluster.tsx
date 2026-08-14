import { ReloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Card, Col, Flex, Row, Slider, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import { useState } from 'react';
import { getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import MetricsLine from '@/pages/kubernetes/components/metrics_line';
import MetricsLiquid from '@/pages/kubernetes/components/metrics_liquid';
import MetricsTable from '@/pages/kubernetes/components/metrics_table';
import MetricsStatistic from '@/pages/kubernetes/components/metrics_statistic';

const ClusterDashboard: React.FC = () => {
  const { cluster } = getCurrentViewInfo();
  const [time, setTime] = useState<dayjs.Dayjs>(dayjs());
  const totalMinutes = 7 * 1440; // 7天总分钟数
  const [startValue, setStartValue] = useState<number>(1440);
  const [endValue, setEndValue] = useState<number>(0);
  const intl = useIntl();
  const colorPrimary = getColorPrimary();
  const customMarks = {
    1440: '-24h',
    2880: '-2day',
    4320: '-3day',
    5760: '-4day',
    7220: '-5day',
    8640: '-6day',
    10080: '-7day',
  };
  const debouncedValueChange = debounce((values: number[]) => {
    if (values.length == 2) {
      if (values[0] > values[1]) {
        setStartValue(values[0]);
        setEndValue(values[1]);
      } else {
        setStartValue(values[1]);
        setEndValue(values[0]);
      }
    } else {
      setStartValue(1440);
      setEndValue(0);
    }
    setTime(dayjs().add(-1 * endValue, 'minute'));
  }, 1500);
  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'menu.dashboard.cluster' })}
    >
      <Flex gap="middle" justify="flex-end" style={{ width: '100%' }}>
        <Slider
          range
          min={0}
          max={totalMinutes}
          marks={customMarks}
          defaultValue={[0, 1440]}
          onChange={(values: number[]) => {
            debouncedValueChange(values);
          }}
          reverse={true}
          style={{ width: '100%' }}
          tooltip={{
            color: colorPrimary,
            placement: 'topLeft',
            formatter: (value: number) => {
              return (
                <>
                  {time.add(-1 * value, 'minute').format('YYYY/M/D HH:mm:ss')}
                </>
              );
            },
          }}
        />
        <Space>

          <Tag key='time'>{new Date(time.unix() * 1000).toLocaleString()} </Tag>
          <ReloadOutlined
            style={{ color: getColorPrimary(), fontSize: '1.2em' }}
            onClick={() => setTime(dayjs())}
          />
        </Space>
      </Flex>
      <Card styles={{ body: { padding: 0 } }}>
        <Row>
          <Col span={3}>
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
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={3}>
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
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={3}>
            <MetricsLiquid

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({ id: 'metrics.cluster.CPURequests' })}
              metricsRequests={[
                {
                  name: 'CPU Requests Commitment',
                  code: 'CPU Requests Commitment',
                  metricKey: '',
                  toFixed: 3,
                  multiplier: 100,
                },
              ]}
              fontSize={20}
              height={120}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={3}>
            <MetricsLiquid

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({ id: 'metrics.cluster.CPULimits' })}
              metricsRequests={[
                {
                  name: 'CPU Limits Commitment',
                  code: 'CPU Limits Commitment',
                  metricKey: '',
                  toFixed: 3,
                  multiplier: 100,
                },
              ]}
              fontSize={20}
              height={120}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={3}>
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
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={3}>
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
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={3}>
            <MetricsLiquid

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.MemoryRequests',
              })}
              metricsRequests={[
                {
                  name: 'Memory Requests Commitment',
                  code: 'Memory Requests Commitment',
                  metricKey: '',
                  toFixed: 3,
                  multiplier: 100,
                },
              ]}
              fontSize={20}
              height={120}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={3}>
            <MetricsLiquid

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({ id: 'metrics.cluster.MemoryLimits' })}
              metricsRequests={[
                {
                  name: 'Memory Limits Commitment',
                  code: 'Memory Limits Commitment',
                  metricKey: '',
                  toFixed: 3,
                  multiplier: 100,
                },
              ]}
              fontSize={20}
              height={120}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>

        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({ id: 'metrics.cluster.CPUUsage' })}
              legend="right"
              metricsRequests={[
                {
                  name: 'CPU Usage',
                  code: 'CPU Usage',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsTable
              key='metrics.cluster.CPUQuota'

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({ id: 'metrics.cluster.CPUQuota' })}
              tableFirstIndex={intl.formatMessage({ id: 'cluster.namespace' })}
              metricsRequests={[
                {
                  name: intl.formatMessage({ id: 'metrics.podNumber' }),
                  code: 'PodsByNamespace',
                  metricKey: 'namespace',
                  toFixed: 0,
                  multiplier: 1,
                },
                {
                  name: intl.formatMessage({ id: 'metrics.workloadNumber' }),
                  code: 'WorkloadsByNamespace',
                  metricKey: 'namespace',
                  toFixed: 0,
                  multiplier: 1,
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.apiserver.CPUusage',
                  }),
                  code: 'CPUUsageByNamespace',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'Core',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.CPURequests',
                  }),
                  code: 'CPURequestsByNamespace',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'Core',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageRequests%',
                  }),
                  code: 'CPURequestsByNamespace%',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1,
                  tableUnit: '%',
                },
                {
                  name: intl.formatMessage({ id: 'metrics.cluster.CPULimits' }),
                  code: 'CPULimitsByNamespace',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'Core',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageLimits%',
                  }),
                  code: 'CPUByNamespaceLimits%',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 100,
                  tableUnit: '%',
                },
              ]}
              fontSize={20}
              height={120}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({ id: 'metrics.cluster.Memory' })}
              legend="right"
              unit="GiB"
              metricsRequests={[
                {
                  name: 'Memory',
                  code: 'Memory',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1 / 1000 / 1000 / 1000,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsTable
              key='metrics.cluster.Memory'

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({ id: 'metrics.cluster.Memory' })}
              tableFirstIndex={intl.formatMessage({ id: 'cluster.namespace' })}
              metricsRequests={[
                {
                  name: intl.formatMessage({ id: 'metrics.podNumber' }),
                  code: 'PodsByNamespace',
                  metricKey: 'namespace',
                  toFixed: 0,
                  multiplier: 1,
                },
                {
                  name: intl.formatMessage({ id: 'metrics.workloadNumber' }),
                  code: 'WorkloadsByNamespace',
                  metricKey: 'namespace',
                  toFixed: 0,
                  multiplier: 1,
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.MemoryUsage',
                  }),
                  code: 'MemoryUsageByNamespace',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.MemoryRequests',
                  }),
                  code: 'MemoryRequestsByNamespace',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageRequests%',
                  }),
                  code: 'MemoryRequestsByNamespace%',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 100,
                  tableUnit: '%',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.MemoryLimits',
                  }),
                  code: 'MemoryLimitsByNamespace',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageLimits%',
                  }),
                  code: 'MemoryByNamespaceLimits%',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 100,
                  tableUnit: '%',
                },
              ]}
              fontSize={20}
              height={120}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsTable
              key='metrics.cluster.CurrentNetworkUsage'

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.CurrentNetworkUsage',
              })}
              tableFirstIndex={intl.formatMessage({ id: 'cluster.namespace' })}
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.TransmitBandwidth',
                  }),
                  code: 'Transmit Bandwidth',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.ReceiveBandwidth',
                  }),
                  code: 'Receive Bandwidth',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofReceivedPackets',
                  }),
                  code: 'Rate of Received Packets',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'p/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofTransmittedPackets',
                  }),
                  code: 'Rate of Transmitted Packets',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofReceivedPacketsDropped',
                  }),
                  code: 'Rate of Received Packets Dropped',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'p/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofTransmittedPacketsDropped',
                  }),
                  code: 'Rate of Transmitted Packets Dropped',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
              ]}
              fontSize={20}
              height={120}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.ReceiveBandwidth',
              })}
              legend="right"
              unit="kB/s"
              metricsRequests={[
                {
                  name: 'Receive Bandwidth',
                  code: 'Receive Bandwidth',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1 / 1000,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.TransmitBandwidth',
              })}
              legend="right"
              unit="kB/s"
              metricsRequests={[
                {
                  name: 'Transmit Bandwidth',
                  code: 'Transmit Bandwidth',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1 / 1000,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.AverageContainerBandwidthbyNamespaceReceived',
              })}
              legend="right"
              unit="kB/s"
              metricsRequests={[
                {
                  name: 'Average Container Bandwidth by Namespace: Received',
                  code: 'Average Container Bandwidth by Namespace: Received',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1 / 1000,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.AverageContainerBandwidthbyNamespaceTransmitted',
              })}
              legend="right"
              unit="kB/s"
              metricsRequests={[
                {
                  name: 'Average Container Bandwidth by Namespace: Transmitted',
                  code: 'Average Container Bandwidth by Namespace: Transmitted',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1 / 1000,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.RateofReceivedPackets',
              })}
              legend="right"
              unit="p/s"
              metricsRequests={[
                {
                  name: 'Rate of Received Packets',
                  code: 'Rate of Received Packets',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.RateofTransmittedPackets',
              })}
              legend="right"
              unit="kB/s"
              metricsRequests={[
                {
                  name: 'Rate of Transmitted Packets',
                  code: 'Rate of Transmitted Packets',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1 / 1000,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.RateofReceivedPacketsDropped',
              })}
              legend="right"
              unit="p/s"
              metricsRequests={[
                {
                  name: 'Rate of Received Packets Dropped',
                  code: 'Rate of Received Packets Dropped',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.RateofTransmittedPacketsDropped',
              })}
              legend="right"
              unit="kB/s"
              metricsRequests={[
                {
                  name: 'Rate of Transmitted Packets Dropped',
                  code: 'Rate of Transmitted Packets Dropped',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1 / 1000,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.IOPS(Reads+Writes)',
              })}
              legend="right"
              unit="kB/s"
              metricsRequests={[
                {
                  name: 'IOPS(Reads+Writes)',
                  code: 'IOPS(Reads+Writes)',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1 / 1000,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.ThroughPut(Read+Write)',
              })}
              legend="right"
              unit="kB/s"
              metricsRequests={[
                {
                  name: 'ThroughPut(Read+Write)',
                  code: 'ThroughPut(Read+Write)',
                  metricKey: 'namespace',
                  toFixed: 2,
                  multiplier: 1 / 1000,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsTable
              key='metrics.cluster.CurrentStorageIO'

              cluster={cluster}
              view="cluster"
              title={intl.formatMessage({
                id: 'metrics.cluster.CurrentStorageIO',
              })}
              tableFirstIndex={intl.formatMessage({ id: 'cluster.namespace' })}
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.IOPS(Reads)',
                  }),
                  code: 'IOPS(Reads)',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'io/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.IOPS(Writes)',
                  }),
                  code: 'IOPS(Writes)',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'io/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.IOPS(Reads+Writes)',
                  }),
                  code: 'IOPS(Reads+Writes)',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'io/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.ThroughPut(Read)',
                  }),
                  code: 'ThroughPut(Read)',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.ThroughPut(Write)',
                  }),
                  code: 'ThroughPut(Write)',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.ThroughPut(Read+Write)',
                  }),
                  code: 'ThroughPut(Read+Write)',
                  metricKey: 'namespace',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
              ]}
              fontSize={20}
              height={120}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
      </Card>
    </PageContainer>
  );
};
export default ClusterDashboard;
