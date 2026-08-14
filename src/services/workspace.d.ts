import { AccountDetail } from './account.d';
// WorkspaceCreate 工作空间创建
export type WorkspaceCreate = { 
  //编码
  //最大长度: 50
  code: string;
  //名称
  //最大长度: 50
  name: string;
  //说明
  //最大长度: 255
  description?: string;
  //工作空间管理员ID
  //最大长度: 50
  ownerId: string;
} ; 
// WorkspaceDetail 工作空间详情
export type WorkspaceDetail = { 
  //主键
  //最大长度: 50
  id: string;
  //创建时间
  createdAt: string;
  //更新时间
  updatedAt: string;
  //创建者
  //最大长度: 50
  creatorId: string;
  //更新者
  //最大长度: 50
  updaterId: string;
  //软删除
  deletedAt?: string;
  //编码
  //最大长度: 50
  code: string;
  //名称
  //最大长度: 50
  name: string;
  //说明
  //最大长度: 255
  description?: string;
  //工作空间管理员ID
  //最大长度: 50
  ownerId: string;
  //工作空间管理员
  owner?: AccountDetail;
} ; 
// WorkspaceDetailList  工作空间列表响应
export type WorkspaceDetailList = { 
  //当前页数据
  data?: WorkspaceDetail[];
  //数据库满足条件的数据总数
  total: number;
} ; 
// WorkspaceUpdate 工作空间更新
export type WorkspaceUpdate = { 
  //主键
  //最大长度: 50
  id: string;
  //编码
  //最大长度: 50
  code: string;
  //名称
  //最大长度: 50
  name: string;
  //说明
  //最大长度: 255
  description?: string;
  //工作空间管理员ID
  //最大长度: 50
  ownerId: string;
} ; 
