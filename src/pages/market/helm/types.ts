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
