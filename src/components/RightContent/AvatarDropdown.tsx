import { DashboardOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { FormattedMessage, useModel } from '@umijs/max';
import { Spin } from 'antd';
import { createStyles } from 'antd-style';
import React, { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { appendKubernetesViewQuery, deleteAllToken, getColorPrimary } from '@/utils/global';
import HeaderDropdown from '../HeaderDropdown';
import { ItemType } from 'antd/es/menu/interface';

export type GlobalHeaderRightProps = {
  menu?: boolean;
  children?: React.ReactNode;
};

export const AvatarName = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  return <span className="anticon">{currentUser?.username}</span>;
};

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      display: 'flex',
      height: '48px',
      marginLeft: 'auto',
      overflow: 'hidden',
      alignItems: 'center',
      padding: '0 8px',
      cursor: 'pointer',
      borderRadius: token.borderRadius,
      '&:hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
  };
});

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({
  menu,
  children,
}) => {
  const colorPrimary = getColorPrimary();
  /**
   * 退出登录，并且将当前的 url 保存
   */
  const loginOut = async () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = appendKubernetesViewQuery('/index');
  };
  const { styles } = useStyles();
  const { initialState, setInitialState } = useModel('@@initialState');
  const onMenuClick = useCallback(
    (event: any) => {
      // 获取当前组织
      const { key } = event;

      if (key === 'logout') {
        // 清理数据
        deleteAllToken();
        flushSync(() => {
          setInitialState((s) => ({ ...s, currentUser: undefined }));
        });
        loginOut();
        return;
      }
      if (key === 'workplace') {
        window.location.href = appendKubernetesViewQuery('/workplace');
      } else if (key === 'console') {
        window.location.href = appendKubernetesViewQuery(`/admin/account`);
      }
    },
    [setInitialState],
  );

  const loading = (
    <span className={styles.action}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );
  if (!initialState) {
    return loading;
  }
  const { currentUser } = initialState;
  if (!currentUser || !currentUser.username) {
    return loading;
  }
  const menuItems = (): ItemType[] => {
    const menus = [] as ItemType[];
    if (!window.location.pathname.startsWith('/admin')) {
      menus.push({
        key: 'console',
        icon: <SettingOutlined style={{ color: colorPrimary }} />,
        label: (
          <FormattedMessage id="pages.console" key="console" />
        ),
      })
    }
    if (!window.location.pathname.startsWith('/workplace')) {
      menus.push({
        key: 'workplace',
        icon: <DashboardOutlined style={{ color: colorPrimary }} />,
        label: (
          <FormattedMessage id="pages.personal.workplace" key="workplace" />
        ),
      })
    }
    menus.push({
      type: 'divider' as const,
    }, {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: colorPrimary }} />,
      label: <FormattedMessage id="pages.personal.logout" key="logout" />,
    })
    return menus
  }
  return (
    <HeaderDropdown
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems(),
      }}
    >
      {children}
    </HeaderDropdown>
  );
};
