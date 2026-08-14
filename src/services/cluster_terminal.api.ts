import { request } from '@umijs/max';

import { ClusterTerminalPodInfo } from './kubernetes.d';

//为用户创建可以使用kubectl等工具的pod
//为用户创建可以使用kubectl等工具的pod，能够自动配置用户的kubeconfig信息
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/terminal
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function createTerminalPod<ClusterTerminalPodInfo>(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterTerminalPodInfo>(`/api/v1/cluster/${cluster}/terminal`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
