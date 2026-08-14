import { request } from '@umijs/max';

import { PodFileList, PodFilePath, PodFileCreate, PodFileContent, PodFileRename, PodFileUploadInfo } from './pod.d';

//获取pod目录下的文件和文件夹列表
//通过 query 参数 path 获取 pod 当前目录的直接条目，未传时默认为根目录 /。返回值同时包含文件和文件夹，并标识文本/二进制与是否可编辑
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/pod/{pod}/{container}/list-files
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: path 是否必须: true  参数说明: Container
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: path 参数类型: string 参数位置: query 是否必须: false  参数说明: 路径，默认为/
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod
export async function listClusterPodFiles<PodFileList>(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    pod: string;// Pod
    container: string;// Container
    path?: string;// 路径，默认为/
  },
  options?: { [key: string]: any }) {
  const { cluster, container, namespace, pod, ...rest } = params;
  return request<PodFileList>(`/api/v1/cluster/${cluster}/namespace/${namespace}/pod/${pod}/${container}/list-files`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//Pod容器日志
//Pod容器日志
//请求方法: GET
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/pod/{pod}/{container}/log
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: path 是否必须: true  参数说明: Container
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod
//参数名: previous 参数类型: boolean 参数位置: query 是否必须: false  参数说明: Previous
//参数名: sinceSeconds 参数类型: number 参数位置: query 是否必须: false  参数说明: 当前时间往前多少秒
//参数名: sinceTime 参数类型: string 参数位置: query 是否必须: false  参数说明: 从什么时候开始的日志
//参数名: tailLines 参数类型: number 参数位置: query 是否必须: false  参数说明: 最后多少行
//参数名: timestamps 参数类型: boolean 参数位置: query 是否必须: false  参数说明: 显示时间戳
export async function clusterPodContainerLog(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    pod: string;// Pod
    container: string;// Container
    previous?: boolean;// Previous
    sinceSeconds?: number;// 当前时间往前多少秒
    sinceTime?: string;// 从什么时候开始的日志
    timestamps?: boolean;// 显示时间戳
    tailLines?: number;// 最后多少行
  },
  options?: { [key: string]: any }) {
  const { cluster, container, namespace, pod, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/pod/${pod}/${container}/log`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//Pod容器终端
//Pod容器终端
//请求方法: GET
//请求地址: /api/ws/cluster/{cluster}/namespace/{namespace}/pod/{pod}/{container}/terminal
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: command 参数类型: string 参数位置: query 是否必须: false  参数说明: 终端命令
//参数名: container 参数类型: string 参数位置: path 是否必须: true  参数说明: Container
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod
export async function clusterPodContainerTerminal(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    pod: string;// Pod
    container: string;// Container
    command?: string;// 终端命令
  },
  options?: { [key: string]: any }) {
  const { cluster, container, namespace, pod, ...rest } = params;
  return request(`/api/ws/cluster/${cluster}/namespace/${namespace}/pod/${pod}/${container}/terminal`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//新建容器文件或目录
//在容器中创建文件或目录
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/pod/{pod}/{container}/create-file
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: path 是否必须: true  参数说明: Container
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod
export async function createFileToContainer<PodFilePath>(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    pod: string;// Pod
    container: string;// Container
  },
  data: PodFileCreate,   options?: { [key: string]: any }) {
  const { cluster, container, namespace, pod, ...rest } = params;
  return request<PodFilePath>(`/api/v1/cluster/${cluster}/namespace/${namespace}/pod/${pod}/${container}/create-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//删除容器文件或目录
//删除容器中的文件或目录
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/pod/{pod}/{container}/delete-file
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: path 是否必须: true  参数说明: Container
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod
export async function deleteFileFromContainer<PodFilePath>(
  params: {
    container: string;// Container
    cluster: string;// 集群编码
    namespace: string;// Namespace
    pod: string;// Pod
  },
  data: PodFilePath,   options?: { [key: string]: any }) {
  const { cluster, container, namespace, pod, ...rest } = params;
  return request<PodFilePath>(`/api/v1/cluster/${cluster}/namespace/${namespace}/pod/${pod}/${container}/delete-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//下载容器文件
//下载容器文件
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/pod/{pod}/{container}/download-file
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: path 是否必须: true  参数说明: Container
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod
export async function downloadFileFromContainer(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    pod: string;// Pod
    container: string;// Container
  },
  data: PodFilePath,   options?: { [key: string]: any }) {
  const { cluster, container, namespace, pod, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/pod/${pod}/${container}/download-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//读取容器文件内容
//读取容器文件内容，适用于文本文件在线预览和编辑
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/pod/{pod}/{container}/read-file
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: path 是否必须: true  参数说明: Container
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod
export async function readFileContentFromContainer<PodFileContent>(
  params: {
    container: string;// Container
    cluster: string;// 集群编码
    namespace: string;// Namespace
    pod: string;// Pod
  },
  data: PodFilePath,   options?: { [key: string]: any }) {
  const { cluster, container, namespace, pod, ...rest } = params;
  return request<PodFileContent>(`/api/v1/cluster/${cluster}/namespace/${namespace}/pod/${pod}/${container}/read-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//重命名容器文件或目录
//重命名容器中的文件或目录
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/pod/{pod}/{container}/rename-file
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: path 是否必须: true  参数说明: Container
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod
export async function renameFileInContainer<PodFilePath>(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    pod: string;// Pod
    container: string;// Container
  },
  data: PodFileRename,   options?: { [key: string]: any }) {
  const { cluster, container, namespace, pod, ...rest } = params;
  return request<PodFilePath>(`/api/v1/cluster/${cluster}/namespace/${namespace}/pod/${pod}/${container}/rename-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//保存容器文本文件
//保存容器文本文件内容
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/pod/{pod}/{container}/save-file
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: path 是否必须: true  参数说明: Container
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod
export async function saveFileContentToContainer<PodFileContent>(
  params: {
    container: string;// Container
    cluster: string;// 集群编码
    namespace: string;// Namespace
    pod: string;// Pod
  },
  data: PodFileContent,   options?: { [key: string]: any }) {
  const { cluster, container, namespace, pod, ...rest } = params;
  return request<PodFileContent>(`/api/v1/cluster/${cluster}/namespace/${namespace}/pod/${pod}/${container}/save-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//大文件上传
//大文件上传，对文件进行分割上传，最后在容器组装
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/pod/{pod}/{container}/upload-big-file
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: path 是否必须: true  参数说明: Container
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod
export async function uploadBigFileToContainer(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    pod: string;// Pod
    container: string;// Container
  },
  data: PodFileUploadInfo,   options?: { [key: string]: any }) {
  const { cluster, container, namespace, pod, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/pod/${pod}/${container}/upload-big-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
//文件上传
//文件上传
//请求方法: POST
//请求地址: /api/v1/cluster/{cluster}/namespace/{namespace}/pod/{pod}/{container}/upload-file
//参数名: cluster 参数类型: string 参数位置: path 是否必须: true  参数说明: 集群编码
//参数名: container 参数类型: string 参数位置: path 是否必须: true  参数说明: Container
//参数名: namespace 参数类型: string 参数位置: path 是否必须: true  参数说明: Namespace
//参数名: pod 参数类型: string 参数位置: path 是否必须: true  参数说明: Pod
export async function uploadFileToContainer(
  params: {
    cluster: string;// 集群编码
    namespace: string;// Namespace
    pod: string;// Pod
    container: string;// Container
  },
  data: PodFileUploadInfo,   options?: { [key: string]: any }) {
  const { cluster, container, namespace, pod, ...rest } = params;
  return request(`/api/v1/cluster/${cluster}/namespace/${namespace}/pod/${pod}/${container}/upload-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data,
    params: { ...rest },
    ...(options || {}),
  });
}
