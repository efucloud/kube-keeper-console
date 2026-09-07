import { request } from '@umijs/max';
import type { ApplicationDetail, ApplicationDetailList } from './application';

export async function listApplication(params: { cluster: string; namespace: string; current?: number; pageSize?: number; order?: string; search?: string; status?: string }) {
  const { cluster, namespace, ...query } = params;
  return request<ApplicationDetailList>(`/api/v1/cluster/${cluster}/namespace/${namespace}/application`, { method: 'GET', params: query });
}

export async function getApplication(params: { cluster: string; namespace: string; id: string }) {
  const { cluster, namespace, id } = params;
  return request<ApplicationDetail>(`/api/v1/cluster/${cluster}/namespace/${namespace}/application/${id}`, { method: 'GET' });
}

export async function deleteApplication(params: { cluster: string; namespace: string; id: string }) {
  const { cluster, namespace, id } = params;
  return request<ApplicationDetail>(`/api/v1/cluster/${cluster}/namespace/${namespace}/application/${id}`, { method: 'DELETE' });
}
