// ClusterApiGroupCreate 集群ApiGroup创建
export type ClusterApiGroupCreate = { 
  //集群ID
  //最大长度: 50
  clusterId: string;
  //内容
  content: datatypes;
} ; 
// ClusterApiGroupDetail 集群ApiGroup详情
export type ClusterApiGroupDetail = { 
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
// ClusterApiGroupDetailList  集群ApiGroup列表响应
export type ClusterApiGroupDetailList = { 
  //当前页数据
  data?: ClusterApiGroupDetail[];
  //数据库满足条件的数据总数
  total: number;
} ; 
// ClusterApiGroupUpdate 集群ApiGroup更新
export type ClusterApiGroupUpdate = { 
  //修改时间
  updatedAt: string;
  //集群ID
  //最大长度: 50
  clusterId: string;
  //内容
  content: datatypes;

}; 
