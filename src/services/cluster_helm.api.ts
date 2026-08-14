import { request } from '@umijs/max';

import { HelmValues } from './kubernetes.d';

//卸载helm部署的应用
//卸载helm部署的应用
//请求方法: DELETE
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/helm{namespace}/release/{release}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: release 参数类型: string 参数位置: path 是否必须: true  参数说明: 需要卸载的Release
export async function helmUninstallRelease(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    release: string;// 需要卸载的Release
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, release, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/helm${namespace}/release/${release}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取Namespace中helm部署的应用
//获取Namespace中helm部署的应用，根据secret来获取，会对同一个应用不同历史去重,返回release信息
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/helm{namespace}/release
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
export async function helmRelease(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/helm${namespace}/release`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取Namespace中helm部署的应用部署历史
//获取Namespace中helm部署的应用部署历史
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/helm{namespace}/release/history/{release}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: release 参数类型: string 参数位置: path 是否必须: true  参数说明: Release名称
export async function helmInstallHistory(
  params: {
    namespace: string;// Namespace
    release: string;// Release名称
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, release, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/helm${namespace}/release/history/${release}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取values.yaml.yaml
//卸载helm部署的应用
//请求方法: POST
//请求地址: /api/v1/helm/values.yaml
export async function getHelmValues<HelmValues>(  data: HelmValues,   options?: { [key: string]: any }) {
  return request<HelmValues>(`/api/v1/helm/values.yaml`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...(options || {}),
  });
}
