// Value 实现 driver.Valuer 接口，Value 返回 json value
export type APIResource = { 
  name?: string;
  namespaced: boolean;
  groupVersion?: string;
  kind?: string;
  group?: string;
  version?: string;
} ; 
// ApplicationRenderResult 应用模版资源渲染结果
export type ApplicationKubernetesResource = { 
  namespace?: string;
  resourceName?: string;
  content?: string;
  message?: string;
  apiResource?: APIResource;
  key?: string;
  renderStatus?: string;
  tryStatus?: string;
  deployStatus?: string;
} ; 
// ApplicationRenderResult 应用模版资源渲染结果
export type ApplicationKubernetesResources = ApplicationKubernetesResource[];
// Value 实现 driver.Valuer 接口，Value 返回 json value
export type ApplicationRenderParams = { 
} ; 
// ApplicationRenderResult 应用模版资源渲染结果
export type ApplicationRenderResult = { 
  successes?: ApplicationKubernetesResource[];
  failures?: ApplicationKubernetesResource[];
} ; 
// ClusterServerGroup 集群资源接口
export type ClusterServerGroup = { 
  groupVersion: string;
  group?: string;
  version: string;
  kind?: string;
  scope?: string;
  name?: string;
} ; 
// ClusterServerGroupCheck 集群资源接口检测
export type ClusterServerGroupCheck = { 
  apiVersion?: string;
  group?: string;
  version?: string;
  kind?: string;
  scope?: string;
  exist: boolean;
  plural?: string;
} ; 
// ClusterServerGroup 集群资源接口
export type ClusterServerGroupChecks = ClusterServerGroupCheck[];
export type ClusterTerminalPodInfo = { 
  cluster?: string;
  targetCluster?: string;
  namespace?: string;
  pod?: string;
  container?: string;
  phase?: string;
  expireAt?: number;
  message?: string;
} ; 
export type GetClusterVersion = { 
} ; 
// Value 实现 driver.Valuer 接口，Value 返回 json value
export type GpuResourceParamDefinition = { 
  name: string;
  injectKey: string;
  valueType: string;
} ; 
// Value 实现 driver.Valuer 接口，Value 返回 json value
export type GpuResourceParamDefinitions = { 
} ; 
// Value 实现 driver.Valuer 接口，Value 返回 json value
export type GroupVersionResource = { 
  group: string;
  version: string;
  resource: string;
} ; 
// Value 实现 driver.Valuer 接口，Value 返回 json value
export type GroupVersionResources = { 
} ; 
// Value 实现 driver.Valuer 接口，Value 返回 json value
export type HelmValues = { 
  content?: string;
  url?: string;
} ; 
// PodResourceResize pod资源调整
export type ImageRegistryAuth = { 
  auths?: {[key: string]: string};
} ; 
// PodResourceResize pod资源调整
export type ImageRegistryAuthLine = { 
  username?: string;
  password?: string;
  auth?: string;
} ; 
//普通用户能创建NS
export type KubernetesVersion = { 
  connectAble: boolean;
  major?: string;
  minor?: string;
  gitVersion?: string;
  gitCommit?: string;
  gitTreeState?: string;
  buildDate?: string;
  goVersion?: string;
  compiler?: string;
  platform?: string;
} ; 
// NamespaceBindWorkspace 绑定或者解绑命名空间
export type NamespaceBindWorkspace = { 
  namespace?: string;
  workspaceCode?: string;
} ; 
// PodResourceResize pod资源调整
export type PodResourceResize = { 
} ; 
// ResourceIndex 应用版本模版中的资源索引
export type ResourceIndex = { 
} ; 
// TemplateClusterRoleRule 集群角色模版，用于快速创建集群角色
export type TemplateClusterRoleRule = { 
  //标签
  labels?: {[key: string]: string};
  //规则
  rules?: any;//todo 可能需要手动完善结构[];
  //聚合规则
  aggregationRule?: any;//todo 可能需要手动完善结构;
} ; 
// UserAccessCluster 用户可以访问的集群
export type UserAccessCluster = { 
  //主键
  id: string;
  //集群编码
  code: string;
  //Features
  features?: string[];
  //集群名称
  name: string;
  //集群版本
  version?: KubernetesVersion;
  //集群类型
  category: string;
  //可访问命名空间列表
  namespaces?: string[];
  //用户在集群内置最大角色
  builtinMaxClusterRole?: string;
  //普通用户能创建NS
  commonCanCreateNs: boolean;
} ; 
// UserAccessClusterList  用户可以访问的集群列表
export type UserAccessClusterList = { 
  //当前页数据
  data?: UserAccessCluster[];
  //数据库满足条件的数据总数
  total: number;
} ; 
// UserAccessClusterNamespace 用户可以访问集群命名空间
export type UserAccessClusterNamespace = { 
  name?: string;
} ; 
// UserAccessClusterNamespaceList  用户可以访问集群的命名空间列表
export type UserAccessClusterNamespaceList = { 
  //当前页数据
  data?: UserAccessClusterNamespace[];
  //数据库满足条件的数据总数
  total: number;
} ; 
