import type { ApplicationKubernetesResource, ApplicationRenderParams } from './kubernetes';

export type ApplicationDeployRequest = { releaseName: string; description?: string; params?: ApplicationRenderParams };

export type ApplicationDetail = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  creatorId?: string;
  updaterId?: string;
  marketApplicationId: string;
  applicationName: string;
  clusterId: string;
  clusterCode: string;
  namespace: string;
  releaseName: string;
  description?: string;
  params?: ApplicationRenderParams;
  resources?: ApplicationKubernetesResource[];
  result: 'pending' | 'success' | 'partial' | 'failed';
  status: 'Deploying' | 'Running' | 'Failed' | 'Deleted';
};

export type ApplicationDetailList = { data?: ApplicationDetail[]; total?: number };
