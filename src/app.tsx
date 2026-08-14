import { AvatarDropdown, AvatarName, Footer, SelectLang, About, SwapView, ClusterImport, WorkplaceIndex, ClusterTerminal } from '@/components';
import type { Settings as LayoutSettings, AppItemProps, AppListProps, MenuDataItem } from '@ant-design/pro-components';
import '@ant-design/v5-patch-for-react-19';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { FormattedMessage } from '@umijs/max';
import { history } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import { getUserinfo } from '@/services/oauth.api';
import type { AuthedUserInfo } from '@/services/common.d';
const indexPath = '/index';
import { appendKubernetesViewQuery, getCurrentViewInfo, getI18nLanguage, normalizeKubernetesPath } from '@/utils/global';
import buildAccess from './access';
import 'monaco-editor/min/vs/editor/editor.main.css';
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import { Divider, Space } from 'antd';
loader.config({ monaco, paths: { vs: './vs' } });
// src/global.tsx 或 src/app.tsx 顶部
import ReactDOM from 'react-dom';

// 防止被 tree-shaken
if (typeof window !== 'undefined') {
  (window as any).FixReactDom = ReactDOM;
}
// 1. 注册自定义语言和语法高亮规则
monaco.languages.register({ id: 'log' });
monaco.languages.setMonarchTokensProvider('log', {
  tokenizer: {
    root: [
      [/ERROR|Error|error|err /i, { token: 'log-error' }],
      [/WARNING |warning |warn /i, { token: 'log-warning' }],
      [/INFO |info |info/i, { token: 'log-info' }],
      [/DEBUG |Debug /i, { token: 'log-debug' }],
    ],
  },
});

// 2. 定义自定义主题
monaco.editor.defineTheme('log-theme', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'log-error', foreground: 'ff0000' },
    { token: 'log-warning', foreground: 'ffa500' },
    { token: 'log-info', foreground: '00ff00' },
    { token: 'log-debug', foreground: 'ffff00' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
  },

});


/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: AuthedUserInfo;
  appList?: AppListProps;
  loading?: boolean;
  getCurrentUserInfo?: () => Promise<AuthedUserInfo | undefined>;
}> {

  const fetchUserInfo = async (): Promise<AuthedUserInfo | undefined> => {
    try {
      const data = await getUserinfo();
      return data as AuthedUserInfo;
    } catch (error) {
      history.push(indexPath);
      return undefined;
    }
  };

  const fetchAppList = async () => {
    let app = [] as AppItemProps[];
    return app as AppListProps;
  };
  const { location } = history;
  if (location.pathname === '/' || location.pathname === '/index' || location.pathname.startsWith('/login') || location.pathname.startsWith('/oauth/callback')) {
    return {
      appList: await fetchAppList(),
      currentUser: {} as AuthedUserInfo,
      getCurrentUserInfo: fetchUserInfo,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  } else {
    const currentUser = await fetchUserInfo();
    return {
      appList: await fetchAppList(),
      getCurrentUserInfo: fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }

}

const hasMenuAccess = (
  item: MenuDataItem,
  accessMap: ReturnType<typeof buildAccess>
) => {
  const accessName = item.access as keyof ReturnType<typeof buildAccess> | undefined;
  if (!accessName) {
    return true;
  }

  const accessValue = accessMap[accessName];
  if (typeof accessValue === 'function') {
    return Boolean(accessValue());
  }

  if (typeof accessValue === 'undefined') {
    return true;
  }

  return Boolean(accessValue);
};

const filterMenuDataByAccess = (
  menuData: MenuDataItem[],
  accessMap: ReturnType<typeof buildAccess>
): MenuDataItem[] => {
  const seen = new Set<string>();

  return menuData.reduce<MenuDataItem[]>((items, item) => {
    if (!hasMenuAccess(item, accessMap)) {
      return items;
    }

    const nextItem = { ...item };
    if (item.children?.length) {
      nextItem.children = filterMenuDataByAccess(item.children, accessMap);
    }

    const identity = String(nextItem.key || nextItem.path || '');
    if (identity && seen.has(identity)) {
      return items;
    }

    if (identity) {
      seen.add(identity);
    }
    items.push(nextItem);
    return items;
  }, []);
};

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  const waterMark = function () {
    if (initialState?.currentUser?.username !== undefined) {
      return [initialState?.currentUser?.remoteAddress, initialState?.currentUser?.username, initialState?.currentUser?.role];
    } else {
      return undefined;
    }
  };

  const { cluster } = getCurrentViewInfo()
  const colorPrimary = '#1890ff';
  const settings = {
    ...initialState?.settings,
    colorPrimary,
  } as Partial<LayoutSettings>;
  const lang = getI18nLanguage();
  if (lang == 'en-US') {
    settings.title = 'KubeKeeper';
  }
  return {
    pageTitleRender: (_, defaultPageTitle, info) => {
      const l = defaultPageTitle?.split('-') as string[];
      if (l?.length == 2) {
        const first = getI18nLanguage() == 'zh-CN' ? l[1] : "EAuth";
        return first + ' - ' + info?.pageName
      } else {
        return defaultPageTitle || '';
      }
    },
    colorPrimary: colorPrimary,
    siderWidth: lang === 'zh-CN' ? 220 : 280,
    actionsRender: (): React.ReactNode[] => {
      let nodes = [] as React.ReactNode[];

      nodes.push(<a href='/versions' target='_self' style={{ fontSize: 12 }}><FormattedMessage id='pages.versions.select' /></a>);
      nodes.push(<About key="about" />);
      nodes.push(<SelectLang key="SelectLang" />);
      return nodes;
    },
    postMenuData: (menuData?: MenuDataItem[]) => {
      const accessMap = buildAccess(initialState);
      return filterMenuDataByAccess(menuData || [], accessMap);
    },
    menuItemRender: (item, dom) => {
      if (!item.path || item.children?.length) {
        return dom;
      }

      const targetPath = appendKubernetesViewQuery(item.path, getCurrentViewInfo());

      return (
        <span
          onClick={(event) => {
            event.preventDefault();
            history.push(targetPath);
          }}
        >
          {dom}
        </span>
      );
    },
    appList: initialState?.appList,
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        if (initialState?.currentUser?.username) {
          return <AvatarDropdown menu={true}>{avatarChildren}</AvatarDropdown>;
        } else {
          return <a href='/login'><FormattedMessage id='pages.click.login' /></a>;
        }
      },
    },
    waterMarkProps: {
      // todo 根据路径判断获取用户
      content: waterMark(),
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      const normalizedKubernetesPath = normalizeKubernetesPath(`${location.pathname}${location.search}`);
      if (normalizedKubernetesPath !== `${location.pathname}${location.search}`) {
        history.replace(normalizedKubernetesPath);
        return;
      }
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== indexPath) {
        history.push(indexPath);
      }
    },
    bgLayoutImgList: [
      {
        src: '/bg2.webp',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: '/bg2.webp',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: '/default.webp',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    // links: isDev
    //   ? [
    //     <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
    //       <LinkOutlined />
    //       <span>OpenAPI 文档</span>
    //     </Link>,
    //   ]
    //   : [],
    menuHeaderRender: undefined,
    headerContentRender: () => {
      return <Space separator={<Divider orientation="vertical" />}  >
        <WorkplaceIndex />
        {cluster && <ClusterImport />}
        {cluster && <ClusterTerminal />}
        <SwapView />
      </Space>
    },
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
        </>
      );
    },
    ...initialState?.settings,
  };
};


/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  ...errorConfig,
};
