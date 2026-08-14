import { getI18nLanguage } from "@/utils/global";
import * as yaml from "js-yaml";
import { IIoK8sApiCoreV1Volume } from "kubernetes-models/v1";
export const listClusterNamespaces = (
  org: string,
  cluster: string
): string[] => {
  const namespaces = [] as string[];
  return namespaces;
};
// 导出一个函数，用于获取集群资源
export const getClusterResource = (
  key: string,
  isZhCn: boolean = true
): string => {
  // 获取当前语言
  const lang = getI18nLanguage();
  // 如果当前语言是英文
  if (lang == "en-US") {
    // 返回key
    return key;
  }
  // 获取集群资源中key对应的值
  const re = clusterResourceZhCn[key];
  // 如果有对应的值
  if (re) {
    // 如果isZhCn为true
    if (isZhCn) {
      // 返回值和key的组合
      return `${re}(${key})`;
    } else {
      return re;
    }
  }
  return key;
};

interface ClusterResource {
  [key: string]: string;
}

const clusterResourceZhCn: ClusterResource = {
  Node: "节点",
  Service: "服务",
  Deployment: "无状态",
  StatefulSet: "有状态",
  DaemonSet: "守护进程集",
  ReplicaSet: "副本集",
  Job: "任务",
  CronJob: "定时任务",
  Pod: "容器组",
  ConfigMap: "配置项",
  Secret: "保密字典",
  ServiceAccount: "服务账户",
  Ingress: "入站规则",
  Route: "路由",
  IngressClass: "路由类",
  NetworkPolicy: "网络策略",
  HPA: "水平Pod自动扩缩",
  Certificate: "证书",
  ClusterRole: "集群角色",
  ClusterRoleBinding: "集群角色绑定",
  Role: "角色",
  RoleBinding: "角色绑定",
  PersistentVolume: "存储卷",
  PersistentVolumeClaim: "存储卷声明",
  StorageClass: "存储类",
  Namespace: "命名空间",
  HelmInstance: "Helm部署应用",
  CustomResourceDefinition: "自定义资源",
  CanaryConfig: "金丝雀发布配置",
  Environment: "环境",
  Function: "函数",
  HTTPTrigger: "HTTP触发器",
  KubernetesWatchTrigger: "集群监听触发器",
  MessageQueueTrigger: "消息队列触发器",
  Package: "函数包",
  TimeTrigger: "定时触发器",
  CertificateSigningRequest: "请求签名证书",
  Pipeline: "流水线",
  MutatingWebhookConfiguration: "变更钩子配置",
  ValidatingWebhookConfiguration: "验证钩子配置",
};
export interface TemplateProps {
  key: string;
  content: string; // 模版内容
  apiVersion: string; // api版本
  kind: string; // 资源类型
  name: string; // 资源名称
}
export const getResourceInfo = (content: string): TemplateProps => {
  if (!content) {
    return {} as TemplateProps;
  }
  const props = {} as TemplateProps;
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("apiVersion: ")) {
      props.apiVersion = extractApiVersoin(lines[i]);
    } else if (lines[i].startsWith("kind: ")) {
      props.kind = extractKind(lines[i]);
    } else if (lines[i].startsWith("  name: ")) {
      props.name = extractName(lines[i]);
    }
  }
  try {
    const data = yaml.load(content);
    if (data?.metadata) {
      if (data.metadata?.uid) {
        delete data.metadata.uid;
      }
      if (data.metadata?.resourceVersion) {
        delete data.metadata.resourceVersion;
      }
      if (data.metadata?.generation) {
        delete data.metadata.generation;
      }
      if (data.metadata?.creationTimestamp) {
        delete data.metadata.creationTimestamp;
      }
      if (data.metadata?.ownerReferences) {
        delete data.metadata.ownerReferences;
      }
      if (data.metadata?.managedFields) {
        delete data.metadata.managedFields;
      }
    }
    if (data?.status) {
      delete data.status;
    }
    props.content = yaml.dump(data);
  } catch (error) {
    props.content = content;
  }

  return props;
};
function extractKind(line: string) {
  return line.replace("kind: ", "");
}
function extractApiVersoin(line: string) {
  return line.replace("apiVersion: ", "");
}
function extractName(line: string) {
  return line.replace("  name: ", "");
}
/**
 * 将 CPU 值转换为毫核（millicores）
 * - string 类型：符合 Kubernetes 规范，不带单位默认是“核”，"xxxm" 是毫核
 * - number 类型：默认单位是“毫核（m）”，直接返回
 * @param cpu string | number
 * @returns 毫核数值
 */
