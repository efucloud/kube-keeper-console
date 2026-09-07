import { request } from '@umijs/max';
import type {
  DataDictionaryDetail,
  DataDictionaryDetailList,
  DataDictionaryUpdate,
} from './data_dictionary';

export async function listDataDictionary() {
  return request<DataDictionaryDetailList>('/api/v1/data-dictionary', {
    method: 'GET',
  });
}

export async function getDataDictionary(params: { code: string }) {
  return request<DataDictionaryDetail>(
    `/api/v1/data-dictionary/${params.code}`,
    { method: 'GET' },
  );
}

export async function updateDataDictionary(
  params: { code: string },
  data: DataDictionaryUpdate,
) {
  return request<DataDictionaryDetail>(
    `/api/v1/data-dictionary/${params.code}`,
    { method: 'PUT', data },
  );
}
