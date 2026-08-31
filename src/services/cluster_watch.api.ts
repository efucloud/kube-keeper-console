import { request } from '@umijs/max';


//集群资源流式监听（NDJSON 格式）
//返回 newline-delimited JSON (NDJSON) 流，每行一个事件对象。客户端需处理长连接和重连。
//请求方法: GET
//请求地址: /api/stream/cluster/{cluster}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: fieldSelector 参数类型: string 参数位置: query 是否必须: false  参数说明: FieldSelector
//参数名: group 参数类型: string 参数位置: query 是否必须: false  参数说明: Group
//参数名: labelSelector 参数类型: string 参数位置: query 是否必须: false  参数说明: LabelSelector
//参数名: resource 参数类型: string 参数位置: query 是否必须: false  参数说明: Resource
//参数名: version 参数类型: string 参数位置: query 是否必须: false  参数说明: Version
export async function streamWatchClusterScope(
  params: {
    cluster: string;// 集群编码
    version?: string;// Version
    fieldSelector?: string;// FieldSelector
    labelSelector?: string;// LabelSelector
    resource?: string;// Resource
    group?: string;// Group
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/stream/cluster/${cluster}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//集群资源流式监听（NDJSON 格式）
//返回 newline-delimited JSON (NDJSON) 流，每行一个事件对象。客户端需处理长连接和重连。
//请求方法: GET
//请求地址: /api/stream/cluster/{cluster}/namespace/{namespace}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: fieldSelector 参数类型: string 参数位置: query 是否必须: false  参数说明: FieldSelector
//参数名: group 参数类型: string 参数位置: query 是否必须: false  参数说明: Group
//参数名: labelSelector 参数类型: string 参数位置: query 是否必须: false  参数说明: LabelSelector
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: 命名空间
//参数名: resource 参数类型: string 参数位置: query 是否必须: false  参数说明: Resource
//参数名: version 参数类型: string 参数位置: query 是否必须: false  参数说明: Version
export async function streamWatchNamespaceScope(
  params: {
    cluster: string;// 集群编码
    namespace: string;// 命名空间
    group?: string;// Group
    version?: string;// Version
    fieldSelector?: string;// FieldSelector
    labelSelector?: string;// LabelSelector
    resource?: string;// Resource
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, ...rest } = params;
  return request(`/api/stream/cluster/${cluster}/namespace/${namespace}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
