import { Modal, Tabs } from "antd";
import { FormContainer } from "@/pages/kubernetes/components/form_container";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "@umijs/max";
import { nanoid } from "@ant-design/pro-components";
import { IIoK8sApiCoreV1Container, IIoK8sApiCoreV1Volume } from "kubernetes-models/v1";
import { TabsProps } from "antd/lib";
import { FormIContainer } from "@/pages/kubernetes/components/form_kubernetes_resource";
import dayjs from "dayjs";

type ContainerListProps = {
  namespace: string;
  containers: FormIContainer[];
  allowEmpty: boolean;
  action: string;
  volumes: IIoK8sApiCoreV1Volume[];
  onContainersChange: (containers: FormIContainer[]) => void;
  timezoneSync?: boolean;
};
const FormContainerList: React.FC<ContainerListProps> = (props) => {
  const defaultVolumeMounts = [
    { name: 'timezone', mountPath: '/etc/localtime', readOnly: true },
    { name: 'timezone-config', mountPath: '/etc/timezone', readOnly: true }
  ];
  let emptyContainer = {
    name: `container-${Date.now().toString()}`,
    imagePullPolicy: 'IfNotPresent',
  } as IIoK8sApiCoreV1Container;
  if (props.timezoneSync) {
    emptyContainer.volumeMounts = defaultVolumeMounts
  }

  useEffect(() => {
    if (props.containers?.length == 0) {
      const key = nanoid();
      const newContainer = { ...emptyContainer };
      if (props.timezoneSync) {
        newContainer.volumeMounts = defaultVolumeMounts
      }
      props.onContainersChange([{ efuKey: key, IContainer: { ...newContainer, name: 'container' }, createTime: dayjs().unix(), isInit: false }]);
      setActiveContainerKey(key)
    }
  }, [props.containers?.length])


  const [activeContainerKey, setActiveContainerKey] = useState<string>(props.containers.length > 0 ? props.containers[0].efuKey : '');
  const intl = useIntl();
  const add = () => {
    const key = nanoid();
    const newContainer = { ...emptyContainer };
    if (props.timezoneSync) {
      newContainer.volumeMounts = defaultVolumeMounts
    }
    props.onContainersChange([...props.containers.filter(item => item.efuKey !== key), {
      IContainer: newContainer,
      efuKey: key,
      createTime: dayjs().unix(),
      isInit: false,
    } as FormIContainer])
    setActiveContainerKey(key);
  };
  const onEdit = (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: 'add' | 'remove',
  ) => {
    if (action === 'add') {
      add();
    } else {
      Modal.confirm({
        title: `${intl.formatMessage({ id: 'cluster.resource.operation.delete' })}${intl.formatMessage({ id: 'cluster.resource.containers' })} `,
        content: intl.formatMessage({ id: 'cluster.resource.container.delete.description' }),
        okText: intl.formatMessage({ id: 'pages.operation.confirm' }),
        cancelText: intl.formatMessage({ id: 'pages.operation.cancel' }),
        onOk() {
          props.onContainersChange([...props.containers.filter(item => item.efuKey !== targetKey)])
          if (props.containers.length > 0) {
            setActiveContainerKey(props.containers[0].efuKey)
          }
        },
      });
    }
  };
  const containerChange = (updatedContainer: FormIContainer) => {
    let index = -1;
    const containers = [...props.containers];
    if (containers && containers.length > 0) {
      for (let i = 0; i < containers.length; i++) {
        if (containers[i].efuKey === updatedContainer.efuKey) {
          index = i
        }
      }
    }
    if (index > -1) {
      containers[index] = updatedContainer
    } else {
      containers.push(updatedContainer)
    }
    props.onContainersChange(containers)
  };
  const items = (): TabsProps['items'] => {
    const nodes = [];
    let containerNames = {} as Record<string, string>; //key为key

    if (props.containers) {
      const sortedContainers = useMemo(() => {
        return [...props.containers].sort((a, b) => a.createTime - b.createTime);
      }, [props.containers]);
      for (let i = 0; i < sortedContainers.length; i++) {
        containerNames[sortedContainers[i].efuKey] = sortedContainers[i].IContainer.name
      }
      for (let i = 0; i < sortedContainers.length; i++) {
        const item = sortedContainers[i] as FormIContainer;
        nodes.push({
          label: <> {item.IContainer.name}({item.isInit === true ?
            <FormattedMessage id='cluster.resource.container.isInit' /> :
            <FormattedMessage id='cluster.resource.container.isBiz' />})</>,
          key: `${item.efuKey}`,
          children: (
            <FormContainer
              volumes={props.volumes || []}
              namespace={props.namespace}
              containerNames={containerNames}
              key={item.efuKey}
              onValuesChange={containerChange}
              action={props.action}
              container={item}
              timezoneSync={props.timezoneSync}
            />
          ),
        });
      }
    }
    return nodes;
  };
  return (
    <>
      <Tabs
        type="editable-card"
        onChange={setActiveContainerKey}
        activeKey={activeContainerKey}
        items={items()}
        onEdit={onEdit}
      />
    </>
  );
};
export default FormContainerList;
