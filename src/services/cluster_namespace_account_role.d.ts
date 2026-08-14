import { AccountDetail } from './account.d';
// ClusterNamespaceAccountRoleCreate 集群命名空间用户
export type ClusterNamespaceAccountRoleCreate = { 
  //集群ID
  //最大长度: 50
  clusterId: string;
  //所属用户: 关联ID
  //最大长度: 50
  accountId: string;
  //集群命名空间
  //最大长度: 255
  namespace: string;
  //角色名称
  //最大长度: 50
  roleName: string;
  //角色绑定名称
  //最大长度: 50
  bindingName: string;
  //临时权限
  isTemp: boolean;
  //开始时间
  startTime: string;
  //结束时间
  endTime: string;
  //是否有效
  //默认值: false
  enable: boolean;
} ; 
// ClusterNamespaceAccountRoleDetail 集群命名空间用户
export type ClusterNamespaceAccountRoleDetail = { 
  //主键
  //最大长度: 50
  id: string;
  //创建时间
  createdAt: string;
  //修改时间
  updatedAt: string;
  //创建者
  //最大长度: 50
  creatorId: string;
  //更新者
  //最大长度: 50
  updaterId: string;
  //软删除
  deletedAt?: string;
  //集群ID
  //最大长度: 50
  clusterId: string;
  //所属用户: 关联ID
  //最大长度: 50
  accountId: string;
  //集群用户
  account?: AccountDetail;
  //集群命名空间
  //最大长度: 255
  namespace?: string;
  //角色名称
  //最大长度: 50
  roleName?: string;
  //角色绑定名称
  //最大长度: 50
  bindingName?: string;
  //临时权限
  isTemp: boolean;
  //开始时间
  startTime: string;
  //结束时间
  endTime: string;
  //是否有效
  //默认值: false
  enable: boolean;
} ; 
// ClusterNamespaceAccountRoleDetailList 集群命名空间用户列表响应
export type ClusterNamespaceAccountRoleDetailList = { 
  //当前页数据
  data?: ClusterNamespaceAccountRoleDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
// ClusterNamespaceAccountRoleUpdate 集群命名空间用户修改
export type ClusterNamespaceAccountRoleUpdate = { 
  //主键
  //最大长度: 50
  id: string;
  //所属用户: 关联ID
  //最大长度: 50
  accountId: string;
} ; 
