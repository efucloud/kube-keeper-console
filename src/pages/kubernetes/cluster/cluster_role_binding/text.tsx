import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useParams } from '@umijs/max';
import { type FC, useEffect, useState } from 'react';
import ResourceJsonOrYamlForm from '@/pages/kubernetes/components/resource_form';
import type { ClusterRoleBinding } from 'kubernetes-models/rbac.authorization.k8s.io/v1';
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterResource } from '@/utils/cluster';
import { getCurrentViewInfo, getClusterApiVersions } from '@/utils/global';

const Update = 'update';
const Create = 'create';

const YamOrJsonForm: FC<Record<string, any>> = () => {
  const { cluster } = getCurrentViewInfo();
  const resourceGroup = getClusterApiVersions(cluster, ['rbac.authorization.k8s.io/v1'], 'ClusterRoleBinding');
const [info, setInfo] = useState<ClusterRoleBinding>();
  const baseApi = `apis/${resourceGroup.groupVersion}/clusterrolebindings`;
  const baseAddress = `/kubernetes/cluster/${cluster}/access/clusterrolebindings`;
  const params = useParams();
  const mode = params.action === Update ? Update : Create;
  const name = mode === Create ? '' : params.name || '';

  const getInfo = async () => {
    const res = (await clusterGetProxy({ cluster, address: `${baseApi}/${name}` })) as ClusterRoleBinding;
    setInfo(res);
  };

  useEffect(() => {
    if (mode === Update && name) {
      getInfo();
    }
  }, [cluster, mode, name]);

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
          {getClusterResource('ClusterRoleBinding')}
          {info?.metadata?.name ? `:${info.metadata.name}` : ''}
        </>
      }
    >
      {mode === Update && info?.apiVersion && (
        <ResourceJsonOrYamlForm
          apiVersion={resourceGroup.groupVersion}
          key="clusterrolebinding"
          kind="ClusterRoleBinding"
          scope="cluster"
          create={false}
          requestAPI={`${baseApi}/${name}`}
          listPage={baseAddress}
          detailPage={baseAddress}
          name={info?.metadata?.name || ''}
          cluster={cluster}
          content={info || {}}
        />
      )}
      {mode === Create && (
        <ResourceJsonOrYamlForm
          apiVersion={resourceGroup.groupVersion}
          key="clusterrolebinding"
          kind="ClusterRoleBinding"
          scope="cluster"
          create={true}
          requestAPI={baseApi}
          listPage={baseAddress}
          detailPage={baseAddress}
          name=""
          cluster={cluster}
          content={{}}
        />
      )}
    </PageContainer>
  );
};

export default YamOrJsonForm;
