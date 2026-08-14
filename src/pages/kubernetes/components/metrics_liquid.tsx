import { MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Liquid } from '@antv/g2plot';
import { Dropdown, Space, Tooltip } from 'antd';
import Decimal from 'decimal.js';
import React, { useEffect, useRef, useState } from 'react';
import {
  clusterMetricsQuery,
} from '@/services/cluster.api';
import type { VectorData } from '@/services/prometheus';
import { getColorPrimary } from '@/utils/global';
import type { MetricsParamsProps } from '@/pages/kubernetes/components/metrics_def';

const MetricsLiquid: React.FC<MetricsParamsProps> = (props) => {
  const containerRef = useRef(null);
  const fontSize = props.fontSize || 30;
  const colorPrimary = getColorPrimary();
  const time = Math.floor(props.end || Date.now() / 1000);
  const [percent, setPercent] = useState<Decimal>(Decimal(0));
  const metricsRequest = props.metricsRequests[0];
  const fetchData = async () => {
    const data = (await clusterMetricsQuery(
      { cluster: props.cluster },
      {
        view: props.view,
        code: metricsRequest.code,
        time: time,
        namespace: props.namespace,
        node: props.node,
        pod: props.pod,
      },
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
    const gauge = new Liquid(containerRef.current, {
      percent: percent.toNumber(),
      outline: {
        border: 1,
        distance: 2,
      },
      statistic: {
        content: {
          style: {
            fontSize: fontSize, // 设置你想要的字体大小
          },
        },
      },
      wave: {
        length: 128,
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
          border: '1px solid #f4f2f2ff',
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

export default MetricsLiquid;
