export type HelmStoreRepository = {
  id: string;
  name: string;
  url: string;
  available: boolean;
  cachedAt?: string;
};

export type HelmChartVersion = {
  repositoryId: string;
  repository: string;
  name: string;
  version: string;
  appVersion?: string;
  description?: string;
  home?: string;
  icon?: string;
  deprecated?: boolean;
  created?: string;
  digest?: string;
  urls?: string[];
  keywords?: string[];
  sources?: string[];
};

export type HelmChartList = { data: HelmChartVersion[]; total: number };
export type HelmChartDetail = {
  repositoryId: string;
  repository: string;
  name: string;
  versions: HelmChartVersion[];
};

export type HelmRepositoryDetail = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  url: string;
  username?: string;
  insecureSkipTLSVerify: boolean;
  enabled: boolean;
  lastSyncedAt?: string;
  lastSyncError?: string;
  cached: boolean;
};

export type HelmRepositoryList = { data: HelmRepositoryDetail[]; total: number };
export type HelmRepositoryInput = {
  id?: string;
  name: string;
  url: string;
  username?: string;
  password?: string;
  insecureSkipTLSVerify?: boolean;
  enabled: boolean;
};
