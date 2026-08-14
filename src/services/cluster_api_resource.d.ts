// ClusterApiResourceCreate 集群ApiResource创建
export type ClusterApiResourceCreate = { 
  //集群ID
  //最大长度: 50
  clusterId: string;
  //内容
  content: datatypes;
} ; 
// ClusterApiResourceDetail 集群ApiResource详情
export type ClusterApiResourceDetail = { 
  //主键
  //最大长度: 50
  id: string;
  //创建时间
  createdAt: string;
  //修改时间
  updatedAt: string;
  //集群ID
  //最大长度: 50
  clusterId: string;
  //内容
  content: datatypes;
} ; 
// ClusterApiResourceDetailList  集群ApiResource列表响应
export type ClusterApiResourceDetailList = { 
  //当前页数据
  data?: ClusterApiResourceDetail[];
  //数据库满足条件的数据总数
  total: number;
} ; 
// ClusterApiResourceUpdate 集群ApiResource更新
export type ClusterApiResourceUpdate = { 
  //修改时间
  updatedAt: string;
  //集群ID
  //最大长度: 50
  clusterId: string;
  //内容
  content: datatypes;
} ; 
