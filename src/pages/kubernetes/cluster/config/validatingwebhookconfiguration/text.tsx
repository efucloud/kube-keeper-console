import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useParams } from '@umijs/max';
import { type FC, useEffect, useState } from 'react';
import ResourceJsonOrYamlForm from '@/pages/kubernetes/components/resource_form';
import type { IValidatingWebhookConfiguration } from 'kubernetes-models/admissionregistration.k8s.io/v1';
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterResource } from '@/utils/cluster';
import { getCurrentViewInfo } from '@/utils/global';

const Update = 'update';
const Create = 'create';

const YamOrJsonForm: FC<Record<string, any>> = () => {
  const { cluster } = getCurrentViewInfo();
  const [info, setInfo] = useState<IValidatingWebhookConfiguration>();
  const baseApi = `apis/admissionregistration.k8s.io/v1/validatingwebhookconfigurations`;
  const baseAddress = `/kubernetes/cluster/${cluster}/config/validatingwebhookconfigurations`;
  const params = useParams();
  const mode = params.action === Update ? Update : Create;
  const name = mode === Create ? '' : params.name || '';

  const getInfo = async () => {
    const res = (await clusterGetProxy({ cluster, address: `${baseApi}/${name}` })) as IValidatingWebhookConfiguration;
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
          {getClusterResource('ValidatingWebhookConfiguration')}
          {info?.metadata?.name ? `:${info.metadata.name}` : ''}
        </>
      }
    >
      {mode === Update && info?.apiVersion && (
        <ResourceJsonOrYamlForm
          apiVersion={'admissionregistration.k8s.io/v1'}
          key="validatingwebhookconfiguration"
          kind="ValidatingWebhookConfiguration"
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
          apiVersion={'admissionregistration.k8s.io/v1'}
          key="validatingwebhookconfiguration"
          kind="ValidatingWebhookConfiguration"
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
