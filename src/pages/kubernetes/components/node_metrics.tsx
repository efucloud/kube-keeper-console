import { ReloadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Col, Flex, Row, Slider, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import { useState } from 'react';
import { getColorPrimary } from '@/utils/global';
import MetricsArea from '@/pages/kubernetes/components/metrics_area';
export type RenderNodeMetricsProps = {
  cluster: string;
  node: string;
};
export const RenderNodeMetrics: React.FC<RenderNodeMetricsProps> = (props) => {
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
          <Col span={12}>
            <MetricsArea

              cluster={props.cluster}
              node={props.node}
              view="node"
              title={intl.formatMessage({ id: 'metrics.cluster.CPUUsage%' })}
              unit="%"
              legend="top"
              metricsRequests={[
                {
                  name: 'CPU Requests',
                  code: 'CPU Utilisation',
                  metricKey: 'instance',
                  toFixed: 4,
                  multiplier: 100,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={12}>
            <MetricsArea

              cluster={props.cluster}
              node={props.node}
              view="node"
              title={intl.formatMessage({ id: 'metrics.cluster.CPUUsage%' })}
              unit="%"
              legend="top"
              metricsRequests={[
                {
                  name: 'CPU Saturation (Load1 per CPU)',
                  code: 'CPU Saturation (Load1 per CPU)',
                  metricKey: 'instance',
                  toFixed: 4,
                  multiplier: 100,
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
            <MetricsArea

              cluster={props.cluster}
              node={props.node}
              view="node"
              title={intl.formatMessage({ id: 'metrics.cluster.MemoryUsage%' })}
              unit="%"
              legend="top"
              metricsRequests={[
                {
                  name: 'Memory Limits',
                  code: 'Memory Utilisation',
                  metricKey: 'instance',
                  toFixed: 4,
                  multiplier: 100,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={12}>
            <MetricsArea

              cluster={props.cluster}
              node={props.node}
              view="node"
              title={intl.formatMessage({ id: 'metrics.cluster.CPUUsage%' })}
              unit="%"
              legend="top"
              metricsRequests={[
                {
                  name: 'Memory Saturation (Major Page Faults)',
                  code: 'Memory Saturation (Major Page Faults)',
                  metricKey: 'instance',
                  toFixed: 4,
                  multiplier: 100,
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
            <MetricsArea

              cluster={props.cluster}
              node={props.node}
              view="node"
              title={intl.formatMessage({
                id: 'metrics.cluster.DiskSpaceUsage%',
              })}
              unit="%"
              legend="top"
              metricsRequests={[
                {
                  name: 'Disk Space Utilisation',
                  code: 'Disk Space Utilisation',
                  metricKey: 'instance',
                  toFixed: 4,
                  multiplier: 100,
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
