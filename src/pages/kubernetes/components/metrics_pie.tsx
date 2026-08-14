import { MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Pie, PieOptions } from '@antv/g2plot';
import { Dropdown, Space, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { clusterMetricsQuery } from '@/services/cluster.api';
import { getColorPrimary } from '@/utils/global';
import { type MetricData, type MetricsParamsProps } from '@/pages/kubernetes/components/metrics_def';
import { VectorData } from '@/services/prometheus';
import Decimal from 'decimal.js';

const MetricsPie: React.FC<MetricsParamsProps> = (props) => {
  const containerRef = useRef(null);
  const colorPrimary = getColorPrimary();
  const time = Math.floor(props.end || Date.now() / 1000);
  const [metricsData, setMetricsData] = useState<MetricData[]>([]);
  const [render, setRender] = useState(0);
  const metricsRequest = props.metricsRequests[0];
  const fetchData = async () => {
    const data = (await clusterMetricsQuery(
      { cluster: props.cluster },
      { view: props.view, code: metricsRequest.code, time: time },
    )) as VectorData[];
    const results = [] as any;
    if (data && data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const type = item.metric ? item.metric[metricsRequest.metricKey] : '';
        const value = item.value ? item.value[1] : 0
        results.push({
          type, value: Number(
            new Decimal(value)
              .mul(metricsRequest?.multiplier || 1)
              .toFixed(metricsRequest?.toFixed || 2),
          )
        })
      }
    }
    setMetricsData(results);
    setRender(render + 1);
  };
  useEffect(() => {
    if (!containerRef.current || props?.metricsRequests?.length === 0) return;
    // 获取指标
    fetchData();
  }, [props.end]);

  useEffect(() => {
    if (!containerRef.current || props?.metricsRequests?.length === 0) return;
    let options = {
      autoFit: true,
      data: metricsData,
      angleField: 'value',
      colorField: 'type',
      legend: false,
      radius: 0.6,
      label: {
        type: 'spider',
        style: {
          fontSize: 12,
          textAlign: 'center',
        },
      },
      interactions: [{ type: 'element-active' }],
    } as PieOptions;
    let colors = {} as Record<string, string>;
    if (metricsRequest.secondKey) {
      colors = JSON.parse(metricsRequest.secondKey)
      if (Object.keys(colors).length > 0) {
        options.color = (datum) => {
          return colors[datum.type] || '#4709d7ff';
        }
      }
    }
    const piePlot = new Pie(containerRef.current, options);
    piePlot.render();
    return () => {
      piePlot.destroy();
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
            {props.title}{props.unit ? `(${props.unit})` : ''}&nbsp;
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

export default MetricsPie;
