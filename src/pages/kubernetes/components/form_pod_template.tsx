import { useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd/lib';
import { IIoK8sApiCoreV1Container, IIoK8sApiCoreV1VolumeMount, type IIoK8sApiCoreV1Volume } from 'kubernetes-models/v1';
import { useState } from 'react';
import FormContainerList from '@/pages/kubernetes/components/form_container_list';
import FormVolumeList from '@/pages/kubernetes/components/form_volumes';
import { DockerOutlined, SaveOutlined } from '@ant-design/icons';
import { FormIContainer } from '@/pages/kubernetes/components/form_kubernetes_resource';

type IFormPodTemplateProps = {
  namespace: string;
  timezoneSync?: boolean;
  action: string;
  containers: FormIContainer[];
  volumes: IIoK8sApiCoreV1Volume[];
  onContainersChange: (containers: FormIContainer[]) => void;
  onVolumesChange: (volumes: IIoK8sApiCoreV1Volume[]) => void
};

const FormPodTemplate: React.FC<IFormPodTemplateProps> = (props) => {
  const intl = useIntl();
  const [activeKey, setActiveKey] = useState('containers');

  const items: TabsProps['items'] = [
    {
      label: intl.formatMessage({ id: 'cluster.workload.containers.list' }),
      key: 'containers',
      icon: <DockerOutlined />,
      children: (
        <>
          <FormContainerList
            key='containers'
            volumes={props.volumes || []}
            namespace={props.namespace}
            onContainersChange={props.onContainersChange}
            containers={props.containers || []}
            allowEmpty={false}
            action={props.action}
            timezoneSync={props.timezoneSync}
          />
        </>
      ),
    },
    {
      label: intl.formatMessage({ id: 'cluster.resource.workload.volumes' }),
      key: 'volumes',
      icon: <SaveOutlined />,
      children: (
        <>
          <FormVolumeList
            namespace={props.namespace}
            key='volumes'
            volumes={props.volumes}
            setVolumes={props.onVolumesChange}
            timezoneSync={props.timezoneSync}
          />
        </>
      ),
    },
  ];
  return (
    <Tabs
      type="card"
      animated={{ inkBar: true, tabPane: true }}
      onChange={(key) => setActiveKey(key)}
      activeKey={activeKey}
      items={items}
    />
  );
};
export default FormPodTemplate;
