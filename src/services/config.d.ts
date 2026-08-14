// ConfigCreate 集群命名空间信息创建
// 记录了集群里面的命名空间，以及命名空间所属的工作空间，以及是不是webide部署的namespace，若为webide部署，则需标识该namespace的管理员，即开发者，支持多个管理员
export type ConfigCreate = { 
  //编码
  //最大长度: 255
  code: string;
  //内容
  data?: string;
} ; 
// ConfigDetail 系统配置信息
export type ConfigDetail = { 
  //修改时间
  updatedAt: string;
  //创建者
  //最大长度: 50
  creatorId: string;
  //更新者
  //最大长度: 50
  updaterId: string;
  //编码
  //最大长度: 255
  code: string;
  //内容
  data?: string;
} ; 
// ConfigDetailList 系统配置信息
export type ConfigDetailList = { 
  //当前页数据
  data?: ConfigDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
// ConfigUpdate 集群命名空间信息修改
// 记录了集群里面的命名空间，以及命名空间所属的工作空间，以及是不是webide部署的namespace，若为webide部署，则需标识该namespace的管理员，即开发者，支持多个管理员
export type ConfigUpdate = { 
  //主键
  //最大长度: 50
  id: string;
  //编码
  //最大长度: 255
  code: string;
  //内容
  data?: string;
} ; 
