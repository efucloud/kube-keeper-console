import { PageContainer } from "@ant-design/pro-components";
import { useIntl } from '@umijs/max';

const RbacView: React.FC = () => {
  const intl = useIntl();
  return (
    <PageContainer
      header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title={intl.formatMessage({ id: 'cluster.rbac.view' })}
      subTitle={intl.formatMessage({ id: 'cluster.rbac.view.description' })}
    >
    </PageContainer>
  );
}
export default RbacView