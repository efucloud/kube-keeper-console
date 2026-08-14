import { AccountDetail } from './account.d';
// WorkspaceMemberCreate 工作空间成员创建
// 只有账户category为enterprise才能加入工作空间
// 该数据触发生成cluster_account_role，能够自动根据权限模版同步权限信息到集群
export type WorkspaceMemberCreate = { 
  //工作空间ID
  //最大长度: 50
  workspaceId: string;
  //用户ID
  //最大长度: 50
  accountId?: string;
} ; 
// WorkspaceMemberDetail 工作空间成员信息
// 只有账户category为enterprise才能加入工作空间
// 该数据触发生成cluster_account_role，能够自动根据权限模版同步权限信息到集群
export type WorkspaceMemberDetail = { 
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
  //用户ID
  //最大长度: 50
  accountId?: string;
  //工作空间ID
  //最大长度: 50
  workspaceId: string;
  //用户
  account?: AccountDetail;
} ; 
// WorkspaceMemberDetailList 工作空间成员列表响应
export type WorkspaceMemberDetailList = { 
  //当前页数据
  data?: WorkspaceMemberDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
