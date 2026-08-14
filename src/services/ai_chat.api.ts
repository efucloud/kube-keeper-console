import { request } from '@umijs/max';


//AI助手
//
//请求方法: POST
//请求地址: /api/stream/cluster/{cluster}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function postaiChat(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/stream/cluster/${cluster}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//AI助手
//
//请求方法: POST
//请求地址: /api/stream/cluster/{cluster}/namespace/{namespace}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function postaiChat(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/stream/cluster/${cluster}/namespace/{namespace}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
