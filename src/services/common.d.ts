// AccessTokenResponse 登录获取token
export type AccessTokenResponse = { 
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
  timestamp: number;
} ; 
// AnyJsonData 任意json数据
export type AnyJsonData = Record<string, unknown>;
export type ApplicationInfo = { 
  application?: string;
  goVersion?: string;
  commit?: string;
  buildDate?: string;
  os?: string;
  arch?: string;
  cpuCores?: number;
} ; 
// AuditLogConfig 审计日志配置
export type AuditLogConfig = { 
  //服务地址
  address?: string;
  //API Key
  apiKey?: string;
  //API Secret
  apiSecret?: string;
} ; 
// AuditLogSearchOption 审计日志es搜索
export type AuditLogSearchOption = { 
  //集群编码
  cluster?: string;
  //Namespace,带*模糊搜索
  namespace?: string;
  //用户名，包括sa账户,带*模糊搜索
  username?: string;
  //资源对象,带*模糊搜索
  resource?: string;
  //资源对象名称,带*模糊搜索
  resourceName?: string;
  //鉴权结果
  decision?: string;
  //操作
  verb?: string;
  //从第几页开始
  page?: number;
  //页码大小
  size?: number;
  //字段排序，只是上面的字段，sort: {'username':'desc or asc'}
  sort?: {[key: string]: string};
  //开始时间 2023-07-23
  startTime?: string;
  //结束时间，2023-07-23
  endTime?: string;
} ; 
// AuthedUserInfo 用户信息
export type AuthedUserInfo = { 
  //主键
  id: string;
  //用户名
  username: string;
  //昵称，如中文名
  nickname: string;
  //工号
  jobNumber: string;
  //系统角色
  role: string;
  //是否有效
  enable: boolean;
  //邮箱
  email: string;
  //手机号码
  phone: string;
  //默认语言
  language: string;
  //头像
  avatar: string;
  //远程地址
  remoteAddress: string;
} ; 
// BatchOperationIds 需要删除的列表,根据数据库id
export type BatchOperationIds = { 
  //需要删key 可以为数据库的id
  ids: string[];
} ; 
// BatchOperationKeys 需要删除的列表，根据表唯一字符型字段
export type BatchOperationKeys = { 
  //需要删key 可以为数据库的id
  ids: string[];
} ; 
// ByIds 根据id列表获取信息
export type ByIds = { 
  ids?: string[];
} ; 
// ClientInformation 获取浏览器等客户端信息
export type ClientInformation = { 
  //平台 如"MacIntel"、"Win32"、"Linux x86_64"、"Linux armv81"
  platform?: string;
  //供应商
  vendor?: string;
  //客户端代理
  userAgent?: string;
  //CPU核数
  hardwareConcurrency?: number;
  //浏览器
  browser?: string;
  //客户端地址
  remote?: string;
  //平台细节
  platformDetail?: string;
  //内存大小(G)
  deviceMemory?: number;
} ; 
export type ClusterAdmin = { 
  accountId: string;
} ; 
// ClusterExtendConfig 集群扩展信息
export type ClusterExtendConfig = { 
  //审计日志服务配置
  //AuditLogConfig *AuditLogConfig `json:"auditLogConfig" description:"审计日志服务配置"`
  //prometheus配置
  monitorPrometheusConfig?: MonitorPrometheusConfig;
} ; 
// ClusterTablePagination 集群资源对象分页
export type ClusterTablePagination = { 
  continue?: string;
  remainingItemCount?: number;
  resourceVersion?: string;
} ; 
export type ClusterVersionInfo = { 
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
export type DecryptClientInformation = { 
} ; 
export type DecryptClientUserId = { 
} ; 
// ByIds 根据id列表获取信息
export type DutyTime = { 
  startTime?: string;
  endTime?: string;
} ; 
// EsQuery ES查请求封装结构
export type EsQuery = { 
  //查询请求数据
  query?: EsQueryBody;
  //查询记录偏移
  from?: number;
  //查询数据数量
  size?: number;
  //查询排序
  sort?: any[];
} ; 
// EsQueryBody 查询请求
export type EsQueryBody = { 
  bool?: any;//todo 可能需要手动完善结构;
} ; 
// QueryMust 匹配规则
export type Filter = { 
  range?: any;//todo 可能需要手动完善结构;
  //正则匹配
  regexp?: {[key: string]: any};
} ; 
export type I18N = { 
  zh?: string;
  en?: string;
} ; 
// I18NInfo 国际化
export type I18NInfo = { 
  zh?: string;
  en?: string;
} ; 
//路径所指向的结构体
export type KubernetesResource = {
  apiVersion?: string;
  kind?: string;
  metadata: {
    name: string;
    namespace?: string;
    uid?: string;
    [key: string]: any;
  };
  spec?: any;
  status?: any;
  [key: string]: any;
};
export type WatchEventType = 'ADDED' | 'MODIFIED' | 'DELETED' | 'BOOKMARK';

export interface WatchEvent<T extends KubernetesResource = KubernetesResource> {
  Type: WatchEventType;
  Object: T;
}
//路径所指向的结构体
export type KubernetesResourceList = { 
  items?: KubernetesResource[];
} ; 
// LoginByOIDC OIDC登录
export type LoginByOIDC = { 
  code?: string;
  redirectUri?: string;
  //客户端信息 加密数据
  client?: string;
} ; 
// MonitorPrometheusConfig 监控配置
// 配置集群或者应用系统基于prometheus的监控配置信息
export type MonitorPrometheusConfig = { 
  //Prometheus指标中集群编码 多集群数据共存时使用
  cluster?: string;
  //prometheus地址
  address?: string;
} ; 
//远程地址
export type OidcConfig = { 
  issuer: string;
  clientId: string;
} ; 
// OidcRequestToken oidc认证获取token请求结构
export type OidcRequestToken = { 
  //客户端ID
  client_id: string;
  //客户端密钥
  client_secret: string;
  //类型
  grant_type: string;
  //请求码
  code: string;
  //重定向地址
  redirect_uri?: string;
  //客户端信息 加密数据
  client?: string;
} ; 
// PatchSubsetValue 差异更新
export type PatchSubsetValue = { 
  //操作, 例如: add、remove、replace、
  op: string;
  //到什么路径，列如下面的: /spec/subset 从 / 下开始这里的位置就是根据具体的配置
  path: string;
  //路径所指向的结构体
  value: any;//todo 可能需要手动完善结构;
} ; 
// QueryMust 匹配规则
export type QueryExist = { 
  exists?: {[key: string]: any};
} ; 
// QueryMust 匹配规则
export type QueryMust = { 
  match_phrase?: {[key: string]: any};
  match?: {[key: string]: any};
} ; 
export type QueryParam = { 
  time?: number;
  view: string;
  code: string;
  namespace?: string;
  node?: string;
  pod?: string;
  workload?: string;
  workloadType?: string;
  start?: number;
  end?: number;
  step?: string;
} ; 
// QueryMust 匹配规则
export type QueryWildcard = { 
  wildcard?: {[key: string]: any};
} ; 
// RequestParameter 请求参数
// 在部署时用户提交的参数，提交的是某个操作模版中使用ParameterDefinition定义的参数，
export type RequestParameter = { 
  //变量名
  key?: string;
  //变量值
  val?: string;
} ; 
// ResponseError 错误响应
export type ResponseError = { 
  //错误英文编码
  message?: string;
  //错误详情信息
  detail?: string;
  //支持I18N的提示信息
  alert?: string;
  //当前请求地址
  requestUri?: string;
} ; 
// S3StorageConfig 对象存储配置
export type S3StorageConfig = { 
  //地址
  endpoint?: string;
  //accessKeyId
  accessKeyId?: string;
  //secretAccessKey
  secretAccessKey?: string;
  //token
  token?: string;
  //insecure
  insecure: boolean;
  //region
  region?: string;
} ; 
// Status 修改记录状态
export type Status = { 
  //主键
  ids: string[];
  //是否有效
  //默认值: true
  enable: boolean;
} ; 
// TableListPagination 分页信息
export type TableListPagination = { 
  //总数
  total?: number;
  //每页数量
  pageSize?: number;
  //当前页
  current?: number;
  //名称
  name?: string;
  //编码
  code?: string;
  //搜索
  search?: string;
} ; 
// UserAgentInformation 获取浏览器等客户端信息
export type UserAgentInformation = { 
  //平台 如"MacIntel"、"Win32"、"Linux x86_64"、"Linux armv81"
  platform?: string;
  //供应商
  vendor?: string;
  //客户端代理
  userAgent?: string;
  //CPU核数
  hardwareConcurrency?: number;
  //浏览器
  browser?: string;
  //客户端地址
  remote?: string;
  //平台细节
  platformDetail?: string;
  //内存大小(G)
  deviceMemory?: number;
} ; 
//客户端信息 加密数据
export type UserClaims = { 
  //组织用户ID
  id: string;
  eAuthId?: string;
  // 用户名 组织内唯一必须由DNS-1123标签格式的单元组成
  username?: string;
  // 昵称，如中文名
  nickname?: string;
  // 系统角色
  role?: string;
  nonce?: string;
  email?: string;
  phone?: string;
} ; 
// 系统角色
export type WebsocketUserInfo = { 
  userId?: string;
  timeStamp?: string;
} ; 
// AnyJsonData 任意json数据
export type WorkspaceBatchOperationIds = { 
  workspaceId?: string;
  ids: string[];
} ; 
