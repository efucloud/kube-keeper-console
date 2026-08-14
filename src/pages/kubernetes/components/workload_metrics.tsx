import { ReloadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Col, Flex, Row, Slider, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import { useState } from 'react';
import { getColorPrimary } from '@/utils/global';
import MetricsLine from '@/pages/kubernetes/components/metrics_line';
export type RenderWorkloadMetricsProps = {
  cluster: string;
  namespace: string;
  workload: string;
  workloadType: string;
};
export const RenderWorkloadMetrics: React.FC<RenderWorkloadMetricsProps> = (
  props,
) => {
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

          <Tag>{new Date(time.unix() * 1000).toLocaleString()} </Tag>
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
              view="workload"
              workloadType={props.workloadType}
              workload={props.workload}
              title="CPU Usage"
              unit="Core"
              legend="top"
              metricsRequests={[
                {
                  name: 'CPU Usage',
                  code: 'CPU Usage',
                  metricKey: 'workload',
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
            <MetricsLine

              cluster={props.cluster}
              namespace={props.namespace}
              view="workload"
              workloadType={props.workloadType}
              workload={props.workload}
              title="Memory Usage"
              unit="GiB"
              legend="top"
              metricsRequests={[
                {
                  name: 'Memory Usage',
                  code: 'Memory Usage',
                  metricKey: 'pod',
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
      </div>
    </>
  );
};
