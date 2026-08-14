// ClusterDashboard 集群面板
export type ClusterDashboard = { 
  nodes?: number;
  namespaces?: number;
  pods?: number;
  deployments?: number;
  statefulSets?: number;
  daemonSets?: number;
  job?: number;
  cronJob?: number;
  configMap?: number;
  secret?: number;
  helmInstance?: number;
  service?: number;
  ingress?: number;
  pv?: number;
  pvc?: number;
  storageClass?: number;
  crd?: number;
} ; 
// DashboardData 看板数据
export type DashboardData = { 
  name: string;
  intlName?: string;
  value: T;
} ; 
// NamespaceDashboard 命名克难攻坚面板
export type NamespaceDashboard = { 
  pods?: number;
  deployments?: number;
  statefulSets?: number;
  daemonSets?: number;
  job?: number;
  cronJob?: number;
  configMap?: number;
  secret?: number;
  helmInstance?: number;
  service?: number;
  ingress?: number;
  pvc?: number;
} ; 
