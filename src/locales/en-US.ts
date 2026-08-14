import builtin_command from "./en-US/builtin_command";
import cluster from "./en-US/cluster";
import copilot from "./en-US/copilot";
import global_page from "./en-US/global_page";
import ide from "./en-US/ide";
import integration from "./en-US/integration";
import menu from "./en-US/menu";
import metrics from "./en-US/metrics";
import model from "./en-US/model";
import model_account from "./en-US/model_account";
import model_appstore from "./en-US/model_appstore";
import model_cluster from "./en-US/model_cluster";
import model_cluster_role_template from "./en-US/model_cluster_role_template";
import dict from "./en-US/model_dict";
import model_user from "./en-US/model_user";
import model_workspace from "./en-US/model_workspace";
import pages from "./en-US/pages";
import pwa from "./en-US/pwa";
import settingDrawer from "./en-US/settingDrawer";
import settings from "./en-US/settings";
import versions from "./en-US/versions";
import workspace from "./en-US/workspace";
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
