import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FileOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Editor } from '@monaco-editor/react';
import { request, useIntl } from '@umijs/max';
import type { UploadProps } from 'antd';
import {
  Button,
  Card,
  Empty,
  Input,
  Modal,
  message,
  Radio,
  Select,
  Space,
  Spin,
  Splitter,
  Tabs,
  Tag,
  Tree,
  Typography,
  theme,
  Upload,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import { saveAs } from 'file-saver';
import * as yaml from 'js-yaml';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { listClusterPodFiles } from '@/services/pod.api';
import type {
  PodFileContent,
  PodFileEntry,
  PodFileList,
  PodFilePath,
} from '@/services/pod.d';
import { customSchema, getToken } from '@/utils/global';

export type ContainerFileProps = {
  cluster: string;
  namespace: string;
  pod: string;
  containers: string[];
};

type EntryType = 'dir' | 'file';

type NormalizedFileEntry = {
  key: string;
  name: string;
  path: string;
  entryType: EntryType;
  text: boolean;
  binary: boolean;
  editable: boolean;
  downloadable: boolean;
  size: number;
};

type ExplorerNode = DataNode & {
  path: string;
  name: string;
  entryType: EntryType;
  loaded?: boolean;
  meta?: NormalizedFileEntry;
  children?: ExplorerNode[];
};

type FileTab = {
  key: string;
  path: string;
  title: string;
  content: string;
  savedContent: string;
  binary: boolean;
  writable: boolean;
  encoding?: string;
  language?: string;
  mimeType?: string;
  size?: number;
  maxBytes?: number;
  truncated?: boolean;
  loading?: boolean;
};

type CreateDialogState = {
  open: boolean;
  directory: boolean;
  name: string;
};

type RenameDialogState = {
  open: boolean;
  path?: string;
  name: string;
};

const ROOT_PATH = '/';
const TEXT_PREVIEW_LIMIT = 256 * 1024;
const LARGE_FILE_UPLOAD_THRESHOLD = 20 * 1024 * 1024;

const normalizePath = (value?: string): string => {
  const raw = (value || ROOT_PATH).trim().replace(/\\/g, '/');
  if (!raw || raw === '.') {
    return ROOT_PATH;
  }
  let next = raw.startsWith(ROOT_PATH) ? raw : `${ROOT_PATH}${raw}`;
  next = next.replace(/\/+/g, '/');
  if (next.length > 1) {
    next = next.replace(/\/+$/g, '');
  }
  return next || ROOT_PATH;
};

const toQueryPath = (value: string): string | undefined => {
  const normalized = normalizePath(value);
  return normalized === ROOT_PATH ? undefined : normalized;
};

const isDescendantPath = (rootPath: string, targetPath: string) => {
  const normalizedRoot = normalizePath(rootPath);
  const normalizedTarget = normalizePath(targetPath);
  return (
    normalizedRoot === ROOT_PATH ||
    normalizedTarget === normalizedRoot ||
    normalizedTarget.startsWith(`${normalizedRoot}/`)
  );
};

const getBaseName = (value: string): string => {
  const normalized = normalizePath(value);
  if (normalized === ROOT_PATH) {
    return ROOT_PATH;
  }
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || ROOT_PATH;
};

const getNodeLabel = (value: string): string => {
  const normalized = normalizePath(value);
  return normalized === ROOT_PATH ? ROOT_PATH : getBaseName(normalized);
};

const getParentPath = (value: string): string => {
  const normalized = normalizePath(value);
  if (normalized === ROOT_PATH) {
    return ROOT_PATH;
  }
  const index = normalized.lastIndexOf('/');
  return index <= 0 ? ROOT_PATH : normalized.slice(0, index);
};

const joinPath = (dir: string, name: string): string => {
  const base = normalizePath(dir);
  return base === ROOT_PATH ? `${ROOT_PATH}${name}` : `${base}/${name}`;
};

const guessLanguage = (value?: string): string => {
  const name = (value ? getBaseName(value) : '').toLowerCase();
  if (name === 'dockerfile') return 'dockerfile';
  if (name === 'makefile') return 'makefile';
  if (name.endsWith('.md')) return 'markdown';
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return 'yaml';
  if (name.endsWith('.json')) return 'json';
  if (name.endsWith('.toml')) return 'toml';
  if (name.endsWith('.svg')) return 'xml';
  if (name.endsWith('.xml')) return 'xml';
  if (name.endsWith('.html') || name.endsWith('.htm')) return 'html';
  if (
    name.endsWith('.css') ||
    name.endsWith('.scss') ||
    name.endsWith('.less')
  ) {
    return 'css';
  }
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return 'typescript';
  if (
    name.endsWith('.jsx') ||
    name.endsWith('.js') ||
    name.endsWith('.mjs') ||
    name.endsWith('.cjs')
  ) {
    return 'javascript';
  }
  if (name.endsWith('.py')) return 'python';
  if (name.endsWith('.go')) return 'go';
  if (name.endsWith('.java')) return 'java';
  if (
    name.endsWith('.sh') ||
    name.endsWith('.bash') ||
    name.endsWith('.zsh') ||
    name.endsWith('.env')
  ) {
    return 'shell';
  }
  if (name.endsWith('.sql')) return 'sql';
  if (
    name.endsWith('.ini') ||
    name.endsWith('.conf') ||
    name.endsWith('.cfg') ||
    name.endsWith('.cnf')
  ) {
    return 'ini';
  }
  if (name.endsWith('.log')) return 'log';
  return 'plaintext';
};

const resolveLanguageFromMime = (mimeType?: string): string | undefined => {
  const normalizedMimeType = (mimeType || '').toLowerCase();
  if (!normalizedMimeType) {
    return undefined;
  }
  if (
    normalizedMimeType.includes('yaml') ||
    normalizedMimeType.includes('x-yaml')
  ) {
    return 'yaml';
  }
  if (normalizedMimeType.includes('json')) {
    return 'json';
  }
  if (normalizedMimeType.includes('toml')) {
    return 'toml';
  }
  if (
    normalizedMimeType.includes('svg') ||
    normalizedMimeType.includes('xml')
  ) {
    return 'xml';
  }
  if (
    normalizedMimeType.includes('javascript') ||
    normalizedMimeType.includes('ecmascript')
  ) {
    return 'javascript';
  }
  if (normalizedMimeType.includes('css')) {
    return 'css';
  }
  if (
    normalizedMimeType.includes('shell') ||
    normalizedMimeType.includes('x-sh') ||
    normalizedMimeType.includes('x-shellscript')
  ) {
    return 'shell';
  }
  return undefined;
};

const normalizeEditorLanguage = (language?: string): string | undefined => {
  const normalizedLanguage = (language || '').toLowerCase();
  if (!normalizedLanguage) {
    return undefined;
  }
  if (normalizedLanguage === 'yml') {
    return 'yaml';
  }
  if (normalizedLanguage === 'properties') {
    return 'ini';
  }
  return normalizedLanguage;
};

const resolveEditorLanguage = (
  filePath: string,
  backendLanguage?: string,
  mimeType?: string,
): string => {
  const extensionLanguage = guessLanguage(filePath);
  if (
    ['yaml', 'json', 'toml', 'shell', 'javascript', 'css'].includes(
      extensionLanguage,
    )
  ) {
    return extensionLanguage;
  }

  const mimeLanguage = resolveLanguageFromMime(mimeType);
  if (mimeLanguage) {
    return mimeLanguage;
  }

  return (
    normalizeEditorLanguage(backendLanguage) || extensionLanguage || 'plaintext'
  );
};

const IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.ico',
  '.svg',
  '.avif',
];

