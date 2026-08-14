import { PageContainer } from '@ant-design/pro-components';

const DetailView: React.FC = () => {
  return (
    <PageContainer
      header={{ breadcrumb: {}, onBack: () => window.history.back() }}
    >
      <div>Deployment Detail</div>
    </PageContainer>
  );
};
export default DetailView;
