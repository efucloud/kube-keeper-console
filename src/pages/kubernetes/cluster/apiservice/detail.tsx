import { getColorPrimary, getCurrentViewInfo, normalizeKubernetesPath } from '@/utils/global';
import { PageContainer, ProDescriptions } from "@ant-design/pro-components";
import { useParams, useIntl, FormattedMessage } from "@umijs/max";
import { useEffect, useState } from "react";
import { Card, message } from "antd";
import { clusterGetProxy, clusterDeleteProxy } from '@/services/cluster_proxy.api';
import { APIService } from 'kubernetes-models/apiregistration.k8s.io/v1';
import { IntlShape } from "react-intl";
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import dayjs from "dayjs";


const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const { name } = useParams();
  const [info, setInfo] = useState<APIService>();
  const intl = useIntl();
  const [editorResource, setEditorResource] = useState<boolean>(false);

  const BaseApi = `apis/apiregistration.k8s.io/v1/apiservices`
  const BaseAddress = `/kubernetes/cluster/apiservices`
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as APIService;
    setInfo(res);
  }

  useEffect(() => {
    getInfo();
  }, [name]);
  const handleRemove = async (intl: IntlShape, deploy: APIService) => {
    const params = { cluster, address: BaseApi };
    await clusterDeleteProxy(params);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    window.location.pathname = normalizeKubernetesPath(BaseAddress);
    return true;
  };

  return (<>
    {info && <PageContainer header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title={info?.metadata?.name}
    >
      <Card variant={'borderless'} style={{ marginBottom: 20 }}   >

        <ProDescriptions column={3}  >
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.name' />} valueType="text"  >{info?.metadata?.name}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.group' />} valueType="text"  >{info?.spec?.group}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.apiVersion' />} valueType="text"  >{info?.spec?.version}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.creationTimestamp' />} valueType="text"  >{dayjs(info.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm:ss')}</ProDescriptions.Item>
        </ProDescriptions>
      </Card>
      <Card variant={'borderless'}   >
        <ResourceEditor key={info?.metadata?.resourceVersion || 'edit'} edit={editorResource} address={`${BaseApi}/${name}`} kind='APIService' name={info?.metadata?.name || ''} cluster={cluster} content={info} />
      </Card>

    </PageContainer>}

  </>
  )
};
export default DetailView;