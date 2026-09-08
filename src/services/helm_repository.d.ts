export type HelmRepositoryCreate = {
  name?: string;
  url?: string;
  username?: string;
  password?: string;
  insecureSkipTLSVerify?: boolean;
  enabled?: boolean;
};
export type HelmRepositoryDetail = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  url?: string;
  username?: string;
  insecureSkipTLSVerify?: boolean;
  enabled?: boolean;
  lastSyncedAt?: string;
  lastSyncError?: string;
  cached?: boolean;
};
export type HelmRepositoryDetailList = {
  data?: HelmRepositoryDetail[];
  total?: number;
};
export type HelmRepositoryUpdate = {
  id: string;
  name?: string;
  url?: string;
  username?: string;
  password?: string;
  insecureSkipTLSVerify?: boolean;
  enabled?: boolean;
};
