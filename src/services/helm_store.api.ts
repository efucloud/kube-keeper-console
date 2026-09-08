import { request } from '@umijs/max';
import type {
  HelmChartDetail,
  HelmChartList,
  HelmRepositoryDetail,
  HelmRepositoryInput,
  HelmRepositoryList,
  HelmStoreRepository,
} from './helm_store';

export const listHelmStoreRepositories = () =>
  request<HelmStoreRepository[]>('/api/v1/helm-store/repositories');

export const listHelmStoreCharts = (params: {
  repository?: string;
  search?: string;
  current?: number;
  pageSize?: number;
}) => request<HelmChartList>('/api/v1/helm-store/charts', { params });

export const getHelmStoreChart = (repository: string, chart: string) =>
  request<HelmChartDetail>(
    `/api/v1/helm-store/charts/${encodeURIComponent(repository)}/${encodeURIComponent(chart)}`,
  );

export const listHelmRepositories = (params: {
  current?: number;
  pageSize?: number;
}) => request<HelmRepositoryList>('/api/v1/helm-repository', { params });

export const createHelmRepository = (data: HelmRepositoryInput) =>
  request<HelmRepositoryDetail>('/api/v1/helm-repository', {
    method: 'POST',
    data,
  });

export const updateHelmRepository = (data: HelmRepositoryInput) =>
  request<HelmRepositoryDetail>('/api/v1/helm-repository', {
    method: 'PUT',
    data,
  });

export const deleteHelmRepository = (ids: string[]) =>
  request('/api/v1/helm-repository', { method: 'DELETE', data: { ids } });

export const syncHelmRepository = (id: string) =>
  request<HelmRepositoryDetail>(
    `/api/v1/helm-repository/${encodeURIComponent(id)}/sync`,
    { method: 'POST' },
  );
