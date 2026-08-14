import type {
  AccessTokenResponse,
  ClientInformation,
} from "@/services/common.d";
import type { ClusterServerGroup } from "@/services/kubernetes";
import { aesDecrypt, aesEncrypt } from "@/utils/crypto";
import * as yaml from "js-yaml";
import pako from "pako";
// 系统认证重定向地址
const systemOauthUrl = "se";
//保存访问不同组织的token 信息
const tokenKey = "ke";
//保存组织信息
export const saveClusterVersion = (clusterCode: string, version: string) => {
  localStorage.setItem(`${clusterCode}|v`, version);
};
export const getClusterVersion = (clusterCode: string): string => {
  return localStorage.getItem(`${clusterCode}|v`) || "";
};
export const saveClusterApiVersions = (clusterCode: string, groups: string) => {
  localStorage.setItem(`${clusterCode}|-`, groups);
};
export const getClusterApiVersionDetail = (
  clusterCode: string,
  group: string,
  version: string,
  kind: string
): ClusterServerGroup => {
  const secretKey = "asdfS2324A><:..";
  const info = localStorage.getItem(`${clusterCode}|-`) || "[]";
  if (info && info !== "[]") {
    const decryptedInfo = aesDecrypt(info, secretKey);
    const groups = JSON.parse(decryptedInfo) as ClusterServerGroup[];
    if (groups && groups.length > 0) {
      for (let i = 0; i < groups.length; i++) {
        if (groups[i].group === group && groups[i].kind === kind) {
          if (groups[i].name && groups[i].name !== "") {
            if (!groups[i].name?.includes("/")) {
              return groups[i];
            }
          }
        }
      }
    }
  }

  return {
    group: group,
    version: version,
    groupVersion: `${group}/${version}`,
  } as ClusterServerGroup;
};
export const getClusterApiVersions = (
  clusterCode: string,
  groupVersions: string[],
  kind: string
): ClusterServerGroup => {
  const secretKey = "asdfS2324A><:..";
  const info = localStorage.getItem(`${clusterCode}|-`) || "[]";
  if (info && info !== "[]") {
    const decryptedInfo = aesDecrypt(info, secretKey);
    const groups = JSON.parse(decryptedInfo) as ClusterServerGroup[];
    if (groups && groups.length > 0) {
      for (let i = 0; i < groups.length; i++) {
        if (
          groupVersions.includes(groups[i].groupVersion) &&
          groups[i].kind === kind
        ) {
          return groups[i];
        }
      }
    }
  }
  let sp = groupVersions[0].split("/");
  return {
    group: sp[0],
    version: sp[1],
    groupVersion: groupVersions[0],
  } as ClusterServerGroup;
};
export const saveClusterFeatures = (
  clusterCode: string,
  features: string[]
) => {
  localStorage.setItem(`${clusterCode}|f`, JSON.stringify(features));
};
export const getClusterFeatures = (clusterCode: string): string[] => {
  const info = localStorage.getItem(`${clusterCode}|f`) || undefined;
  if (info && info != "undefined") {
    return JSON.parse(info) as string[];
  } else {
    return [];
  }
};
export const base64Decode = (base64String: string): string => {
  // 使用 atob 将 base64 字符串解码为二进制字符串
  const binaryString = atob(base64String);
  // 将二进制字符串转换为 UTF-8 字符串
  try {
    const utf8String = decodeURIComponent(escape(binaryString));
    return utf8String;
  } catch (error) {
    return binaryString;
  }
};

