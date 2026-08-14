import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useParams } from '@umijs/max';
import { type FC, useEffect, useState } from 'react';
import ResourceJsonOrYamlForm from '@/pages/kubernetes/components/resource_form';
import type { IPersistentVolumeClaim } from 'kubernetes-models/v1';
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterResource } from '@/utils/cluster';
import { getCurrentViewInfo } from '@/utils/global';

const Update = 'update';
const Create = 'create';

const YamOrJsonForm: FC<Record<string, any>> = () => {
  const { cluster, namespace } = getCurrentViewInfo();
  const [info, setInfo] = useState<IPersistentVolumeClaim>();
  const baseApi = `api/v1/namespaces/${namespace || '-'}/persistentvolumeclaims`;
  const baseAddress = namespace ? `/kubernetes/cluster/${cluster}/namespace/${namespace}/storage/pvc` : `/kubernetes/cluster/${cluster}/storage/persistentvolumeclaim`;
  const params = useParams();
  const mode = params.action === Update ? Update : Create;
  const name = mode === Create ? '' : params.name || '';

  const getInfo = async () => {
    if (!namespace) return;
    const res = (await clusterGetProxy({ cluster, address: `${baseApi}/${name}` })) as IPersistentVolumeClaim;
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
          {getClusterResource('PersistentVolumeClaim')}
          {info?.metadata?.name ? `:${info.metadata.name}` : ''}
        </>
      }
    >
      {mode === Update && info?.apiVersion && (
        <ResourceJsonOrYamlForm
          apiVersion={'v1'}
          key="persistentvolumeclaim"
          kind="PersistentVolumeClaim"
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
          apiVersion={'v1'}
          key="persistentvolumeclaim"
          kind="PersistentVolumeClaim"
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
