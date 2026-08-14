export type PodFileContent = { 
  pod?: string;
  container?: string;
  dir?: string;
  fileName?: string;
  content?: string;
  binary: boolean;
  truncated: boolean;
  writable: boolean;
  encoding?: string;
  language?: string;
  mimeType?: string;
  size?: number;
  maxBytes?: number;
} ; 
export type PodFileCreate = { 
  parentDir?: string;
  name?: string;
  directory: boolean;
} ; 
export type PodFileEntry = { 
  name?: string;
  path?: string;
  directory: boolean;
  text: boolean;
  binary: boolean;
  editable: boolean;
  downloadable: boolean;
  size?: number;
} ; 
export type PodFileList = { 
  root?: string;
  entries?: PodFileEntry[];
} ; 
export type PodFilePath = { 
  pod?: string;
  container?: string;
  dir?: string;
  fileName?: string;
} ; 
export type PodFileRename = { 
  dir?: string;
  newName?: string;
} ; 
export type PodFileUploadInfo = { 
  file?: string;
  fileName?: string;
  path?: string;
} ; 
export type normalizeAbsolutePodPath = { 
} ; 
