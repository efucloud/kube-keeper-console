import { AccountDetail } from './account.d';
// ClusterAccountCreate 用户在集群的csr
// 创建用户在集群的csr，针对没有对接eauth的集群
export type ClusterAccountCreate = { 
  //用户ID
  //最大长度: 50
  accountId: string;
  //集群ID
  //最大长度: 50
  clusterId: string;
  //邮箱:csr中指定的邮箱
  //最大长度: 50
  email: string;
  //CSR有效期:单位(s)
  expirationSeconds: number;
  //客户端证书
  clientCertificate?: string;
  //客户端Key
  clientKey?: string;
  //CSR名称:用户在集群中CSR名称
  //最大长度: 200
  csrName: string;
  //集群核准状态
  //最大长度: 50
  state: string;
  //原因:失败时的原因
  reason?: string;
  //授权说明或原因
  //最大长度: 255
  description?: string;
  //超级管理员
  isSupper: boolean;
} ; 
// ClusterAccountDetail 集群的用户信息
export type ClusterAccountDetail = { 
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
  //用户ID
  //最大长度: 50
  accountId: string;
  //集群用户
  account?: AccountDetail;
  //邮箱:csr中指定的邮箱
  //最大长度: 50
  email: string;
  //CSR有效期:单位(s)
  expirationSeconds: number;
  //CSR名称:用户在集群中CSR名称
  //最大长度: 200
  csrName: string;
  //集群核准状态
  //最大长度: 50
  state: string;
  //原因:失败时的原因
  reason?: string;
  //授权说明或原因
  //最大长度: 255
  description?: string;
  //超级管理员
  isSupper: boolean;
  //是否有效
  //默认值: true
  enable: boolean;
} ; 
// ClusterAccountDetailList 集群列用户表响应
export type ClusterAccountDetailList = { 
  //当前页数据
  data?: ClusterAccountDetail[];
  //数据库满足条件的数据总数
  total?: number;
} ; 
// ClusterAccountUpdate 用户在集群的csr
// 创建用户在集群的csr，针对没有对接eauth的集群
export type ClusterAccountUpdate = { 
  //主键
  //最大长度: 50
  id: string;
  //CSR有效期:单位(s)
  expirationSeconds: number;
  //客户端证书
  clientCertificate?: string;
  //客户端Key
  clientKey?: string;
  //CSR名称:用户在集群中CSR名称
  //最大长度: 200
  csrName?: string;
  //集群核准状态
  //最大长度: 50
  state?: string;
  //原因:失败时的原因
  reason?: string;
} ; 
