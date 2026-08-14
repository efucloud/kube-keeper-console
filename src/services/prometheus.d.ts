import { I18N } from './common.d';
// MatrixDataLine 响应数据为matrix类型
export type MatrixDataLine = { 
} ; 
export type MatrixDataLineData = { 
  result?: MatrixDataLine[];
  resultType?: string;
} ; 
export type PrometheusQuery = { 
  query?: string;
  variables?: {[key: string]: string};
  i18N?: I18N;
  description?: string;
} ; 
export type PrometheusQueryVariable = { 
  description?: string;
  default?: string;
  required: boolean;
} ; 
export type PrometheusResponseMatrixData = { 
  status?: string;
  data?: MatrixDataLineData;
  errorType?: string;
  error?: string;
} ; 
export type PrometheusResponseVectorData = { 
  status?: string;
  data?: ResponseVectorData;
  errorType?: string;
  error?: string;
} ; 
export type ResponseVectorData = { 
  result?: VectorData[];
  resultType?: string;
} ; 
export type VectorData = { 
  metric?: {[key: string]: string};
  value?: any[];
} ; 
