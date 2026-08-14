import { ShortClusterDetail } from './cluster.d';
// ClusterNamespaceCreate 集群命名空间信息创建
// 记录了集群里面的命名空间，以及命名空间所属的工作空间，以及是不是webide部署的namespace，若为webide部署，则需标识该namespace的管理员，即开发者，支持多个管理员
export type ClusterNamespaceCreate = { 
  //集群ID
  //最大长度: 50
  clusterId: string;
  //集群命名空间名称
  //最大长度: 255
  namespace: string;
  //所属工作空间编码
  //最大长度: 50
  workspaceCode?: string;
  //描述
  //最大长度: 50
  description?: string;
  //命名空间状态
  status?: string;
  //集群上创建时间
  clusterCreateTime: string;
  //命名空间类型public:工作空间中所有成员均可加入,private:工作空间成员私有命名空间,命名空间管理员可以邀请工作空间用户加入
  //默认值: true
  isPublic: boolean;
} ; 
// ClusterNamespaceDetail 集群命名空间信息
// 记录了集群里面的命名空间，以及命名空间所属的工作空间，以及是不是webide部署的namespace，若为webide部署，则需标识该namespace的管理员，即开发者，支持多个管理员
export type ClusterNamespaceDetail = { 
  //主键
  //最大长度: 50
  id: string;
  //创建时间
  createdAt: string;
  //修改时间
  updatedAt: string;
  //软删除
  deletedAt?: string;
  //创建者
  //最大长度: 50
  creatorId: string;
  //更新者
  //最大长度: 50
  updaterId: string;
  //集群ID
  //最大长度: 50
  clusterId: string;
  //集群信息
  cluster?: ShortClusterDetail;
  //集群命名空间名称
  //最大长度: 255
  namespace: string;
  //所属工作空间编码
  //最大长度: 50
  workspaceCode?: string;
  //描述
  //最大长度: 50
  description?: string;
  //命名空间状态
  status?: string;
  //集群上创建时间
  clusterCreateTime: string;
  //命名空间类型public:工作空间中所有成员均可加入,private:工作空间成员私有命名空间,命名空间管理员可以邀请工作空间用户加入
  //默认值: true
  isPublic: boolean;
} ; 
// ClusterNamespaceDetailList 集群Namespace列表响应
export type ClusterNamespaceDetailList = { 
  //当前页数据
  data?: ClusterNamespaceDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
// ClusterNamespaceUpdate 集群命名空间信息修改
// 记录了集群里面的命名空间，以及命名空间所属的工作空间，以及是不是webide部署的namespace，若为webide部署，则需标识该namespace的管理员，即开发者，支持多个管理员
export type ClusterNamespaceUpdate = { 
  //主键
  //最大长度: 50
  id: string;
  //所属工作空间编码
  //最大长度: 50
  workspaceCode?: string;
  //描述
  //最大长度: 50
  description?: string;
  //命名空间状态
  status?: string;
} ; 
