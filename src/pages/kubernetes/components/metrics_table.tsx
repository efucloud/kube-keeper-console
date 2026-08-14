import { MoreOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Dropdown, Space, Table, Tooltip } from 'antd';
import { Decimal } from 'decimal.js';
import React, { useEffect, useState } from 'react';
import { clusterMetricsQuery } from '@/services/cluster.api';
import type { VectorData } from '@/services/prometheus';
import { getColorPrimary } from '@/utils/global';
import type { MetricsParamsProps } from '@/pages/kubernetes/components/metrics_def';
import { useIntl } from '@umijs/max';

type ItemData = Record<string, any>;
const MetricsTable: React.FC<MetricsParamsProps> = (props) => {
  const colorPrimary = getColorPrimary();
  const [width, setWidth] = useState(100);
  const intl = useIntl();
  const time = props.end;
  const dayniamicColumns = (): ProColumns[] => {
    let metricKey = '';
    const columns = [] as ProColumns[];

    for (let i = 0; i < props.metricsRequests.length; i++) {
      const item = props.metricsRequests[i];
      if (!metricKey) {
        metricKey = item.metricKey;
      }
      columns.push({
        title: item.name,
        dataIndex: item.code,
      });
    }
    if (props.tableSecondIndex && props.tableSecondName) {
      columns.unshift({
        title: props.tableSecondName,
        dataIndex: 'tableSecondIndex',
      });
    }
    columns.unshift({
      title: props.tableFirstIndex,
      dataIndex: 'metricName',
      width: 300,
    });

    return columns;
  };
  const [dataSource, setDataSource] = useState<any[]>([]);
  const fetchData = async () => {
    const metricsData = {} as Record<string, ItemData>;
    // 多个指标请求参数组装
    for (let i = 0; i < props.metricsRequests.length; i++) {
      const metricsRequest = props.metricsRequests[i];
      const params = {
        view: props.view,
        code: metricsRequest.code,
        time: time,
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
      params['category'] = metricsRequest.metricKey;
      params['time'] = time;
      // 多个指标请求
      const data = (await clusterMetricsQuery(
        { cluster: props.cluster },
        params,
      )) as VectorData[];
      if (data && data.length > 0) {
        for (let j = 0; j < data.length; j++) {
          const item = data[j];
          if (item && item.metric) {
            let tableSecondValue = '';
            if (props.tableSecondIndex) {
              tableSecondValue = item.metric[props.tableSecondIndex] || '';
            }
            const metricName =
              item.metric[metricsRequest.metricKey] ||
              undefined + `|${tableSecondValue}`;
            if (metricName && item.value && item.value[1]) {
              setWidth(
                width > (15 * metricName.length) / 1
                  ? width
                  : (15 * metricName.length) / 1,
              );
              const value = item.value[1] as number;
              if (
                metricsData[metricName] &&
                metricsData[metricName].metricName === metricName
              ) {
                const oldItem = metricsData[metricName];
                const valueHuman = new Decimal(value)
                  .mul(metricsRequest.multiplier || 1)
                  .toFixed(metricsRequest.toFixed);
                if (valueHuman.toString() !== '') {
                  oldItem[metricsRequest.code] =
                    `${valueHuman.toString()} ${metricsRequest.tableUnit || ''}`;
                } else {
                  oldItem[metricsRequest.code] = '';
                }
                metricsData[metricName] = oldItem;
              } else {
                const newItem = {
                  metricName: metricName,
                  tableSecondIndex: tableSecondValue,
                } as ItemData;
                const valueHuman = new Decimal(value)
                  .mul(metricsRequest.multiplier || 1)
                  .toFixed(metricsRequest.toFixed);
                if (valueHuman.toString() !== '') {
                  newItem[metricsRequest.code] =
                    `${valueHuman.toString()} ${metricsRequest.tableUnit || ''}`;
                } else {
                  newItem[metricsRequest.code] = '';
                }
                metricsData[metricName] = newItem;
              }
            }
          }
        }
      }
    }
    const listData = [];
    for (const key in metricsData) {
      if (Object.hasOwn(metricsData, key)) {
        listData.push(metricsData[key]);
      }
    }
    setDataSource(listData);
  };
  useEffect(() => {
    // 获取指标
    fetchData();
  }, [props.start, props.end, props.step]);

  return (
    <>
      <div
        style={{
          overflow: 'hidden',
          border: '1px solid #e8e8e8',
          padding: '0px',
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
          <Table
            key={props.title}
            scroll={{ y: 40 * 5 }}
            columns={dayniamicColumns()}
            dataSource={dataSource}
            pagination={false}
            size="small"
            notFoundContent={intl.formatMessage({ id: 'pages.no.data' })}
          />
        </div>
      </div>
    </>
  );
};

export default MetricsTable;
