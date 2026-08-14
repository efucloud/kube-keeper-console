import { GpuResourceParamDefinitions } from './kubernetes.d';
// GpuResourceDefinitionCreate GPU资源定义创建
export type GpuResourceDefinitionCreate = { 
  //编码
  //最大长度: 50
  code: string;
  //名称
  //最大长度: 50
  name: string;
  //参数
  parameters: GpuResourceParamDefinitions;
} ; 
// GpuResourceDefinitionDetail GPU资源定义详情
export type GpuResourceDefinitionDetail = { 
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
  //参数
  parameters: GpuResourceParamDefinitions;
} ; 
// GpuResourceDefinitionDetailList  GPU资源定义列表响应
export type GpuResourceDefinitionDetailList = { 
  //当前页数据
  data?: GpuResourceDefinitionDetail[];
  //数据库满足条件的数据总数
  total: number;
} ; 
// GpuResourceDefinitionUpdate GPU资源定义更新
export type GpuResourceDefinitionUpdate = { 
  //主键
  //最大长度: 50
  id: string;
  //名称
  //最大长度: 50
  name: string;
  //参数
  parameters: GpuResourceParamDefinitions;
} ; 
