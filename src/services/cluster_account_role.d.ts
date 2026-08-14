import { AccountDetail } from './account.d';
// ClusterAccountRoleCreate 集群用户角色
export type ClusterAccountRoleCreate = { 
  //所属用户: 关联ID
  //最大长度: 50
  accountId: string;
  //角色名称
  //最大长度: 50
  roleName?: string;
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
// ClusterAccountRoleDetail 集群用户角色
export type ClusterAccountRoleDetail = { 
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
  //创建者
  creator?: AccountDetail;
  //更新者
  //最大长度: 50
  updaterId: string;
  //集群ID
  //最大长度: 50
  clusterId: string;
  //所属用户: 关联ID
  //最大长度: 50
  accountId: string;
  //集群用户
  account?: AccountDetail;
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
// ClusterAccountRoleDetailList 集群用户角色列表响应
export type ClusterAccountRoleDetailList = { 
  //当前页数据
  data?: ClusterAccountRoleDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
