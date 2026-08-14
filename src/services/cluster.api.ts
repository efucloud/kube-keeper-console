import { request } from '@umijs/max';

import { ClusterDetailList, ClusterDetail, ClusterCreate, ClusterRegistry, ClusterStatus, ClusterUpdate } from './cluster.d';
import { ClusterAccountDetailList } from './cluster_account.d';
import { KubernetesVersion, ClusterServerGroupChecks } from './kubernetes.d';
import { ClusterDashboard } from './dashboard.d';
import { BatchOperationIds, ClusterAdmin, QueryParam } from './common.d';

//删除集群
//删除集群信息，删除集群将会删除系统中跟集群关联的所有信息，但不会删除集群的任何信息，包括自动创建的csr以及相关资源的labels和annotations
//请求方法: DELETE
//请求地址: /api/v1/cluster
export async function deleteCluster(  data: BatchOperationIds,   options?: { [key: string]: any }) {
  return request(`/api/v1/cluster`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...(options || {}),
  });
}
//删除集群创建管理员
//删除集群建管理员,此处会提权使用集群配置信息来创建clientset
//请求方法: DELETE
//请求地址: /api/v1/cluster/supper/user/{cluster}/{id}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: id 参数类型: string 参数位置: path 是否必须: true  参数说明: 数据库ID
export async function deleteClusterUser(
  params: {
    cluster: string;// 集群编码
    id: string;// 数据库ID
  },
  options?: { [key: string]: any }) {
  const { cluster, id, ...rest } = params;
  return request(`/api/v1/cluster/supper/user/${cluster}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取集群列表
//获取集群信息
//请求方法: GET
//请求地址: /api/v1/cluster
//参数名: category 参数类型: string 参数位置: query 是否必须: false  参数说明: 集群类型
//参数名: code 参数类型: string 参数位置: query 是否必须: false  参数说明: 编码
//参数名: name 参数类型: string 参数位置: query 是否必须: false  参数说明: 用户名
//参数名: order 参数类型: string 参数位置: query 是否必须: false  参数说明: 排序
//参数名: page 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: search 参数类型: string 参数位置: query 是否必须: false  参数说明: 搜索
//参数名: size 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
export async function listCluster<ClusterDetailList>(
  params: {
    page?: number;// 页码
    size?: number;// 每页大小
    order?: string;// 排序
    name?: string;// 用户名
    code?: string;// 编码
    search?: string;// 搜索
    category?: string;// 集群类型
  },
  options?: { [key: string]: any }) {
  return request<ClusterDetailList>(`/api/v1/cluster`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: params,
    ...(options || {}),
  });
}
//获取集群详情
//获取集群信息详情
//请求方法: GET
//请求地址: /api/v1/cluster/code/{code}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function getClusterByCode<ClusterDetail>(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterDetail>(`/api/v1/cluster/code/{code}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//同步Namespace信息到集群
//同步Namespace信息到集群
//请求方法: GET
//请求地址: /api/v1/cluster/sync-namespace/{cluster}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function syncClusterNamespace(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/sync-namespace/${cluster}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取集群创建管理员
//获取集群创建管理员,此处会提权使用集群配置信息来创建clientset
//请求方法: GET
//请求地址: /api/v1/cluster/user/{cluster}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: page 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: size 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
export async function listClusterUser<ClusterAccountDetailList>(
  params: {
    cluster: string;// 集群编码
    page?: number;// 页码
    size?: number;// 每页大小
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterAccountDetailList>(`/api/v1/cluster/user/${cluster}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取集群APIGroupResources信息
//获取集群APIGroupResources信息
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/api-group-resources
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterApiGroupResources(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/api-group-resources`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//apiResources
//apiResources
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/apiResources
//参数名: category 参数类型: string 参数位置: path 是否必须: true  参数说明: 角色类型
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterApiResources(
  params: {
    cluster: string;// 集群编码
    category: string;// 角色类型
  },
  options?: { [key: string]: any }) {
  const { category, cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/apiResources`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//集群连接测试
//集群连接测试
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/connect/check
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterConnectCheck<KubernetesVersion>(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<KubernetesVersion>(`/api/v1/cluster/${cluster}/connect/check`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//csg
//csg
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/csg
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterServerGroups(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/csg`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取集群信息
//获取集群信息
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/info
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function getClusterInfo<ClusterDetail>(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterDetail>(`/api/v1/cluster/${cluster}/info`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//集群资源总览
//集群资源总览
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/resource/dashboard
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function getClusterResourceDashboard<ClusterDashboard>(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterDashboard>(`/api/v1/cluster/${cluster}/resource/dashboard`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取用户在集群中的权限信息
//获取用户在集群中的权限信息
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/role/rbac
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: kind 参数类型: string 参数位置: query 是否必须: false  参数说明: 角色类型
//参数名: name 参数类型: string 参数位置: query 是否必须: false  参数说明: 用户名或Group名或ServiceAccount
//参数名: namespace 参数类型: string 参数位置: query 是否必须: false  参数说明: Namespace，在name为ServiceAccount时有效
export async function getClusterRoleRbac(
  params: {
    cluster: string;// 集群编码
    name?: string;// 用户名或Group名或ServiceAccount
    namespace?: string;// Namespace，在name为ServiceAccount时有效
    kind?: string;// 角色类型
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/role/rbac`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//serverGroups
//serverGroups
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/serverGroups
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function serverGroups(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/serverGroups`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//serverPreferredNamespacedResources
//serverPreferredNamespacedResources
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/serverPreferredNamespacedResources
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function serverPreferredNamespacedResources(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/serverPreferredNamespacedResources`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//serverResources
//serverResources
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/serverResources
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function serverResources(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/serverResources`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取用户详情
//获取用户信息详情
//请求方法: GET
//请求地址: /api/v1/cluster/{id}
//参数名: id 参数类型: string 参数位置: path 是否必须: true  参数说明: 记录ID
export async function getClusterById<ClusterDetail>(
  params: {
    id: string;// 记录ID
  },
  options?: { [key: string]: any }) {
  const { id, ...rest } = params;
  return request<ClusterDetail>(`/api/v1/cluster/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//同步集群特性
//同步集群特性
//请求方法: GET
//请求地址: /api/v1/features/{cluster}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function syncClusterFeatures(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/features/${cluster}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取集群的入站规则类
//获取集群的入站规则类
//请求方法: GET
//请求地址: /api/v1/ingress-class/{cluster}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function getClusterIngressClass(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/ingress-class/${cluster}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取集群的存储类
//获取集群的存储类
//请求方法: GET
//请求地址: /api/v1/storage-class/{cluster}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function getClusterStorageClass(
  params: {
    cluster: string;// 集群编码
  },
  options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/storage-class/${cluster}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//创建集群
//创建集群，若集群没有跟应用一致的认证，需要为组织拥有者创建csr
//请求方法: POST
//请求地址: /api/v1/cluster
export async function createCluster<ClusterDetail>(  data: ClusterCreate,   options?: { [key: string]: any }) {
  return request<ClusterDetail>(`/api/v1/cluster`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...(options || {}),
  });
}
//集群自动注册
//集群自动注册
//请求方法: POST
//请求地址: /api/v1/cluster/auto-registry
export async function autoRegistry<ClusterDetail>(  data: ClusterRegistry,   options?: { [key: string]: any }) {
  return request<ClusterDetail>(`/api/v1/cluster/auto-registry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...(options || {}),
  });
}
//启用禁用
//启用禁用,修改账户状态
//请求方法: POST
//请求地址: /api/v1/cluster/status
export async function changeClusterStatus(  data: ClusterStatus,   options?: { [key: string]: any }) {
  return request(`/api/v1/cluster/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...(options || {}),
  });
}
//为集群创建管理员
//为集群创建管理员,此处会提权使用集群配置信息来创建clientset
//请求方法: POST
//请求地址: /api/v1/cluster/supper/user/{cluster}
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function createClusterSupperUser(
  params: {
    cluster: string;// 集群编码
  },
  data: ClusterAdmin,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/supper/user/${cluster}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//检查资源类型在集群是否存在
//检查资源类型在集群是否存在
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/csgCheck
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterServerGroupsCheck<ClusterServerGroupChecks>(
  params: {
    cluster: string;// 集群编码
  },
  data: ClusterServerGroupChecks,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<ClusterServerGroupChecks>(`/api/v1/cluster/${cluster}/csgCheck`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//集群Prometheus指标获取
//集群Prometheus指标获取
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/monitor/query
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterMetricsQuery(
  params: {
    cluster: string;// 集群编码
  },
  data: QueryParam,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/monitor/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//集群Prometheus指标获取
//集群Prometheus指标获取
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/monitor/query-range
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterMetricsQueryRange(
  params: {
    cluster: string;// 集群编码
  },
  data: QueryParam,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/monitor/query-range`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//判断用户是否具有某个资源的权限
//判断用户是否具有某个资源的权限，使用用户自己的信息请求集群,使用场景示例：获取namespace列表之前请求判断用户是否有list ns的权限，判断用户是否有ns创建的权限
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/self-subject-access-reviews
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
export async function clusterSelfSubjectAccessReviews<SubjectAccessReviewStatus>(
  params: {
    cluster: string;// 集群编码
  },
  data: ResourceAttributes,   options?: { [key: string]: any }) {
  const { cluster, ...rest } = params;
  return request<SubjectAccessReviewStatus>(`/api/v1/cluster/${cluster}/self-subject-access-reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//更新集群信息
//更新集群信息，更新集群信息不会自动创建集群侧任何资源对象，若集群本身为重建，请先删除集群
//请求方法: PUT
//请求地址: /api/v1/cluster
export async function updateCluster<ClusterDetail>(  data: ClusterUpdate,   options?: { [key: string]: any }) {
  return request<ClusterDetail>(`/api/v1/cluster`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...(options || {}),
  });
}
