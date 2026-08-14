import Decimal from 'decimal.js';
import React, { useEffect, useState } from 'react';
import { clusterMetricsQuery } from '@/services/cluster.api';
import type { VectorData } from '@/services/prometheus';
import type { MetricsParamsProps } from '@/pages/kubernetes/components/metrics_def';

const MetricsValue: React.FC<MetricsParamsProps> = (props) => {
  const time = Math.floor(props.end || Date.now() / 1000);
  const [value, setValue] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const metricsRequest = props.metricsRequests[0];
  const [danger, setDanger] = useState(false);
  const fetchData = async () => {
    const data = (await clusterMetricsQuery(
      { cluster: props.cluster },
      {
        view: props.view,
        code: metricsRequest.code,
        node: props.node || '',
        namespace: props.namespace || '',
        pod: props.pod,
        time: time,
      },
    )) as VectorData[];
    if (data && data.length > 0 && data[0]?.value) {
      const p = new Decimal(data[0]?.value[1] || 0).mul(
        metricsRequest.multiplier || 1,
      );
      if (props?.danger && p.toNumber() > props.danger) {
        setDanger(true);
      }
      setValue(p.toFixed(metricsRequest.toFixed));
      setSuccess(true);
    }
  };
  useEffect(() => {
    // 获取指标
    fetchData();
  }, [time]);

  return (
    <span style={{ color: danger ? 'red' : '' }}>
      {success ? (
        <span>
          {value}
          {metricsRequest.tableUnit || ''}
        </span>
      ) : (
        ''
      )}
    </span>
  );
};

export default MetricsValue;
