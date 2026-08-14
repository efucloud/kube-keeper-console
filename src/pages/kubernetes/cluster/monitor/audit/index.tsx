import { PageContainer } from '@ant-design/pro-components';
import { Access, FormattedMessage, Outlet, useAccess, useIntl, useModel, useNavigate } from '@umijs/max';

const AuditLog: React.FC = () => {
  const intl = useIntl();
  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.auditlog' })}
    ></PageContainer>
  );
};
export default AuditLog;
