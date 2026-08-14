import { MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Column } from '@antv/g2plot';
import { Dropdown, Space, Tooltip } from 'antd';
import Decimal from 'decimal.js';
import React, { useEffect, useRef, useState } from 'react';
import { clusterMetricsQuery } from '@/services/cluster.api';
import type { VectorData } from '@/services/prometheus';
import { getColorPrimary } from '@/utils/global';
import type { MetricsParamsProps } from '@/pages/kubernetes/components/metrics_def';
const MetricsColumn: React.FC<MetricsParamsProps> = (props) => {
  const containerRef = useRef(null);
  const colorPrimary = getColorPrimary();
  const time = Math.floor(props.end || Date.now() / 1000);
  const [data, setData] = useState<any[]>([]);
  const fetchData = async () => {
    const metricsData = [] as { name: string, value: number, unit: string }[];
    for (let i = 0; i < props.metricsRequests.length; i++) {
      const metricsRequest = props.metricsRequests[i];
      const item = props.metricsRequests[i];
      let metricKey = '';
      if (!metricKey) {
        metricKey = item.metricKey;
      }
      const data = (await clusterMetricsQuery(
        { cluster: props.cluster },
        { view: props.view, namespace: props.namespace, code: metricsRequest.code, time: time },
      )) as VectorData[];
      if (data && data.length > 0 && data[0]?.value) {
        const p = new Decimal(data[0]?.value[1] || (0 as number)).mul(metricsRequest.multiplier || 1);
        metricsData.push({ name: metricKey, value: Number(p.toFixed(metricsRequest.toFixed || 2)), unit: props.unit || '' });
      }
    }
    setData(metricsData);

  };
  useEffect(() => {
    if (!containerRef.current || props.metricsRequests.length === 0) return;
    // 获取指标
    fetchData();
  }, [props.end]);
  useEffect(() => {
    if (!containerRef.current) return;
    const column = new Column(containerRef.current, {
      data: data,
      xField: 'name',
      yField: 'value',
      label: {
        position: 'middle',
        style: {
          fill: '#FFFFFF',
          opacity: 0.6,
        },
        // ✅ 格式化标签：值 + 单位
        formatter: (datum) => {
          return `${datum.value} ${datum.unit}`;
        },
      },
      xAxis: {
        label: {
          autoHide: true,
          autoRotate: false,
        },
      },

    });

    column.render();
    return () => {
      column.destroy();
    };
  }, [data]);
  return (
    <>
      <div
        style={{
          overflow: 'hidden', border: '1px solid #e8e8e8', padding: '10px',
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
            <Dropdown menu={{ items: [] }} key="more">
              <a style={{ color: colorPrimary }}
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
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}  >
          <div ref={containerRef} style={{ width: '100%', height: props.height }} />
        </div>
      </div>
    </>
  );
};

export default MetricsColumn;
