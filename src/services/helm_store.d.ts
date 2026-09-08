export type HelmStoreInstallRequest = {
  repositoryId?: string;
  chart?: string;
  version?: string;
  releaseName?: string;
  values?: string;
};
export type HelmStoreInstallResult = {
  name?: string;
  namespace?: string;
  revision?: number;
  status?: string;
  chart?: string;
  chartVersion?: string;
  appVersion?: string;
};
export type HelmStoreValues = {
  content?: string;
};
