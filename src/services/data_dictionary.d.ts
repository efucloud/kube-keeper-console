export type DataDictionaryDetail = {
  id: string;
  createdAt: string;
  updatedAt: string;
  creatorId?: string;
  updaterId?: string;
  code?: string;
  name?: string;
  description?: string;
  lines?: DictionaryLines;
};
export type DataDictionaryDetailList = {
  data?: DataDictionaryDetail[];
  total?: number;
};
export type DataDictionaryUpdate = {
  name: string;
  description?: string;
  lines: DictionaryLines;
};
export type DictionaryLine = {
  label: string;
  value: string;
  index?: number;
};
export type DictionaryLines = DictionaryLine[];
