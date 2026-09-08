import { request } from '@umijs/max';

import { BatchOperationIds } from './common.d';
import { HelmRepositoryCreate, HelmRepositoryDetail, HelmRepositoryDetailList, HelmRepositoryUpdate } from './helm_repository.d';
import { HelmStoreValues } from './helm_store.d';

//删除Helm仓库
//
//请求方法: DELETE
//请求地址: /api/v1/helm-repository
export async function deleteHelmRepository(  data: BatchOperationIds,   options?: { [key: string]: any }) {
  return request(`/api/v1/helm-repository`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...(options || {}),
  });
}
//获取Helm仓库管理列表
//
//请求方法: GET
//请求地址: /api/v1/helm-repository
//参数名: current 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: pageSize 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
export async function listHelmRepository<HelmRepositoryDetailList>(
  params: {
    current?: number;// 页码
    pageSize?: number;// 每页大小
  },
  options?: { [key: string]: any }) {
  return request<HelmRepositoryDetailList>(`/api/v1/helm-repository`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: params,
    ...(options || {}),
  });
}
//立即同步Helm仓库
//
//请求方法: GET
//请求地址: /api/v1/helm-repository/{id}/sync
//参数名: id 参数类型: string 参数位置: path 是否必须: true  参数说明: 仓库ID
export async function syncHelmRepository<HelmRepositoryDetail>(
  params: {
    id: string;// 仓库ID
  },
  options?: { [key: string]: any }) {
  const { id, ...rest } = params;
  return request<HelmRepositoryDetail>(`/api/v1/helm-repository/${id}/sync`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取Helm Chart列表
//
//请求方法: GET
//请求地址: /api/v1/helm-store/charts
//参数名: current 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: pageSize 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
//参数名: repository 参数类型: string 参数位置: query 是否必须: false  参数说明: 仓库ID
//参数名: search 参数类型: string 参数位置: query 是否必须: false  参数说明: Chart名称、描述或关键字
export async function listHelmStoreCharts<ChartList>(
  params: {
    current?: number;// 页码
    pageSize?: number;// 每页大小
    repository?: string;// 仓库ID
    search?: string;// Chart名称、描述或关键字
  },
  options?: { [key: string]: any }) {
  return request<ChartList>(`/api/v1/helm-store/charts`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: params,
    ...(options || {}),
  });
}
//获取Helm Chart详情
//
//请求方法: GET
//请求地址: /api/v1/helm-store/charts/{repository}/{chart}
//参数名: chart 参数类型: string 参数位置: path 是否必须: true  参数说明: Chart名称
//参数名: repository 参数类型: string 参数位置: path 是否必须: true  参数说明: 仓库ID
export async function getHelmStoreChart<ChartDetail>(
  params: {
    chart: string;// Chart名称
    repository: string;// 仓库ID
  },
  options?: { [key: string]: any }) {
  const { chart, repository, ...rest } = params;
  return request<ChartDetail>(`/api/v1/helm-store/charts/${repository}/${chart}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取Helm Chart原始values.yaml
//
//请求方法: GET
//请求地址: /api/v1/helm-store/charts/{repository}/{chart}/{version}/values
//参数名: chart 参数类型: string 参数位置: path 是否必须: true  参数说明: Chart名称
//参数名: repository 参数类型: string 参数位置: path 是否必须: true  参数说明: 仓库ID
//参数名: version 参数类型: string 参数位置: path 是否必须: true  参数说明: Chart版本
export async function getHelmStoreChartValues<HelmStoreValues>(
  params: {
    chart: string;// Chart名称
    repository: string;// 仓库ID
    version: string;// Chart版本
  },
  options?: { [key: string]: any }) {
  const { chart, repository, version, ...rest } = params;
  return request<HelmStoreValues>(`/api/v1/helm-store/charts/${repository}/${chart}/${version}/values`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取可用Helm仓库
//
//请求方法: GET
//请求地址: /api/v1/helm-store/repositories
export async function listHelmStoreRepositories(  options?: { [key: string]: any }) {
  return request(`/api/v1/helm-store/repositories`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}
//新增Helm仓库
//
//请求方法: POST
//请求地址: /api/v1/helm-repository
export async function createHelmRepository<HelmRepositoryDetail>(  data: HelmRepositoryCreate,   options?: { [key: string]: any }) {
  return request<HelmRepositoryDetail>(`/api/v1/helm-repository`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...(options || {}),
  });
}
//更新Helm仓库
//
//请求方法: PUT
//请求地址: /api/v1/helm-repository
export async function updateHelmRepository<HelmRepositoryDetail>(  data: HelmRepositoryUpdate,   options?: { [key: string]: any }) {
  return request<HelmRepositoryDetail>(`/api/v1/helm-repository`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...(options || {}),
  });
}
