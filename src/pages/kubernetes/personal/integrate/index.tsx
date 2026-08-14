import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import React, { useState } from 'react';
export const BaseAddress = '/system/personal/token';
import type { TabsProps } from 'antd/lib';
import { getColorPrimary } from '@/utils/global';
import GitIndex from '@/pages/kubernetes/personal/integrate/git';

const Index: React.FC = () => {
  const colorPrimary = getColorPrimary();
  /** 新建窗口的弹窗 */
  /** 国际化配置 */
  const intl = useIntl();
  const [activeKey, setActiveKey] = useState<string>('gitlab');
  const items: TabsProps['items'] = [
    {
      label: intl.formatMessage({ id: 'integration.git' }),
      key: 'gitlab',
      children: <>
        <GitIndex />
      </>,
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'menu.personal.integrate' })}
    >
      <Tabs
        activeKey={activeKey}
        items={items}
        onChange={(key) => setActiveKey(key)}
      />
    </PageContainer>
  );
};

export default Index;
