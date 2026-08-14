import { MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Gauge } from '@antv/g2plot';
import { Dropdown, Space, Tooltip } from 'antd';
import Decimal from 'decimal.js';
import React, { useEffect, useRef, useState } from 'react';
import { clusterMetricsQuery } from '@/services/cluster.api';
import type { VectorData } from '@/services/prometheus';
import { getColorPrimary } from '@/utils/global';
import type { MetricsParamsProps } from '@/pages/kubernetes/components/metrics_def';

const MetricsGauge: React.FC<MetricsParamsProps> = (props) => {
  const containerRef = useRef(null);
  const colorPrimary = getColorPrimary();
  const time = Math.floor(props.end || Date.now() / 1000);
  const [percent, setPercent] = useState<Decimal>(Decimal(0));
  const metricsRequest = props.metricsRequests[0];
  const fetchData = async () => {
    const data = (await clusterMetricsQuery(
      { cluster: props.cluster },
      { view: props.view, code: metricsRequest.code, time: time },
    )) as VectorData[];
    if (data && data.length > 0 && data[0]?.value) {
      const p = new Decimal(data[0]?.value[1] || (0 as number));
      setPercent(p.toDecimalPlaces(metricsRequest.toFixed || 2));
    }
  };
  useEffect(() => {
    if (!containerRef.current || props.metricsRequests.length === 0) return;
    // 获取指标
    fetchData();
  }, [props.end]);
  useEffect(() => {
    if (!containerRef.current) return;
    const gauge = new Gauge(containerRef.current, {
      percent: percent.toNumber(),
      range: {
        ticks: [0, 1 / 3, 2 / 3, 1],
        color: ['#F4664A', '#FAAD14', '#30BF78'],
      },
      indicator: {
        pointer: {
          style: {
            stroke: '#D0D0D0',
          },
        },
        pin: {
          style: {
            stroke: '#D0D0D0',
          },
        },
      },
      statistic: {
        content: {
          style: {
            fontSize: '12px',
            lineHeight: '36px',
          },
        },
      },
    });

    gauge.render();
    return () => {
      gauge.destroy();
    };
  }, [percent]);
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
            <Dropdown menu={{ items: [] }} key="more">
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

export default MetricsGauge;