const isImageMimeType = (mimeType?: string) =>
  (mimeType || '').toLowerCase().startsWith('image/');

const isImageFile = (filePath: string, mimeType?: string) => {
  if (isImageMimeType(mimeType)) {
    return true;
  }
  const normalizedName = getBaseName(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension),
  );
};

const isSvgFile = (filePath: string, mimeType?: string) => {
  const normalizedMimeType = (mimeType || '').toLowerCase();
  if (normalizedMimeType.includes('image/svg')) {
    return true;
  }
  return getBaseName(filePath).toLowerCase().endsWith('.svg');
};

const formatStructuredContent = (
  content: string,
  language?: string,
): string => {
  const normalizedLanguage = normalizeEditorLanguage(language);
  if (normalizedLanguage === 'json') {
    return JSON.stringify(JSON.parse(content), null, 2);
  }
  if (normalizedLanguage === 'yaml') {
    if (!content.trim()) {
      return content;
    }
    const documents: any[] = [];
    yaml.loadAll(
      content,
      (document) => {
        documents.push(document);
      },
      { schema: customSchema },
    );
    if (!documents.length) {
      return content;
    }
    return documents
      .map((document) =>
        yaml
          .dump(document, {
            schema: customSchema,
            indent: 2,
            noRefs: true,
            lineWidth: -1,
            sortKeys: false,
          })
          .trimEnd(),
      )
      .join('\n---\n');
  }
  return content;
};

const ensureCustomLanguage = (
  monaco: any,
  languageId: string,
  config: {
    aliases: string[];
    extensions: string[];
    configuration: Record<string, any>;
    tokenizer: Record<string, any>;
  },
) => {
  const exists = monaco.languages
    .getLanguages()
    .some((item: { id: string }) => item.id === languageId);
  if (exists) {
    return;
  }

  monaco.languages.register({
    id: languageId,
    aliases: config.aliases,
    extensions: config.extensions,
  });
  monaco.languages.setLanguageConfiguration(languageId, config.configuration);
  monaco.languages.setMonarchTokensProvider(languageId, {
    tokenizer: config.tokenizer,
  });
};

const ensureFileEditorLanguages = (monaco: any) => {
  ensureCustomLanguage(monaco, 'yaml', {
    aliases: ['YAML', 'yaml'],
    extensions: ['.yaml', '.yml'],
    configuration: {
      comments: {
        lineComment: '#',
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
    },
    tokenizer: {
      root: [
        [/^\s*#.*$/, 'comment'],
        [/^(\s*-)(\s+)/, ['keyword', 'white']],
        [
          /^(\s*)([A-Za-z0-9_.-]+)(\s*:)/,
          ['white', 'type.identifier', 'delimiter'],
        ],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\b(true|false|null|yes|no|on|off)\b/, 'keyword'],
        [/\b\d+\.\d+\b/, 'number.float'],
        [/\b\d+\b/, 'number'],
        [/[{}[\]]/, '@brackets'],
      ],
    },
  });

  ensureCustomLanguage(monaco, 'toml', {
    aliases: ['TOML', 'toml'],
    extensions: ['.toml'],
    configuration: {
      comments: {
        lineComment: '#',
      },
      brackets: [
        ['[', ']'],
        ['{', '}'],
      ],
      autoClosingPairs: [
        { open: '[', close: ']' },
        { open: '{', close: '}' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
      surroundingPairs: [
        { open: '[', close: ']' },
        { open: '{', close: '}' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
    },
    tokenizer: {
      root: [
        [/^\s*#.*$/, 'comment'],
        [/^\s*\[\[.*\]\]\s*$/, 'type.identifier'],
        [/^\s*\[.*\]\s*$/, 'type.identifier'],
        [/^(\s*)([A-Za-z0-9_.-]+)(\s*=)/, ['white', 'variable', 'delimiter']],
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],
        [/\b(true|false)\b/, 'keyword'],
        [/\b\d+\.\d+\b/, 'number.float'],
        [/\b\d+\b/, 'number'],
        [/[{}[\]]/, '@brackets'],
      ],
    },
  });
};

const formatBytes = (size?: number): string => {
  if (!size || size <= 0) {
    return '0 B';
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const normalizeEntry = (
  entry: PodFileEntry,
): NormalizedFileEntry | undefined => {
  if (!entry?.path) {
    return undefined;
  }
  const path = normalizePath(entry.path);
  const entryType: EntryType = entry.directory ? 'dir' : 'file';
  return {
    key: `${entryType}:${path}`,
    name: entry.name || getBaseName(path),
    path,
    entryType,
    text: !!entry.text,
    binary: !!entry.binary,
    editable: !!entry.editable,
    downloadable: entryType === 'file' ? entry.downloadable !== false : false,
    size: entry.size || 0,
  };
};

const sortEntries = (left: NormalizedFileEntry, right: NormalizedFileEntry) => {
  if (left.entryType !== right.entryType) {
    return left.entryType === 'dir' ? -1 : 1;
  }
  return left.name.localeCompare(right.name);
};

const filterExplorerTree = (
  nodes: ExplorerNode[],
  keyword: string,
): ExplorerNode[] => {
  if (!keyword) {
    return nodes;
  }

  return nodes
    .map((node) => {
      const nextChildren = node.children
        ? filterExplorerTree(node.children, keyword)
        : undefined;
      const matched =
        node.name.toLowerCase().includes(keyword) ||
        node.path.toLowerCase().includes(keyword);
      if (matched || (nextChildren && nextChildren.length > 0)) {
        return {
          ...node,
          children: nextChildren,
        };
      }
      return undefined;
    })
    .filter(Boolean) as ExplorerNode[];
};

const collectNodeKeys = (nodes: ExplorerNode[]): string[] => {
  const keys: string[] = [];
  nodes.forEach((node) => {
    keys.push(node.path);
    if (node.children?.length) {
      keys.push(...collectNodeKeys(node.children));
    }
  });
  return keys;
};

const createBreadcrumbItems = (value: string) => {
  const normalized = normalizePath(value);
  if (normalized === ROOT_PATH) {
    return [{ title: ROOT_PATH, path: ROOT_PATH }];
  }
  const segments = normalized.split('/').filter(Boolean);
  let current = ROOT_PATH;
  return [
    { title: ROOT_PATH, path: ROOT_PATH },
    ...segments.map((segment) => {
      current = joinPath(current, segment);
      return { title: segment, path: current };
    }),
  ];
};

const getExpandedPathKeys = (
  rootPath: string,
  targetPath: string,
): string[] => {
  const normalizedRoot = normalizePath(rootPath);
  const normalizedTarget = normalizePath(targetPath);
  if (!isDescendantPath(normalizedRoot, normalizedTarget)) {
    return [normalizedRoot];
  }
  const keys = [normalizedRoot];
  if (normalizedTarget === normalizedRoot) {
    return keys;
  }
  const rest = normalizedTarget
    .slice(normalizedRoot === ROOT_PATH ? 1 : normalizedRoot.length + 1)
    .split('/')
    .filter(Boolean);
  let current = normalizedRoot;
  rest.forEach((segment) => {
    current = joinPath(current, segment);
    keys.push(current);
  });
  return Array.from(new Set(keys));
};

const buildChildNodes = (entries: NormalizedFileEntry[]): ExplorerNode[] =>
  [...entries].sort(sortEntries).map((entry) => ({
    key: entry.path,
    path: entry.path,
    name: entry.name,
    title: entry.name,
    entryType: entry.entryType,
    loaded: entry.entryType === 'file',
    isLeaf: entry.entryType === 'file',
    meta: entry,
    children: entry.entryType === 'dir' ? undefined : [],
  }));

const createRootNode = (rootPath: string): ExplorerNode => ({
  key: normalizePath(rootPath),
  path: normalizePath(rootPath),
  name: getNodeLabel(rootPath),
  title: getNodeLabel(rootPath),
  entryType: 'dir',
  loaded: false,
  isLeaf: false,
  children: [],
});

const updateTreeNode = (
  nodes: ExplorerNode[],
  targetPath: string,
  updater: (node: ExplorerNode) => ExplorerNode,
): ExplorerNode[] =>
  nodes.map((node) => {
    if (node.path === targetPath) {
      return updater(node);
    }
    if (node.children?.length) {
      return {
        ...node,
        children: updateTreeNode(node.children, targetPath, updater),
      };
    }
    return node;
  });

const findTreeNode = (
  nodes: ExplorerNode[],
  targetPath?: string,
): ExplorerNode | undefined => {
  if (!targetPath) {
    return undefined;
  }
  for (const node of nodes) {
    if (node.path === targetPath) {
      return node;
    }
    if (node.children?.length) {
      const found = findTreeNode(node.children, targetPath);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};

const readFileContent = async (
  props: ContainerFileProps,
  container: string,
  filePath: string,
) =>
  request<PodFileContent>(
    `/api/v1/cluster/${props.cluster}/namespace/${props.namespace}/pod/${props.pod}/${container}/read-file`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: { dir: normalizePath(filePath) },
    },
  );

const saveFileContent = async (
  props: ContainerFileProps,
  container: string,
  filePath: string,
  content: string,
  language?: string,
) =>
  request<PodFileContent>(
    `/api/v1/cluster/${props.cluster}/namespace/${props.namespace}/pod/${props.pod}/${container}/save-file`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        dir: normalizePath(filePath),
        fileName: getBaseName(filePath),
        content,
        language,
      },
    },
  );

const createFileEntry = async (
  props: ContainerFileProps,
  container: string,
  parentDir: string,
  name: string,
  directory: boolean,
) =>
  request<PodFilePath>(
    `/api/v1/cluster/${props.cluster}/namespace/${props.namespace}/pod/${props.pod}/${container}/create-file`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        parentDir: normalizePath(parentDir),
        name,
        directory,
      },
    },
  );

const renameFileEntry = async (
  props: ContainerFileProps,
  container: string,
  filePath: string,
  newName: string,
) =>
  request<PodFilePath>(
    `/api/v1/cluster/${props.cluster}/namespace/${props.namespace}/pod/${props.pod}/${container}/rename-file`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        dir: normalizePath(filePath),
        newName,
      },
    },
  );

const deleteFileEntry = async (
  props: ContainerFileProps,
  container: string,
  filePath: string,
) =>
  request<PodFilePath>(
    `/api/v1/cluster/${props.cluster}/namespace/${props.namespace}/pod/${props.pod}/${container}/delete-file`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        dir: normalizePath(filePath),
      },
    },
  );

