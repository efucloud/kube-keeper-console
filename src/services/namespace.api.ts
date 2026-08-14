import { request } from '@umijs/max';

import { NamespaceDashboard } from './dashboard.d';
import { NamespaceBindWorkspace } from './kubernetes.d';

//命名空间删除
//命名空间删除，前端在调用集群删除命名空间接口后调用，用于清理系统中集群命名空间列表和命名空间与工作空间的绑定管理
//请求方法: DELETE
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
export async function namespaceDelete(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//命名空间资源总览
//命名空间资源总览
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/dashboard
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: 命名空间
export async function getClusterNamespaceDashboard<NamespaceDashboard>(
  params: {
    cluster: string;// 集群编码
    namespace: string;// 命名空间
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, ...rest } = params;
  return request<NamespaceDashboard>(`/api/v1/cluster/${cluster}/namespace/${namespace}/dashboard`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//命名空间可以使用的镜像版本信息
//命名空间可以使用的镜像版本信息
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/image/config-file
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: image 参数类型: string 参数位置: query 是否必须: false  参数说明: 参考镜像
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
export async function namespaceImageConfigFile(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    image?: string;// 参考镜像
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/image/config-file`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//镜像tar包下载
//镜像tar包下载
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/image/download
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: image 参数类型: string 参数位置: query 是否必须: false  参数说明: 参考镜像
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
export async function namespaceImageDownload(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    image?: string;// 参考镜像
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/image/download`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取命名空间拉取镜像的密钥
//获取命名空间拉取镜像的密钥
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/image/pull/secrets
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
export async function listNamespaceImagePullSecret(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/image/pull/secrets`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取命名空间可以拉取的镜像仓库信息
//获取命名空间可以拉取的镜像仓库信息
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/image/registries
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
export async function listNamespaceImageRegistries(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/image/registries`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//命名空间可以使用的镜像版本信息
//命名空间可以使用的镜像版本信息
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/image/search
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: image 参数类型: string 参数位置: query 是否必须: false  参数说明: 参考镜像
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
export async function namespaceImageSearch(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    image?: string;// 参考镜像
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/image/search`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//命名空间绑定所属的工作空间
//命名空间绑定所属的工作空间，将会把工作空间管理员设置为命名空间管理员权限
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/namespace/bind/workspace
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function namespacesBindWorkspace(
  params: {
    cluster: string;// 集群编码
  },
  data: NamespaceBindWorkspace,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/bind/workspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//命名空间解绑所属的工作空间
//命名空间解绑所属的工作空间，只清理用户权限相关资源，不清理命名空间其他资源
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/namespace/unbind/workspace
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function namespacesUnBindWorkspace(
  params: {
    cluster: string;// 集群编码
  },
  data: NamespaceBindWorkspace,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/unbind/workspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