export function cpuToMillicores(cpu: string | number): number {
  if (typeof cpu === "number") {
    // number 类型：默认单位是毫核（m），直接返回
    if (!isFinite(cpu)) {
      return 0;
    }
    return cpu;
  }

  // string 类型：走原有 Kubernetes 解析逻辑
  if (typeof cpu !== "string") {
    return 0;
  }
  cpu = cpu.trim();

  if (cpu.endsWith("m")) {
    const value = parseFloat(cpu.slice(0, -1));
    if (isNaN(value) || !isFinite(value)) {
      return 0;
    }
    return value;
  } else {
    const value = parseFloat(cpu);
    if (isNaN(value) || !isFinite(value)) {
      return 0;
    }
    return Math.round(value * 1000); // 不带单位字符串，默认是“核”
  }
}
/**
 * 将内存值转换为 MiB 数值（输出单位：Mi）
 * - 输入 string：
 *   - 带单位 → 按 Kubernetes 单位换算为 bytes，再转 Mi
 *   - 不带单位 → 默认是 bytes（K8s 标准），再转 Mi
 * - 输入 number → 默认是 bytes，再转 Mi
 * @param memory string | number
 * @returns 数值，单位是 Mi（Mebibyte）
 */
export function memoryToMi(memory: string | number): number {
  let bytes: number;

  if (typeof memory === "number") {
    if (!isFinite(memory)) {
      return 0;
    }
    bytes = memory; // number 默认是 bytes
  } else if (typeof memory === "string") {
    memory = memory.trim();

    const match = memory.match(/^([0-9]+\.?[0-9]*)([a-zA-Z]*)$/);
    if (!match) {
      return 0;
    }

    const value = parseFloat(match[1]);
    const unit = match[2];

    if (isNaN(value) || !isFinite(value)) {
      throw new Error(`Invalid memory number: ${match[1]}`);
    }

    const unitMultipliers: Record<string, number> = {
      Ki: 1024,
      Mi: 1024 ** 2,
      Gi: 1024 ** 3,
      Ti: 1024 ** 4,
      Pi: 1024 ** 5,
      Ei: 1024 ** 6,
      K: 1000,
      M: 1000 ** 2,
      G: 1000 ** 3,
      T: 1000 ** 4,
      P: 1000 ** 5,
      E: 1000 ** 6,
      "": 1, // 👈 不带单位，默认是 bytes（K8s 标准）
    };

    const multiplier = unitMultipliers[unit];
    if (multiplier === undefined) {
      return 0;
    }

    bytes = value * multiplier;
  } else {
    return 0;
  }

  // 转换为 Mi（Mebibyte）
  return bytes / (1024 * 1024);
}
/**
 * 将内存值转换为 GiB 数值（输出单位：Gi）
 * - 输入 string：
 *   - 带单位 → 按 Kubernetes 单位换算为 bytes，再转 Gi
 *   - 不带单位 → 默认是 bytes（K8s 标准），再转 Gi
 * - 输入 number → 默认是 bytes，再转 Gi
 * @param memory string | number
 * @returns 数值，单位是 Gi（Gibibyte）
 */
export function memoryToGi(memory: string | number): number {
  const bytes = memoryToBytes(memory); // 复用标准解析逻辑
  return bytes / 1024 ** 3; // 转换为 Gi
}

/**
 * 内部辅助函数：将任意输入转为字节数（bytes）—— 符合 Kubernetes 标准
 * - string 不带单位 → bytes
 * - number → bytes
 */
