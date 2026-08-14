import { request } from '@umijs/max';

import { BatchOperationIds } from './common.d';
import { ClusterAccountRoleDetailList, ClusterAccountRoleDetail, ClusterAccountRoleCreate } from './cluster_account_role.d';

//删除集群用户角色
//删除集群用户角色信息详情
//请求方法: DELETE
//请求地址: /api/v1/cluster/{cluster}/cluster-account-role
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function deleteClusterAccountRole(
  params: {
    cluster: string;// 集群编码
  },
  data: BatchOperationIds,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/cluster-account-role`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//获取集群用户角色列表
//获取集群用户角色信息
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/cluster-account-role
//参数名: accountId 参数类型: string 参数位置: query 是否必须: false  参数说明: 用户Id
//参数名: bindingName 参数类型: string 参数位置: query 是否必须: false  参数说明: 绑定角色
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: isTemp 参数类型: boolean 参数位置: query 是否必须: false  参数说明: 是否临时
//参数名: order 参数类型: string 参数位置: query 是否必须: false  参数说明: 排序
//参数名: page 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: roleName 参数类型: string 参数位置: query 是否必须: false  参数说明: 角色名称
//参数名: size 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
export async function listClusterAccountRole<ClusterAccountRoleDetailList>(
  params: {
    cluster: string;// 集群编码
    page?: number;// 页码
    size?: number;// 每页大小
    accountId?: string;// 用户Id
    order?: string;// 排序
    roleName?: string;// 角色名称
    bindingName?: string;// 绑定角色
    isTemp?: boolean;// 是否临时
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterAccountRoleDetailList>(`/api/v1/cluster/${cluster}/cluster-account-role`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取集群用户角色详情
//获取集群用户角色信息详情
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/cluster-account-role/{id}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: id 参数类型: string 参数位置: path 是否必须: true  参数说明: ID
export async function getClusterAccountRole<ClusterAccountRoleDetail>(
  params: {
    cluster: string;// 集群编码
    id: string;// ID
  },
  options?: { [key: string]: any }) {
  const { cluster, id, ...rest } = params;
  return request<ClusterAccountRoleDetail>(`/api/v1/cluster/${cluster}/cluster-account-role/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//创建集群用户角色
//创建集群用户角色
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/cluster-account-role
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function createClusterAccountRole<ClusterAccountRoleDetail>(
  params: {
    cluster: string;// 集群编码
  },
  data: ClusterAccountRoleCreate,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterAccountRoleDetail>(`/api/v1/cluster/${cluster}/cluster-account-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
