import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';
import { getColorPrimary } from '@/utils/global';

interface Props {
  title: string;
  subTitle: string;
}
const ClusterResourceNotFound: React.FC<any> = (props) => {
  const intl = useIntl();
  const colorPrimary = getColorPrimary();
  return (
    <PageContainer
      header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title={props.title}
      subTitle={props.subTitle}
    >
      集群未部署该资源，请联系管理员部署
    </PageContainer>
  );
};
export default ClusterResourceNotFound;
