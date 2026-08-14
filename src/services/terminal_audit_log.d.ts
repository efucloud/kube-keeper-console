import { AccountDetail } from './account.d';
// TerminalAuditLogCreate 集群终端审计日志
// 通过web terminal操作日志记录
export type TerminalAuditLogCreate = { 
  //终端连接开始时间
  startTime?: string;
  //终端连接结束时间
  endTime?: string;
  //集群ID
  //最大长度: 50
  clusterId: string;
  //用户ID
  //最大长度: 50
  accountId: string;
  //用户名
  //最大长度: 50
  accountName?: string;
  //命名空间
  //最大长度: 255
  namespace?: string;
  //Pod name
  //最大长度: 255
  pod_name?: string;
  //容器
  //最大长度: 255
  container?: string;
  //终端命令和输出记录
  content?: datatypes;
  //输入命令记录
  commands?: datatypes2;
} ; 
// TerminalAuditLogDetail 集群终端审计日志
// 通过web terminal操作日志记录
export type TerminalAuditLogDetail = { 
  //主键
  //最大长度: 50
  id: string;
  //创建时间
  createdAt: string;
  //修改时间
  updatedAt: string;
  //终端连接开始时间
  startTime?: string;
  //终端连接结束时间
  endTime?: string;
  //集群ID
  //最大长度: 50
  clusterId: string;
  //用户ID
  //最大长度: 50
  accountId: string;
  //集群用户
  account?: AccountDetail;
  //用户名
  //最大长度: 50
  accountName?: string;
  //命名空间
  //最大长度: 255
  namespace?: string;
  //Pod name
  //最大长度: 255
  podName?: string;
  //容器
  //最大长度: 255
  container?: string;
  //终端命令和输出记录
  content?: datatypes;
  //输入命令记录
  commands?: datatypes2;
} ; 
// TerminalAuditLogDetailList 审计日志列表响应
export type TerminalAuditLogDetailList = { 
  //当前页数据
  data?: TerminalAuditLogDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
