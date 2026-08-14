import { TemplateClusterRoleRule } from './kubernetes.d';
// AuthorizeByAccount 用户授权
export type AuthorizeByAccount = { 
  //类型
  category: string;
  //模版名称
  templates: string[];
  //命名空间列表 ,类型为Role时有效
  namespaces: string[];
  //用户ID
  accountId: string;
  //临时权限
  isTemp: boolean;
  //开始时间
  startTime: string;
  //结束时间
  endTime: string;
} ; 
// ClusterAuthorizeByTemplate 模版授权
export type ClusterAuthorizeByTemplate = { 
  //角色
  templateId?: string;
  //用户ID列表
  accountIds: string[];
} ; 
//数据库满足条件的数据总数
export type ClusterRoleTemplate = { 
  //角色类型
  //最大长度: 255
  category: string;
  //角色名称,从模板中获取
  //最大长度: 50
  name: string;
  //角色规则
  rule: TemplateClusterRoleRule;
  //角色描述
  //最大长度: 255
  description: string;
} ; 
// ClusterRoleTemplateList 集群角色模版
export type ClusterRoleTemplateList = { 
  //当前页数据
  data?: ClusterRoleTemplate[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
// NamespaceAuthorizeByTemplate 模版授权
export type NamespaceAuthorizeByTemplate = { 
  //模版ID
  templateId: string;
  //命名空间列表 ,类型为Role时有效
  namespaces: string[];
  //用户ID列表
  accountIds: string[];
} ; 