const fetchFileBlob = async (
  props: ContainerFileProps,
  container: string,
  filePath: string,
) => {
  const token = getToken();
  const response = await fetch(
    `/api/v1/cluster/${props.cluster}/namespace/${props.namespace}/pod/${props.pod}/${container}/download-file`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token?.access_token || ''}`,
      },
      body: JSON.stringify({ dir: normalizePath(filePath) }),
    },
  );

  if (!response.ok) {
    let errorMessage =
      response.statusText || `Request failed: ${response.status}`;
    try {
      const text = await response.text();
      if (text) {
        errorMessage = text;
      }
    } catch (error) {
      console.error(error);
    }
    throw new Error(errorMessage);
  }

  const disposition = response.headers.get('Content-Disposition') || '';
  const utf8Filename = disposition.match(/filename\*=UTF-8''(.+)/i);
  const plainFilename = disposition.match(/filename="?([^;"]+)"?/i);
  const fileName = utf8Filename?.[1]
    ? decodeURIComponent(utf8Filename[1])
    : plainFilename?.[1] || getBaseName(filePath);

  return {
    blob: await response.blob(),
    fileName,
  };
};

const downloadFile = async (
  props: ContainerFileProps,
  container: string,
  filePath: string,
) => {
  const { blob, fileName } = await fetchFileBlob(props, container, filePath);
  saveAs(blob, fileName);
};

const uploadFile = async (
  props: ContainerFileProps,
  container: string,
  file: File,
  targetPath: string,
  largeFile: boolean,
) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('path', normalizePath(targetPath));
  formData.append('fileName', file.name);
  formData.append('file', file);

  const response = await fetch(
    `/api/v1/cluster/${props.cluster}/namespace/${props.namespace}/pod/${props.pod}/${container}/${largeFile ? 'upload-big-file' : 'upload-file'}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token?.access_token || ''}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    let errorMessage =
      response.statusText || `Request failed: ${response.status}`;
    try {
      const text = await response.text();
      if (text) {
        errorMessage = text;
      }
    } catch (error) {
      console.error(error);
    }
    throw new Error(errorMessage);
  }
};

