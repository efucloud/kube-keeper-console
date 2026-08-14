import { type ProColumns, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import type { IIoK8sApiCoreV1ObjectReference } from 'kubernetes-models/v1';
import { getClusterResource } from '@/utils/cluster';

export type RenderCronJobProps = {
  instances?: IIoK8sApiCoreV1ObjectReference[];
};

export const RenderCronJobInstances: React.FC<RenderCronJobProps> = (props) => {
  const intl = useIntl();

  const instances = props.instances;
  const columns: ProColumns<IIoK8sApiCoreV1ObjectReference>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.kind' }),
      dataIndex: 'kind',
      render: (dom, entity) => {
        return <>{getClusterResource(entity.kind || '', false)}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.namespace' }),
      dataIndex: 'namespace',
      render: (dom, entity) => {
        return <>{entity.namespace}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'name',
      render: (dom, entity) => {
        return <>{entity.name}</>;
      },
    },
  ];
  if (!instances) {
    return <></>;
  } else {
    return (
      <ProTable<IIoK8sApiCoreV1ObjectReference>
        key='object-reference'
        scroll={{ x: 'max-content' }}
        search={false}
        toolBarRender={false}
        size="small"
        columns={columns}
        dataSource={instances}
      />
    );
  }
};
