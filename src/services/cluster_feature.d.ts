import { GroupVersionResources } from './kubernetes.d';
// ClusterFeatureDetail 用户在集群的csr
export type ClusterFeatureDetail = { 
  //编码
  //最大长度: 255
  code: string;
  //名称
  //最大长度: 255
  name: string;
  //检查资源
  checkResource?: GroupVersionResources;
} ; 
// ClusterFeatureDetailList 集群特性表响应
export type ClusterFeatureDetailList = { 
  //当前页数据
  data?: ClusterFeatureDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
