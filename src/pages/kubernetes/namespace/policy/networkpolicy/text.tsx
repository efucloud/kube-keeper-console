import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useParams } from '@umijs/max';
import { type FC, useEffect, useState } from 'react';
import ResourceJsonOrYamlForm from '@/pages/kubernetes/components/resource_form';
import type { INetworkPolicy } from 'kubernetes-models/networking.k8s.io/v1';
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterResource } from '@/utils/cluster';
import { getCurrentViewInfo, getClusterApiVersions } from '@/utils/global';

const Update = 'update';
const Create = 'create';

const YamOrJsonForm: FC<Record<string, any>> = () => {
  const { cluster, namespace } = getCurrentViewInfo();
  const resourceGroup = getClusterApiVersions(cluster, ['networking.k8s.io/v1'], 'NetworkPolicy');
const [info, setInfo] = useState<INetworkPolicy>();
  const baseApi = `apis/${resourceGroup.groupVersion}/namespaces/${namespace || '-'}/networkpolicies`;
  const baseAddress = `/kubernetes/cluster/${cluster}/namespace/${namespace || '-'}/policy/networkpolicy`;
  const params = useParams();
  const mode = params.action === Update ? Update : Create;
  const name = mode === Create ? '' : params.name || '';

  const getInfo = async () => {
    if (!namespace) return;
    const res = (await clusterGetProxy({ cluster, address: `${baseApi}/${name}` })) as INetworkPolicy;
    setInfo(res);
  };

  useEffect(() => {
    if (mode === Update && name && namespace) {
      getInfo();
    }
  }, [cluster, mode, name, namespace]);

  return (
    <PageContainer
      header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title={
        mode === Update ? (
          <FormattedMessage id="cluster.resource.operation.edit" />
        ) : (
          <FormattedMessage id="cluster.resource.operation.create" />
        )
      }
      subTitle={
        <>
          {getClusterResource('NetworkPolicy')}
          {info?.metadata?.name ? `:${info.metadata.name}` : ''}
        </>
      }
    >
      {mode === Update && info?.apiVersion && (
        <ResourceJsonOrYamlForm
          apiVersion={resourceGroup.groupVersion}
          key="networkpolicy"
          kind="NetworkPolicy"
          scope="namespace"
          create={false}
          requestAPI={`${baseApi}/${name}`}
          listPage={baseAddress}
          detailPage={baseAddress}
          namespace={namespace || ''}
          name={info?.metadata?.name || ''}
          cluster={cluster}
          content={info || {}}
        />
      )}
      {mode === Create && (
        <ResourceJsonOrYamlForm
          apiVersion={resourceGroup.groupVersion}
          key="networkpolicy"
          kind="NetworkPolicy"
          scope="namespace"
          create={true}
          requestAPI={baseApi}
          listPage={baseAddress}
          detailPage={baseAddress}
          namespace={namespace || ''}
          name=""
          cluster={cluster}
          content={{}}
        />
      )}
    </PageContainer>
  );
};

export default YamOrJsonForm;
