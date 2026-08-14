import { request } from '@umijs/max';

import { AuthorizeByAccount, ClusterAuthorizeByTemplate, NamespaceAuthorizeByTemplate } from './cluster_role_template.d';
import { ClusterNamespaceAccountRoleDetailList } from './cluster_namespace_account_role.d';
import { BatchOperationIds } from './common.d';
import { ClusterAccountDetailList, ClusterAccountDetail } from './cluster_account.d';
import { ClusterAccountRoleDetailList } from './cluster_account_role.d';

//删除集群用户
//删除集群用户信息详情
//请求方法: DELETE
//请求地址: /api/v1/cluster/{cluster}/cluster-account
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function deleteClusterAccount(
  params: {
    cluster: string;// 集群编码
  },
  data: BatchOperationIds,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/cluster-account`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//获取集群用户列表
//获取集群用户信息
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/cluster-account
//参数名: accountId 参数类型: string 参数位置: query 是否必须: false  参数说明: 组织用户ID
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: isSupper 参数类型: string 参数位置: query 是否必须: false  参数说明: 超级管理员
//参数名: name 参数类型: string 参数位置: query 是否必须: false  参数说明: 用户名
//参数名: order 参数类型: string 参数位置: query 是否必须: false  参数说明: 排序
//参数名: page 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: size 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
export async function listClusterAccount<ClusterAccountDetailList>(
  params: {
    cluster: string;// 集群编码
    size?: number;// 每页大小
    order?: string;// 排序
    name?: string;// 用户名
    isSupper?: string;// 超级管理员
    page?: number;// 页码
    accountId?: string;// 组织用户ID
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterAccountDetailList>(`/api/v1/cluster/${cluster}/cluster-account`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取集群用户详情
//获取集群用户信息详情
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/cluster-account/{id}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: id 参数类型: string 参数位置: path 是否必须: true  参数说明: ID
export async function getClusterAccount<ClusterAccountDetail>(
  params: {
    id: string;// ID
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, id, ...rest } = params;
  return request<ClusterAccountDetail>(`/api/v1/cluster/${cluster}/cluster-account/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//用户集群授权
//用户集群授权，支持选择多个角色模版和多个命名空间
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/cluster-account/authorizeClusterByAccount
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterAccountAuthorizeClusterByAccount<ClusterAccountRoleDetailList>(
  params: {
    cluster: string;// 集群编码
  },
  data: AuthorizeByAccount,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterAccountRoleDetailList>(`/api/v1/cluster/${cluster}/cluster-account/authorizeClusterByAccount`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//集群授权
//集群授权，支持选择多个用户和多个角色模版
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/cluster-account/authorizeClusterByTemplate
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterAccountAuthorizeClusterByTemplate<ClusterAccountRoleDetailList>(
  params: {
    cluster: string;// 集群编码
  },
  data: ClusterAuthorizeByTemplate,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterAccountRoleDetailList>(`/api/v1/cluster/${cluster}/cluster-account/authorizeClusterByTemplate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//用户命名空间授权
//用户命名空间授权，支持选择多个角色模版
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/cluster-account/authorizeNamespaceByAccount
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterAccountAuthorizeNamespaceByAccount<ClusterNamespaceAccountRoleDetailList>(
  params: {
    cluster: string;// 集群编码
  },
  data: AuthorizeByAccount,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterNamespaceAccountRoleDetailList>(`/api/v1/cluster/${cluster}/cluster-account/authorizeNamespaceByAccount`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//命名空间授权
//命名空间授权，支持选择多个用户和多个角色模版
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/cluster-account/authorizeNamespaceByTemplate
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterAccountAuthorizeNamespaceByTemplate<ClusterNamespaceAccountRoleDetailList>(
  params: {
    cluster: string;// 集群编码
  },
  data: NamespaceAuthorizeByTemplate,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterNamespaceAccountRoleDetailList>(`/api/v1/cluster/${cluster}/cluster-account/authorizeNamespaceByTemplate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
