import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useParams } from '@umijs/max';
import { type FC, useEffect, useState } from 'react';
import ResourceJsonOrYamlForm from '@/pages/kubernetes/components/resource_form';
import type { IAPIService } from 'kubernetes-models/apiregistration.k8s.io/v1';
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterResource } from '@/utils/cluster';
import { getCurrentViewInfo } from '@/utils/global';

const Update = 'update';
const Create = 'create';

const YamOrJsonForm: FC<Record<string, any>> = () => {
  const { cluster } = getCurrentViewInfo();
  const [info, setInfo] = useState<IAPIService>();
  const baseApi = `apis/apiregistration.k8s.io/v1/apiservices`;
  const baseAddress = `/kubernetes/cluster/${cluster}/apiservices`;
  const params = useParams();
  const mode = params.action === Update ? Update : Create;
  const name = mode === Create ? '' : params.name || '';

  const getInfo = async () => {
    const res = (await clusterGetProxy({ cluster, address: `${baseApi}/${name}` })) as IAPIService;
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
          {getClusterResource('APIService')}
          {info?.metadata?.name ? `:${info.metadata.name}` : ''}
        </>
      }
    >
      {mode === Update && info?.apiVersion && (
        <ResourceJsonOrYamlForm
          apiVersion={'apiregistration.k8s.io/v1'}
          key="apiservice"
          kind="APIService"
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
          apiVersion={'apiregistration.k8s.io/v1'}
          key="apiservice"
          kind="APIService"
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
