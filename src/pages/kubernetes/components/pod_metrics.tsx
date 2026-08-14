import { ReloadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Col, Flex, Row, Slider, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import { useState } from 'react';
import { getColorPrimary } from '@/utils/global';
import MetricsLine from '@/pages/kubernetes/components/metrics_line';
import MetricsTable from '@/pages/kubernetes/components/metrics_table';
export type RenderPodMetricsProps = {
  cluster: string;
  namespace: string;
  pod: string;
  startTime?: number;
  endTime?: number;
};
export const RenderPodMetrics: React.FC<RenderPodMetricsProps> = (props) => {
  const [time, setTime] = useState<dayjs.Dayjs>(dayjs());
  const totalSeconds = 7 * 1440 * 60; // 7天总秒数
  const [startValue, setStartValue] = useState<number>(props.startTime || 1440 * 60);
  const [endValue, setEndValue] = useState<number>(props.endTime || 0);
  const intl = useIntl();
  const colorPrimary = getColorPrimary();
  const customMarks = {
    [1440*60]: '-24h',
    [2880*60]: '-2day',
    [4320*60]: '-3day',
    [5760*60]: '-4day',
    [7200*60]: '-5day',
    [8640*60]: '-6day',
    [10080*60]: '-7day',
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
    setTime(dayjs().add(-1 * endValue, 'second'));
  }, 1500);
  return (
    <>
      {!props.startTime && <Flex gap="middle" justify="flex-end" style={{ width: '100%' }}>
        <Slider
          range
          min={0}
          max={totalSeconds}
          marks={customMarks}
          defaultValue={[0, 1440*60]}
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
                  {time.add(-1 * value, 'second').format('YYYY/M/D HH:mm:ss')}
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
      </Flex>}
      <div>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({ id: 'metrics.cluster.CPUUsage' })}
              unit="Core"
              legend="top"
              metricsRequests={[
                {
                  name: 'CPU Requests',
                  code: 'CPU Requests',
                  metricKey: 'requests',
                  toFixed: 6,
                  multiplier: 1,
                },
                {
                  name: 'CPU Limits',
                  code: 'CPU Limits',
                  metricKey: 'limits',
                  toFixed: 6,
                  multiplier: 1,
                },
                {
                  name: 'CPU Usage',
                  code: 'Container CPU Usage',
                  metricKey: 'container',
                  toFixed: 6,
                  multiplier: 1,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({
                id: 'metrics.cluster.CPUThrottling',
              })}
              unit="%"
              legend="top"
              metricsRequests={[
                {
                  name: 'CPU Throttling',
                  code: 'CPU Throttling',
                  metricKey: 'container',
                  toFixed: 2,
                  multiplier: 100,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsTable

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({ id: 'metrics.cluster.CPUQuota' })}
              tableFirstIndex={intl.formatMessage({
                id: 'metrics.cluster.container',
              })}
              metricsRequests={[
                {
                  name: intl.formatMessage({ id: 'metrics.cluster.CPUUsage' }),
                  code: 'Container CPU Usage',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'Core',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.CPURequests',
                  }),
                  code: 'Container CPU Requests',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'Core',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageRequests%',
                  }),
                  code: 'Container CPU Requests%',
                  metricKey: 'container',
                  toFixed: 2,
                  multiplier: 100,
                  tableUnit: '%',
                },
                {
                  name: intl.formatMessage({ id: 'metrics.cluster.CPULimits' }),
                  code: 'Container CPU Limits',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'Core',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageLimits%',
                  }),
                  code: 'Container CPU Limits%',
                  metricKey: 'container',
                  toFixed: 2,
                  multiplier: 100,
                  tableUnit: '%',
                },
              ]}
              fontSize={20}
              height={120}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({ id: 'metrics.cluster.MemoryUsage' })}
              unit="GiB"
              legend="top"
              metricsRequests={[
                {
                  name: 'Memory Requests',
                  code: 'Memory Requests',
                  metricKey: 'requests',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name: 'Memory Limits',
                  code: 'Memory Limits',
                  metricKey: 'limits',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name: 'Memory Usage (WSS)',
                  code: 'Memory Usage (WSS)',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsTable

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({ id: 'metrics.cluster.Memory' })}
              tableFirstIndex={intl.formatMessage({
                id: 'metrics.cluster.container',
              })}
              metricsRequests={[
                {
                  name:
                    intl.formatMessage({ id: 'metrics.cluster.MemoryUsage' }) +
                    '(WSS)',
                  code: 'Memory Usage (WSS)',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.MemoryRequests',
                  }),
                  code: 'Container Memory Requests',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageRequests%',
                  }),
                  code: 'Container Memory Requests%',
                  metricKey: 'container',
                  toFixed: 2,
                  multiplier: 100,
                  tableUnit: '%',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.MemoryLimits',
                  }),
                  code: 'Container Memory Limits',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.UsageLimits%',
                  }),
                  code: 'Container Memory Limits%',
                  metricKey: 'container',
                  toFixed: 2,
                  multiplier: 100,
                  tableUnit: '%',
                },
                {
                  name:
                    intl.formatMessage({ id: 'metrics.cluster.MemoryUsage' }) +
                    '(RSS)',
                  code: 'Memory Usage (RSS)',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name:
                    intl.formatMessage({ id: 'metrics.cluster.MemoryUsage' }) +
                    '(Cache)',
                  code: 'Memory Usage (Cache)',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
                {
                  name:
                    intl.formatMessage({ id: 'metrics.cluster.MemoryUsage' }) +
                    '(Swap)',
                  code: 'Memory Usage (Swap)',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1 / 1000 / 1000 / 1000,
                  tableUnit: 'GiB',
                },
              ]}
              fontSize={20}
              height={120}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({
                id: 'metrics.cluster.ReceiveBandwidth',
              })}
              unit="kB/s"
              legend="top"
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.ReceiveBandwidth',
                  }),
                  code: 'Receive Bandwidth',
                  metricKey: 'pod',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({
                id: 'metrics.cluster.TransmitBandwidth',
              })}
              unit="kB/s"
              legend="top"
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.TransmitBandwidth',
                  }),
                  code: 'Transmit Bandwidth',
                  metricKey: 'pod',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({
                id: 'metrics.cluster.RateofReceivedPackets',
              })}
              unit="p/s"
              legend="top"
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofReceivedPackets',
                  }),
                  code: 'Rate of Received Packets',
                  metricKey: 'pod',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'p/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({
                id: 'metrics.cluster.RateofTransmittedPackets',
              })}
              unit="kB/s"
              legend="top"
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofTransmittedPackets',
                  }),
                  code: 'Rate of Transmitted Packets',
                  metricKey: 'pod',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({
                id: 'metrics.cluster.RateofReceivedPacketsDropped',
              })}
              unit="p/s"
              legend="top"
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofReceivedPacketsDropped',
                  }),
                  code: 'Rate of Received Packets Dropped',
                  metricKey: 'pod',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'p/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({
                id: 'metrics.cluster.RateofTransmittedPacketsDropped',
              })}
              unit="kB/s"
              legend="top"
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.RateofTransmittedPacketsDropped',
                  }),
                  code: 'Rate of Transmitted Packets Dropped',
                  metricKey: 'pod',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({ id: 'IOPS (Pod)' })}
              unit="io/s"
              legend="top"
              metricsRequests={[
                {
                  name: 'Reads',
                  code: 'IOPS Reads (Pod)',
                  metricKey: 'Reads',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: 'Writes',
                  code: 'IOPS Writes (Pod)',
                  metricKey: 'Writes',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
          <Col span={12}>
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({ id: 'ThroughPut (Pod)' })}
              unit="kB/s"
              legend="top"
              metricsRequests={[
                {
                  name: 'Reads',
                  code: 'ThroughPut Reads (Pod)',
                  metricKey: 'Reads',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: 'Writes',
                  code: 'ThroughPut Writes (Pod)',
                  metricKey: 'Writes',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <MetricsTable

              cluster={props.cluster}
              namespace={props.namespace}
              pod={props.pod}
              view="pod"
              title={intl.formatMessage({
                id: 'metrics.cluster.CurrentStorageIO',
              })}
              tableFirstIndex={intl.formatMessage({
                id: 'metrics.cluster.container',
              })}
              metricsRequests={[
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.IOPS(Reads)',
                  }),
                  code: 'IOPS Reads Container',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'io/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.IOPS(Writes)',
                  }),
                  code: 'IOPS Writes Container',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'io/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.IOPS(Reads+Writes)',
                  }),
                  code: 'IOPS(Reads + Writes) Container',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1,
                  tableUnit: 'io/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.ThroughPut(Read)',
                  }),
                  code: 'Throughput(Read) Container',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.ThroughPut(Write)',
                  }),
                  code: 'Throughput(Write) Container',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
                {
                  name: intl.formatMessage({
                    id: 'metrics.cluster.ThroughPut(Read+Write)',
                  }),
                  code: 'Throughput(Read+Write) Container',
                  metricKey: 'container',
                  toFixed: 3,
                  multiplier: 1 / 1000,
                  tableUnit: 'kB/s',
                },
              ]}
              fontSize={20}
              height={120}
              start={time.add(-1 * startValue, 'second').unix()}
              end={time.add(-1 * endValue, 'second').unix()}
            />
          </Col>
        </Row>
      </div>
    </>
  );
};
