import { request } from '@umijs/max';

import { BuiltinShellCommandDetailList, BuiltinShellCommandDetail, BuiltinShellCommandCreate, BuiltinShellCommandUpdate } from './builtin_shell_command.d';

//删除内置Shell命令
//删除内置Shell命令信息详情
//请求方法: DELETE
//请求地址: /api/v1/builtin-shell-command/{id}
//参数名: id 参数类型: string 参数位置: path 是否必须: true  参数说明: 记录ID
export async function deleteBuiltinShellCommand(
  params: {
    id: string;// 记录ID
  },
  options?: { [key: string]: any }) {
  const { id, ...rest } = params;
  return request(`/api/v1/builtin-shell-command/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//获取内置Shell命令列表
//获取内置Shell命令信息
//请求方法: GET
//请求地址: /api/v1/builtin-shell-command
//参数名: description 参数类型: string 参数位置: query 是否必须: false  参数说明: 命名描述
//参数名: name 参数类型: string 参数位置: query 是否必须: false  参数说明: 内置Shell命令名
//参数名: order 参数类型: string 参数位置: query 是否必须: false  参数说明: 排序
//参数名: page 参数类型: number 参数位置: query 是否必须: false  参数说明: 页码
//参数名: size 参数类型: number 参数位置: query 是否必须: false  参数说明: 每页大小
export async function listBuiltinShellCommand<BuiltinShellCommandDetailList>(
  params: {
    page?: number;// 页码
    size?: number;// 每页大小
    order?: string;// 排序
    name?: string;// 内置Shell命令名
    description?: string;// 命名描述
  },
  options?: { [key: string]: any }) {
  return request<BuiltinShellCommandDetailList>(`/api/v1/builtin-shell-command`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: params,
    ...(options || {}),
  });
}
//获取内置Shell命令详情
//获取内置Shell命令详情
//请求方法: GET
//请求地址: /api/v1/builtin-shell-command/{id}
//参数名: id 参数类型: string 参数位置: path 是否必须: true  参数说明: 记录ID
export async function getBuiltinShellCommand<BuiltinShellCommandDetail>(
  params: {
    id: string;// 记录ID
  },
  options?: { [key: string]: any }) {
  const { id, ...rest } = params;
  return request<BuiltinShellCommandDetail>(`/api/v1/builtin-shell-command/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    params: { ...rest },
    ...(options || {}),
  });
}
//创建内置Shell命令
//创建内置Shell命令信息
//请求方法: POST
//请求地址: /api/v1/builtin-shell-command
export async function createBuiltinShellCommand<BuiltinShellCommandDetail>(  data: BuiltinShellCommandCreate,   options?: { [key: string]: any }) {
  return request<BuiltinShellCommandDetail>(`/api/v1/builtin-shell-command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...(options || {}),
  });
}
//更新内置Shell命令信息
//更新内置Shell命令信息
//请求方法: PUT
//请求地址: /api/v1/builtin-shell-command
export async function updateBuiltinShellCommand<BuiltinShellCommandDetail>(  data: BuiltinShellCommandUpdate,   options?: { [key: string]: any }) {
  return request<BuiltinShellCommandDetail>(`/api/v1/builtin-shell-command`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data,
    ...(options || {}),
  });
}
