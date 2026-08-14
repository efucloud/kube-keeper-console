import { getClusterApiVersions, getColorPrimary, getCurrentViewInfo } from "@/utils/global";
import { PageContainer, ProDescriptions } from "@ant-design/pro-components";
import { useParams, useIntl, FormattedMessage } from "@umijs/max";
import { useEffect, useState } from "react";
import { Card } from "antd";
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { CustomResourceDefinition } from 'kubernetes-models/apiextensions.k8s.io/v1';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import dayjs from "dayjs";


const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster } = getCurrentViewInfo();
  const { name } = useParams();
  const [info, setInfo] = useState<CustomResourceDefinition>();
  const intl = useIntl();
  const resourceGroup = getClusterApiVersions(cluster, ['apiextensions.k8s.io/v1', 'apiextensions.k8s.io/v1beta1'], 'CustomResourceDefinition');
  const BaseApi = `apis/${resourceGroup.groupVersion}/customresourcedefinitions`
  const BaseAddress = `/kubernetes/cluster/${cluster}/customresourcedefinitions`
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as CustomResourceDefinition;
    setInfo(res);
  }
  useEffect(() => {
    getInfo();
  }, [name]);
  return (<>
    {info && <PageContainer header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title={info?.metadata?.name}
    >
      <Card variant={'borderless'} style={{ marginBottom: 15 }}   >
        <ProDescriptions column={3}  >
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.name' />} valueType="text"  >{info?.metadata?.name}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.scope' />} valueType="text"  >{info?.spec?.scope}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.kind' />} valueType="text"  >{info?.spec?.names?.kind}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.kind.list' />} valueType="text"  >{info?.spec?.names?.listKind}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.group' />} valueType="text"  >{info?.spec?.group}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.name.singular' />} valueType="text"  >{info?.spec?.names?.singular}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.name.plural' />} valueType="text"  >{info?.spec?.names?.plural}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.creationTimestamp' />} valueType="text"  >{dayjs(info.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm:ss')}</ProDescriptions.Item>
        </ProDescriptions>
      </Card>
      <Card variant={'borderless'}   >
        <ResourceEditor key={info?.metadata?.resourceVersion || 'edit'} edit={false} address={`${BaseApi}/${name}`} kind='CustomResourceDefinition' name={info?.metadata?.name || ''} cluster={cluster} content={info} />
      </Card>

    </PageContainer>}

  </>
  )
};
export default DetailView;