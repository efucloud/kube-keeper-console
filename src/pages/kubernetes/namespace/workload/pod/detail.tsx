import { getColorPrimary, getCurrentViewInfo, normalizeKubernetesPath } from '@/utils/global';
import { PageContainer, ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import { useParams, useIntl, FormattedMessage } from "@umijs/max";
import { useEffect, useState } from "react";
import { Button, Card, Popconfirm, message, Dropdown, Space, Drawer, Row, Col, Tag, Tabs, TabsProps } from "antd";
import { clusterGetProxy, clusterDeleteProxy } from '@/services/cluster_proxy.api';
import { IIoK8sApiCoreV1ContainerStatus, IIoK8sApiCoreV1HostAlias, IIoK8sApiCoreV1PodCondition, Pod } from "kubernetes-models/v1";
import { MoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { getClusterResource } from "@/utils/cluster";
import { IntlShape } from "react-intl";
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { RenderLabels, RenderVolumes } from '@/pages/kubernetes/components/render';
import dayjs from "dayjs";
import { RelatedEvents } from "@/pages/kubernetes/components/event";
import { RenderContainers } from "@/pages/kubernetes/components/container";
import { RelatedServices } from "@/pages/kubernetes/components/service";
import PodContainerLog from "@/pages/kubernetes/components/container_log";
import PodContainerTerminal from "@/pages/kubernetes/components/container_terminal";
import { RenderPodMetrics } from "@/pages/kubernetes/components/pod_metrics";
import PodContainerFile from "@/pages/kubernetes/components/container_file";
import AICopilot from "@/pages/kubernetes/components/ai";
import *as yaml from 'js-yaml';
import { cleanK8sResourceForAI } from "@/utils/copilot";

const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const { name } = useParams();
  const [info, setInfo] = useState<Pod>();
  const intl = useIntl();
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchAnnotationsVisible, setPatchAnnotationsVisible] = useState<boolean>(false);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<string>('containers');
  const [baseActive, setBaseActive] = useState<string>('base');
  const [containers, setContainers] = useState<string[]>([]);
  const BaseApi = `api/v1/namespaces/${namespace}/pods`;
  const BaseAddress = `/kubernetes/cluster/${cluster}/namespace/${namespace}/workload/pods`
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as Pod;
    if (res.spec) {
      let cons: string[] = [];
      for (let i = 0; i < res.spec.containers.length; i++) {
        cons.push(res.spec.containers[i].name);
      }
      if (res.spec?.ephemeralContainers) {
        for (let i = 0; i < res.spec.ephemeralContainers.length; i++) {
          cons.push(res.spec.ephemeralContainers[i].name);
        }
      }

      setContainers(cons);
    }
    setInfo(res);
  }
  const patchVisibleReflash = (visible: boolean) => {
    setPatchAnnotationsVisible(false);
    setPatchLabelVisible(false);
    setResourceDrawerVisible(false);
    setEditorResource(false);
    getInfo();
  };
  useEffect(() => {
    getInfo();
  }, [name]);
  const [externalAiMessage, setExternalAiMessage] = useState<{ message: string; questionType: 'log'; }>();
  const handleLogSelect = (logQuestion: string) => {
    setExternalAiMessage({ message: logQuestion, questionType: 'log' });
  };
  const handleRemove = async (intl: IntlShape, deploy: Pod) => {
    const params = { cluster, address: BaseApi };
    await clusterDeleteProxy(params);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    window.location.pathname = normalizeKubernetesPath(BaseAddress);
    return true;
  };
  const moreItems = () => {
    let nodes = [];

    nodes.push({
      key: 'view-yaml',
      label: <a onClick={() => {
        setEditorResource(false);
        setResourceDrawerVisible(true);
      }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.view.yaml' /></a>,
    });
    if (info && !info?.metadata?.ownerReferences) {
      nodes.push({
        key: 'labels',
        label: <a onClick={() => {
          setPatchLabelVisible(true);
        }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.patch.labels' /></a>,
      });
      nodes.push({
        key: 'edit',
        label: <a onClick={() => { window.location.href = normalizeKubernetesPath(`${BaseAddress}/${info.metadata?.name}/update`) }} style={{ color: colorPrimary }}><FormattedMessage id='model.update' /></a>,
      });
      nodes.push({
        key: 'annotations',
        label: <a onClick={() => {
          setPatchAnnotationsVisible(true);
        }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.patch.annotations' /></a>,
      });
    }



    if (info) {
      nodes.push({
        key: 'delete',
        label: <Popconfirm
          key={info.metadata?.resourceVersion + '-delete'}
          description={intl.formatMessage({ id: 'cluster.resource.pod.delete.description' })}
          title={intl.formatMessage({ id: 'pages.operation.delete.description' }) +
            getClusterResource('Pod') + '【' + info.metadata?.name + '】'}
          onConfirm={() => {
            handleRemove(intl, info)
          }}
          okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
          cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
        >
          <a style={{ color: colorPrimary }} ><FormattedMessage id="pages.operation.delete" /></a>
        </Popconfirm>
      })
    }

    return nodes;
  }
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
  const onChange = (key: string) => {
    setActiveKey(key);
  };

  const items: TabsProps['items'] = [
    {
      key: 'containers', label: <FormattedMessage id='cluster.resource.pod' />,
      children: <RenderContainers

        cluster={cluster}
        namespace={namespace}
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
  return (<>
    {info && <PageContainer header={{ breadcrumb: {}, onBack: () => window.location.href = normalizeKubernetesPath(BaseAddress) }}
      title={info?.metadata?.name}
      subTitle={info?.metadata?.annotations?.['efucloud.com/description'] || ''}
      extra={[
        <Dropdown
          key="more"
          menu={{ items: moreItems() }}
          trigger={['hover']}
          mouseEnterDelay={0.1}
          mouseLeaveDelay={0.15}
        >
          <span
            style={{
              padding: '4px 11px',
              borderRadius: 6,
              cursor: 'pointer',
              border: '1px solid #d9d9d9',
              backgroundColor: 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              color: 'inherit',
              transition: 'background-color 0.3s, border-color 0.3s',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = '#f5f5f5'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <FormattedMessage id="pages.operation.more" />
            <MoreOutlined style={{ color: colorPrimary }} />
          </span>
        </Dropdown>,

        <Button onClick={() => getInfo()}><ReloadOutlined /></Button>,
      ]}
    >
      <Tabs defaultActiveKey={baseActive}
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
                  <Card><PodContainerLog
                    running={info?.status?.phase === 'Running'}
                    cluster={cluster} namespace={namespace} pod={info?.metadata?.name}
                    containers={[
                      ...(info?.spec?.initContainers?.map(c => c.name) ?? []),
                      ...(info?.spec?.containers?.map(c => c.name) ?? [])]}
                    onSelectLog={handleLogSelect}
                  /></Card>
                }
              </>
            });
          if (info?.status?.phase === 'Running') {
            tabs.push(
              {
                key: 'terminal', label: <FormattedMessage id='cluster.resource.container.terminal' />, children: <>
                  {info?.metadata?.name &&
                    <Card>< PodContainerTerminal cluster={cluster} namespace={namespace} pod={info?.metadata?.name} containers={containers} /></Card>
                  }
                </>
              });
          }

          tabs.push(
            {
              key: 'event', label: <FormattedMessage id='cluster.resource.event' />, children: <RelatedEvents cluster={cluster} namespace={namespace}
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
                          children: <RelatedServices cluster={cluster} namespace={namespace} podLabels={info?.metadata?.labels || {}} />
                        },
                      ]
                    }
                  />
                </Card>
              </>
            },
            {
              key: 'monitor', label: <FormattedMessage id='cluster.view.monitor' />, children: <>
                <Card><RenderPodMetrics cluster={cluster} namespace={info.metadata?.namespace || ''} pod={info.metadata?.name || ''} /></Card>
              </>
            });
          if (info?.status?.phase === 'Running') {
            tabs.push({
              key: 'file', label: <FormattedMessage id='cluster.resource.container.file' />, children: <PodContainerFile cluster={cluster} namespace={namespace} pod={info.metadata?.name || ''} containers={containers}
              />
            });
          }
          return tabs as TabsProps['items'];
        })()}
      />
      {patchLabelVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='labels' title={<FormattedMessage id='cluster.patch.labels' />} key='label' kind="Pod" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchLabelVisible} labels={info?.metadata?.labels || {}} />}
      {patchAnnotationsVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='annotations' title={<FormattedMessage id='cluster.patch.annotations' />} key='annotations' kind="Pod" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchAnnotationsVisible} labels={info?.metadata?.annotations || {}} />}
      <Drawer destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={<>{getClusterResource('Pod')}:&nbsp;&nbsp;{info?.metadata?.name}</>}
      >
        <ResourceEditor key={info?.metadata?.resourceVersion || 'edit'} edit={editorResource} address={`${BaseApi}/${name}`} kind='Pod' name={info?.metadata?.name || ''} cluster={cluster} content={info} />
      </Drawer>
      {info.apiVersion &&
        <AICopilot
          view='detail'
          cluster={cluster}
          namespace={namespace || ''}
          name={info.metadata?.name || ''}
          kind="Pod"
          resourceContent={yaml.dump(cleanK8sResourceForAI(info))}
          status={info?.status?.phase === 'Running' ? 'success' : 'error'}
          externalMessage={externalAiMessage}
          externalSkills={['k8s-troubleshoot', 'k8s-log-diagnose-from-user-content']}
        />}

    </PageContainer>}

  </>
  )
};
export default DetailView;