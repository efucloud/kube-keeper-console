import { request } from '@umijs/max';

import { ClusterRoleTemplateList } from './cluster_role_template.d';

//
//
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/cluster-role-template
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function listClusterRoleTemplate<ClusterRoleTemplateList>(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterRoleTemplateList>(`/api/v1/cluster/${cluster}/cluster-role-template`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
