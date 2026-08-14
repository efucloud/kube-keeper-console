import { MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Line } from '@antv/g2plot';
import { Dropdown, Space, Tooltip } from 'antd';
import { format } from 'date-fns';
import { Decimal } from 'decimal.js';
import React, { useEffect, useRef, useState } from 'react';
import { clusterMetricsQueryRange } from '@/services/cluster.api';
import { getColorPrimary } from '@/utils/global';
import { type MatrixData, type MetricData, type MetricsParamsProps } from '@/pages/kubernetes/components/metrics_def';

const MetricsLine: React.FC<MetricsParamsProps> = (props) => {
  const containerRef = useRef(null);
  const colorPrimary = getColorPrimary();
  const [metricsData, setMetricsData] = useState<MetricData[]>([]);
  const [render, setRender] = useState(0);
  const fetchData = async () => {
    const paramsList = [] as Record<string, any>;
    // 多个指标请求参数组装
    for (let i = 0; i < props.metricsRequests.length; i++) {
      const metricsRequest = props.metricsRequests[i];
      const params = {
        view: props.view,
        code: metricsRequest.code,
        start: props.start,
        end: props.end,
      } as Record<string, any>;
      if (props?.namespace) {
        params['namespace'] = props.namespace;
      }
      if (props?.pod) {
        params['pod'] = props.pod;
      }
      if (props?.node) {
        params['node'] = props.node;
      }
      if (props?.workload) {
        params['workload'] = props.workload;
      }
      if (props?.workloadType) {
        params['workloadType'] = props.workloadType;
      }
      params['category'] = metricsRequest.metricKey;
      if (metricsRequest.secondKey) {
        params['secondKey'] = metricsRequest.secondKey;
      } else {
        params['secondKey'] = undefined;
      }
      paramsList.push(params);
    }
    // 多个指标请求
    let oldData = metricsData;
    const list = [] as MetricData[];
    for (let i = 0; i < paramsList.length; i++) {
      const params = paramsList[i];
      const metricsRequest = props.metricsRequests.find(
        (item) => item.code === params.code,
      );
      const data = (await clusterMetricsQueryRange(
        { cluster: props.cluster },
        params,
      )) as MatrixData[];
      //处理结果

      if (data && data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          for (let j = 0; j < item.values.length; j++) {
            const value = item.values[j];
            const timeStamp = Number(value[0] * 1000);
            const date = new Date(timeStamp); // 将秒转为毫秒
            let yValue = value[1];
            if (metricsRequest) {
              yValue = new Decimal(value[1])
                .mul(metricsRequest.multiplier || 1)
                .toFixed(metricsRequest.toFixed);
            }
            // 使用 date-fns 格式化时间为 HH:mm:ss
            list.push({
              code: params.code,
              time: format(date, 'MM/dd HH:mm'),
              value: Number(yValue),
              secondKey: params?.secondKey || undefined,
              category: params?.secondKey
                ? `${item.metric[params.category]} - ${item.metric[params.secondKey] || ''}`
                : item.metric[params.category] || params.category,
            });
          }
        }
      }
      //剔除原来的数据,
      oldData = oldData.filter(
        (item) =>
          item.code !== params.code &&
          item.category != params.category &&
          item.secondKey != params.secondKey,
      );
    }
    setMetricsData(list.concat(oldData));

    setRender(render + 1);
  };
  useEffect(() => {
    if (!containerRef.current || props?.metricsRequests?.length === 0) return;
    // 获取指标
    fetchData();
  }, [props.start, props.end, props.step]);
  useEffect(() => {
    if (!containerRef.current || props?.metricsRequests?.length === 0) return;
    const linePlot = new Line(containerRef.current, {
      title: {
        text: props.title,
      },
      data: metricsData || [],
      height: props.height,
      xField: 'time',
      yField: 'value',
      colorField: 'category',
      seriesField: 'category',
      legend: {
        position: props.legend || 'right',
      },
      yAxis: {
        label: {
          formatter: (val) => `${val} ${props.unit || ''}`, // 在这里添加单位
        },
      },
    });
    linePlot.render();
    return () => {
      linePlot.destroy();
    };
  }, [render]);
  const items = [];
  return (
    <>
      <div
        style={{
          overflow: 'hidden',
          border: '1px solid #e8e8e8',
          padding: '10px',
        }}
      >
        <div>
          <div style={{ float: 'left' }}>
            {props.title}&nbsp;
            {props.tooltip && (
              <Tooltip color={getColorPrimary()} title={props.tooltip}>
                <QuestionCircleOutlined />
              </Tooltip>
            )}
          </div>
          {props?.dropdown && <div style={{ float: 'right' }}>
            <Dropdown menu={{ items: items }} key="more">
              <a
                style={{ color: colorPrimary }}
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                <Space>
                  <MoreOutlined style={{ color: colorPrimary }} />
                </Space>
              </a>
            </Dropdown>
          </div>}
        </div>
        <br />
        <div
          style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
        >
          <div
            ref={containerRef}
            style={{ width: '100%', height: props.height }}
          />
        </div>
      </div>
    </>
  );
};

export default MetricsLine;
