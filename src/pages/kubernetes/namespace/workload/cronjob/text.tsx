import { PageContainer } from '@ant-design/pro-components';
import { useEffect, useState, type FC } from 'react';
import { useParams, FormattedMessage } from '@umijs/max';
import ResourceJsonOrYamlForm from '@/pages/kubernetes/components/resource_form';

const Update = 'update';
const Create = 'create';
import { ReplicaSet } from "kubernetes-models/apps/v1";
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterApiVersions, getCurrentViewInfo } from '@/utils/global';
import { getClusterResource } from '@/utils/cluster';


const YamOrJsonForm: FC<Record<string, any>> = () => {

  const { cluster, namespace } = getCurrentViewInfo();
  const [info, setInfo] = useState<ReplicaSet>();
  const BaseAddress = namespace ? `/kubernetes/cluster/${cluster}/namespace/${namespace}/workload/cronjobs` : `/kubernetes/cluster/${cluster}/workload/cronjobs`
  const params = useParams();
  const mode = params.action === Update ? Update : Create; // update or create
  const name = mode === Create ? '' : params.name || '' // resource name
  const resourceGroup = getClusterApiVersions(cluster, ['batch/v1', 'batch/v1beta1'], 'CronJob');
  const BaseApi = `apis/${resourceGroup.groupVersion}/namespaces/${namespace}/cronjobs`;

  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as ReplicaSet;
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
    subTitle={<>{getClusterResource('ReplicaSet')}<></>{info?.metadata?.name ? `:${info?.metadata?.name}` : ''}</>}
  >
    {mode === Update && info?.apiVersion &&
      <ResourceJsonOrYamlForm apiVersion={resourceGroup.groupVersion} key='replicaset' kind='ReplicaSet' scope='namespace' create={false} requestAPI={`${BaseApi}/${name}`} listPage={BaseAddress} detailPage={BaseAddress} namespace={namespace || ''} name={info?.metadata?.name || ''} cluster={cluster} content={info || {}} />
    }
    {mode === Create &&
      <ResourceJsonOrYamlForm apiVersion={resourceGroup.groupVersion} key='replicaset' kind='ReplicaSet' scope='namespace' create={true} requestAPI={BaseApi} listPage={BaseAddress} detailPage={BaseAddress} namespace={namespace || ''} name={''} cluster={cluster} content={{}} />
    }
  </PageContainer>);
}
export default YamOrJsonForm;