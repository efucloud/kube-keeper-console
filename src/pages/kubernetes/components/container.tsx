import { Tabs, TabsProps, Typography, Tag, Space, Drawer, message } from "antd";
import { IContainer, IIoK8sApiCoreV1ContainerPort, IIoK8sApiCoreV1EnvVar, IIoK8sApiCoreV1VolumeMount, IIoK8sApiCoreV1Probe } from "kubernetes-models/v1";
import { useState } from "react";
import { Access, FormattedMessage, useAccess, useIntl } from "@umijs/max";
import { ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import { RenderContainerResources, RenderSecurityContext } from "@/pages/kubernetes/components/render";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { getColorPrimary, getHeight } from "@/utils/global";
import * as yaml from 'js-yaml';
import { namespaceImageConfigFile } from "@/services/namespace.api";
import { Editor } from "@monaco-editor/react";
import { namespaceImageDownload } from "@/utils/imageDownload";
import access from "@/access";
const { Paragraph } = Typography;
export type RenderContainersProps = {

  cluster: string;
  namespace: string;
  containers: IContainer[];
  inits: IContainer[];
  ephemerals: IContainer[];

}
export const RenderContainers: React.FC<RenderContainersProps> = (props) => {
  const { inits, containers, ephemerals } = props;
  const [activeContainerType, setActiveContainerType] = useState<string>('containers');
  const [bizContainer, setBizContainer] = useState<string>();
  const [initContainer, setInitContainer] = useState<string>();
  const [ephemeralContainer, setEphemeralContainer] = useState<string>();

  const items = (): TabsProps['items'] => {
    let allNodes = [];
    if (containers && containers.length > 0) {
      const bizItems = (): TabsProps['items'] => {
        let nodes = [];
        if (containers) {
          for (let i = 0; i < containers.length; i++) {
            nodes.push({
              label: <span>{containers[i].name}</span>,
              key: containers[i].name,
              children: <RenderContainer cluster={props.cluster} namespace={props.namespace} container={containers[i]} />
            })
          }
        }
        return nodes;
      };
      allNodes.push({
        label: <FormattedMessage id='cluster.workload.containers' />,
        key: 'containers',
        children: <><Tabs
          activeKey={bizContainer}
          onChange={(key) => setBizContainer(key)}
          items={bizItems()}
        /></>,
      });
    }
    if (inits && inits.length > 0) {
      const initItems = (): TabsProps['items'] => {
        let nodes = [];
        for (let i = 0; i < inits.length; i++) {
          nodes.push({
            label: <span>{inits[i].name}</span>,
            key: inits[i].name,
            children: <RenderContainer cluster={props.cluster} namespace={props.namespace} container={inits[i]} />
          })
        }
        return nodes;
      };
      allNodes.push({
        label: <FormattedMessage id='cluster.workload.initContainers' />,
        key: 'initContainers',
        children: <><Tabs
          activeKey={initContainer}
          onChange={(key) => setInitContainer(key)}
          items={initItems()}
        /></>,
      })
    }
    if (ephemerals && ephemerals.length > 0) {
      const ephemeralsItems = (): TabsProps['items'] => {
        let nodes = [];
        for (let i = 0; i < ephemerals.length; i++) {
          nodes.push({
            label: <span>{ephemerals[i].name}</span>,
            key: ephemerals[i].name,
            children: <RenderContainer cluster={props.cluster} namespace={props.namespace} container={ephemerals[i]} />
          })
        }
        return nodes;
      };
      allNodes.push({
        label: <FormattedMessage id='cluster.workload.ephemeralContainers' />,
        key: 'ephemeralContainers',
        children: <><Tabs
          activeKey={ephemeralContainer}
          onChange={(key) => setEphemeralContainer(key)}
          items={ephemeralsItems()}
        /></>,
      })
    }
    return allNodes
  };
  return (
    <>
      <Tabs
        tabBarGutter={2}
        activeKey={activeContainerType}
        items={items()}
        tabPlacement='start'
        onChange={(key) => setActiveContainerType(key)}
      />
    </>
  );

}
export type ContainerProps = {
  cluster: string;
  namespace: string;
  container: IContainer;
}

export const RenderIProbe = (probe: IIoK8sApiCoreV1Probe) => {
  let nodes = [] as React.ReactNode[];
  if (probe.exec?.command) {
    nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.check.method.exec' />} valueType='code'>{probe.exec.command.join('\n')}</ProDescriptions.Item>)
  }
  if (probe.httpGet) {
    nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.check.method.httpGet' />} valueType='code'>{JSON.stringify(probe.httpGet)}</ProDescriptions.Item>)
  }
  if (probe.grpc) {
    nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.check.method.grpc' />} valueType='code'>{JSON.stringify(probe.grpc)}</ProDescriptions.Item>)
  }
  if (probe.tcpSocket) {
    nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.check.method.tcpSocket' />} valueType='code'>{JSON.stringify(probe.tcpSocket)}</ProDescriptions.Item>)
  }
  nodes.push(<ProDescriptions column={2}>
    {probe.periodSeconds && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.check.periodSeconds' />} valueType='text'>{probe.periodSeconds}</ProDescriptions.Item>}
    {probe.initialDelaySeconds && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.check.initialDelaySeconds' />} valueType='text'>{probe.periodSeconds}</ProDescriptions.Item>}
    {probe.timeoutSeconds && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.check.timeoutSeconds' />} valueType='text'>{probe.timeoutSeconds}</ProDescriptions.Item>}
    {probe.successThreshold && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.check.successThreshold' />} valueType='text'>{probe.successThreshold}</ProDescriptions.Item>}
    {probe.failureThreshold && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.check.failureThreshold' />} valueType='text'>{probe.failureThreshold}</ProDescriptions.Item>}
  </ProDescriptions>);

  return (<ProDescriptions column={1}>{nodes}</ProDescriptions>)
}

export const RenderContainer: React.FC<ContainerProps> = (props) => {
  const intl = useIntl();
  const { container } = props;
  const access = useAccess();
  const [activeKey, setActiveKey] = useState<string>('base');
  const colorPrimary = getColorPrimary();
  const [configFileVisible, setConfigFileVisible] = useState<boolean>(false);
  const [configFile, setConfigFile] = useState<string>('');
  const getImageConfigFile = async (imageWithTag: string) => {
    const res = await namespaceImageConfigFile({ cluster: props.cluster, namespace: props.namespace, image: imageWithTag })
    setConfigFile(yaml.dump(JSON.parse(res || '{}')));
  }
  const handleDownload = ({ cluster, namespace, image }) => {
    namespaceImageDownload({ cluster, namespace, image })
      .then(() => console.log('Download started'))
      .catch(error => alert(`Failed to start download: ${error}`));
  };
  const onChange = (key: string) => {
    setActiveKey(key);
  };
  const volumnColumns: ProColumns<IIoK8sApiCoreV1VolumeMount>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.container.volumeMount.name' }),
      dataIndex: 'name',
      render: (dom, entity) => {
        return <>{entity.name}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.container.volumeMount.mountPath' }),
      dataIndex: 'mountPath',
      render: (dom, entity) => {
        return <>{entity.mountPath}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.container.volumeMount.subPath' }),
      dataIndex: 'subPath',
      render: (dom, entity) => {
        return <>{entity.subPath}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.container.volumeMount.readOnly' }),
      dataIndex: 'readOnly',
      render: (dom, entity) => {
        return <>{entity.readOnly}</>;
      },
    },
  ];
  const envColumns: ProColumns<IIoK8sApiCoreV1EnvVar>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.container.env.name' }),
      dataIndex: 'name',
      render: (dom, entity) => {
        return <>{entity.name}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.container.env.value' }),
      dataIndex: 'name',
      render: (dom, entity) => {
        if (entity.value) {
          return <>{entity.value}</>;
        } else if (entity.valueFrom) {
          if (entity.valueFrom.configMapKeyRef) {
            return <> <FormattedMessage id='cluster.resource.container.env.value.fromConfigMap' /> : <Tag key={entity.name}>{entity.valueFrom.configMapKeyRef.name}</Tag><FormattedMessage id='cluster.resource.container.env.value.get' />&nbsp;&nbsp;<Tag key={entity.name}>{entity.valueFrom.configMapKeyRef.key}</Tag></>;
          } else if (entity.valueFrom.secretKeyRef) {
            return <> <FormattedMessage id='cluster.resource.container.env.value.fromSecret' /> : <Tag key={entity.name}>{entity.valueFrom.secretKeyRef.name}</Tag><FormattedMessage id='cluster.resource.container.env.value.get' />&nbsp;&nbsp;<Tag key={entity.name}>{entity.valueFrom.secretKeyRef.key}</Tag></>;
          } else if (entity.valueFrom.fieldRef) {
            return <> <FormattedMessage id='cluster.resource.container.env.value.fromField' /> : <Tag key={entity.name}>{entity.valueFrom.fieldRef.fieldPath}</Tag><FormattedMessage id='cluster.resource.container.env.value.get' /> </>;
          } else if (entity.valueFrom.resourceFieldRef) {
            return <><FormattedMessage id='cluster.resource.container.env.value.fromResource' /> : <Tag key={entity.name}>{entity.valueFrom.resourceFieldRef.resource}</Tag><FormattedMessage id='cluster.resource.container.env.value.get' /> </>;
          }
        }
      },
    },
  ]
  const items = (): TabsProps['items'] => {
    let nodes = [{
      label: <FormattedMessage id='cluster.resource.container.base' />,
      key: 'base',
      children: <>
        <br />
        <ProDescriptions column={2}>
          {container?.targetContainerName && <ProDescriptions.Item label={<FormattedMessage id='cluster.workload.ephemeralContainers.target' />}  >{container.targetContainerName}</ProDescriptions.Item>}
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.name' />}   >{container.name}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.imagePullPolicy' />}
            valueEnum={{
              'Always': {
                text: intl.formatMessage({ id: 'cluster.resource.container.imagePullPolicy.Always' }),
              },
              'Never': {
                text: intl.formatMessage({ id: 'cluster.resource.container.imagePullPolicy.Never' }),
              },
              'IfNotPresent': {
                text: intl.formatMessage({ id: 'cluster.resource.container.imagePullPolicy.IfNotPresent' }),
              },
            }}  >{container.imagePullPolicy}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.image' />}   ><Space>
            {container.image}
            <EyeOutlined style={{ color: colorPrimary, fontSize: 16 }} onClick={() => {
              getImageConfigFile(container.image!)
              setConfigFileVisible(true);
            }} />
            <DownloadOutlined style={{ color: colorPrimary, fontSize: 16 }} onClick={() => {
              handleDownload({ cluster: props.cluster, namespace: props.namespace, image: container.image! })
            }} />
          </Space></ProDescriptions.Item>
        </ProDescriptions>
        {container.resources && <RenderContainerResources resources={container.resources} />}
        <ProDescriptions column={1}>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.port' />} >
            {container.ports && <>
              <Paragraph>
                <ul>
                  {container.ports?.map((item: IIoK8sApiCoreV1ContainerPort) => {
                    return <li>
                      {item.name && <Tag key={item.name}><FormattedMessage id='cluster.resource.container.port.name' />:{item.name}</Tag>}
                      <Tag key={item.name + '-protocal'}><FormattedMessage id='cluster.resource.container.port.protocol' />:{item.protocol || 'TCP'}</Tag>
                      <Tag key={item.name + '-containerPort'}><FormattedMessage id='cluster.resource.container.port.containerPort' />:{item.containerPort}</Tag>
                      {item.hostIP && <Tag key={item.name + '-hostIP'}><FormattedMessage id='cluster.resource.container.port.hostIP' />:{item.hostIP}</Tag>}
                      {item.hostPort && <Tag key={item.name + '-hostPort'}><FormattedMessage id='cluster.resource.container.port.hostPort' />:{item.hostPort}</Tag>}
                    </li>
                  })}
                </ul>
              </Paragraph>
            </>
            }
          </ProDescriptions.Item>
        </ProDescriptions>
        <ProDescriptions style={{ marginBottom: 16 }} column={1}>
          {container.command && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.command' />} valueType='code'  > {container.command?.join('\n') || '-'}</ProDescriptions.Item>}
          {container.args && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.args' />} valueType='code'  >{container.args?.join('\n')}</ProDescriptions.Item>}
        </ProDescriptions>
      </>
    }];

    if (container.lifecycle) {
      nodes.push({
        label: <FormattedMessage id='cluster.resource.container.lifecyle' />,
        key: 'lifecyle',
        children: <> <br />
          <ProDescriptions style={{ marginBottom: 16 }} column={2}>
            {container.lifecycle?.preStop && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.lifecycle.preStop' />} valueType='code'  >{container.lifecycle?.preStop?.exec?.command?.join('\n')}</ProDescriptions.Item>}
            {container.lifecycle?.preStop && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.lifecycle.postStart' />} valueType='code'  >{container.lifecycle?.postStart?.exec?.command?.join('\n')}</ProDescriptions.Item>}
          </ProDescriptions>
        </>
      })
    }
    if (container.livenessProbe || container.readinessProbe || container.startupProbe) {
      nodes.push({
        label: <FormattedMessage id='cluster.resource.container.health' />,
        key: 'health',
        children: <> <br />
          <ProDescriptions style={{ marginBottom: 16 }} column={1}>
            {container.livenessProbe && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.livenessProbe' />}>{
              RenderIProbe(container.livenessProbe)
            }</ProDescriptions.Item>}
            {container.readinessProbe && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.readinessProbe' />}>{
              RenderIProbe(container.readinessProbe)
            }</ProDescriptions.Item>}
            {container.startupProbe && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.container.health.startupProbe' />}>{
              RenderIProbe(container.startupProbe)
            }</ProDescriptions.Item>}
          </ProDescriptions>
        </>
      })
    }
    if (container.env) {
      nodes.push({
        label: <FormattedMessage id='cluster.resource.container.env' />,
        key: 'env',
        children: <> <br />
          {container.env && <>
            <ProTable<IIoK8sApiCoreV1EnvVar>
              scroll={{ x: 'max-content' }}
              key='env'
              search={false}
              size='small'
              toolBarRender={false}
              pagination={false}
              columns={envColumns}
              dataSource={container.env}
            />
          </>}
        </>
      });
    }

    if (container.volumeMounts) {
      nodes.push({
        label: <FormattedMessage id='cluster.resource.container.storage' />,
        key: 'storage',
        children: <> <br />
          {container.volumeMounts && <>
            <ProTable<IIoK8sApiCoreV1EnvVar>
              key='env-var'
              scroll={{ x: 'max-content' }}
              key='storage'
              search={false}
              size='small'
              toolBarRender={false}
              pagination={false}
              columns={volumnColumns}
              dataSource={container.volumeMounts}
            />
          </>}
        </>
      })
    }
    if (container.securityContext) {
      nodes.push({
        label: <FormattedMessage id='cluster.resource.container.security' />,
        key: 'security',
        children: <> <br />
          {container.securityContext && <>
            <RenderSecurityContext securityContext={container.securityContext} />
          </>}
        </>
      })
    }
    return nodes;
  }

  return (<>
    <Tabs
      activeKey={activeKey}
      tabBarGutter={2}
      items={items()}
      size='small'
      tabPlacement='start'
      onChange={onChange}
    />
    {configFileVisible && configFile && <Drawer
      title={<FormattedMessage id='cluster.resource.container.configFile' />}
      placement="right"
      destroyOnHidden={true}
      width="60vw"
      open={configFileVisible}
      onClose={() => setConfigFileVisible(false)}
      closable={true}>
      <Editor
        key='configFile'
        language="yaml"
        height={getHeight(configFile)}
        options={{
          readOnly: true,
          tabSize: 2,
          insertSpaces: true,
        }}
        theme="vs-dark"
        defaultValue={configFile}
        onMount={(editor, monaco) => {
          // 拦截键盘输入
          editor.onKeyDown((e) => {
            if (!editor.getOption(monaco.editor.EditorOption.readOnly)) return;
            // 阻止所有可能修改内容的按键（可选）
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
              e.preventDefault();
              // 可选：显示自定义提示（如 Tooltip、Toast）
              message.warning(intl.formatMessage({ id: 'pages.operation.write.forbbiden' }));
            }
          });
          // 拦截粘贴
          editor.onDidPaste(() => {
            if (editor.getOption(monaco.editor.EditorOption.readOnly)) {
              message.warning(intl.formatMessage({ id: 'pages.operation.paste.forbidden' }));
            }
          });
        }}
      />
    </Drawer>}
  </>)
}