export function memoryToBytes(memory: string | number): number {
  if (typeof memory === "number") {
    if (!isFinite(memory)) {
      return 0;
    }
    return memory; // number 默认是 bytes
  }

  if (typeof memory !== "string") {
    return 0;
  }

  memory = memory.trim();

  const match = memory.match(/^([0-9]+\.?[0-9]*)([a-zA-Z]*)$/);
  if (!match) {
    return 0;
  }

  const value = parseFloat(match[1]);
  const unit = match[2];

  if (isNaN(value) || !isFinite(value)) {
    return 0;
  }

  const unitMultipliers: Record<string, number> = {
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
    Pi: 1024 ** 5,
    Ei: 1024 ** 6,
    K: 1000,
    M: 1000 ** 2,
    G: 1000 ** 3,
    T: 1000 ** 4,
    P: 1000 ** 5,
    E: 1000 ** 6,
    "": 1, // 👈 不带单位，默认是 bytes（K8s 标准）
  };

  const multiplier = unitMultipliers[unit];
  if (multiplier === undefined) {
    return 0;
  }

  return value * multiplier;
}
export const getVolumeType = (volume: IIoK8sApiCoreV1Volume): string => {
  if (volume.emptyDir) {
    return "emptyDir";
  } else if (volume.secret) {
    return "secret";
  } else if (volume.configMap) {
    return "configMap";
  } else if (volume.persistentVolumeClaim) {
    return "persistentVolumeClaim";
  } else if (volume.hostPath) {
    return "hostPath";
  } else if (volume.nfs) {
    return "nfs";
  } else if (volume.ephemeral) {
    return "ephemeral";
  } else if (volume.csi) {
    return "csi";
  } else if (volume.downwardAPI) {
    return "downwardAPI";
  } else if (volume.fc) {
    return "fc";
  } else if (volume.image) {
    return "image";
  } else if (volume.iscsi) {
    return "iscsi";
  } else if (volume.projected) {
    return "projected";
  }
  return "";
};
// src/utils/k8s.ts
export const getResourceKey = (resource: {
  metadata: { namespace?: string; name: string };
}) => {
  // 对 Namespaced 资源：namespace/name
  // 对 ClusterScoped 资源：/name （或直接 name，但建议统一格式）
  return `${resource.metadata?.namespace || ""}/${resource.metadata.name}`;
};

/**
 * 判断 Kubernetes 集群版本是否满足功能所需的最低版本
 * @param requiredVersion 功能所需的最低版本，格式如 "1.35"
 * @param clusterVersion 从后端获取的集群版本，如 "v1.35.2"、"1.34+"、"v1.36.0-gke.123"
 * @returns 是否满足版本要求
 */
export function isK8sVersionSupported(
  requiredVersion: string,
  clusterVersion: string
): boolean {
  // 清理并提取 major.minor（忽略 v 前缀、+ 后缀、-alpha 等）
  const cleanVersion = (v: string): [number, number] => {
    // 移除开头的 'v'
    let str = v.trim().replace(/^v/i, "");
    // 截取到第一个非数字/点的位置（处理 +, -, gke 等）
    str = str.split(/[^0-9.]/)[0];
    // 按 '.' 分割，取前两段
    const parts = str.split(".").map(Number);
    const major = parts[0] || 0;
    const minor = parts.length > 1 ? parts[1] || 0 : 0;
    return [major, minor];
  };

  const [reqMajor, reqMinor] = cleanVersion(requiredVersion);
  const [cluMajor, cluMinor] = cleanVersion(clusterVersion);

  if (cluMajor > reqMajor) return true;
  if (cluMajor < reqMajor) return false;
  return cluMinor >= reqMinor;
}
/**
 * 根据 Kubernetes 资源类型和状态，判断是否“正常”
 * @returns 'success' | 'error' | undefined
 */
export function getWorkloadStatus(
  resource: any,
  kind: string
): "success" | "error" | undefined {
  if (!resource) return undefined;
  const lowerKind = kind.toLowerCase();
  // 处理副本控制器类工作负载
  if (
    ["deployment", "statefulset", "daemonset", "replicaset"].includes(lowerKind)
  ) {
    const specReplicas = resource.spec?.replicas ?? 1;
    if (specReplicas === 0) {
      return undefined; // 用户主动缩容，不视为错误
    }
    const available = resource.status?.availableReplicas || 0;
    return available > 0 ? "success" : "error";
  }

  // 处理 Job
  if (lowerKind === "job") {
    const completions = resource.spec?.completions ?? 1;
    const succeeded = resource.status?.succeeded || 0;
    return succeeded >= completions ? "success" : "error";
  }

  // 处理 CronJob
  if (lowerKind === "cronjob") {
    // 如果从未成功过，status 可能为空或无 lastSuccessfulTime
    if (!resource.status) return "error";
    // 只要有 lastSuccessfulTime，就认为“能正常工作”（即使最近一次失败，也说明调度正常）
    // 更严格可结合 lastScheduleTime + active jobs，但复杂度高
    return resource.status.lastSuccessfulTime ? "success" : "error";
  }

  // 其他资源（如 Pod、Service）暂不处理，返回 undefined
  return undefined;
}
