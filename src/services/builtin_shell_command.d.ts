// BuiltinShellCommandCreate 内置命名创建
// 管理员可以根据需要创建任何shell命令
export type BuiltinShellCommandCreate = { 
  //命令名称
  //最大长度: 50
  name: string;
  //命令说明
  //最大长度: 255
  description?: string;
  //命令内容:支持模板化参数
  command: string;
} ; 
// BuiltinShellCommandDetail 内置的shell命令详情
// 用户可以选择内置的命令快速实现对容器的运维，同时减少手动输入错误的可能性
export type BuiltinShellCommandDetail = { 
  //主键
  //最大长度: 50
  id: string;
  //创建时间
  createdAt: string;
  //修改时间
  updatedAt: string;
  //创建者
  //最大长度: 50
  creatorId: string;
  //更新者
  //最大长度: 50
  updaterId: string;
  //软删除
  deletedAt?: string;
  //命令名称
  //最大长度: 50
  name: string;
  //命令说明
  //最大长度: 255
  description?: string;
  //命令内容:支持模板化参数
  command: string;
} ; 
// BuiltinShellCommandDetailList 内建shell命令列表响应
export type BuiltinShellCommandDetailList = { 
  //当前页数据
  data?: BuiltinShellCommandDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
//命令内容:支持模板化参数
export type BuiltinShellCommandUpdate = { 
  //主键
  //最大长度: 50
  id: string;
  //命令名称
  //最大长度: 50
  name: string;
  //命令说明
  //最大长度: 255
  description?: string;
  //命令内容:支持模板化参数
  command: string;
} ; 
