import type { ClusterDetail } from "@/services/cluster";
import { getClusterInfo } from "@/services/cluster.api";
import type { AuthedUserInfo } from "@/services/common.d";
import {
  getClusterFeatures,
  getClusterVersion,
  getCurrentViewInfo,
  isGlobalPersonalCenter,
  isPersonalCenter,
  saveClusterFeatures,
} from "@/utils/global";
import { isK8sVersionSupported } from "./utils/cluster";

const AccountSourceTenant = "tenant";
const AccountSourceSystem = "system";
// 系统个人权限
// 租户个人权限
// 系统权限: admin,edit,view
// 租户权限: admin,edit,view
// 集群权限: admin,edit,view

const personalAccess = () => {
  return isPersonalCenter();
};
const clusterNamespaceAccess = (currentUser?: AuthedUserInfo) => {
  const { isNamespace } = getCurrentViewInfo();
  return isNamespace === true;
};
const clusterAccess = (currentUser?: AuthedUserInfo) => {
  const { isCluster } = getCurrentViewInfo();
  return isCluster === true;
};
export const clusterResourceExist = (minVersion: string) => {
  return () => {
    const { cluster } = getCurrentViewInfo();

    const version = getClusterVersion(cluster);
    return isK8sVersionSupported(minVersion, version);
  };
};
export const clusterFeaturesAccess = (feature: string) => {
  return () => {
    const { cluster } = getCurrentViewInfo();
    const features = getClusterFeatures(cluster);
    if (!features) {
      getClusterInfo({ cluster })
        .then((res) => {
          const info = res as ClusterDetail;
          saveClusterFeatures(cluster, info.features || []);
          if (info.features?.includes(feature)) {
            return true;
          }
          return false;
        })
        .catch(() => {
          return false;
        });
    } else {
      return features.includes(feature);
    }
    return false;
  };
};
const adminAccess = (currentUser?: AuthedUserInfo) => {
  const { cluster } = getCurrentViewInfo();
  if (cluster) {
    return false;
  }
  return currentUser && currentUser.role === "admin";
};

const systemPersonalAccess = () => {
  return isGlobalPersonalCenter();
};

/**
 * @see https://umijs.org/zh-CN/plugins/plugin-access
 * */
// 权限分类
// 系统权限：只有企业用户才能拥有，即登录的用户为global User
// admin: 管理员 能查看操作系统所有数据
// edit: 编辑，能查看和编辑系统数据
// view: 查看 能查看系统数据
// none: 普通用户 即无法进入系统后台查看系统本身的数据，只能查看个人数据
// 组织权限
// admin: 管理员 能查看操作该组织的所有数据
// edit: 编辑，能查看和编辑该组织的数据
// view: 查看 能查看该组织的数据
// none: 普通用户 即无法进入组织后台查看系统本身的数据，只能查看个人数据
export default function access(
  initialState: { currentUser?: AuthedUserInfo } | undefined
) {
  const { currentUser } = initialState ?? {};
  return {
    personalAccess: personalAccess(),
    adminAccess: adminAccess(currentUser),
    clusterAccess: clusterAccess(currentUser),
    clusterAdminAccess: clusterAccess(currentUser),
    clusterNamespaceAccess: clusterNamespaceAccess(currentUser),
    systemPersonalAccess: systemPersonalAccess(),
    clusterResourceEndpointSliceAccess: clusterResourceExist("1.17"),
  };
}
