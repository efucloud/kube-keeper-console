import { S3StorageConfig, AuditLogConfig } from './common.d';
// ClusterExtendCreate 集群扩展信息创建
// 包括集群审计日志信息，集群备份信息等，未来可继续扩展
export type ClusterExtendCreate = { 
  //集群ID
  //最大长度: 50
  clusterId: string;
  //集群备份S3配置
  veleroStorageConfig?: S3StorageConfig;
  //pod文件上传地址
  fileStorageConfig?: S3StorageConfig;
  //集群审计日志配置
  auditLogConfig?: AuditLogConfig;
} ; 
// ClusterExtendDetail 集群扩展信息
// 包括集群审计日志信息，集群备份信息等，未来可继续扩展
export type ClusterExtendDetail = { 
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
  //集群ID
  //最大长度: 50
  clusterId: string;
  //集群备份S3配置
  veleroStorageConfig?: S3StorageConfig;
  //pod文件上传地址
  fileStorageConfig?: S3StorageConfig;
  //集群审计日志配置
  auditLogConfig?: AuditLogConfig;
} ; 
// ClusterExtendDetailList  集群扩展信息列表响应
export type ClusterExtendDetailList = { 
  //当前页数据
  data?: ClusterExtendDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
// ClusterExtendUpdate 集群扩展信息修改
// 包括集群审计日志信息，集群备份信息等，未来可继续扩展
export type ClusterExtendUpdate = { 
  //主键
  //最大长度: 50
  id: string;
  //集群ID
  //最大长度: 50
  clusterId: string;
  //集群备份S3配置
  veleroStorageConfig?: S3StorageConfig;
  //pod文件上传地址
  fileStorageConfig?: S3StorageConfig;
  //集群审计日志配置
  auditLogConfig?: AuditLogConfig;
} ; 
