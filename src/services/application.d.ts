import { ResourceIndex } from './kubernetes.d';
import { ParameterDefinitions } from './application_def.d';
// ApplicationCreate 应用部署模版创建
export type ApplicationCreate = { 
  //创建者
  //最大长度: 50
  creatorId: string;
  //状态 0:Draft 1::Released 2:Archived
  //默认值: 0
  state: number;
  //显示名称
  //最大长度: 255
  name?: string;
  //版本描述
  description: string;
  //模版内容,yaml格式，支持多个，若为helm部署，则为values.yaml内容
  templates: string[];
  //模版资源索引
  //最大长度: 255
  resourceIndex: ResourceIndex;
  //有CRD资源
  hasCrd: boolean;
  // 应用参数
  parameters?: ParameterDefinitions;
  //版本
  //最大长度: 50
  version: string;
} ; 
// ApplicationDetail 模版应用
export type ApplicationDetail = { 
  //主键
  //最大长度: 50
  id: string;
  //创建者
  //最大长度: 50
  creatorId: string;
  //状态 0:Draft 1::Released 2:Archived
  //默认值: 0
  state: number;
  //显示名称
  //最大长度: 255
  name?: string;
  //版本描述
  description: string;
  //模版内容,yaml格式，支持多个，若为helm部署，则为values.yaml内容
  templates: string[];
  //模版资源索引
  //最大长度: 255
  resourceIndex: ResourceIndex;
  //有CRD资源
  hasCrd: boolean;
  // 应用参数
  parameters?: ParameterDefinitions;
  //版本
  //最大长度: 50
  version: string;
} ; 
export type ApplicationDetailList = { 
  //当前页数据
  data?: ApplicationDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
// ApplicationExportImport 应用版本导入导出
export type ApplicationExportImport = { 
  //显示名称
  //最大长度: 255
  name?: string;
  //版本描述
  description: string;
  //模版内容,yaml格式，支持多个，若为helm部署，则为values.yaml内容
  templates: string[];
  //模版资源索引
  //最大长度: 255
  resourceIndex: ResourceIndex;
  //有CRD资源
  hasCrd: boolean;
  // 应用参数
  parameters?: ParameterDefinitions;
  //版本
  //最大长度: 50
  version: string;
} ; 
// ApplicationUpdate 应用部署模版更新
export type ApplicationUpdate = { 
  //主键
  //最大长度: 50
  id: string;
  //修改时间
  updatedAt: string;
  //更新者
  //最大长度: 50
  updaterId: string;
  //状态 0:Draft 1::Released 2:Archived
  //默认值: 0
  state: number;
  //显示名称
  //最大长度: 255
  name?: string;
  //版本描述
  description: string;
  //模版内容,yaml格式，支持多个，若为helm部署，则为values.yaml内容
  templates: string[];
  //模版资源索引
  //最大长度: 255
  resourceIndex: ResourceIndex;
  //有CRD资源
  hasCrd: boolean;
  // 应用参数
  parameters?: ParameterDefinitions;
  //版本
  //最大长度: 50
  version: string;
} ; 
export type getTemplateIndex = { 
} ; 
