import type { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from '@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta';

export function encodeQueryParams(params: { [key: string]: any }): string {
  const searchParams = new URLSearchParams();

  for (const key in params) {
    if (Object.hasOwn(params, key)) {
      let value = params[key];
      // 如果值是布尔类型，转换为字符串形式
      if (typeof value === 'boolean') {
        value = value ? 'true' : 'false';
      }
      // 将键值对添加到 URLSearchParams 对象中
      searchParams.append(key, String(value));
    }
  }

  return searchParams.toString();
}

export interface ResponseKind {
  group: string;
  version: string;
  kind: string;
}
type verb =
  | 'create'
  | 'delete'
  | 'deletecollection'
  | 'get'
  | 'list'
  | 'patch'
  | 'update'
  | 'watch';
export interface Subresource {
  subresource: string;
  responseKind: ResponseKind;
  verbs: verb[];
}

export interface APIGroupDiscoveryResource {
  resource: string;
  responseKind: ResponseKind;
  scope: string;
  singularResource: string;
  verbs: verb[];
  categories: string[];
  subresources: Subresource[];
}

export interface APIGroupDiscoveryVersion {
  version: string;
  resources: APIGroupDiscoveryResource[];
  freshness: string;
}

export interface APIGroupDiscovery {
  metadata: IIoK8sApimachineryPkgApisMetaV1ObjectMeta;
  versions: APIGroupDiscoveryVersion[];
}

export interface APIGroupDiscoveryList {
  kind: string;
  apiVersion: string;
  metadata: IIoK8sApimachineryPkgApisMetaV1ObjectMeta;
  items: APIGroupDiscovery[];
}

export interface ResourceAPIVersion {
  version: string;
  kind: string;
  resource: string;
  scope: 'Namespaced' | 'Cluster';
  cluster: string;
  namespace?: string;
}
