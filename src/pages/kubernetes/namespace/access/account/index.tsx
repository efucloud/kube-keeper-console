import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';


const Index: React.FC = () => {
  /** 国际化配置 */
  const intl = useIntl();
  return (
    <PageContainer
      header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title={intl.formatMessage({ id: 'cluster.account.permission' })}
      content={intl.formatMessage({
        id: 'cluster.account.permission.namespace.description',
      })}
    >
      
    </PageContainer>
  );
};
export default Index;
