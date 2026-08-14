import { ReloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Card, Col, Flex, Row, Select, Slider, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import debounce from 'lodash/debounce';
import { useState } from 'react';
import { getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import MetricsArea from '@/pages/kubernetes/components/metrics_area';
import MetricsLine from '@/pages/kubernetes/components/metrics_line';
import MetricsLiquid from '@/pages/kubernetes/components/metrics_liquid';

const ApiServer: React.FC = () => {
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
      title={intl.formatMessage({ id: 'menu.dashboard.ApiServer' })}
    >
      <Flex gap="middle" justify="flex-end" style={{ width: '100%' }}>
        <Slider
          range
          marks={customMarks}
          min={0}
          max={totalMinutes}
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
          <Col span={8}>
            <MetricsLiquid

              cluster={cluster}
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.availability',
              })}
              tooltip={intl.formatMessage({
                id: 'metrics.apiserver.availability.tooltip',
              })}
              metricsRequests={[
                {
                  name: 'Availability',
                  code: 'Availability',
                  metricKey: '',
                  toFixed: 3,
                  multiplier: 100,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={8}>
            <MetricsLiquid

              cluster={cluster}
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.availability.read',
              })}
              tooltip={intl.formatMessage({
                id: 'metrics.apiserver.availability.read.tooltip',
              })}
              metricsRequests={[
                {
                  name: 'ReadAvailability',
                  code: 'ReadAvailability',
                  metricKey: '',
                  toFixed: 3,
                  multiplier: 100,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={8}>
            <MetricsLiquid

              cluster={cluster}
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.availability.write',
              })}
              tooltip={intl.formatMessage({
                id: 'metrics.apiserver.availability.write.tooltip',
              })}
              metricsRequests={[
                {
                  name: 'WriteAvailability',
                  code: 'WriteAvailability',
                  metricKey: '',
                  toFixed: 3,
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
          <Col span={24}>
            <MetricsArea

              cluster={cluster}
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.ErrorBudget',
              })}
              tooltip={intl.formatMessage({
                id: 'metrics.apiserver.ErrorBudget.tooltip',
              })}
              legend="top"
              unit="%"
              metricsRequests={[
                {
                  name: 'ErrorBudget',
                  code: 'ErrorBudget',
                  metricKey: '',
                  toFixed: 0,
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
            <MetricsLine

              cluster={cluster}
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.ReadSLIRequests',
              })}
              tooltip={intl.formatMessage({
                id: 'metrics.apiserver.ReadSLIRequests.tooltip',
              })}
              legend="right"
              unit="req/s"
              metricsRequests={[
                {
                  name: 'Read SLI - Requests',
                  code: 'Read SLI - Requests',
                  metricKey: 'code',
                  toFixed: 2,
                  multiplier: 1,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={12}>
            <MetricsLine

              cluster={cluster}
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.ReadSLIErrors',
              })}
              tooltip={intl.formatMessage({
                id: 'metrics.apiserver.ReadSLIErrors.tooltip',
              })}
              legend="right"
              unit="req/s"
              metricsRequests={[
                {
                  name: 'Read SLI - Errors',
                  code: 'Read SLI - Errors',
                  metricKey: 'code',
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
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.ReadSLIDuration',
              })}
              tooltip={intl.formatMessage({
                id: 'metrics.apiserver.ReadSLIDuration.tooltip',
              })}
              unit="ms"
              legend="right"
              metricsRequests={[
                {
                  name: 'Read SLI - Duration',
                  code: 'Read SLI - Duration',
                  metricKey: 'resource',
                  toFixed: 2,
                  multiplier: 1000,
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

              cluster={cluster}
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.WriteSLIRequests',
              })}
              tooltip={intl.formatMessage({
                id: 'metrics.apiserver.WriteSLIRequests.tooltip',
              })}
              legend="right"
              unit="req/s"
              metricsRequests={[
                {
                  name: 'Write SLI - Requests',
                  code: 'Write SLI - Requests',
                  metricKey: 'code',
                  toFixed: 2,
                  multiplier: 1,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={12}>
            <MetricsLine

              cluster={cluster}
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.WriteSLIErrors',
              })}
              tooltip={intl.formatMessage({
                id: 'metrics.apiserver.WriteSLIErrors.tooltip',
              })}
              legend="top"
              unit="req/s"
              metricsRequests={[
                {
                  name: 'Write SLI - Errors',
                  code: 'Write SLI - Errors',
                  metricKey: 'code',
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
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.WriteSLIDuration',
              })}
              tooltip={intl.formatMessage({
                id: 'metrics.apiserver.WriteSLIDuration.tooltip',
              })}
              unit="ms"
              legend="right"
              metricsRequests={[
                {
                  name: 'Write SLI - Duration',
                  code: 'Write SLI - Duration',
                  metricKey: 'resource',
                  toFixed: 2,
                  multiplier: 1000,
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
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.WorkQueueAddRate',
              })}
              unit="ops/s"
              legend="right"
              metricsRequests={[
                {
                  name: 'Work Queue Add Rate',
                  code: 'Work Queue Add Rate',
                  metricKey: 'name',
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
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.WorkQueueDepth',
              })}
              legend="right"
              metricsRequests={[
                {
                  name: 'Work Queue Depth',
                  code: 'Work Queue Depth',
                  metricKey: 'name',
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
              view="apiserver"
              title={intl.formatMessage({
                id: 'metrics.apiserver.WorkQueueLatency',
              })}
              unit="ms"
              legend="right"
              metricsRequests={[
                {
                  name: 'Work Queue Latency',
                  code: 'Work Queue Latency',
                  metricKey: 'name',
                  toFixed: 4,
                  multiplier: 1000,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <MetricsLine

              cluster={cluster}
              view="apiserver"
              title={intl.formatMessage({ id: 'metrics.cluster.Memory' })}
              unit="GiB"
              legend="top"
              metricsRequests={[
                {
                  name: 'Memory',
                  code: 'Memory',
                  metricKey: 'instance',
                  toFixed: 2,
                  multiplier: 1 / 1000 / 1000 / 1000,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={8}>
            <MetricsLine

              cluster={cluster}
              view="apiserver"
              title={intl.formatMessage({ id: 'metrics.apiserver.CPUusage' })}
              legend="top"
              metricsRequests={[
                {
                  name: 'CPU usage',
                  code: 'CPU usage',
                  metricKey: 'instance',
                  toFixed: 2,
                  multiplier: 1,
                },
              ]}
              height={160}
              start={time.add(-1 * startValue, 'minute').unix()}
              end={time.add(-1 * endValue, 'minute').unix()}
            />
          </Col>
          <Col span={8}>
            <MetricsLine

              cluster={cluster}
              view="apiserver"
              title={intl.formatMessage({ id: 'metrics.apiserver.Goroutines' })}
              unit="K"
              legend="top"
              metricsRequests={[
                {
                  name: 'Goroutines',
                  code: 'Goroutines',
                  metricKey: 'instance',
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
      </Card>
    </PageContainer>
  );
};
export default ApiServer;
