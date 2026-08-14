import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useParams } from '@umijs/max';
import { type FC, useEffect, useState } from 'react';
import ResourceJsonOrYamlForm from '@/pages/kubernetes/components/resource_form';

const Update = 'update';
const Create = 'create';

import type { Role } from 'kubernetes-models/rbac.authorization.k8s.io/v1';

import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterResource } from '@/utils/cluster';
import { getCurrentViewInfo } from '@/utils/global';

const YamOrJsonForm: FC<Record<string, any>> = () => {
  const { cluster, namespace } = getCurrentViewInfo();
  const [info, setInfo] = useState<Role>();
  const BaseApi = `apis/rbac.authorization.k8s.io/v1/namespaces/${namespace}/roles`;
  const BaseAddress = namespace
    ? `/kubernetes/cluster/${cluster}/namespace/${namespace}/access/roles`
    : `/kubernetes/cluster/${cluster}/access/roles`;
  const params = useParams();
  const mode = params.action === Update ? Update : Create; // update or create
  const name = mode === Create ? '' : params.name || ''; // resource name
  const getInfo = async () => {
    const params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = (await clusterGetProxy(params)) as Role;
    setInfo(res);
  };
  useEffect(() => {
    if (name && name !== '' && name !== '-') {
      getInfo();
    }
  }, [name]);
  return (
    <PageContainer
      header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title={
        info?.metadata?.name ? (
          <FormattedMessage id="cluster.resource.operation.edit" />
        ) : (
          <FormattedMessage id="cluster.resource.operation.create" />
        )
      }
      subTitle={
        <>
          {getClusterResource('Role')}
          <></>
          {info?.metadata?.name ? `:${info?.metadata?.name}` : ''}
        </>
      }
    >
      {mode === Update && info?.apiVersion && (
        <ResourceJsonOrYamlForm
          apiVersion='rbac.authorization.k8s.io/v1'
          key="role"
          kind="Role"
          scope="namespace"
          create={false}
          requestAPI={`${BaseApi}/${name}`}
          listPage={BaseAddress}
          detailPage={BaseAddress}
          namespace={namespace || ''}
          name={info?.metadata?.name || ''}

          cluster={cluster}
          content={info || {}}
        />
      )}
      {mode === Create && (
        <ResourceJsonOrYamlForm
          apiVersion='rbac.authorization.k8s.io/v1'
          key="role"
          kind="Role"
          scope="namespace"
          create={true}
          requestAPI={BaseApi}
          listPage={BaseAddress}
          detailPage={BaseAddress}
          namespace={namespace || ''}
          name={''}

          cluster={cluster}
          content={{}}
        />
      )}
    </PageContainer>
  );
};
export default YamOrJsonForm;
