import { ReloadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Col, Flex, Row, Slider, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import { useState } from 'react';
import { getColorPrimary } from '@/utils/global';
import MetricsLine from '@/pages/kubernetes/components/metrics_line';
import MetricsTable from '@/pages/kubernetes/components/metrics_table';
export type RenderNamespaceWorkloadMetricsProps = {
  cluster: string;
  namespace: string;
  legend?:
  | 'right'
  | 'top'
  | 'left'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'right-top'
  | 'right-bottom'
  | 'left-top'
  | 'left-bottom'
  | 'bottom-left'
  | 'bottom-right'
  | undefined;
};
export const RenderNamespaceWorkloadMetrics: React.FC<RenderNamespaceWorkloadMetricsProps> = (props) => {
  const [time, setTime] = useState<dayjs.Dayjs>(dayjs());
  const totalMinutes = 7 * 1440; // 7天总分钟数
  const [startValue, setStartValue] = useState<number>(1440);
  const [endValue, setEndValue] = useState<number>(0);
  const intl = useIntl();
  const colorPrimary = getColorPrimary();
  const legend = props.legend || 'right';
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
    <>
      <Flex gap="middle" justify="flex-end" style={{ width: '100%' }}>
        <Slider
          range
          min={0}
          max={totalMinutes}
          defaultValue={[0, 1440]}
          marks={customMarks}
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

          <Tag key='date'>{new Date(time.unix() * 1000).toLocaleString()} </Tag>
          <ReloadOutlined
            style={{ color: getColorPrimary(), fontSize: '1.2em' }}
            onClick={() => setTime(dayjs())}
          />
        </Space>
      </Flex>
      <div>
        <Row>
          <Col span={24}>
            <MetricsLine
              cluster={props.cluster}
              namespace={props.namespace}
              view="namespace"
              title={intl.formatMessage({ id: 'metrics.cluster.CPUUsage' })}
              unit="Core"
              legend={legend}
              metricsRequests={[
                {
                  name: 'CPU Request Total',
                  code: 'Workload CPU Request Total',
                  metricKey: 'requests',
                  toFixed: 6,
                  multiplier: 1,
                },
                {
                  name: 'CPU Limit Total',
                  code: 'Workload CPU Limit Total',
                  metricKey: 'limits',
                  toFixed: 6,
                  multiplier: 1,
                },
                {
                  name: 'CPU Usage Total',
                  code: 'Workload CPU Usage',
                  metricKey: 'workload',
                  secondKey: 'workload_type',
                  toFixed: 6,
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

              cluster={props.cluster}
              namespace={props.namespace}
              view="namespace"
              title={intl.formatMessage({ id: 'metrics.cluster.CPUQuota' })}
              tableFirstIndex={intl.formatMessage({ id: 'cluster.workload' })}
              tableSecondIndex="workload_type"
              tableSecondName={intl.formatMessage({
                id: 'cluster.workload.type',
              })}
              metricsRequests={[
                {
                  name: intl.formatMessage({ id: 'metrics.podNumber' }),
                  code: 'Workload Type',
                  metricKey: 'workload',
                  toFixed: 0,
                  multiplier: 1,
                },
                {
                  name: intl.formatMessage({ id: 'metrics.cluster.CPUUsage' }),
                  code: 'Workload CPU Usage',
                  metricKey: 'workload',
                  toFixed: 4,
                  multiplier: 1,
                  tableUnit: 'Core',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.CPURequests',
                  }),
                  code: 'Workload CPU Request',
                  metricKey: 'workload',
                  toFixed: 4,
                  multiplier: 1,
                  tableUnit: 'Core',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageRequests%',
                  }),
                  code: 'Workload CPU Request%',
                  metricKey: 'workload',
                  toFixed: 2,
                  multiplier: 100,
                  tableUnit: '%',
                },
                {
                  name: intl.formatMessage({ id: 'metrics.cluster.CPULimits' }),
                  code: 'Workload CPU Limit',
                  metricKey: 'workload',
                  toFixed: 4,
                  multiplier: 1,
                  tableUnit: 'Core',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageLimits%',
                  }),
                  code: 'Workload CPU Limit%',
                  metricKey: 'workload',
                  toFixed: 2,
                  multiplier: 100,
                  tableUnit: '%',
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

              cluster={props.cluster}
              namespace={props.namespace}
              view="namespace"
              title={intl.formatMessage({ id: 'metrics.cluster.MemoryUsage' })}
              unit="GiB"
              legend={legend}
              metricsRequests={[
                {
                  name: 'Workload Memory Limit Total',
                  code: 'Workload Memory Limit Total',
                  metricKey: 'limits',
                  toFixed: 4,
                  multiplier: 1 / 1000 / 1000 / 1024,
                },
                {
                  name: 'Workload Memory Request Total',
                  code: 'Workload Memory Request Total',
                  metricKey: 'requests',
                  toFixed: 4,
                  multiplier: 1 / 1000 / 1000 / 1024,
                },
                {
                  name: 'Memory Usage',
                  code: 'Workload Memory Usage',
                  metricKey: 'workload',
                  toFixed: 4,
                  multiplier: 1 / 1000 / 1000 / 1024,
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

              cluster={props.cluster}
              namespace={props.namespace}
              view="namespace"
              title={intl.formatMessage({ id: 'metrics.cluster.MemoryUsage' })}
              tableFirstIndex={intl.formatMessage({ id: 'cluster.workload' })}
              tableSecondIndex="workload_type"
              unit="GiB"
              tableSecondName={intl.formatMessage({
                id: 'cluster.workload.type',
              })}
              metricsRequests={[
                {
                  name: intl.formatMessage({ id: 'metrics.podNumber' }),
                  code: 'Workload Type',
                  metricKey: 'workload',
                  toFixed: 0,
                  multiplier: 1,
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.MemoryUsage',
                  }),
                  code: 'Workload Memory Usage',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.MemoryRequests',
                  }),
                  code: 'Workload Memory Request',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageRequests%',
                  }),
                  code: 'Workload Memory Request%',
                  metricKey: 'workload',
                  toFixed: 2,
                  multiplier: 100,
                  tableUnit: '%',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.MemoryLimits',
                  }),
                  code: 'Workload Memory Limit',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageLimits%',
                  }),
                  code: 'Workload Memory Limit%',
                  metricKey: 'workload',
                  toFixed: 2,
                  multiplier: 100,
                  tableUnit: '%',
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
            <MetricsTable

              cluster={props.cluster}
              namespace={props.namespace}
              view="namespace"
              title={intl.formatMessage({
                id: 'metrics.cluster.CurrentNetworkUsage',
              })}
              tableFirstIndex={intl.formatMessage({ id: 'cluster.workload' })}
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.ReceiveBandwidth',
                  }),
                  code: 'Workload Current Receive Bandwidth',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.TransmitBandwidth',
                  }),
                  code: 'Workload Current Receive Transmitted',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofReceivedPackets',
                  }),
                  code: 'Workload Rate of Received Packets',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'p/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofTransmittedPackets',
                  }),
                  code: 'Workload Rate of Transmitted Packets',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofReceivedPacketsDropped',
                  }),
                  code: 'Workload Rate of Received Packets Dropped',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'p/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofTransmittedPacketsDropped',
                  }),
                  code: 'Workload Rate of Transmitted Packets Dropped',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
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
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              view="namespace"
              title={intl.formatMessage({
                id: 'metrics.cluster.ReceiveBandwidth',
              })}
              unit="kB/s"
              legend={legend}
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.ReceiveBandwidth',
                  }),
                  code: 'Workload Current Receive Bandwidth',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              view="namespace"
              title={intl.formatMessage({
                id: 'metrics.cluster.TransmitBandwidth',
              })}
              unit="kB/s"
              legend={legend}
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.TransmitBandwidth',
                  }),
                  code: 'Workload Current Receive Transmitted',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              view="namespace"
              title={intl.formatMessage({
                id: 'metrics.cluster.RateofReceivedPackets',
              })}
              unit="p/s"
              legend={legend}
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofReceivedPackets',
                  }),
                  code: 'Workload Rate of Received Packets',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'p/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              view="namespace"
              title={intl.formatMessage({
                id: 'metrics.cluster.RateofTransmittedPackets',
              })}
              unit="p/s"
              legend={legend}
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofTransmittedPackets',
                  }),
                  code: 'Workload Rate of Transmitted Packets',
                  metricKey: 'workload',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'p/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
      </div>
    </>
  );
};
