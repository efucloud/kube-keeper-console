import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useParams } from '@umijs/max';
import { type FC, useEffect, useState } from 'react';
import ResourceJsonOrYamlForm from '@/pages/kubernetes/components/resource_form';
import type { IHorizontalPodAutoscaler } from 'kubernetes-models/autoscaling/v1';
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterResource } from '@/utils/cluster';
import { getCurrentViewInfo, getClusterApiVersions } from '@/utils/global';

const Update = 'update';
const Create = 'create';

const YamOrJsonForm: FC<Record<string, any>> = () => {
  const { cluster, namespace } = getCurrentViewInfo();
  const resourceGroup = getClusterApiVersions(cluster, ['autoscaling/v2beta2', 'autoscaling/v2', 'autoscaling/v1'], 'HorizontalPodAutoscaler');
const [info, setInfo] = useState<IHorizontalPodAutoscaler>();
  const baseApi = `apis/${resourceGroup.groupVersion}/namespaces/${namespace || '-'}/horizontalpodautoscalers`;
  const baseAddress = `/kubernetes/cluster/${cluster}/namespace/${namespace || '-'}/policy/hpa`;
  const params = useParams();
  const mode = params.action === Update ? Update : Create;
  const name = mode === Create ? '' : params.name || '';

  const getInfo = async () => {
    if (!namespace) return;
    const res = (await clusterGetProxy({ cluster, address: `${baseApi}/${name}` })) as IHorizontalPodAutoscaler;
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
          {getClusterResource('HorizontalPodAutoscaler')}
          {info?.metadata?.name ? `:${info.metadata.name}` : ''}
        </>
      }
    >
      {mode === Update && info?.apiVersion && (
        <ResourceJsonOrYamlForm
          apiVersion={resourceGroup.groupVersion}
          key="horizontalpodautoscaler"
          kind="HorizontalPodAutoscaler"
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
          key="horizontalpodautoscaler"
          kind="HorizontalPodAutoscaler"
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
