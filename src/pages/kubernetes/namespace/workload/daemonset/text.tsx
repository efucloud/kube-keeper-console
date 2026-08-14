import { PageContainer } from '@ant-design/pro-components';
import { useEffect, useState, type FC } from 'react';
import { useParams, FormattedMessage } from '@umijs/max';
import ResourceJsonOrYamlForm from '@/pages/kubernetes/components/resource_form';

const Update = 'update';
const Create = 'create';
import { DaemonSet } from "kubernetes-models/apps/v1";
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterApiVersions, getCurrentViewInfo } from '@/utils/global';
import { getClusterResource } from '@/utils/cluster';
import { Card } from 'antd';


const YamOrJsonForm: FC<Record<string, any>> = () => {
  const { cluster, namespace } = getCurrentViewInfo();
  const [info, setInfo] = useState<DaemonSet>();
  const BaseAddress = namespace ? `/kubernetes/cluster/${cluster}/namespace/${namespace}/workload/daemonsets` : `/kubernetes/cluster/${cluster}/workload/daemonsets`
  const params = useParams();
  const mode = params.action === Update ? Update : Create; // update or create
  const name = mode === Create ? '' : params.name || '' // resource name
  const resourceGroup = getClusterApiVersions(cluster, ['apps/v1', 'apps/v1beta1', 'apps/v1beta2'], 'DaemonSet');
  const BaseApi = `apis/${resourceGroup.groupVersion}/namespaces/${namespace}/daemonsets`;

  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as DaemonSet;
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
    subTitle={<>{getClusterResource('DaemonSet')}<></>{info?.metadata?.name ? `:${info?.metadata?.name}` : ''}</>}
  >
    <Card>
      {mode === Update && info?.apiVersion &&
        <ResourceJsonOrYamlForm apiVersion={resourceGroup.groupVersion} key='daemonset' kind='DaemonSet' scope='namespace' create={false} requestAPI={`${BaseApi}/${name}`} listPage={BaseAddress} detailPage={BaseAddress} namespace={namespace || ''} name={info?.metadata?.name || ''} cluster={cluster} content={info || {}} />
      }
      {mode === Create &&
        <ResourceJsonOrYamlForm apiVersion={resourceGroup.groupVersion} key='daemonset' kind='DaemonSet' scope='namespace' create={true} requestAPI={BaseApi} listPage={BaseAddress} detailPage={BaseAddress} namespace={namespace || ''} name={''} cluster={cluster} content={{}} />
      }
    </Card>
  </PageContainer>);
}
export default YamOrJsonForm;