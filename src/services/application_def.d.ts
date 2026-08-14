// ApplicationEdge 应用边
export type ApplicationEdge = { 
  id?: string;
  source?: string;
  target?: string;
} ; 
// Value 实现 driver.Valuer 接口，Value 返回 json value
export type ApplicationEdgeStyle = { 
  height?: number;
  weight?: number;
} ; 
// ApplicationEdges 应用边
export type ApplicationEdges = ApplicationEdge[];
// ApplicationMetrics 应用指标
export type ApplicationMetrics = { 
  promql?: string;
  name?: string;
} ; 
// ApplicationNode 应用节点
export type ApplicationNode = { 
  //组件名称 作为画布节点的ID，同时作为集群资源名称的一部分
  id: string;
  data?: ApplicationNodeInfo;
  type?: string;
  position?: Position;
} ; 
// ApplicationNodeInfo 节点中应用信息
export type ApplicationNodeInfo = { 
  source?: string;
  //应用ID
  applicationId: string;
  //组件logo
  logo?: string;
  //版本号
  selectedVersion: string;
  //组织ID
  organizationId: string;
  //工作空间ID
  workspaceId: string;
  //组件名称
  name: string;
  //组件显示名称
  displayName: string;
  //组件作用
  function?: string;
  //画布连接属性
  handleProps?: string[];
  //节点类型
  nodeType: string;
  //版本信息
  version?: EmbedMarketApplicationVersion;
} ; 
// ApplicationNodes 应用节点
export type ApplicationNodes = ApplicationNode[];
export type ApplicationState = { 
  //工作空间ID
  workspaceId?: string;
  //版本ID
  versionId?: string;
  //应用ID，操作版本时使用
  applicationId?: string;
  //状态
  state: number;
  //当前版本设置为默认版本
  setDefaultVersion: boolean;
  //设置某个版本为默认版本
  defaultVersion?: string;
} ; 
// 映射的应用参数
export type ApplicationVariable = { 
  //Canvas上应用ID,若ID为空表示基础应用的参数映射
  id?: string;
  name?: string;
} ; 
// EmbedMarketApplicationVersion 模版应用
export type EmbedMarketApplicationVersion = { 
  //主键
  //最大长度: 50
  id: string;
  //工作空间ID
  //最大长度: 50
  workspaceId: string;
  //状态 0:Draft 1:Development 2:Testing 3:ReleasedCandidate 4:Released 5:Deprecated 6:Archived
  //默认值: 0
  state: number;
  //包含的子应用
  includes?: string[];
  //应用ID
  //最大长度: 50
  applicationId: string;
  //模版内容,yaml格式，支持多个，若为helm部署，则为values.yaml内容
  templates: string[];
  // 应用参数
  parameters?: ParameterDefinitions;
  //参数映射
  mappings?: ParametersMappings;
  //Helm仓库地址
  //最大长度: 255
  helmRepo: string;
  //Helm部署的values.yaml
  values?: string;
  //版本
  //最大长度: 50
  version: string;
  //应用类别
  //默认值: base
  //最大长度: 50
  type: string;
  //应用部署方式
  //最大长度: 255
  deployMethod: string;
  //节点
  nodes: ApplicationNodes;
  //边缘
  edges?: ApplicationEdges;
  //画布连接属性
  handleProps?: string[];
} ; 
//设置某个版本为默认版本
export type IdeTemplateState = { 
  //工作空间ID
  workspaceId?: string;
  //版本ID
  versionId?: string;
  //模版ID，操作版本时使用
  templateId?: string;
  //状态
  state: number;
  //当前版本设置为默认版本
  setDefaultVersion: boolean;
  //设置某个版本为默认版本
  defaultVersion?: string;
} ; 
// NodeMeasured 节点尺寸
export type NodeMeasured = { 
  width?: number;
  height?: number;
} ; 
// ParameterDefinition 参数定义
// 用于应用模版，ide模版中对参数的定义，借鉴了openshift的template概念
export type ParameterDefinition = { 
  //名称(英文)
  name: string;
  //显示名称
  displayName?: string;
  //是否必须
  required: boolean;
  //类型
  type: string;
  //描述
  description?: string;
  //默认值
  defaultValue?: any;//todo 可能需要手动完善结构;
  //可选值，只针对Type为string类型
  allowableValues?: any;//todo 可能需要手动完善结构;
} ; 
// ParameterDefinitions 数组
export type ParameterDefinitions = ParameterDefinition[];
// ParametersMapping 参数映射
export type ParametersMapping = { 
  //名称(英文)
  name?: string;
  //显示名称
  displayName?: string;
  //是否必须
  required: boolean;
  //类型
  type: string;
  //描述
  description?: string;
  //参数值
  defaultValue?: any;//todo 可能需要手动完善结构;
  //输入值
  inputValue?: any;//todo 可能需要手动完善结构;
  // 映射的应用参数
  variables?: ApplicationVariable[];
} ; 
// ParametersMappings 数组
export type ParametersMappings = ParametersMapping[];
// Value 实现 driver.Valuer 接口，Value 返回 json value
export type Position = { 
  x?: number;
  y?: number;
} ; 
