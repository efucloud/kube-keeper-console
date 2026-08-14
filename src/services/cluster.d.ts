import { ClusterExtendConfig } from './common.d';
import { KubernetesVersion } from './kubernetes.d';
// ClusterCreate 集群创建
export type ClusterCreate = { 
  //集群编码
  //最大长度: 50
  code: string;
  //集群名称
  //最大长度: 50
  name: string;
  //是否有效
  //默认值: true
  enable: boolean;
  //集群类型
  //最大长度: 50
  category: string;
  //描述
  //最大长度: 255
  description?: string;
  //apiserver地址
  //最大长度: 255
  apiServer: string;
  //集群CA证书:Base64编码，若为编码，则自动编码为base64
  certificateAuthority?: string;
  //CA过期时间
  expireTime: string;
  //集群管理员用户客户端证书，Base64编码，若为编码，则自动编码为base64"
  clientCertificate: string;
  //集群管理员用户客户端Key，Base64编码，若为编码，则自动编码为base64
  clientKey: string;
  //域名列表:用于模版部署时提示使用
  domainList?: string[];
  //扩展配置信息
  extendConfig?: ClusterExtendConfig;
} ; 
// ClusterDetail 集群
export type ClusterDetail = { 
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
  //集群编码
  //最大长度: 50
  code: string;
  //集群名称
  //最大长度: 50
  name: string;
  //是否有效
  //默认值: true
  enable: boolean;
  //集群类型
  //最大长度: 50
  category: string;
  //集群版本
  version?: KubernetesVersion;
  //描述
  //最大长度: 255
  description?: string;
  //apiserver地址
  //最大长度: 255
  apiServer: string;
  //CA过期时间
  expireTime: string;
  //域名列表:用于模版部署时提示使用
  domainList?: string[];
  //扩展配置信息
  extendConfig?: ClusterExtendConfig;
  //Features
  features?: string[];
} ; 
// ClusterDetailList 集群列表响应
export type ClusterDetailList = { 
  //当前页数据
  data?: ClusterDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
//Features
export type ClusterRegistry = { 
  //集群编码
  //最大长度: 50
  code: string;
  //集群名称
  //最大长度: 50
  name: string;
  //集群类型
  //最大长度: 50
  category: string;
  //apiserver地址
  //最大长度: 255
  apiServer: string;
  //集群CA证书:Base64编码，若为编码，则自动编码为base64
  certificateAuthority?: string;
  //客户端证书
  clientCertificate: string;
  //集群管理员用户客户端Key，Base64编码，若为编码，则自动编码为base64
  clientKey: string;
  //域名列表:用于模版部署时提示使用
  domainList?: string[];
} ; 
// ClusterStatus  集群启用禁用
export type ClusterStatus = { 
  //主键
  ids: string[];
  //是否有效
  //默认值: true
  enable: boolean;
} ; 
// ClusterUpdate 集群修改
export type ClusterUpdate = { 
  //主键
  //最大长度: 50
  id: string;
  //集群编码
  //最大长度: 50
  code: string;
  //集群名称
  //最大长度: 50
  name: string;
  //是否有效
  //默认值: true
  enable: boolean;
  //集群类型
  //最大长度: 50
  category: string;
  //描述
  //最大长度: 255
  description?: string;
  //apiserver地址
  //最大长度: 255
  apiServer: string;
  //集群CA证书:Base64编码，若为编码，则自动编码为base64
  certificateAuthority?: string;
  //CA过期时间
  expireTime: string;
  //集群管理员用户客户端证书，Base64编码，若为编码，则自动编码为base64"
  clientCertificate?: string;
  //集群管理员用户客户端Key，Base64编码，若为编码，则自动编码为base64
  clientKey?: string;
  //域名列表:用于模版部署时提示使用
  domainList?: string[];
  //扩展配置信息
  extendConfig?: ClusterExtendConfig;
  //更新链接信息
  updateConnect: boolean;
  //Features
  features?: string[];
} ; 
// ClusterUpdateFeatures 集群特性修改
export type ClusterUpdateFeatures = { 
  //主键
  //最大长度: 50
  id: string;
  //Features
  features?: string[];
} ; 
// ShortClusterDetail 集群
export type ShortClusterDetail = { 
  //主键
  //最大长度: 50
  id: string;
  //集群编码
  //最大长度: 50
  code: string;
  //集群名称
  //最大长度: 50
  name: string;
  //是否有效
  //默认值: true
  enable: boolean;
  //集群类型
  //最大长度: 50
  category: string;
  //集群版本
  version?: KubernetesVersion;
  //描述
  //最大长度: 255
  description?: string;
  //Features
  features?: string[];
} ; 
