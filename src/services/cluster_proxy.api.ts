import { request } from '@umijs/max';

import { KubernetesResource } from './common.d';

//集群DELETE请求代理
//集群DELETE请求代理，本应用做认证后获取用户信息，并根据用户信息使用对应的kubeconfig连接集群
//请求方法: DELETE
//请求地址: /api/v1/proxy/{cluster}/{address:*}
//参数名: address 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群地址,https://192.168.64.15:8443/{address:*}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterDeleteProxy(
  params: {
    cluster: string;// 集群编码
    address: string;// 集群地址,https://192.168.64.15:8443/{address:*}
  },
  options?: { [key: string]: any }) {
  const { address, cluster, ...rest } = params;
  return request(`/api/v1/proxy/${cluster}/${address}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//集群GET请求代理
//集群GET请求代理，本应用做认证后获取用户信息，并根据用户信息使用对应的kubeconfig连接集群
//请求方法: GET
//请求地址: /api/v1/proxy/{cluster}/{address:*}
//参数名: address 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群地址,https://192.168.64.15:8443/{address:*}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterGetProxy(
  params: {
    cluster: string;// 集群编码
    address: string;// 集群地址,https://192.168.64.15:8443/{address:*}
  },
  options?: { [key: string]: any }) {
  const { address, cluster, ...rest } = params;
  return request(`/api/v1/proxy/${cluster}/${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//集群PATCH请求代理，需要注意请求头的改变目前只支持：application/json-patch+json
//集群PATCH请求代理，本应用做认证后获取用户信息，并根据用户信息使用对应的kubeconfig连接集群,例如增加namespace的label
//请求方法: PATCH
//请求地址: /api/v1/proxy/{cluster}/{address:*}
//参数名: address 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群地址,https://192.168.64.15:8443/{address:*}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterPatchProxy(
  params: {
    cluster: string;// 集群编码
    address: string;// 集群地址,https://192.168.64.15:8443/{address:*}
  },
  data: any,   options?: { [key: string]: any }) {
  const { address, cluster, ...rest } = params;
  return request(`/api/v1/proxy/${cluster}/${address}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json-patch+json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//集群POST请求代理
//集群POST请求代理，本应用做认证后获取用户信息，并根据用户信息使用对应的kubeconfig连接集群
//请求方法: POST
//请求地址: /api/v1/proxy/{cluster}/{address:*}
//参数名: address 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群地址,https://192.168.64.15:8443/{address:*}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterPostProxy(
  params: {
    cluster: string;// 集群编码
    address: string;// 集群地址,https://192.168.64.15:8443/{address:*}
  },
  data: KubernetesResource,   options?: { [key: string]: any }) {
  const { address, cluster, ...rest } = params;
  return request(`/api/v1/proxy/${cluster}/${address}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//集群PUT请求代理，建议使用PATCH进行数据更新
//集群PUT请求代理，本应用做认证后获取用户信息，并根据用户信息使用对应的kubeconfig连接集群
//请求方法: PUT
//请求地址: /api/v1/proxy/{cluster}/{address:*}
//参数名: address 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群地址,https://192.168.64.15:8443/{address:*}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterPutProxy(
  params: {
    address: string;// 集群地址,https://192.168.64.15:8443/{address:*}
    cluster: string;// 集群编码
  },
  data: KubernetesResource,   options?: { [key: string]: any }) {
  const { address, cluster, ...rest } = params;
  return request(`/api/v1/proxy/${cluster}/${address}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
