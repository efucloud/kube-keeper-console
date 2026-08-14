import { PageContainer } from '@ant-design/pro-components';
import { useEffect, useState, type FC } from 'react';
import { useParams, FormattedMessage } from '@umijs/max';
import ResourceJsonOrYamlForm from '@/pages/kubernetes/components/resource_form';

const Update = 'update';
const Create = 'create';
import { ConfigMap } from "kubernetes-models/v1";

import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getCurrentViewInfo } from '@/utils/global';
import { getClusterResource } from '@/utils/cluster';


const YamOrJsonForm: FC<Record<string, any>> = () => {
  const { cluster, namespace } = getCurrentViewInfo();
  const [info, setInfo] = useState<ConfigMap>();
  const BaseApi = `api/v1/namespaces/${namespace}/configmaps`;
  const BaseAddress = namespace ? `/kubernetes/cluster/${cluster}/namespace/${namespace}/config/configmaps` : `/kubernetes/cluster/${cluster}/config/configmaps`
  const params = useParams();
  const mode = params.action === Update ? Update : Create; // update or create
  const name = mode === Create ? '' : params.name || '' // resource name
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as ConfigMap;
    setInfo(res);
  }
  useEffect(() => {
    if (name && name !== '' && name !== '-') {
      getInfo();
    }
  }, [name]);
  return (<PageContainer
    header={{ breadcrumb: {}, onBack: () => window.history.back() }}
    title={info?.metadata?.name ? <FormattedMessage id='cluster.resource.operation.edit' /> : <FormattedMessage id='cluster.resource.operation.create' />}
    subTitle={<>{getClusterResource('ConfigMap')}<></>{info?.metadata?.name ? `:${info?.metadata?.name}` : ''}</>}
  >
    {mode === Update && info?.apiVersion &&
      <ResourceJsonOrYamlForm apiVersion='v1' key='configMap' kind='ConfigMap' scope='namespace' create={false} requestAPI={`${BaseApi}/${name}`} listPage={BaseAddress} detailPage={BaseAddress} namespace={namespace || ''} name={info?.metadata?.name || ''} cluster={cluster} content={info || {}} />
    }
    {mode === Create &&
      <ResourceJsonOrYamlForm apiVersion='v1'  key='configMap' kind='ConfigMap' scope='namespace' create={true} requestAPI={BaseApi} listPage={BaseAddress} detailPage={BaseAddress} namespace={namespace || ''} name={''} cluster={cluster} content={{}} />
    }
  </PageContainer>);
}
export default YamOrJsonForm;