export const PodContainerFile: React.FC<ContainerFileProps> = (props) => {
  const intl = useIntl();
  const { token } = theme.useToken();
  const t = useCallback(
    (id: string, defaultMessage: string, values?: Record<string, any>) =>
      intl.formatMessage({ id, defaultMessage }, values),
    [intl],
  );
  const [container, setContainer] = useState<string>(props.containers[0] || '');
  const [workspaceRootPath, setWorkspaceRootPath] = useState<string>(ROOT_PATH);
  const [pathInput, setPathInput] = useState<string>(ROOT_PATH);
  const [treeData, setTreeData] = useState<ExplorerNode[]>([
    createRootNode(ROOT_PATH),
  ]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([ROOT_PATH]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [directoryLoading, setDirectoryLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedNodePath, setSelectedNodePath] = useState<string>(ROOT_PATH);
  const [currentPath, setCurrentPath] = useState<string>(ROOT_PATH);
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>();
  const [savingTabKey, setSavingTabKey] = useState<string>();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>();
  const [imagePreviewLoading, setImagePreviewLoading] =
    useState<boolean>(false);
  const [_imagePreviewFailed, setImagePreviewFailed] = useState<boolean>(false);
  const [svgViewModes, setSvgViewModes] = useState<
    Record<string, 'preview' | 'source'>
  >({});
  const [createDialog, setCreateDialog] = useState<CreateDialogState>({
    open: false,
    directory: false,
    name: '',
  });
  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({
    open: false,
    path: undefined,
    name: '',
  });
  const tabsRef = useRef<FileTab[]>([]);

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const fetchDirectoryEntries = useCallback(
    async (dirPath: string, nextContainer = container) => {
      const result = await listClusterPodFiles<PodFileList>({
        cluster: props.cluster,
        namespace: props.namespace,
        pod: props.pod,
        container: nextContainer,
        path: toQueryPath(dirPath),
      });
      return (result?.entries || [])
        .map((item) => normalizeEntry(item))
        .filter(Boolean) as NormalizedFileEntry[];
    },
    [container, props.cluster, props.namespace, props.pod],
  );

  const loadDirectoryChildren = useCallback(
    async (dirPath: string, force = false, nextContainer = container) => {
      const normalizedDirPath = normalizePath(dirPath);
      const existingNode = findTreeNode(treeData, normalizedDirPath);
      if (!force && existingNode?.loaded) {
        return existingNode.children || [];
      }
      const entries = await fetchDirectoryEntries(
        normalizedDirPath,
        nextContainer,
      );
      const children = buildChildNodes(entries);
      setTreeData((prev) =>
        updateTreeNode(prev, normalizedDirPath, (node) => ({
          ...node,
          loaded: true,
          children,
        })),
      );
      return children;
    },
    [container, fetchDirectoryEntries, treeData],
  );

  const initializeWorkspace = useCallback(
    async (rootPath: string, nextContainer = container) => {
      const normalizedRoot = normalizePath(rootPath);
      setDirectoryLoading(true);
      setWorkspaceRootPath(normalizedRoot);
      setPathInput(normalizedRoot);
      setCurrentPath(normalizedRoot);
      setSelectedNodePath(normalizedRoot);
      setExpandedKeys([normalizedRoot]);
      setTreeData([createRootNode(normalizedRoot)]);
      try {
        const entries = await fetchDirectoryEntries(
          normalizedRoot,
          nextContainer,
        );
        const children = buildChildNodes(entries);
        setTreeData([
          {
            ...createRootNode(normalizedRoot),
            loaded: true,
            children,
          },
        ]);
      } finally {
        setDirectoryLoading(false);
      }
    },
    [container, fetchDirectoryEntries],
  );

  useEffect(() => {
    const nextContainer = props.containers[0] || '';
    if (!props.containers.includes(container)) {
      setContainer(nextContainer);
    }
    if (!props.containers.length) {
      setContainer('');
      setTreeData([createRootNode(ROOT_PATH)]);
      setTabs([]);
      setActiveTabKey(undefined);
      setWorkspaceRootPath(ROOT_PATH);
      setCurrentPath(ROOT_PATH);
      setSelectedNodePath(ROOT_PATH);
    }
  }, [container, props.containers]);

  useEffect(() => {
    if (!container) {
      return;
    }
    setTabs([]);
    setActiveTabKey(undefined);
    setSearchValue('');
    void initializeWorkspace(ROOT_PATH, container);
  }, [container, initializeWorkspace]);

  const openFile = useCallback(
    async (filePath: string, nextContainer = container) => {
      const normalizedPath = normalizePath(filePath);
      setSelectedNodePath(normalizedPath);
      setCurrentPath(getParentPath(normalizedPath));
      setExpandedKeys((prev) =>
        Array.from(
          new Set([
            ...prev,
            ...getExpandedPathKeys(
              workspaceRootPath,
              getParentPath(normalizedPath),
            ),
          ]),
        ),
      );
      await loadDirectoryChildren(
        getParentPath(normalizedPath),
        false,
        nextContainer,
      );

      const existingTab = tabsRef.current.find(
        (item) => item.key === normalizedPath,
      );
      if (existingTab) {
        setActiveTabKey(existingTab.key);
        return;
      }

      const title = getBaseName(normalizedPath);
      const loadingTab: FileTab = {
        key: normalizedPath,
        path: normalizedPath,
        title,
        content: '',
        savedContent: '',
        binary: false,
        writable: false,
        language: resolveEditorLanguage(normalizedPath),
        loading: true,
      };
      setTabs((prev) => [...prev, loadingTab]);
      setActiveTabKey(normalizedPath);

      try {
        const result = await readFileContent(
          props,
          nextContainer,
          normalizedPath,
        );
        setTabs((prev) =>
          prev.map((item) => {
            if (item.key !== normalizedPath) {
              return item;
            }
            return {
              ...item,
              content: result.content || '',
              savedContent: result.content || '',
              binary: !!result.binary,
              writable: !!result.writable,
              encoding: result.encoding,
              language: resolveEditorLanguage(
                normalizedPath,
                result.language,
                result.mimeType,
              ),
              mimeType: result.mimeType,
              size: result.size,
              maxBytes: result.maxBytes,
              truncated: !!result.truncated,
              loading: false,
            };
          }),
        );
      } catch (error) {
        setTabs((prev) => prev.filter((item) => item.key !== normalizedPath));
        setActiveTabKey((prev) => (prev === normalizedPath ? undefined : prev));
        throw error;
      }
    },
    [container, loadDirectoryChildren, props, workspaceRootPath],
  );

  const closeTab = useCallback(
    (targetKey: string) => {
      setTabs((prev) => {
        const currentIndex = prev.findIndex((item) => item.key === targetKey);
        const nextTabs = prev.filter((item) => item.key !== targetKey);
        if (activeTabKey === targetKey) {
          const fallback =
            nextTabs[currentIndex - 1] || nextTabs[currentIndex] || nextTabs[0];
          setActiveTabKey(fallback?.key);
          if (fallback) {
            setSelectedNodePath(fallback.path);
            setCurrentPath(getParentPath(fallback.path));
          } else {
            setSelectedNodePath(currentPath);
          }
        }
        return nextTabs;
      });
    },
    [activeTabKey, currentPath],
  );

  const activeTab = useMemo(
    () => tabs.find((item) => item.key === activeTabKey),
    [activeTabKey, tabs],
  );

  const activeTabIsImage = useMemo(
    () => (activeTab ? isImageFile(activeTab.path, activeTab.mimeType) : false),
    [activeTab],
  );

  const activeTabLanguage = useMemo(
    () =>
      activeTab
        ? resolveEditorLanguage(
            activeTab.path,
            activeTab.language,
            activeTab.mimeType,
          )
        : undefined,
    [activeTab],
  );

  const activeTabIsSvg = useMemo(
    () => (activeTab ? isSvgFile(activeTab.path, activeTab.mimeType) : false),
    [activeTab],
  );

  const activeTabSvgViewMode = useMemo(
    () => (activeTab ? svgViewModes[activeTab.key] || 'preview' : 'preview'),
    [activeTab, svgViewModes],
  );

  const activeTabShowsImagePreview = useMemo(
    () =>
      activeTabIsImage &&
      (!activeTabIsSvg || activeTabSvgViewMode === 'preview'),
    [activeTabIsImage, activeTabIsSvg, activeTabSvgViewMode],
  );

  const activeTabCanFormat = useMemo(
    () =>
      !!activeTab &&
      !activeTab.binary &&
      !activeTabShowsImagePreview &&
      ['json', 'yaml'].includes(activeTabLanguage || ''),
    [activeTab, activeTabLanguage, activeTabShowsImagePreview],
  );

  useEffect(() => {
    let disposedUrl: string | undefined;
    let cancelled = false;

    if (!activeTab || !activeTabShowsImagePreview) {
      setImagePreviewLoading(false);
      setImagePreviewFailed(false);
      setImagePreviewUrl((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous);
        }
        return undefined;
      });
      return;
    }

    setImagePreviewLoading(true);
    setImagePreviewFailed(false);
    void fetchFileBlob(props, container, activeTab.path)
      .then(({ blob }) => {
        if (cancelled) {
          return;
        }
        disposedUrl = URL.createObjectURL(blob);
        setImagePreviewUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return disposedUrl;
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setImagePreviewFailed(true);
        setImagePreviewUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return undefined;
        });
      })
      .finally(() => {
        if (!cancelled) {
          setImagePreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (disposedUrl) {
        URL.revokeObjectURL(disposedUrl);
      }
    };
  }, [
    activeTab,
    activeTabShowsImagePreview,
    container,
    props.cluster,
    props.namespace,
    props.pod,
  ]);

  const selectedNode = useMemo(
    () => findTreeNode(treeData, selectedNodePath),
    [selectedNodePath, treeData],
  );

  const currentDirectoryNode = useMemo(
    () => findTreeNode(treeData, currentPath),
    [currentPath, treeData],
  );

  const workspaceRootNode = useMemo(
    () => findTreeNode(treeData, workspaceRootPath),
    [treeData, workspaceRootPath],
  );

  const currentEntries = currentDirectoryNode?.children || [];
  const directDirectories = currentEntries.filter(
    (item) => item.entryType === 'dir',
  ).length;
  const directFiles = currentEntries.filter(
    (item) => item.entryType === 'file',
  ).length;

  const filteredTreeData = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    return filterExplorerTree(treeData, keyword);
  }, [searchValue, treeData]);

  const visibleExpandedKeys = useMemo(() => {
    if (!searchValue.trim()) {
      return expandedKeys;
    }
    return collectNodeKeys(filteredTreeData);
  }, [expandedKeys, filteredTreeData, searchValue]);

  const currentFilePath =
    activeTab?.path ||
    (selectedNode?.entryType === 'file' ? selectedNode.path : undefined);
  const actionTargetPath = selectedNodePath || currentPath;
  const canMutateSelected =
    !!actionTargetPath && actionTargetPath !== workspaceRootPath;

  const breadcrumbItems = useMemo(
    () => createBreadcrumbItems(currentPath),
    [currentPath],
  );

  const handleDownload = async (filePath: string) => {
    try {
      await downloadFile(props, container, filePath);
      message.success(
        t('cluster.pod.file.download.started', 'Started downloading {name}', {
          name: getBaseName(filePath),
        }),
      );
    } catch (error: any) {
      message.error(
        error?.message ||
          t('cluster.pod.file.download.failed', 'Failed to download file'),
      );
    }
  };

  const reloadActiveTab = async () => {
    if (!activeTab) {
      return;
    }
    setTabs((prev) =>
      prev.map((item) =>
        item.key === activeTab.key ? { ...item, loading: true } : item,
      ),
    );
    try {
      const result = await readFileContent(props, container, activeTab.path);
      setTabs((prev) =>
        prev.map((item) => {
          if (item.key !== activeTab.key) {
            return item;
          }
          return {
            ...item,
            content: result.content || '',
            savedContent: result.content || '',
            binary: !!result.binary,
            writable: !!result.writable,
            encoding: result.encoding,
            language: resolveEditorLanguage(
              activeTab.path,
              result.language,
              result.mimeType,
            ),
            mimeType: result.mimeType,
            size: result.size,
            maxBytes: result.maxBytes,
            truncated: !!result.truncated,
            loading: false,
          };
        }),
      );
    } catch (error: any) {
      setTabs((prev) =>
        prev.map((item) =>
          item.key === activeTab.key ? { ...item, loading: false } : item,
        ),
      );
      message.error(
        error?.message ||
          t('cluster.pod.file.read.failed', 'Failed to read file'),
      );
    }
  };

  const handleSave = async () => {
    if (
      !activeTab ||
      activeTab.binary ||
      activeTabShowsImagePreview ||
      !activeTab.writable
    ) {
      return;
    }
    setSavingTabKey(activeTab.key);
    try {
      const result = await saveFileContent(
        props,
        container,
        activeTab.path,
        activeTab.content,
        activeTabLanguage,
      );
      setTabs((prev) =>
        prev.map((item) => {
          if (item.key !== activeTab.key) {
            return item;
          }
          return {
            ...item,
            content: result.content || item.content,
            savedContent: result.content || item.content,
            encoding: result.encoding,
            language: resolveEditorLanguage(
              item.path,
              result.language || item.language,
              result.mimeType || item.mimeType,
            ),
            mimeType: result.mimeType,
            size: result.size,
            maxBytes: result.maxBytes,
            truncated: !!result.truncated,
          };
        }),
      );
      message.success(
        t('cluster.pod.file.save.success', 'Saved {name}', {
          name: activeTab.title,
        }),
      );
      await loadDirectoryChildren(getParentPath(activeTab.path), true);
    } finally {
      setSavingTabKey(undefined);
    }
  };

  const handleFormat = () => {
    if (!activeTab || !activeTabCanFormat) {
      return;
    }
    try {
      const formattedContent = formatStructuredContent(
        activeTab.content,
        activeTabLanguage,
      );
      setTabs((prev) =>
        prev.map((item) =>
          item.key === activeTab.key
            ? { ...item, content: formattedContent }
            : item,
        ),
      );
      message.success(
        t('cluster.pod.file.format.success', 'Formatted {name}', {
          name: activeTab.title,
        }),
      );
    } catch (error: any) {
      message.error(
        error?.message ||
          t(
            'cluster.pod.file.format.failed',
            'Failed to format the current file',
          ),
      );
    }
  };

  const handleUploadFile = async (file: File) => {
    const targetPath = normalizePath(currentPath);
    setUploading(true);
    try {
      await uploadFile(
        props,
        container,
        file,
        targetPath,
        file.size >= LARGE_FILE_UPLOAD_THRESHOLD,
      );
      message.success(
        t('cluster.pod.file.upload.success', 'Uploaded {name}', {
          name: file.name,
        }),
      );
      await loadDirectoryChildren(targetPath, true);
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    showUploadList: false,
    beforeUpload: (file) => {
      void handleUploadFile(file as File);
      return false;
    },
  };

  const handleCreate = async () => {
    const name = createDialog.name.trim();
    if (!name) {
      message.error(t('cluster.pod.file.name.required', 'Name is required'));
      return;
    }
    try {
      const result = await createFileEntry(
        props,
        container,
        currentPath,
        name,
        createDialog.directory,
      );
      setCreateDialog({ open: false, directory: false, name: '' });
      await loadDirectoryChildren(currentPath, true);
      message.success(
        t('cluster.pod.file.create.success', 'Created {name}', { name }),
      );
      if (!createDialog.directory && result?.dir) {
        await openFile(result.dir);
      }
    } catch (error: any) {
      message.error(
        error?.message ||
          t('cluster.pod.file.create.failed', 'Failed to create'),
      );
    }
  };

  const handleRename = async () => {
    if (!renameDialog.path) {
      return;
    }
    const newName = renameDialog.name.trim();
    if (!newName) {
      message.error(t('cluster.pod.file.name.required', 'Name is required'));
      return;
    }
    const oldPath = normalizePath(renameDialog.path);
    try {
      const result = await renameFileEntry(props, container, oldPath, newName);
      const nextPath = normalizePath(
        result?.dir || joinPath(getParentPath(oldPath), newName),
      );
      const parentPath = getParentPath(oldPath);
      setRenameDialog({ open: false, path: undefined, name: '' });
      setSelectedNodePath(nextPath);
      if (currentPath === oldPath) {
        setCurrentPath(nextPath);
      }
      if (activeTabKey === oldPath) {
        setActiveTabKey(nextPath);
      }
      setTabs((prev) => {
        const exactTab = prev.find((item) => item.path === oldPath);
        if (exactTab) {
          return prev.map((item) =>
            item.path === oldPath
              ? {
                  ...item,
                  key: nextPath,
                  path: nextPath,
                  title: getBaseName(nextPath),
                  language: resolveEditorLanguage(
                    nextPath,
                    item.language,
                    item.mimeType,
                  ),
                }
              : item,
          );
        }
        return prev.filter((item) => !isDescendantPath(oldPath, item.path));
      });
      await loadDirectoryChildren(parentPath, true);
      message.success(
        t('cluster.pod.file.rename.success', 'Renamed to {name}', {
          name: newName,
        }),
      );
    } catch (error: any) {
      message.error(
        error?.message ||
          t('cluster.pod.file.rename.failed', 'Failed to rename'),
      );
    }
  };

  const handleDelete = async () => {
    if (!canMutateSelected) {
      return;
    }
    const targetPath = normalizePath(actionTargetPath);
    Modal.confirm({
      title: t('cluster.pod.file.delete.title', 'Delete file or folder'),
      content: t(
        'cluster.pod.file.delete.content',
        'Are you sure you want to delete {name}?',
        {
          name: getBaseName(targetPath),
        },
      ),
      okText: t('cluster.pod.file.delete.confirm', 'Delete'),
      cancelText: t('cluster.pod.file.cancel', 'Cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteFileEntry(props, container, targetPath);
          setTabs((prev) =>
            prev.filter((item) => !isDescendantPath(targetPath, item.path)),
          );
          if (activeTabKey && isDescendantPath(targetPath, activeTabKey)) {
            setActiveTabKey(undefined);
          }
          const parentPath = getParentPath(targetPath);
          setSelectedNodePath(parentPath);
          setCurrentPath(parentPath);
          await loadDirectoryChildren(parentPath, true);
          message.success(
            t('cluster.pod.file.delete.success', 'Deleted {name}', {
              name: getBaseName(targetPath),
            }),
          );
        } catch (error: any) {
          message.error(
            error?.message ||
              t('cluster.pod.file.delete.failed', 'Failed to delete'),
          );
        }
      },
    });
  };

  const openRenameDialog = () => {
    if (!canMutateSelected) {
      return;
    }
    setRenameDialog({
      open: true,
      path: actionTargetPath,
      name: getBaseName(actionTargetPath),
    });
  };

  const handleSelectDirectory = async (dirPath: string) => {
    const normalizedPath = normalizePath(dirPath);
    setSelectedNodePath(normalizedPath);
    setCurrentPath(normalizedPath);
    setPathInput(normalizedPath);
    setExpandedKeys((prev) =>
      Array.from(
        new Set([
          ...prev,
          ...getExpandedPathKeys(workspaceRootPath, normalizedPath),
        ]),
      ),
    );
    await loadDirectoryChildren(normalizedPath);
  };

  const handleTabChange = async (key: string) => {
    setActiveTabKey(key);
    const nextTab = tabsRef.current.find((item) => item.key === key);
    if (!nextTab) {
      return;
    }
    if (isDescendantPath(workspaceRootPath, nextTab.path)) {
      setSelectedNodePath(nextTab.path);
      setCurrentPath(getParentPath(nextTab.path));
      setExpandedKeys((prev) =>
        Array.from(
          new Set([
            ...prev,
            ...getExpandedPathKeys(
              workspaceRootPath,
              getParentPath(nextTab.path),
            ),
          ]),
        ),
      );
      await loadDirectoryChildren(getParentPath(nextTab.path));
    }
  };

  if (!props.containers.length) {
    return (
      <Empty
        description={t(
          'cluster.pod.file.empty.container',
          'No available container in the current Pod',
        )}
      />
    );
  }

  return (
    <Card>
      <div
        className="pod-file-workspace"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <style>{`
          .pod-file-workspace .ant-tree {
            background: transparent;
            font-size: 13px;
          }
          .pod-file-workspace .ant-tree .ant-tree-treenode {
            width: 100%;
            padding: 0;
          }
          .pod-file-workspace .ant-tree .ant-tree-node-content-wrapper {
            width: calc(100% - 24px);
            padding: 0;
            background: transparent !important;
          }
          .pod-file-workspace .ant-tree .ant-tree-switcher {
            color: #8c8c8c;
          }
          .pod-file-workspace .ant-tree .ant-tree-indent-unit {
            width: 14px;
          }
          .pod-file-workspace .ant-tree .ant-tree-list-holder-inner {
            min-width: 100%;
          }
          .pod-file-workspace .ant-tabs-nav {
            margin: 0;
            padding-inline: 16px;
            background: ${token.colorBgContainer};
            border-bottom: 1px solid ${token.colorBorderSecondary};
          }
          .pod-file-workspace .ant-tabs-nav::before {
            border-bottom-color: ${token.colorBorderSecondary};
          }
          .pod-file-workspace .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
            background: ${token.colorBgContainer};
            border-color: ${token.colorBorderSecondary};
            border-radius: 12px 12px 0 0;
          }
          .pod-file-workspace .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
            background: ${token.colorFillAlter};
          }
          .pod-file-workspace .ant-tabs-content-holder,
          .pod-file-workspace .ant-tabs-content,
          .pod-file-workspace .ant-tabs-tabpane {
            min-height: 0;
          }
        `}</style>

        <div
          style={{
            padding: 20,
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            <Space wrap size={[16, 12]} align="start">
              <div style={{ minWidth: 240 }}>
                <div
                  style={{
                    color: token.colorTextSecondary,
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  {t('cluster.pod.file.pod', 'Pod')}
                </div>
                <Typography.Text strong style={{ fontSize: 18 }}>
                  {props.pod}
                </Typography.Text>
              </div>
              <div style={{ minWidth: 240 }}>
                <div
                  style={{
                    color: token.colorTextSecondary,
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  {t('cluster.pod.file.container', 'Container')}
                </div>
                <Select
                  value={container}
                  style={{ minWidth: 220 }}
                  options={props.containers.map((item) => ({
                    label: item,
                    value: item,
                  }))}
                  onChange={(value) => setContainer(value)}
                />
              </div>
              <div style={{ minWidth: 220 }}>
                <div
                  style={{
                    color: token.colorTextSecondary,
                    fontSize: 14,
                    marginBottom: 8,
                  }}
                >
                  {t('cluster.pod.file.workspace', 'Workspace')}
                </div>
                <Tag
                  style={{
                    margin: 0,
                    paddingInline: 10,
                    borderRadius: 8,
                    background: token.colorFillAlter,
                    borderColor: token.colorBorderSecondary,
                  }}
                >
                  {workspaceRootPath}
                </Tag>
              </div>
            </Space>
          </div>

          <Space wrap size={[12, 12]} style={{ marginTop: 20 }}>
            <Input.Search
              value={pathInput}
              onChange={(event) => setPathInput(event.target.value)}
              onSearch={(value) => void initializeWorkspace(value)}
              placeholder={t(
                'cluster.pod.file.path.placeholder',
                'Enter an absolute path and switch workspace',
              )}
              style={{ width: 360, maxWidth: '100%' }}
              enterButton={t('cluster.pod.file.path.submit', 'Go')}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void initializeWorkspace(workspaceRootPath)}
            >
              {t('cluster.pod.file.refresh', 'Refresh')}
            </Button>
            <Upload {...uploadProps} disabled={uploading}>
              <Button loading={uploading} icon={<CloudUploadOutlined />}>
                {t('cluster.pod.file.upload', 'Upload file')}
              </Button>
            </Upload>
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              disabled={!currentFilePath}
              onClick={() =>
                currentFilePath && void handleDownload(currentFilePath)
              }
            >
              {t('cluster.pod.file.download.current', 'Download current file')}
            </Button>
          </Space>
        </div>

        <div
          style={{
            overflow: 'hidden',
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,

            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
          }}
        >
          <Splitter style={{ height: '74vh', minHeight: 640 }}>
            <Splitter.Panel defaultSize="30%" min="24%" max="42%">
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  background: token.colorBgContainer,
                  borderRight: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <div
                  style={{
                    padding: '18px 18px 14px',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorBgContainer,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <Typography.Text strong style={{ display: 'block' }}>
                        {t('cluster.pod.file.explorer', 'File Explorer')}
                      </Typography.Text>
                      <Typography.Text
                        type="secondary"
                        style={{ display: 'block', fontSize: 12, marginTop: 4 }}
                      >
                        {workspaceRootNode?.name || workspaceRootPath}
                      </Typography.Text>
                    </div>
                    <Space size={[6, 6]} wrap>
                      <Tag style={{ margin: 0, borderRadius: 8 }}>
                        {t('cluster.pod.file.stats.dirs', 'Dirs {count}', {
                          count: directDirectories,
                        })}
                      </Tag>
                      <Tag style={{ margin: 0, borderRadius: 8 }}>
                        {t('cluster.pod.file.stats.files', 'Files {count}', {
                          count: directFiles,
                        })}
                      </Tag>
                      <Tag style={{ margin: 0, borderRadius: 8 }}>
                        {t(
                          'cluster.pod.file.stats.direct',
                          '{count} direct items',
                          {
                            count: currentEntries.length,
                          },
                        )}
                      </Tag>
                    </Space>
                  </div>
                  <Space wrap size={[8, 8]} style={{ marginTop: 12 }}>
                    <Button
                      icon={<FileAddOutlined />}
                      onClick={() =>
                        setCreateDialog({
                          open: true,
                          directory: false,
                          name: '',
                        })
                      }
                    >
                      {t('cluster.pod.file.create.file', 'New file')}
                    </Button>
                    <Button
                      icon={<FolderAddOutlined />}
                      onClick={() =>
                        setCreateDialog({
                          open: true,
                          directory: true,
                          name: '',
                        })
                      }
                    >
                      {t('cluster.pod.file.create.folder', 'New folder')}
                    </Button>
                    <Button
                      icon={<EditOutlined />}
                      disabled={!canMutateSelected}
                      onClick={openRenameDialog}
                    >
                      {t('cluster.pod.file.rename', 'Rename')}
                    </Button>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      disabled={!canMutateSelected}
                      onClick={() => void handleDelete()}
                    >
                      {t('cluster.pod.file.delete', 'Delete')}
                    </Button>
                  </Space>
                  <Input.Search
                    allowClear
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder={t(
                      'cluster.pod.file.search.placeholder',
                      'Filter files or folders',
                    )}
                    style={{ marginTop: 12 }}
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto',
                    padding: 12,
                  }}
                >
                  <Spin spinning={directoryLoading}>
                    {filteredTreeData.length ? (
                      <Tree
                        blockNode
                        showIcon={false}
                        selectedKeys={
                          selectedNodePath ? [selectedNodePath] : []
                        }
                        expandedKeys={visibleExpandedKeys}
                        treeData={filteredTreeData}
                        loadData={async (node) => {
                          const explorerNode = node as ExplorerNode;
                          if (explorerNode.entryType === 'dir') {
                            await loadDirectoryChildren(explorerNode.path);
                          }
                        }}
                        onExpand={(keys) => setExpandedKeys(keys as string[])}
                        titleRender={(node) => {
                          const explorerNode = node as ExplorerNode;
                          const isActive =
                            explorerNode.path === selectedNodePath;
                          return (
                            <div
                              onClick={() => {
                                if (explorerNode.entryType === 'dir') {
                                  void handleSelectDirectory(explorerNode.path);
                                  return;
                                }
                                void openFile(explorerNode.path);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                minWidth: 0,
                                padding: '6px 8px',
                                borderRadius: 6,
                                background: isActive
                                  ? token.controlItemBgActive
                                  : 'transparent',
                              }}
                            >
                              {explorerNode.entryType === 'dir' ? (
                                expandedKeys.includes(explorerNode.path) ? (
                                  <FolderOpenOutlined
                                    style={{ color: token.colorPrimary }}
                                  />
                                ) : (
                                  <FolderOutlined
                                    style={{ color: token.colorPrimary }}
                                  />
                                )
                              ) : (
                                <FileOutlined
                                  style={{ color: token.colorTextSecondary }}
                                />
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <Typography.Text
                                  ellipsis={{ tooltip: explorerNode.path }}
                                  style={{
                                    color: isActive
                                      ? token.colorPrimary
                                      : token.colorText,
                                  }}
                                >
                                  {explorerNode.name}
                                </Typography.Text>
                              </div>
                              {explorerNode.entryType === 'file' &&
                              explorerNode.meta?.binary ? (
                                <Typography.Text
                                  type="secondary"
                                  style={{ fontSize: 11 }}
                                >
                                  {t('cluster.pod.file.binary.short', 'binary')}
                                </Typography.Text>
                              ) : null}
                            </div>
                          );
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            searchValue.trim()
                              ? t(
                                  'cluster.pod.file.search.empty',
                                  'No matching files or folders',
                                )
                              : t(
                                  'cluster.pod.file.directory.empty',
                                  'This directory is empty',
                                )
                          }
                        />
                      </div>
                    )}
                  </Spin>
                </div>
              </div>
            </Splitter.Panel>

            <Splitter.Panel>
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  background: token.colorBgContainer,
                }}
              >
                <Tabs
                  hideAdd
                  type="editable-card"
                  activeKey={activeTabKey}
                  onChange={(key) => void handleTabChange(key)}
                  onEdit={(targetKey, action) => {
                    if (action === 'remove') {
                      closeTab(String(targetKey));
                    }
                  }}
                  items={tabs.map((item) => ({
                    key: item.key,
                    label: (
                      <Space size={6}>
                        <span>{item.title}</span>
                        {item.content !== item.savedContent && !item.binary ? (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: token.colorPrimary,
                              display: 'inline-block',
                            }}
                          />
                        ) : null}
                      </Space>
                    ),
                    children: <></>,
                  }))}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorBgContainer,
                  }}
                >
                  <Space wrap size={[8, 8]}>
                    {activeTab?.size !== undefined && (
                      <Tag style={{ margin: 0 }}>
                        {formatBytes(activeTab.size)}
                      </Tag>
                    )}
                    {activeTab && (
                      <Tag
                        color={activeTab.binary ? 'volcano' : 'blue'}
                        style={{ margin: 0 }}
                      >
                        {activeTabIsImage
                          ? t('cluster.pod.file.image', 'Image')
                          : activeTab.binary
                            ? t('cluster.pod.file.binary', 'Binary file')
                            : t('cluster.pod.file.text', 'Text file')}
                      </Tag>
                    )}
                    {activeTab?.truncated && (
                      <Tag color="gold" style={{ margin: 0 }}>
                        {t(
                          'cluster.pod.file.preview.limit',
                          'Loaded only the first',
                        )}{' '}
                        {formatBytes(activeTab.maxBytes || TEXT_PREVIEW_LIMIT)}
                      </Tag>
                    )}
                  </Space>

                  <Space wrap size={[8, 8]}>
                    {activeTabIsSvg && (
                      <Radio.Group
                        size="small"
                        optionType="button"
                        buttonStyle="solid"
                        value={activeTabSvgViewMode}
                        onChange={(event) => {
                          if (!activeTab) {
                            return;
                          }
                          const nextMode = event.target.value as
                            | 'preview'
                            | 'source';
                          setSvgViewModes((prev) => ({
                            ...prev,
                            [activeTab.key]: nextMode,
                          }));
                        }}
                        options={[
                          {
                            label: t('cluster.pod.file.svg.preview', 'Preview'),
                            value: 'preview',
                          },
                          {
                            label: t('cluster.pod.file.svg.source', 'Source'),
                            value: 'source',
                          },
                        ]}
                      />
                    )}
                    {activeTabCanFormat && (
                      <Button size="small" onClick={() => handleFormat()}>
                        {t('cluster.pod.file.format', 'Format')}
                      </Button>
                    )}
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      disabled={!activeTab}
                      onClick={() => void reloadActiveTab()}
                    >
                      {t('cluster.pod.file.reload', 'Reload')}
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<SaveOutlined />}
                      disabled={
                        !activeTab ||
                        activeTab.binary ||
                        activeTabShowsImagePreview ||
                        !activeTab.writable ||
                        activeTab.content === activeTab.savedContent
                      }
                      loading={savingTabKey === activeTab?.key}
                      onClick={() => void handleSave()}
                    >
                      {t('cluster.pod.file.save', 'Save changes')}
                    </Button>
                  </Space>
                </div>

                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorFillAlter,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    {breadcrumbItems.map((item, index) => (
                      <React.Fragment key={item.path}>
                        <Typography.Link
                          onClick={() => void handleSelectDirectory(item.path)}
                        >
                          {item.title}
                        </Typography.Link>
                        {index < breadcrumbItems.length - 1 && (
                          <Typography.Text type="secondary">/</Typography.Text>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <Space wrap size={[10, 6]}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {t('cluster.pod.file.current.dir', 'Current directory')}:{' '}
                      {currentPath}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {t('cluster.pod.file.direct.items', 'Direct items')}:{' '}
                      {currentEntries.length}
                    </Typography.Text>
                    {activeTab?.encoding && (
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        {t('cluster.pod.file.encoding', 'Encoding')}:{' '}
                        {activeTab.encoding}
                      </Typography.Text>
                    )}
                    {activeTab?.mimeType && (
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        MIME: {activeTab.mimeType}
                      </Typography.Text>
                    )}
                  </Space>
                </div>

                <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                  {!activeTab ? (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24,
                      }}
                    >
                      <div style={{ textAlign: 'center', maxWidth: 520 }}>
                        <Empty
                          description={t(
                            'cluster.pod.file.empty.title',
                            'Select a file from the left to preview or edit',
                          )}
                        />
                        <Space wrap size={[8, 8]}>
                          <Tag color="blue">
                            {t(
                              'cluster.pod.file.current.dir',
                              'Current directory',
                            )}{' '}
                            {currentPath}
                          </Tag>
                          <Tag>
                            {t(
                              'cluster.pod.file.stats.direct',
                              '{count} direct items',
                              {
                                count: currentEntries.length,
                              },
                            )}
                          </Tag>
                          <Tag color="geekblue">
                            {t(
                              'cluster.pod.file.stats.files',
                              'Files {count}',
                              {
                                count: (
                                  workspaceRootNode?.children || []
                                ).filter((item) => item.entryType === 'file')
                                  .length,
                              },
                            )}
                          </Tag>
                        </Space>
                      </div>
                    </div>
                  ) : activeTab.loading ? (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Spin />
                    </div>
                  ) : activeTabShowsImagePreview ? (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          minHeight: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'auto',
                          padding: 24,
                        }}
                      >
                        {imagePreviewLoading ? (
                          <Spin />
                        ) : imagePreviewUrl ? (
                          <img
                            alt={activeTab.title}
                            src={imagePreviewUrl}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              borderRadius: 12,
                              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                              background: token.colorBgLayout,
                            }}
                          />
                        ) : (
                          <Empty
                            description={t(
                              'cluster.pod.file.image.failed',
                              'Unable to load the image preview. Please download the file to view it.',
                            )}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          padding: '0 24px 24px',
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <Space wrap size={[8, 8]}>
                          <Button
                            icon={<CloudDownloadOutlined />}
                            onClick={() => void handleDownload(activeTab.path)}
                          >
                            {t(
                              'cluster.pod.file.download.file',
                              'Download file',
                            )}
                          </Button>
                          <Upload {...uploadProps} disabled={uploading}>
                            <Button
                              loading={uploading}
                              icon={<CloudUploadOutlined />}
                            >
                              {t(
                                'cluster.pod.file.upload.replace',
                                'Upload replacement file',
                              )}
                            </Button>
                          </Upload>
                        </Space>
                      </div>
                    </div>
                  ) : activeTab.binary ? (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24,
                      }}
                    >
                      <div style={{ textAlign: 'center', maxWidth: 460 }}>
                        <Empty
                          description={t(
                            'cluster.pod.file.binary.title',
                            'This file cannot be edited online',
                          )}
                        />
                        <Space wrap size={[8, 8]}>
                          <Button
                            icon={<CloudDownloadOutlined />}
                            onClick={() => void handleDownload(activeTab.path)}
                          >
                            {t(
                              'cluster.pod.file.download.file',
                              'Download file',
                            )}
                          </Button>
                          <Upload {...uploadProps} disabled={uploading}>
                            <Button
                              loading={uploading}
                              icon={<CloudUploadOutlined />}
                            >
                              {t(
                                'cluster.pod.file.upload.replace',
                                'Upload replacement file',
                              )}
                            </Button>
                          </Upload>
                        </Space>
                      </div>
                    </div>
                  ) : (
                    <Editor
                      beforeMount={ensureFileEditorLanguages}
                      height="100%"
                      language={activeTabLanguage}
                      theme="vs"
                      value={activeTab.content}
                      options={{
                        automaticLayout: true,
                        fontSize: 13,
                        minimap: {
                          enabled: true,
                          scale: 1,
                          showSlider: 'mouseover',
                        },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        readOnly: !activeTab.writable,
                        padding: { top: 16 },
                        smoothScrolling: true,
                        renderLineHighlight: 'gutter',
                      }}
                      onChange={(value) => {
                        setTabs((prev) =>
                          prev.map((item) =>
                            item.key === activeTab.key
                              ? { ...item, content: value || '' }
                              : item,
                          ),
                        );
                      }}
                    />
                  )}
                </div>
              </div>
            </Splitter.Panel>
          </Splitter>
        </div>
      </div>

      <Modal
        open={createDialog.open}
        title={
          createDialog.directory
            ? t('cluster.pod.file.create.folder', 'New folder')
            : t('cluster.pod.file.create.file', 'New file')
        }
        okText={t('cluster.pod.file.confirm', 'Confirm')}
        cancelText={t('cluster.pod.file.cancel', 'Cancel')}
        onCancel={() =>
          setCreateDialog({ open: false, directory: false, name: '' })
        }
        onOk={() => void handleCreate()}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            {t('cluster.pod.file.current.dir', 'Current directory')}:{' '}
            {currentPath}
          </Typography.Text>
          <Radio.Group
            value={createDialog.directory ? 'dir' : 'file'}
            onChange={(event) =>
              setCreateDialog((prev) => ({
                ...prev,
                directory: event.target.value === 'dir',
              }))
            }
          >
            <Radio.Button value="file">
              {t('cluster.pod.file.create.file', 'New file')}
            </Radio.Button>
            <Radio.Button value="dir">
              {t('cluster.pod.file.create.folder', 'New folder')}
            </Radio.Button>
          </Radio.Group>
          <Input
            value={createDialog.name}
            onChange={(event) =>
              setCreateDialog((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder={t('cluster.pod.file.name.placeholder', 'Enter name')}
            onPressEnter={() => void handleCreate()}
          />
        </Space>
      </Modal>

      <Modal
        open={renameDialog.open}
        title={t('cluster.pod.file.rename', 'Rename')}
        okText={t('cluster.pod.file.confirm', 'Confirm')}
        cancelText={t('cluster.pod.file.cancel', 'Cancel')}
        onCancel={() =>
          setRenameDialog({ open: false, path: undefined, name: '' })
        }
        onOk={() => void handleRename()}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            {renameDialog.path}
          </Typography.Text>
          <Input
            value={renameDialog.name}
            onChange={(event) =>
              setRenameDialog((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder={t('cluster.pod.file.name.placeholder', 'Enter name')}
            onPressEnter={() => void handleRename()}
          />
        </Space>
      </Modal>
    </Card>
  );
};

export default PodContainerFile;
