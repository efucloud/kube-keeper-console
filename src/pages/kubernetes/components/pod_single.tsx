import { clusterGetProxy } from "@/services/cluster_proxy.api";
import { ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import { FormattedMessage, useIntl } from "@umijs/max";
import { Card, Col, Row, Space, Tabs, Tag } from "antd";
import { IIoK8sApiCoreV1ContainerStatus, IIoK8sApiCoreV1HostAlias, IIoK8sApiCoreV1PodCondition, Pod } from "kubernetes-models/v1";
import { useEffect, useState } from "react";
import { RenderLabels, RenderVolumes } from "@/pages/kubernetes/components/render";
import { RenderContainers } from "@/pages/kubernetes/components/container";
import { TabsProps } from "antd/lib";
import PodContainerLog from "@/pages/kubernetes/components/container_log";
import PodContainerTerminal from "@/pages/kubernetes/components/container_terminal";
import dayjs from "dayjs";
import { RelatedEvents } from "@/pages/kubernetes/components/event";
import { RelatedServices } from "@/pages/kubernetes/components/service";
import { RenderPodMetrics } from "@/pages/kubernetes/components/pod_metrics";
import PodContainerFile from "@/pages/kubernetes/components/container_file";

export type PodSingleProps = {
  cluster: string;
  namespace: string;
  name: string;
  startTime?: string;
  endTime?: string;
  onSelectLog?: (logQuestion: string) => void;
};
export const PodSingle: React.FC<PodSingleProps> = (props) => {
  const [info, setInfo] = useState<Pod>();
  const [baseActive, setBaseActive] = useState<string>('base');
  const [activeKey, setActiveKey] = useState<string>('containers');
  const intl = useIntl();

  const BaseApi = `api/v1/namespaces/${props.namespace}/pods`;
  const BaseAddress = `/kubernetes/cluster/${props.cluster}/namespace/${props.namespace}/workload/pods`
  const getInfo = async () => {
    let params = { cluster: props.cluster, address: `${BaseApi}/${props.name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as Pod;

    setInfo(res);
  }
  useEffect(() => {
    getInfo();
  }, [])
  const onChange = (key: string) => {
    setActiveKey(key);
  };

  const items: TabsProps['items'] = [
    {
      key: 'containers', label: <FormattedMessage id='cluster.resource.pod' />,
      children: <RenderContainers

        cluster={props.cluster}
        namespace={info?.metadata?.namespace || ''}
        inits={info?.spec?.initContainers || []}
        containers={info?.spec?.containers || []}
        ephemerals={info?.spec?.ephemeralContainers || []} />
    },
    { key: 'storage', label: <FormattedMessage id='cluster.resource.volume' />, children: <RenderVolumes volumes={info?.spec?.volumes || []} /> },

  ];
  const conditionsColumns: ProColumns[] = [
    {
      title: <FormattedMessage id="cluster.resource.event.type" />,
      dataIndex: 'type',
      search: false,
    },
    {
      title: <FormattedMessage id="cluster.resource.conditions.status" />,
      dataIndex: 'status',
      search: false,
      valueEnum: {
        'False': {
          text: 'False',
          status: 'Error',
        },
        "True": {
          text: "True",
          status: 'Success',
        },
      },
    },
    {
      title: <FormattedMessage id="cluster.resource.conditions.lastTransitionTime" />,
      dataIndex: 'lastTransitionTime',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: <FormattedMessage id="cluster.resource.conditions.reason" />,
      dataIndex: 'reason',
      search: false,
    },
    {
      title: <FormattedMessage id="cluster.resource.conditions.message" />,
      dataIndex: 'message',
      search: false,
    },
  ]
  const containerStatusColumns: ProColumns[] = [
    {
      title: <FormattedMessage id="cluster.resource.container.name" />,
      dataIndex: 'name',
      search: false,
    },
    {
      title: <FormattedMessage id="cluster.resource.container.restartCount" />,
      dataIndex: 'restartCount',
      valueType: 'digit',
      search: false,
    },

    {
      title: <FormattedMessage id="cluster.resource.conditions.status" />,
      dataIndex: 'ready',
      search: false,
      valueEnum: {
        false: {
          text: 'False',
          status: 'Error',
        },
        true: {
          text: "True",
          status: 'Success',
        },
      },

    },
    {
      title: <FormattedMessage id="cluster.resource.container.state.time" />,
      search: false,
      render: (_, entity: IIoK8sApiCoreV1ContainerStatus) => {
        if (entity?.state?.running) {
          if (entity?.state?.running.startedAt) {
            return <><FormattedMessage id='cluster.resource.container.startAt' />:&nbsp;{dayjs(entity?.state?.running.startedAt).format('YYYY-MM-DD HH:mm:ss')}</>
          }
          return null
        } else if (entity?.lastState?.terminated) {
          if (entity.lastState?.terminated?.finishedAt) {
            return <><FormattedMessage id='cluster.resource.container.latestFinishedAt' />:&nbsp;{dayjs(entity.lastState?.terminated?.finishedAt).format('YYYY-MM-DD HH:mm:ss')}</>
          }
          return null
        } else {
          if (entity.state?.terminated?.finishedAt) {
            return <><FormattedMessage id='cluster.resource.container.finishedAt' />:&nbsp;{dayjs(entity.state?.terminated?.finishedAt).format('YYYY-MM-DD HH:mm:ss')}</>
          }
          return null
        }

      },
    },
    {
      title: <FormattedMessage id="cluster.resource.conditions.reason" />,
      search: false,
      render: (_, entity: IIoK8sApiCoreV1ContainerStatus) => {
        if (entity?.state?.waiting) {
          return entity?.state?.waiting?.reason;
        }
      }
    },
    {
      title: <FormattedMessage id="cluster.resource.conditions.message" />,
      search: false,
      render: (_, entity: IIoK8sApiCoreV1ContainerStatus) => {
        if (entity?.state?.waiting) {
          return entity?.state?.waiting?.message;
        }
      }
    },
  ]
  const hostAliasColumns: ProColumns[] = [
    {
      title: <FormattedMessage id="cluster.resource.pod.hostAliases.ip" />,
      dataIndex: 'ip',
      search: false,
    },
    {
      title: <FormattedMessage id="cluster.resource.pod.hostAliases.hostnames" />,
      dataIndex: 'hostnames',
      search: false,
      render: (_, entity: IIoK8sApiCoreV1HostAlias) => {
        // return entity.hostnames?.join(', ');
        return <Space>{entity.hostnames?.map((item) => <Tag key={item}>{item}</Tag>)}</Space>;
      }
    }
  ]
  const status = (info: Pod) => {
    const phase = info?.status?.phase || 'Unknown';
    if (phase === 'Running') {
      return (<Tag style={{ border: 0 }} color="green"><FormattedMessage id='cluster.pod.status.Running' /></Tag>);
    } else if (phase === 'Pending') {
      return (<Tag style={{ border: 0 }} color="orange"><FormattedMessage id='cluster.pod.status.Pending' /></Tag>);
    } else if (phase === 'Succeeded') {
      return (<Tag style={{ border: 0 }} color="blue"><FormattedMessage id='cluster.pod.status.Succeeded' /></Tag>);
    } else if (phase === 'Failed') {
      return (<Tag style={{ border: 0 }} color="red"><FormattedMessage id='cluster.pod.status.Failed' /></Tag>);
    } else {
      return (<Tag style={{ border: 0 }} color="red"><FormattedMessage id='cluster.pod.status.Unknown' /></Tag>);
    }
  };
  return (<>
    {info && <Tabs defaultActiveKey={baseActive}
      onChange={setBaseActive}
      items={(() => {
        const tabs = [];
        tabs.push(
          {
            key: 'base', label: <FormattedMessage id='cluster.resource.base' />, children: <>
              <Card variant={'borderless'}   >
                <Row gutter={16}>
                  <Col lg={10} md={10} sm={24} >
                    <ProDescriptions column={1}  >
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.namespace' />} valueType="text"  >{info?.metadata?.namespace}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.name' />} valueType="text"  >{info?.metadata?.name}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.creationTimestamp' />} valueType="text"  >{dayjs(info.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm:ss')}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.status' />} valueType="text"  >{status(info)}</ProDescriptions.Item>
                      <ProDescriptions.Item copyable label={<FormattedMessage id='cluster.resources.pod.node' />} valueType="text"  >{info.spec?.nodeName}</ProDescriptions.Item>
                      <ProDescriptions.Item copyable label={<FormattedMessage id='cluster.resources.pod.node.ip' />} valueType="text"  >{info.status?.hostIP}</ProDescriptions.Item>
                      <ProDescriptions.Item copyable label={<FormattedMessage id='cluster.resources.pod.ip' />} valueType="text"  >{info.status?.podIP}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.workload.restartPolicy' />} valueType="text" valueEnum={{
                        'Always': {
                          text: intl.formatMessage({ id: 'cluster.workload.restartPolicy.Always' }),
                        },
                        'Never': {
                          text: intl.formatMessage({ id: 'cluster.workload.restartPolicy.Never' }),
                        },
                        'OnFailure': {
                          text: intl.formatMessage({ id: 'cluster.workload.restartPolicy.OnFailure' }),
                        },

                      }} >{info.spec?.restartPolicy}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.serviceaccount' />} valueType="text"  >{info.spec?.serviceAccount}</ProDescriptions.Item>
                    </ProDescriptions>
                  </Col>
                  <Col lg={14} md={14} sm={24} >
                    <Tabs
                      items={(() => {
                        const tabs = [];
                        tabs.push({
                          label: intl.formatMessage({ id: 'cluster.resource.labels' }),
                          key: 'labels',
                          children: <>
                            <ProDescriptions.Item valueType="code" ><RenderLabels labels={info.metadata?.labels || {}} type='ReactNode' /></ProDescriptions.Item>
                          </>
                        });
                        if (info.spec?.hostAliases && info.spec?.hostAliases.length > 0) {
                          tabs.push({
                            label: intl.formatMessage({ id: 'cluster.resource.pod.hostAliases' }),
                            key: 'hostAliases',
                            children: <>
                              <ProTable<IIoK8sApiCoreV1HostAlias>
                                key='host-alias'
                                scroll={{ x: 'max-content' }}
                                className="no-search-form"
                                size="small"
                                dataSource={info.spec?.hostAliases || []}
                                columns={hostAliasColumns}
                                rowSelection={false}
                                pagination={false}
                                toolBarRender={false}
                                options={false}
                                search={{ optionRender: false }}
                                locale={{
                                  emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
                                }}
                              />
                            </>
                          })
                        }
                        return tabs;
                      })()} />
                  </Col>
                </Row>
                <Row gutter={16} >
                  <Col span={24}  >
                    <Tabs
                      items={[
                        {
                          label: intl.formatMessage({ id: 'cluster.pod.constainer.status' }),
                          key: 'status',
                          children: <>
                            <ProTable<IIoK8sApiCoreV1ContainerStatus>
                              key='container-status'
                              scroll={{ x: 'max-content' }}
                              className="no-search-form"
                              size="small"
                              dataSource={[...(info.status?.containerStatuses || []),
                              ...(info.status?.initContainerStatuses || []),
                              ...(info.status?.ephemeralContainerStatuses || [])]}
                              columns={containerStatusColumns}
                              rowSelection={false}
                              pagination={false}
                              toolBarRender={false}
                              options={false}
                              search={{ optionRender: false }}
                              locale={{
                                emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
                              }}
                            />
                          </>
                        },
                        {
                          label: intl.formatMessage({ id: 'cluster.resource.conditions' }),
                          key: 'conditions',
                          children: <>
                            <ProTable<IIoK8sApiCoreV1PodCondition>
                              key='pod-condition'
                              scroll={{ x: 'max-content' }}
                              className="no-search-form"
                              size="small"
                              dataSource={info.status?.conditions || []}
                              columns={conditionsColumns}
                              rowSelection={false}
                              pagination={false}
                              toolBarRender={false}
                              options={false}
                              search={{ optionRender: false }}
                              locale={{
                                emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
                              }}
                            />
                          </>
                        }

                      ]} />
                  </Col>
                </Row>
              </Card>
              <Card variant={'borderless'} style={{ marginTop: 16 }} >
                <Tabs
                  activeKey={activeKey}
                  items={items}
                  onChange={onChange}
                />
              </Card>
            </>
          },
          {
            key: 'log', label: <FormattedMessage id='cluster.resource.container.log' />, children: <>
              {info?.metadata?.name &&
                <Card>
                  <PodContainerLog
                    running={info?.status?.phase === 'Running'}
                    cluster={props.cluster} namespace={props.namespace} pod={info?.metadata?.name} containers={[
                      ...(info?.spec?.containers?.map(c => c.name) ?? []),
                      ...(info?.spec?.initContainers?.map(c => c.name) ?? [])

                    ]}
                    onSelectLog={props.onSelectLog} /></Card>
              }
            </>
          });
        if (info?.status?.phase === 'Running') {
          tabs.push(
            {
              key: 'terminal', label: <FormattedMessage id='cluster.resource.container.terminal' />, children: <>
                {info?.metadata?.name &&
                  <Card>< PodContainerTerminal cluster={props.cluster} namespace={props.namespace} pod={info?.metadata?.name} containers={[
                    ...(info?.spec?.containers?.map(c => c.name) ?? [])
                  ]} /></Card>
                }
              </>
            });
        }

        tabs.push(
          {
            key: 'event', label: <FormattedMessage id='cluster.resource.event' />, children: <RelatedEvents cluster={props.cluster} namespace={props.namespace}
              fieldSelectors={{
                'kind': 'Pod',
                'name': `${info?.metadata?.name}`,
                'namespace': `${info?.metadata?.namespace}`,
              }} />
          },
          {
            key: 'accessMethod', label: <FormattedMessage id='cluster.workload.accessMethod' />, children: <>
              <Card style={{ border: 0 }}>
                <Tabs
                  defaultActiveKey='service'
                  items={
                    [
                      {
                        label: <FormattedMessage id='cluster.resource.service' />,
                        key: 'service',
                        children: <RelatedServices cluster={props.cluster} namespace={props.namespace} podLabels={info?.metadata?.labels || {}} />
                      },
                    ]
                  }
                />
              </Card>
            </>
          },
          {
            key: 'monitor', label: <FormattedMessage id='cluster.view.monitor' />, children: <>
              <Card><RenderPodMetrics startTime={dayjs(props.startTime).unix()} endTime={props.endTime ? dayjs(props.endTime).unix() : dayjs().unix()} cluster={props.cluster} namespace={info.metadata?.namespace || ''} pod={info.metadata?.name || ''} /></Card>
            </>
          });
        if (info?.status?.phase === 'Running') {
          tabs.push({
            key: 'file', label: <FormattedMessage id='cluster.resource.container.file' />, children: <PodContainerFile cluster={props.cluster} namespace={props.namespace} pod={info.metadata?.name || ''} containers={[
              ...(info?.spec?.containers?.map(c => c.name) ?? [])
            ]}
            />
          });
        }
        return tabs as TabsProps['items'];
      })()}
    />}
  </>)
}
export default PodSingle;