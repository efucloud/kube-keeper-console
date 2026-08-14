export type MetricsTableKey = {
  key: string;
  name: string;
};
export type MetricsParamsProps = {
  dropdown?: boolean;
  title: string;
  tooltip?: string;
  subTitle?: string;
  cluster: string;
  view: string;
  start?: number;
  end?: number;
  step?: string;
  height: number;
  namespace?: string;
  pod?: string;
  node?: string;
  metricsRequests: MetricsDefinition[];
  workloadType?: string;
  workload?: string;
  legend?:
    | 'right'
    | 'top'
    | 'left'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'right-top'
    | 'right-bottom'
    | 'left-top'
    | 'left-bottom'
    | 'bottom-left'
    | 'bottom-right'
    | undefined;
  unit?: string; //单位
  fontSize?: number; //字体大小
  tableFirstIndex?: string;
  tableSecondIndex?: string;
  tableSecondName?: string;
  danger?: number;
};
export type MetricsDefinition = {
  name: string;
  code: string; //指标code
  metricKey: string; //metric中的key，用于显示
  secondKey?: string; //metric中的key，用于辅助显示
  toFixed?: number; //小数点后几位
  multiplier?: number; //放大倍数
  tableUnit?: string; //table显示时的单位
};

export type MetricData = {
  code: string;
  time: string;
  value: number;
  category: string;
  secondKey?: string | undefined;
};
export type MatrixData = {
  metric: Record<string, string>;
  values: Array<Array<number | string>>;
};
