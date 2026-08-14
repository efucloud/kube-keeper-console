import { MoreOutlined } from "@ant-design/icons";
import { Tag, Flex, Popover, Space } from "antd";
import { IIoK8sApiAppsV1DeploymentStrategy, IIoK8sApiAppsV1DaemonSetUpdateStrategy, IIoK8sApiAppsV1StatefulSetUpdateStrategy } from "kubernetes-models/apps/v1";
import { FormattedMessage, useIntl } from '@umijs/max';
import { IVolume, IIoK8sApiCoreV1PodSecurityContext, IIoK8sApiCoreV1ResourceRequirements, IIoK8sApiCoreV1SecurityContext } from "kubernetes-models/v1";
import { ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import React from "react";

export type RenderContainerResourcesProps = {
  resources?: IIoK8sApiCoreV1ResourceRequirements;
}

export const RenderContainerResources: React.FC<RenderContainerResourcesProps> = (props) => {
  let nodes = [] as React.ReactNode[];
  const resources = props.resources;
  if (!resources) {
    return (<></>)
  }
  if (resources.requests) {
    let tags = [] as React.ReactNode[];
    if (resources.requests['cpu']) {
      tags.push(<Tag style={{ border: 0 }} key='cpu'><FormattedMessage id='cluster.resource.container.resources.cpu' />:&nbsp;{resources.requests['cpu']}</Tag>)
    }
    if (resources.requests['memory']) {
      tags.push(<Tag style={{ border: 0 }} key='memory'><FormattedMessage id='cluster.resource.container.resources.memory' />:&nbsp;{resources.requests['memory']}</Tag>)
    }
    nodes.push(<ProDescriptions.Item key='request' label={<FormattedMessage id='cluster.resource.container.resources.requests' />} ><Flex gap="4px 0" wrap>{tags}</Flex></ProDescriptions.Item>)
  }
  if (resources.limits) {
    let tags = [] as React.ReactNode[];
    if (resources.limits['cpu']) {
      tags.push(<Tag style={{ border: 0 }} key='cpu'><FormattedMessage id='cluster.resource.container.resources.cpu' />:&nbsp;{resources.limits['cpu']}</Tag>)
    }
    if (resources.limits['memory']) {
      tags.push(<Tag style={{ border: 0 }} key='memory'><FormattedMessage id='cluster.resource.container.resources.memory' />:&nbsp;{resources.limits['memory']}</Tag>)
    }
    nodes.push(<ProDescriptions.Item key='limits' label={<FormattedMessage id='cluster.resource.container.resources.limits' />} ><Flex gap="4px 0" wrap>{tags}</Flex></ProDescriptions.Item>)
  }
  return (<ProDescriptions style={{ marginBottom: 16 }} column={2}>{nodes}</ProDescriptions>)
}
export type RenderSecurityContextProps = {
  securityContext: IIoK8sApiCoreV1SecurityContext;
}

export const RenderSecurityContext: React.FC<RenderSecurityContextProps> = (props) => {
  let nodes = [] as React.ReactNode[];
  const securityContext = props.securityContext

  nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.securityContext.allowPrivilegeEscalation' />} >{securityContext.allowPrivilegeEscalation ? <FormattedMessage id='cluster.boolean.true' /> : <FormattedMessage id='cluster.boolean.false' />}</ProDescriptions.Item>)
  nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.securityContext.privileged' />} >{securityContext.privileged ? <FormattedMessage id='cluster.boolean.true' /> : <FormattedMessage id='cluster.boolean.false' />}</ProDescriptions.Item>)
  if (securityContext.capabilities?.add) {
    nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.securityContext.capabilities.add' />} ><Flex gap="4px 0" wrap>{securityContext.capabilities.add.map((item: string) => <Tag style={{ border: 0 }}>{item}</Tag>)}</Flex></ProDescriptions.Item>)
  }
  if (securityContext.capabilities?.drop) {
    nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.securityContext.capabilities.drop' />} ><Flex gap="4px 0" wrap>{securityContext.capabilities.drop.map((item: string) => <Tag style={{ border: 0 }}>{item}</Tag>)}</Flex></ProDescriptions.Item>)
  }
  if (securityContext.procMount) {
    nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.securityContext.procMount' />} >{securityContext.procMount}</ProDescriptions.Item>)
  }
  if (securityContext.readOnlyRootFilesystem === true) {
    nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.securityContext.readOnlyRootFilesystem' />} ><FormattedMessage id='cluster.boolean.true' /> </ProDescriptions.Item>)
  }
  if (securityContext.runAsGroup) {
    nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.securityContext.runAsGroup' />} >{securityContext.runAsGroup}</ProDescriptions.Item>)
  }
  if (securityContext.runAsNonRoot) {
    nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.securityContext.runAsNonRoot' />} ><FormattedMessage id='cluster.boolean.true' /> </ProDescriptions.Item>)

  }
  if (securityContext.runAsUser) {
    nodes.push(<ProDescriptions.Item label={<FormattedMessage id='cluster.securityContext.runAsUser' />} >{securityContext.runAsUser}</ProDescriptions.Item>)
  }
  return (<ProDescriptions column={2}>{nodes}</ProDescriptions>)
}
export type RenderPodSecurityContextProps = {
  securityContext: IIoK8sApiCoreV1PodSecurityContext;
}

export const RenderPodSecurityContext: React.FC<RenderPodSecurityContextProps> = (props) => {
  let tags = [] as React.ReactNode[];
  const securityContext = props.securityContext
  if (securityContext.fsGroup) {
    tags.push(<Tag style={{ border: 0 }} key='fsGroup'>fsGroup:&nbsp;{securityContext.fsGroup}</Tag>)
  }
  if (securityContext.runAsGroup) {
    tags.push(<Tag style={{ border: 0 }} key='runAsGroup'>runAsGroup:&nbsp;{securityContext.runAsGroup}</Tag>)
  }
  if (securityContext.runAsNonRoot) {
    tags.push(<Tag style={{ border: 0 }} key='runAsNonRoot'><FormattedMessage id='cluster.workload.securityContext.runAsNonRoot' /></Tag>)
  }
  if (securityContext.runAsUser) {
    tags.push(<Tag style={{ border: 0 }} key='runAsUser'><FormattedMessage id='cluster.workload.securityContext.runAsUser' />:{securityContext.runAsUser}</Tag>)
  }

  return (<Flex gap="4px 0" wrap> {tags}</Flex>)
}

export type RenderLabelProps = {
  type?: 'text' | 'ReactNode';
  labels: { [key: string]: string; };
}

export const RenderLabels: React.FC<RenderLabelProps> = (props) => {
  if (props.type === 'text') {
    let labels = [] as string[];
    for (const [key, value] of Object.entries(props.labels || {})) {
      labels.push(`${key}=${value}`)
    }
    return labels.join('\n');

  } else {
    let tags = [] as React.ReactNode[];
    const keys = Object.keys(props.labels || {});
    if (keys.length > 0) {
      keys?.map((key: string) => { tags.push(<Tag style={{ border: 0 }} key={key}>{key}={props.labels[key]}</Tag>) })
    }
    return (<Space orientation="vertical" size="small" style={{ display: 'flex' }}> {tags}</Space>)
  }

}
export type RenderAnnotationsProps = {
  labels: { [key: string]: string; };
}
export const RenderAnnotations: React.FC<RenderAnnotationsProps> = (props) => {
  let tags = [] as React.ReactNode[];
  const keys = Object.keys(props.labels || {});
  if (keys.length > 0) {
    keys?.map((key: string) => {
      if (key === 'kubectl.kubernetes.io/last-applied-configuration') {
        tags.push(<Tag style={{ border: 0 }} key={key}>{key}=<Popover content={props.labels[key]}><MoreOutlined /></Popover></Tag>)
      } else {
        tags.push(<Tag style={{ border: 0 }} key={key}>{key}={props.labels[key]}</Tag>)
      }
    })
  }
  return (<Flex gap="4px 0" wrap> {tags}</Flex>)
}

export const DaemonSetStrategy = (strategy: IIoK8sApiAppsV1DaemonSetUpdateStrategy) => {
  return (<>
    {strategy?.type === "OnDelete" ? <Tag color="green"><FormattedMessage id='cluster.workload.strategy.type.OnDelete' /></Tag> : <Tag color="blue"><FormattedMessage id='cluster.workload.strategy.type.RollingUpdate' /></Tag>}
    {strategy?.rollingUpdate?.maxSurge && <Tag key='maxSurge'><FormattedMessage id='cluster.workload.strategy.rollingUpdate.maxSurge' />:{strategy?.rollingUpdate?.maxSurge}</Tag>}
    {strategy?.rollingUpdate?.maxUnavailable && <Tag key='maxUnavailable'><FormattedMessage id='cluster.workload.strategy.rollingUpdate.maxUnavailable' />:{strategy?.rollingUpdate?.maxUnavailable}</Tag>}
  </>);
}
export const DeploymentStrategy = (strategy: IIoK8sApiAppsV1DeploymentStrategy) => {
  return (<>
    {strategy?.type === "Recreate" ? <Tag color="green"><FormattedMessage id='cluster.workload.strategy.type.Recreate' /></Tag> : <Tag color="blue"><FormattedMessage id='cluster.workload.strategy.type.RollingUpdate' /></Tag>}
    {strategy?.rollingUpdate?.maxSurge && <Tag key='maxSurge'><FormattedMessage id='cluster.workload.strategy.rollingUpdate.maxSurge' />:{strategy?.rollingUpdate?.maxSurge}</Tag>}
    {strategy?.rollingUpdate?.maxUnavailable && <Tag key='maxUnavailable'><FormattedMessage id='cluster.workload.strategy.rollingUpdate.maxUnavailable' />:{strategy?.rollingUpdate?.maxUnavailable}</Tag>}
  </>);
}
export const StatefulSetStrategy = (strategy: IIoK8sApiAppsV1StatefulSetUpdateStrategy) => {
  return (<>
    {strategy?.type === "OnDelete" ? <Tag color="green"><FormattedMessage id='cluster.workload.strategy.type.OnDelete' /></Tag> : <Tag color="blue"><FormattedMessage id='cluster.workload.strategy.type.RollingUpdate' /></Tag>}
    {strategy?.rollingUpdate?.partition && <Tag key='partition'><FormattedMessage id='cluster.workload.strategy.rollingUpdate.partition' />:{strategy?.rollingUpdate?.partition}</Tag>}
    {strategy?.rollingUpdate?.maxUnavailable && <Tag key='maxUnavailable'><FormattedMessage id='cluster.workload.strategy.rollingUpdate.maxUnavailable' />:{strategy?.rollingUpdate?.maxUnavailable}</Tag>}
  </>);
}
export type RenderVolumesProps = {
  volumes: IVolume[]
}
export const RenderVolumes: React.FC<RenderVolumesProps> = (props) => {
  const intl = useIntl();
  const columns: ProColumns<IVolume>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'name',
      render: (dom, entity) => {
        return <>{entity.name}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.volume.provider' }),
      dataIndex: 'provider',
      render: (dom, entity) => {
        if (entity.configMap) {
          return 'configMap';
        } else if (entity.csi) {
          return 'csi';
        } else if (entity.downwardAPI) {
          return 'downwardAPI';
        } else if (entity.emptyDir) {
          return 'emptyDir';
        } else if (entity.hostPath) {
          return 'hostPath';
        } else if (entity.iscsi) {
          return 'iscsi';
        } else if (entity.nfs) {
          return 'nfs';
        } else if (entity.persistentVolumeClaim) {
          return 'persistentVolumeClaim';
        } else if (entity.projected) {
          return 'projected';
        } else if (entity.secret) {
          return 'secret';
        } else if (entity.image) {
          return 'image';
        } else if (entity.ephemeral) {
          return 'ephemeral';
        } else if (entity.fc) {
          return 'fc';
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.volume.provider' }),
      dataIndex: 'provider',
      render: (dom, entity) => {
        if (entity.configMap) {
          const configMap = entity.configMap;
          let tags = [] as React.ReactNode[];
          if (configMap.name) {
            tags.push(<Tag key={configMap.name}><FormattedMessage id='cluster.resource.name' />:{configMap.name}</Tag>)
          }
          if (configMap.items) {
            tags.push(<Tag key='configMap.items'><FormattedMessage id='cluster.resource.volume.optional' />:{JSON.stringify(configMap.items)}</Tag>)
          }
          if (configMap.defaultMode) {
            tags.push(<Tag key={configMap.defaultMode}><FormattedMessage id='cluster.resource.volume.defaultMode' />:{configMap.defaultMode}</Tag>)
          }

          if (configMap.optional) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.volume.optional' /></Tag>)
          }
          return <Flex gap="4px 0" wrap>{tags}</Flex>;
        } else if (entity.csi) {
          const csi = entity.csi;
          let tags = [] as React.ReactNode[];
          if (csi.driver) {
            tags.push(<Tag key={csi.driver}><FormattedMessage id='cluster.resource.volume.provider.csi.driver' />:{csi.driver}</Tag>)
          }
          if (csi.fsType) {
            tags.push(<Tag key={csi.fsType}><FormattedMessage id='cluster.resource.volume.fsType' />:{csi.fsType}</Tag>)
          }
          if (csi.nodePublishSecretRef) {
            tags.push(<Tag key='nodePublishSecretRef'><FormattedMessage id='cluster.resource.volume.provider.csi.nodePublishSecretRef' />:{csi.nodePublishSecretRef.name}</Tag>)
          }
          if (csi.volumeAttributes) {
            tags.push(<Tag key='volumeAttributes'><FormattedMessage id='cluster.resource.volume.provider.csi.volumeAttributes' />:{JSON.stringify(csi.volumeAttributes)}</Tag>)
          }
          if (csi.readOnly) {
            tags.push(<Tag key='readOnly'><FormattedMessage id='cluster.resource.volume.readOnly' /></Tag>)
          }
          return <Flex gap="4px 0" wrap>{tags}</Flex>;
        } else if (entity.downwardAPI) {
          const downwardAPI = entity.downwardAPI;
          return JSON.stringify(downwardAPI);

        } else if (entity.emptyDir) {
          return entity.emptyDir;
        } else if (entity.projected) {
          return JSON.stringify(entity.projected.sources)
        } else if (entity.hostPath) {
          const hostPath = entity.hostPath;
          let tags = [] as React.ReactNode[];
          if (hostPath.path) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.volume.path' />:{hostPath.path}</Tag>)
          }
          if (hostPath.type) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.volume.hostPath.type' />:{hostPath.type}</Tag>)
          }
          return <Flex gap="4px 0" wrap>{tags}</Flex>;
        } else if (entity.nfs) {
          const nfs = entity.nfs;
          let tags = [] as React.ReactNode[];
          if (nfs.server) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.volume.service.address' />:{nfs.server}</Tag>)
          }
          if (nfs.path) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.volume.path' />:{nfs.path}</Tag>)
          }
          if (nfs.readOnly) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.volume.readOnly' /></Tag>)
          }
          return <Flex gap="4px 0" wrap>{tags}</Flex>;
        } else if (entity.persistentVolumeClaim) {
          const pvc = entity.persistentVolumeClaim;
          let tags = [] as React.ReactNode[];
          if (pvc.claimName) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.volume.persistentVolumeClaim.claimName' />:{pvc.claimName}</Tag>)
          }
          if (pvc.readOnly) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.volume.readOnly' /></Tag>)
          }
          return <Flex gap="4px 0" wrap>{tags}</Flex>;
        } else if (entity.secret) {
          const secret = entity.secret;
          let tags = [] as React.ReactNode[];
          if (secret.secretName) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.name' />:{secret.secretName}</Tag>)
          }
          if (secret.items) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.volume.optional' />:{secret.items.join(' ')}</Tag>)
          }
          if (secret.defaultMode) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.volume.defaultMode' />:{secret.defaultMode}</Tag>)
          }
          if (secret.optional) {
            tags.push(<Tag><FormattedMessage id='cluster.resource.volume.optional' /></Tag>)
          }
          return <Flex gap="4px 0" wrap>{tags}</Flex>;
        }
      },
    },
  ];

  return (<>
    <ProTable<IVolume>
      key='volume'
      scroll={{ x: 'max-content' }}
      search={false}
      size='small'
      toolBarRender={false}
      pagination={false}
      columns={columns}
      dataSource={props.volumes}
    />
  </>)
}



