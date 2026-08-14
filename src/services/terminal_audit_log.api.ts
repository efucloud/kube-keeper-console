import { request } from '@umijs/max';

import { TerminalAuditLogDetailList } from './terminal_audit_log.d';

//获取集群Pod终端审计日志列表
//获取集群Pod终端审计日志信息
//请求方法: GET
//请求地址: /api/v1/proxy/{cluster}/terminal-audit-log
//参数名: accountId 参数类型: number 参数位置: query 是否必须: false  参数说明: 用户id
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: query 是否必须: false  参数说明: 容器
//参数名: namespace 参数类型: string 参数位置: query 是否必须: false  参数说明: 集群命名空间
//参数名: order 参数类型: string 参数位置: query 是否必须: false  参数说明: 排序
//参数名: page 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: pod 参数类型: string 参数位置: query 是否必须: false  参数说明: 集群Pod
//参数名: size 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
export async function listTerminalAuditLog<TerminalAuditLogDetailList>(
  params: {
    cluster: string;// 集群编码
    container?: string;// 容器
    page?: number;// 页码
    order?: string;// 排序
    accountId?: number;// 用户id
    size?: number;// 每页大小
    namespace?: string;// 集群命名空间
    pod?: string;// 集群Pod
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<TerminalAuditLogDetailList>(`/api/v1/proxy/${cluster}/terminal-audit-log`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
