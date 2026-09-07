import { request } from '@umijs/max';
import type { ApplicationDeployRequest, ApplicationDetail } from './application';
import type { ApplicationRenderResult } from './kubernetes';
import type { MarketApplicationCreate, MarketApplicationDetail, MarketApplicationDetailList, MarketApplicationState, MarketApplicationUpdate } from './market_application';

export async function listMarketApplication(params: { current?: number; pageSize?: number; order?: string; search?: string; category?: string; state?: number }) {
  return request<MarketApplicationDetailList>('/api/v1/market-application', { method: 'GET', params });
}
export async function getMarketApplication(params: { id: string }) {
  return request<MarketApplicationDetail>(`/api/v1/market-application/${params.id}`, { method: 'GET' });
}
export async function createMarketApplication(data: MarketApplicationCreate) {
  return request<MarketApplicationDetail>('/api/v1/market-application', { method: 'POST', data });
}
export async function updateMarketApplication(data: MarketApplicationUpdate) {
  return request<MarketApplicationDetail>('/api/v1/market-application', { method: 'PUT', data });
}
export async function updateMarketApplicationState(data: MarketApplicationState) {
  return request('/api/v1/market-application/state', { method: 'PUT', data });
}
export async function deleteMarketApplication(data: { ids: string[] }) {
  return request('/api/v1/market-application', { method: 'DELETE', data });
}
export async function importMarketApplication(content: string) {
  return request<MarketApplicationDetail>('/api/v1/market-application/import', { method: 'POST', data: content, headers: { 'Content-Type': 'application/yaml' } });
}
export async function exportMarketApplication(params: { id: string }) {
  return request<MarketApplicationDetail>(`/api/v1/market-application/${params.id}/export`, { method: 'GET' });
}
export async function renderMarketApplication(params: { cluster: string; namespace: string; id: string }, data: ApplicationDeployRequest) {
  const { cluster, namespace, id } = params;
  return request<ApplicationRenderResult>(`/api/v1/cluster/${cluster}/namespace/${namespace}/market-application/${id}/render`, { method: 'POST', data });
}
export async function validateMarketApplication(params: { cluster: string; namespace: string; id: string }, data: ApplicationDeployRequest) {
  const { cluster, namespace, id } = params;
  return request<ApplicationRenderResult>(`/api/v1/cluster/${cluster}/namespace/${namespace}/market-application/${id}/validate`, { method: 'POST', data });
}
export async function deployMarketApplication(params: { cluster: string; namespace: string; id: string }, data: ApplicationDeployRequest) {
  const { cluster, namespace, id } = params;
  return request<ApplicationDetail>(`/api/v1/cluster/${cluster}/namespace/${namespace}/market-application/${id}/deploy`, { method: 'POST', data });
}