//
export const convertTimestampToDate = (timestampInSeconds: number): string => {
  // 将秒级时间戳转换为毫秒
  const date = new Date(timestampInSeconds * 1000);

  // 格式化日期输出
  // 这里我们使用了toISOString方法，并对结果进行了处理，去掉末尾的'Z'和'T'
  return date.toISOString().replace("T", " ").substring(0, 19);
};
function startsWithHyphen(str: string): boolean {
  return /^-/.test(str);
}
type SlashStart = `/${string}`;
function isSlashStart(str: string): str is SlashStart {
  return str.startsWith("/");
}
// 自定义 schema，注册 !!merge 标签（实际上忽略它，因为 << 已足够）
export const customSchema = yaml.DEFAULT_SCHEMA.extend({
  implicit: [],
  explicit: [
    new yaml.Type("tag:yaml.org,2002:merge", {
      kind: "mapping",
      construct: function (data) {
        // 实际上我们不需要构造任何东西，因为 << 已触发合并
        return data || {};
      },
    }),
  ],
});
// 分割YAML文件的函数
export const splitYamlFiles = (multiDocumentYaml: string): string[] => {
  // 正则表达式匹配---后面的换行符，以及可能的空格
  const splitRegex = /^---\s*/gm;
  // 使用split保留分隔符，这样每个文档都会以"---"开始
  const documents = multiDocumentYaml.split(splitRegex);
  // 移除空文档
  const resources = documents.filter((doc) => doc.trim());
  const newResources = [] as string[];
  //  判断是否时item list
  for (let i = 0; i < resources.length; i++) {
    const content = resources[i].replace(/!!merge\s+<</g, "<<");
    try {
      const resourceObj = yaml.load(content, { schema: customSchema });
      if (
        resourceObj?.kind.endsWith("List") &&
        resourceObj?.items &&
        resourceObj?.items.length > 0 &&
        resourceObj?.apiVersion
      ) {
        for (let j = 0; j < resourceObj.items.length; j++) {
          const re = yaml.dump(resourceObj.items[j], {
            indent: 2,
            noRefs: true,
          });
          newResources.push(re);
        }
      } else {
        newResources.push(content);
      }
    } catch (error) {
      console.log(error);
    }
  }
  return newResources;
};

export const getHelmData = (text: string): string => {
  const gzipData = base64Decode(text);
  return decompressGzip(gzipData);
};
export const getHeight = (text: string): string => {
  let line = Math.floor(countNewLines(text) * 2);
  line = line < 10 ? 10 : line;
  line = line > 80 ? 80 : line;
  return `${line + 10}vh`;
};
export const countNewLines = (text: string): number => {
  if (text) {
    return text.split("\n").length - 1;
  } else {
    return 1;
  }
};

