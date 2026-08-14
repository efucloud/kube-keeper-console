import builtin_command from "./zh-CN/builtin_command";
import cluster from "./zh-CN/cluster";
import copilot from "./zh-CN/copilot";
import global_page from "./zh-CN/global_page";
import ide from "./zh-CN/ide";
import integration from "./zh-CN/integration";
import menu from "./zh-CN/menu";
import metrics from "./zh-CN/metrics";
import model from "./zh-CN/model";
import model_account from "./zh-CN/model_account";
import model_appstore from "./zh-CN/model_appstore";
import model_cluster from "./zh-CN/model_cluster";
import model_cluster_role_template from "./zh-CN/model_cluster_role_template";
import dict from "./zh-CN/model_dict";
import model_user from "./zh-CN/model_user";
import model_workspace from "./zh-CN/model_workspace";
import pages from "./zh-CN/pages";
import pwa from "./zh-CN/pwa";
import settingDrawer from "./zh-CN/settingDrawer";
import settings from "./zh-CN/settings";
import versions from "./zh-CN/versions";
import workspace from "./zh-CN/workspace";
export default {
  ...cluster,
  ...model_account,
  ...model_cluster,
  ...pages,
  ...global_page,
  ...menu,
  ...model_cluster_role_template,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...model,
  ...model_user,
  ...model_workspace,
  ...dict,
  ...integration,
  ...metrics,
  ...model_appstore,
  ...versions,
  ...copilot,
  ...ide,
  ...workspace,
  ...builtin_command,
};
