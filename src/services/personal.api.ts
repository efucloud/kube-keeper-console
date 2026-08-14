import { request } from '@umijs/max';

import { WorkspaceDetailList } from './workspace.d';
import { ClusterNamespaceDetailList } from './cluster_namespace.d';
import { UserAccessClusterList } from './kubernetes.d';

//获取用户可以访问集群的命名空间列表
//获取用户可以访问集群的命名空间列表
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/personal/namespace/list
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: current 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: order 参数类型: string 参数位置: query 是否必须: false  参数说明: 排序
//参数名: pageSize 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
//参数名: search 参数类型: string 参数位置: query 是否必须: false  参数说明: 命名空间
export async function canAccessClusterNamespaces<ClusterNamespaceDetailList>(
  params: {
    cluster: string;// 集群编码
    current?: number;// 页码
    pageSize?: number;// 每页大小
    order?: string;// 排序
    search?: string;// 命名空间
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterNamespaceDetailList>(`/api/v1/cluster/${cluster}/personal/namespace/list`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取用户可以访问的集群
//获取用户可以访问的集群
//请求方法: GET
//请求地址: /api/v1/personal/cluster/list
//参数名: current 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: order 参数类型: string 参数位置: query 是否必须: false  参数说明: 排序
//参数名: pageSize 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
//参数名: search 参数类型: string 参数位置: query 是否必须: false  参数说明: 集群名称或者编码
export async function canAccessClusters<UserAccessClusterList>(
  params: {
    current?: number;// 页码
    pageSize?: number;// 每页大小
    order?: string;// 排序
    search?: string;// 集群名称或者编码
  },
  options?: { [key: string]: any }) {
  return request<UserAccessClusterList>(`/api/v1/personal/cluster/list`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: params,
    ...(options || {}),
  });
}
//获取用户可以访问的工作空间
//获取用户可以访问的工作空间
//请求方法: GET
//请求地址: /api/v1/personal/workspace/list
//参数名: current 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: order 参数类型: string 参数位置: query 是否必须: false  参数说明: 排序
//参数名: pageSize 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
//参数名: search 参数类型: string 参数位置: query 是否必须: false  参数说明: 工作空间名称或者编码
export async function canAccessWorkspaces<WorkspaceDetailList>(
  params: {
    search?: string;// 工作空间名称或者编码
    current?: number;// 页码
    pageSize?: number;// 每页大小
    order?: string;// 排序
  },
  options?: { [key: string]: any }) {
  return request<WorkspaceDetailList>(`/api/v1/personal/workspace/list`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: params,
    ...(options || {}),
  });
}
//获取工作空间下的命名空间
//获取工作空间下的命名空间
//请求方法: GET
//请求地址: /api/v1/personal/workspace/{workspace}/namespace/list
//参数名: current 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: namespace 参数类型: string 参数位置: query 是否必须: false  参数说明: 命名空间
//参数名: order 参数类型: string 参数位置: query 是否必须: false  参数说明: 排序
//参数名: pageSize 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
//参数名: workspace 参数类型: string 参数位置: path 是否必须: true  参数说明: 工作空间编码
export async function getWorkspaceNamespaces<ClusterNamespaceDetailList>(
  params: {
    workspace: string;// 工作空间编码
    current?: number;// 页码
    pageSize?: number;// 每页大小
    order?: string;// 排序
    namespace?: string;// 命名空间
  },
  options?: { [key: string]: any }) {
  const { workspace, ...rest } = params;
  return request<ClusterNamespaceDetailList>(`/api/v1/personal/workspace/${workspace}/namespace/list`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