export const decompressGzip = (gzip: string): string => {
  var binaryString = gzip;
  var binaryLen = binaryString.length;
  var bytes = new Uint8Array(binaryLen);
  for (var i = 0; i < binaryLen; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  var data = pako.inflate(bytes);
  return new TextDecoder("utf-8").decode(data);
};
export const removeSuffix = (str: string, suffix: string): string => {
  if (str.endsWith(suffix)) {
    return str.slice(0, -suffix.length);
    // 或者使用substring方法:
    // return str.substring(0, str.length - suffix.length);
  }
  return str;
};
// 加密客户端数据
export const getClientData = (): string => {
  const client = {} as ClientInformation;
  const sKey = "Efucloud2024OKOK";
  client.hardwareConcurrency = navigator.hardwareConcurrency;
  client.userAgent = navigator.userAgent;
  client.platform = navigator.platform;
  client.vendor = navigator.vendor;
  client.deviceMemory = navigator?.deviceMemory || 0;
  return aesEncrypt(JSON.stringify(client), sKey);
};

export const getCurrentMenuParams = (): [string, string] => {
  let cluster = "";
  let namespace = "";
  if (window.location.pathname.startsWith("/kubernetes")) {
    const info = getCurrentViewInfo();
    cluster = info.cluster || "";
    namespace = info.namespace || "";
  }
  return [cluster, namespace];
};
export interface ViewInformation {
  cluster: string;
  namespace: string;
  isAdmin: boolean;
  isCluster: boolean;
  isNamespace: boolean;
}

const KUBERNETES_ROOT_PATH = "/kubernetes";
const STATIC_CLUSTER_PATH = "/kubernetes/cluster";
const STATIC_NAMESPACE_PATH = "/kubernetes/namespace";
const STATIC_CLUSTER_SEGMENTS = new Set([
  "terminal",
  "dashboard",
  "permission",
  "node",
  "namespace",
  "workload",
  "config",
  "networks",
  "access",
  "storage",
  "policy",
  "monitor",
  "customresourcedefinitions",
  "apiservices",
]);

const getViewQueryValue = (value?: string | null) => {
  if (!value || value === "-") {
    return "";
  }
  return value;
};

export const appendKubernetesViewQuery = (
  path: string,
  view?: Partial<Pick<ViewInformation, "cluster" | "namespace">>
) => {
  if (!path || !path.startsWith(KUBERNETES_ROOT_PATH)) {
    return path;
  }

  const [pathname, rawSearch = ""] = path.split("?");
  if (
    !pathname.startsWith(STATIC_CLUSTER_PATH) &&
    !pathname.startsWith(STATIC_NAMESPACE_PATH)
  ) {
    return path;
  }

  const searchParams = new URLSearchParams(rawSearch);
  const currentView = view || getCurrentViewInfo();
  const cluster = getViewQueryValue(currentView.cluster);
  const namespace = getViewQueryValue(currentView.namespace);

  if (cluster) {
    searchParams.set("cluster", cluster);
  } else {
    searchParams.delete("cluster");
  }

  if (pathname.startsWith(STATIC_NAMESPACE_PATH) && namespace) {
    searchParams.set("namespace", namespace);
  } else {
    searchParams.delete("namespace");
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
};

export const normalizeKubernetesPath = (path: string) => {
  if (!path || !path.startsWith(KUBERNETES_ROOT_PATH)) {
    return path;
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(path, baseUrl);
  const segments = url.pathname.split("/").filter(Boolean);

  if (url.pathname.startsWith(STATIC_NAMESPACE_PATH)) {
    return appendKubernetesViewQuery(
      `${url.pathname}${url.search}`,
      {
        cluster: url.searchParams.get("cluster") || getCurrentViewInfo().cluster,
        namespace: url.searchParams.get("namespace") || getCurrentViewInfo().namespace,
      }
    );
  }

  if (
    url.pathname === STATIC_CLUSTER_PATH ||
    (url.pathname.startsWith(`${STATIC_CLUSTER_PATH}/`) &&
      segments[2] &&
      STATIC_CLUSTER_SEGMENTS.has(segments[2]))
  ) {
    return appendKubernetesViewQuery(
      `${url.pathname}${url.search}`,
      {
        cluster: url.searchParams.get("cluster") || getCurrentViewInfo().cluster,
      }
    );
  }

  if (segments.length < 3 || segments[0] !== "kubernetes" || segments[1] !== "cluster") {
    return path;
  }

  const legacyCluster = segments[2];
  if (segments[3] === "namespace") {
    const legacyNamespace = segments[4] || "";
    const restPath = segments.slice(5).join("/");
    const pathname = restPath
      ? `${STATIC_NAMESPACE_PATH}/${restPath}`
      : `${STATIC_NAMESPACE_PATH}/dashboard/overview`;

    return appendKubernetesViewQuery(
      `${pathname}${url.search}`,
      {
        cluster: legacyCluster,
        namespace: legacyNamespace,
      }
    );
  }

  const restPath = segments.slice(3).join("/");
  const pathname = restPath
    ? `${STATIC_CLUSTER_PATH}/${restPath}`
    : `${STATIC_CLUSTER_PATH}`;

  return appendKubernetesViewQuery(
    `${pathname}${url.search}`,
    {
      cluster: legacyCluster,
    }
  );
};

export const getCurrentViewInfo = (): ViewInformation => {
  const info = {
    cluster: "",
    namespace: "",
    isAdmin: false,
    isCluster: false,
    isNamespace: false,
  } as ViewInformation;
  if (window.location.pathname.startsWith("/kubernetes")) {
    const searchParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    const pathSegments = pathname.split("/").filter(Boolean);
    const currentSegment = pathSegments[2];

    if (pathname.startsWith(STATIC_NAMESPACE_PATH)) {
      info.cluster = getViewQueryValue(searchParams.get("cluster"));
      info.namespace = getViewQueryValue(searchParams.get("namespace"));
      info.isNamespace = true;
      info.isCluster = false;
      return info;
    }

    if (
      pathname === STATIC_CLUSTER_PATH ||
      (pathname.startsWith(STATIC_CLUSTER_PATH) &&
        currentSegment &&
        STATIC_CLUSTER_SEGMENTS.has(currentSegment))
    ) {
      info.cluster = getViewQueryValue(searchParams.get("cluster"));
      info.namespace = getViewQueryValue(searchParams.get("namespace"));
      info.isCluster = true;
      return info;
    }

    const sp = pathname.split("/");
    if (sp?.[2] === "cluster") {
      info.cluster = getViewQueryValue(sp?.[3]);
      info.isCluster = true;
    }
    if (sp?.[4] === "namespace" && sp?.[5]) {
      info.isNamespace = true;
      info.namespace = getViewQueryValue(sp[5]);
      info.isCluster = false;
    }
  }
  return info;
};
export const getColorPrimary = (): string => {
  return "#1890ff";
};
// 获取 tokens

// 获取 token（当前组织）
export const getToken = (): AccessTokenResponse => {
  const token = JSON.parse(localStorage.getItem(tokenKey) || "{}");
  if (token?.timestamp > Date.now()) {
    deleteToken();
    return {} as AccessTokenResponse;
  }
  return token;
};

// 添加 token 到 localStorage
export const addToken = (token: AccessTokenResponse) => {
  localStorage.setItem(tokenKey, JSON.stringify(token));
};

// 从 localStorage 删除 token
export const deleteToken = () => {
  localStorage.removeItem(tokenKey);
};

export const deleteAllToken = () => {
  localStorage.removeItem(tokenKey);
};

export const isGlobalPersonalCenter = () => {
  return window.location.pathname.startsWith("/system/personal/");
};
export const isPersonalCenter = () => {
  const p = window.location.pathname.split("/");
  if (p[1] === "tenant" && p[3] === "personal") {
    return true;
  }
  return false;
};
export const getI18nLanguage = () => {
  return localStorage.getItem("umi_locale") || "zh-CN";
};
export const getSearchParams = () => {
  return new URLSearchParams(window.location.search);
};

export const setSystemOauthUrl = (url: string) => {
  sessionStorage.setItem(systemOauthUrl, url);
};
export const getSystemOauthUrl = (): string => {
  return sessionStorage.getItem(systemOauthUrl) || "";
};
export const deleteSystemOauthUrl = () => {
  sessionStorage.removeItem(systemOauthUrl);
};
export const StringsToNumbers = (list: string[]) => {
  return list.map((item) => Number(item));
};
export function getExecutionTimeDetailed(
  startTimeStr: string,
  endTimeStr: string
) {
  const start = new Date(startTimeStr);
  const end = new Date(endTimeStr);
  if (isNaN(start) || isNaN(end)) {
    return "";
  }

  const diffMs = end - start;
  if (diffMs < 0) {
    return "";
  }

  // 时间单位换算（全部基于秒）
  let totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / (24 * 3600));
  totalSeconds %= 24 * 3600;

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // 拼接非零部分（更友好）
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`); // 全为0时显示“0秒”

  return parts.join("");
}

export function getCurrentUTCTimeString() {
  const now = new Date();
  // toISOString() 返回类似 "2025-07-26T10:00:00.123Z"
  // 截取前19位 + 'Z' 即可去掉毫秒
  return now.toISOString().slice(0, 19) + "Z";
}

/**
 * 从转义的 Go 模板文本中提取所有变量字段名（如 .name, .hasIngress）
 * 排除：纯 end / else / comment，但保留 if/range/with 中的变量
 * @param content - 包含 _{{_ ... _}}_ 的字符串
 * @returns 去重的字段名数组
 */
export function extractGoTemplateVariables(content: string): string[] {
  const variableSet = new Set<string>();
  const regex = /_\{\{_([\s\S]*?)_\}\}_/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    let inner = match[1].trim();

    // 跳过空内容
    if (!inner) continue;

    // 跳过纯 end / else（不带变量的关键字）
    if (/^(end|else)$/i.test(inner)) {
      continue;
    }

    // 跳过注释：/* ... */
    if (/^\/\*[\s\S]*\*\/$/.test(inner)) {
      continue;
    }

    // 在剩余内容中查找所有 .Identifier 形式的变量
    // 支持：.name, .Name, .user_name, .hasIngress 等
    const varRegex = /\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let varMatch;
    while ((varMatch = varRegex.exec(inner)) !== null) {
      variableSet.add(varMatch[1]);
    }
  }

  return Array.from(variableSet);
}
