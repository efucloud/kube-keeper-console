import type { ParameterDefinitions } from './application_def';

export type MarketApplicationDetail = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  creatorId?: string;
  updaterId?: string;
  state: 0 | 1;
  name: string;
  description?: string;
  logo?: string;
  home?: string;
  category: string;
  tags?: string[];
  templates: string[];
  resourceIndex?: Record<string, number>;
  hasCrd?: boolean;
  parameters?: ParameterDefinitions;
};

export type MarketApplicationDetailList = { data?: MarketApplicationDetail[]; total?: number };
export type MarketApplicationCreate = Omit<MarketApplicationDetail, 'id' | 'createdAt' | 'updatedAt' | 'creatorId' | 'updaterId' | 'resourceIndex' | 'hasCrd'> & { id?: string };
export type MarketApplicationUpdate = MarketApplicationCreate & { id: string };
export type MarketApplicationState = { id: string; state: 0 | 1 };
