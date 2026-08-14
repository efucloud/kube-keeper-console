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
//流式获取日志
//流式获取日志
//请求方法: GET
//请求地址: /api/stream/cluster/{cluster}/namespaces/{namespace}/pods/{pod}/logs
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: query 是否必须: false  参数说明: Container name (required)
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod namespace
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod name
//参数名: previous 参数类型: boolean 参数位置: query 是否必须: false  参数说明: 奔溃前的日志
//参数名: sinceSeconds 参数类型: number 参数位置: query 是否必须: false  参数说明: Only return logs newer than this duration
//参数名: tailLines 参数类型: number 参数位置: query 是否必须: false  参数说明: Number of recent lines to fetch
export async function streamPodContainerLogs(
  params: {
    namespace: string;// Pod namespace
    pod: string;// Pod name
    cluster: string;// 集群编码
    container?: string;// Container name (required)
    tailLines?: number;// Number of recent lines to fetch
    previous?: boolean;// 奔溃前的日志
    sinceSeconds?: number;// Only return logs newer than this duration
  },
  options?: { [key: string]: any }) {
  const { cluster, namespace, pod, ...rest } = params;
  return request(`/api/stream/cluster/${cluster}/namespaces/${namespace}/pods/${pod}/logs`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
