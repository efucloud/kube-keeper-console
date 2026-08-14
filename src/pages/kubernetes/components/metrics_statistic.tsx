import { MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Dropdown, Space, Tooltip, Typography } from 'antd';
const { Title } = Typography;
import React, { useEffect, useRef, useState } from 'react';
import { clusterMetricsQuery } from '@/services/cluster.api';
import { getColorPrimary } from '@/utils/global';
import {
  type MetricsParamsProps,
} from '@/pages/kubernetes/components/metrics_def';
import { VectorData } from '@/services/prometheus';
import Decimal from 'decimal.js';

const MetricsStatistic: React.FC<MetricsParamsProps> = (props) => {
  const colorPrimary = getColorPrimary();
  const time = Math.floor(props.end || Date.now() / 1000);
  const [data, setData] = useState<Number>();
  const metricsRequest = props.metricsRequests[0];
  const fetchData = async () => {
    const data = (await clusterMetricsQuery(
      { cluster: props.cluster },
      { view: props.view, code: metricsRequest.code, time: time },
    )) as VectorData[];
    if (data && data.length > 0 && data[0]?.value) {
      const p = Number(new Decimal(data[0]?.value[1] || (0 as number)).mul(metricsRequest?.multiplier || 1)
        .toFixed(metricsRequest?.toFixed || 0));
      setData(p);
    }
  };
  useEffect(() => {
    // 获取指标
    fetchData();
  }, [props.step]);

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
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: props.height }}
        >
          <Title level={3}>{data?.toString() || 0}</Title>{props.unit && <span>&nbsp;{props.unit}</span>}
        </div>
      </div>
    </>
  );
};

export default MetricsStatistic;
