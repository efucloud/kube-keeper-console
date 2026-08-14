import { PageContainer } from '@ant-design/pro-components';
import { Result } from 'antd';
import React from 'react';

const ApplicationInstanceDetail: React.FC = () => {
  return (
    <PageContainer
      header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title="Application Instance"
    >
      <Result
        status="info"
        title="Application instance detail page is not available yet."
        subTitle="This placeholder keeps the console buildable until the full page is restored."
      />
    </PageContainer>
  );
};

export default ApplicationInstanceDetail;
