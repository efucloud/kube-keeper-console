import { appendKubernetesViewQuery, getClusterApiVersions, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { ModalForm, PageContainer, ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import { useParams, useIntl, FormattedMessage } from "@umijs/max";
import { useEffect, useState } from "react";
import { Button, Card, Popconfirm, message, Dropdown, Drawer, Row, Col, Tag, Flex, Divider, Tabs, TabsProps, Space } from "antd";
import { clusterGetProxy, clusterDeleteProxy, clusterPatchProxy } from '@/services/cluster_proxy.api';
import { Deployment, IIoK8sApiAppsV1DeploymentCondition, IReplicaSet, ReplicaSetList } from "kubernetes-models/apps/v1";
import { EditOutlined, MoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { getClusterResource, getWorkloadStatus } from "@/utils/cluster";
import { IntlShape } from "react-intl";
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import PatchReplicas from '@/pages/kubernetes/components/patch_replicas';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { RenderLabels, RenderVolumes, DeploymentStrategy, RenderPodSecurityContext } from '@/pages/kubernetes/components/render';
import { RenderPods } from '@/pages/kubernetes/components/pod';
import dayjs from "dayjs";
import { RelatedServices } from "@/pages/kubernetes/components/service";
import { RenderContainers } from "@/pages/kubernetes/components/container";
import { RelatedEvents } from "@/pages/kubernetes/components/event";
import { RenderWorkloadMetrics } from "@/pages/kubernetes/components/workload_metrics";
import { IContainer, IIoK8sApiCoreV1HostAlias, IPod, Pod, PodList } from "kubernetes-models/v1";
import PodContainerLog from "@/pages/kubernetes/components/container_log";
import PodContainerTerminal from "@/pages/kubernetes/components/container_terminal";
import ResourceDiffEditor from "@/pages/kubernetes/components/resource_diff_editor";
import { PatchSubsetValue } from "@/services/common";
import PatchImages from "@/pages/kubernetes/components/patch_image";
import AICopilot from "@/pages/kubernetes/components/ai";


const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const { name } = useParams();
  const [info, setInfo] = useState<Deployment>();
  const [pods, setPods] = useState<IPod[]>([]);
  const intl = useIntl();
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchAnnotationsVisible, setPatchAnnotationsVisible] = useState<boolean>(false);
  const [patchVisible, setPatchVisible] = useState<boolean>(false);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [resourceReplicaSetDrawerVisible, setReplicaSetResourceDrawerVisible] = useState<boolean>(false);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const [patchDeployment, setPatchDeployment] = useState<IReplicaSet>();
  const [currentReplicaSet, setCurrentReplicaSet] = useState<IReplicaSet>();
  const [rollbackVisible, setRollbackVisible] = useState<boolean>()
  const [activeKey, setActiveKey] = useState<string>('containers');
  const resourceGroup = getClusterApiVersions(cluster, ['apps/v1', 'apps/v1beta1', 'apps/v1beta2'], 'Deployment');
  const BaseApi = `apis/${resourceGroup.groupVersion}/namespaces/${namespace}/deployments`;
  const BaseAddress = `/kubernetes/namespace/workload/deployments`;
  const [dataSource, setDataSource] = useState<IReplicaSet[]>([]);
  const [imageVisible, setImageVisible] = useState<boolean>(false);
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as Deployment;
    setInfo(res);
  }
  const getPods = async () => {
    const selectLabels = info?.spec?.template.metadata?.labels || {}
    const keys = Object.keys(selectLabels)
    if (keys.length > 0) {
      let params = { cluster, address: `api/v1/namespaces/${info?.metadata?.namespace}/pods` } as Record<string, any>;

      let labels = [] as string[];
      for (let i in keys) {
        labels.push(`${keys[i]}=${selectLabels[keys[i]]}`);
      }
      params['labelSelector'] = labels.join(',');
      const data = await clusterGetProxy(params) as PodList;
      setPods(data?.items || [])
    }
  }
  const [externalAiMessage, setExternalAiMessage] = useState<{ message: string; questionType: 'log'; }>();
  const handleLogSelect = (logQuestion: string) => {
    setExternalAiMessage({ message: logQuestion, questionType: 'log' });
  };
  const getReplicaSets = async () => {
    const selectLabels = info?.spec?.template.metadata?.labels || {}
    const keys = Object.keys(selectLabels)
    if (keys.length > 0) {
      let params = { cluster, address: `apis/${resourceGroup.groupVersion}/namespaces/${info?.metadata?.namespace}/replicasets` } as Record<string, any>;

      let labels = [] as string[];
      for (let i in keys) {
        labels.push(`${keys[i]}=${selectLabels[keys[i]]}`);
      }
      params['labelSelector'] = labels.join(',');
      const data = await clusterGetProxy(params) as ReplicaSetList;
      const list = data?.items || [] as IReplicaSet[];
      setDataSource(list.sort((a, b) => {
        const dateA = new Date(a.metadata?.creationTimestamp).getTime();
        const dateB = new Date(b.metadata?.creationTimestamp).getTime();
        return dateB >= dateA; // 降序：b 在前，a 在后
      }))
    }
  }

  const patchVisibleReflash = (visible: boolean) => {
    setPatchAnnotationsVisible(false);
    setPatchVisible(false);
    setPatchLabelVisible(false);
    setResourceDrawerVisible(false);
    setEditorResource(false);
    getInfo();
  };
  useEffect(() => {
    getInfo();
  }, [name]);
  const handleRemove = async (intl: IntlShape, deploy: Deployment) => {
    const params = { cluster, address: BaseApi };
    await clusterDeleteProxy(params);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    window.location.href = appendKubernetesViewQuery(BaseAddress);
    return true;
  };
  const moreItems = () => {
    let nodes = [];
    nodes.push({
      key: 'patch-image',
      label: <a onClick={() => {
        setImageVisible(true);
      }} style={{ color: colorPrimary }}>{intl.formatMessage({ id: 'cluster.resource.images.change' })}</a>
    });
    nodes.push({
      key: 'view-yaml',
      label: <a onClick={() => {
        setEditorResource(false);
        setResourceDrawerVisible(true);
      }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.view.yaml' /></a>,
    });
    if (info && !info?.metadata?.ownerReferences) {
      nodes.push({
        key: 'edit',
        label: <a onClick={() => { window.location.href = appendKubernetesViewQuery(`${BaseAddress}/${info.metadata?.name}/update`) }} style={{ color: colorPrimary }}><FormattedMessage id='model.update' /></a>,
      });
      nodes.push({
        key: 'labels',
        label: <a onClick={() => {
          setPatchLabelVisible(true);
        }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.patch.labels' /></a>,
      });
      nodes.push({
        key: 'annotations',
        label: <a onClick={() => {
          setPatchAnnotationsVisible(true);
        }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.patch.annotations' /></a>,
      });
      nodes.push({
        key: 'replicas',
        label: <a onClick={() => {
          setPatchVisible(true);
        }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.patch.replicas' /></a>,
      });
      nodes.push({
        key: 'edit-yaml',
        label: <a onClick={() => {
          setEditorResource(true);
          setResourceDrawerVisible(true);
        }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.edit.yaml' /></a>,
      });
    }

    if (info) {
      nodes.push({
        key: 'delete',
        label: <Popconfirm
          key={info.metadata?.resourceVersion + '-delete'}
          description={intl.formatMessage({ id: 'cluster.resource.deployment.delete.description' })}
          title={intl.formatMessage({ id: 'pages.operation.delete.description' }) +
            getClusterResource('Deployment') + '【' + info.metadata?.name + '】'}
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
  const status = (info: Deployment) => {
    const conditions = info?.status?.conditions || [];
    let tags = [] as React.ReactNode[];
    for (const item of conditions) {
      if (item.type === 'Available') {
        if (item.status === 'True' && info.spec?.replicas || 0 === info?.status?.readyReplicas) {
          tags.push(<Tag style={{ border: 0 }} key={item.type} color='green'><FormattedMessage id='cluster.resource.Available' /></Tag>);
        } else {
          if (info?.status?.readyReplicas || 0 > 0) {
            tags.push(<Tag style={{ border: 0 }} key={item.type} color='orange'><FormattedMessage id='cluster.resource.SomeAvailable' /></Tag>);
          } else {
            tags.push(<Tag style={{ border: 0 }} key={item.type} color='red'><FormattedMessage id='cluster.resource.UnAvailable' /></Tag>);
          }
        }
      }
    }
    return (
      <Flex gap="4px 0" wrap>  {tags}  </Flex>
    );
  };
  const getReplicas = (info: Deployment) => {
    const unavailableReplicas = info?.status?.unavailableReplicas || 0
    const health = info?.status?.availableReplicas || (info?.status?.replicas || 0 - unavailableReplicas) || 0;
    const edit = !info.metadata?.ownerReferences;
    if (health > 0) {
      return (<><a style={{ color: '#52c41a' }}>{health}&nbsp;</a>{'/ ' + info.spec?.replicas} &nbsp;&nbsp;&nbsp;&nbsp;{edit && <a onClick={() => { setPatchVisible(true) }}><EditOutlined /></a>}</>);
    } else {
      return (<><a style={{ color: 'red' }}>0&nbsp;</a>{'/ ' + info.spec?.replicas}&nbsp;&nbsp;&nbsp;&nbsp;{edit && <a onClick={() => { setPatchVisible(true) }}><EditOutlined /></a>}</>);
    }
  };
  const onChange = (key: string) => {
    setActiveKey(key);
  };

  const items: TabsProps['items'] = [
    {
      key: 'containers',
      label: <FormattedMessage id='cluster.resource.pod' />,
      children:
        <RenderContainers

          cluster={cluster}
          namespace={namespace}
          inits={info?.spec?.template.spec?.initContainers || []}
          containers={info?.spec?.template.spec?.containers || []}
          ephemerals={info?.spec?.template.spec?.ephemeralContainers || []}
        />
    },
    {
      key: 'storage',
      label: <FormattedMessage id='cluster.resource.volume' />,
      children: <RenderVolumes volumes={info?.spec?.template.spec?.volumes || []} />
    },

  ];
  const podsLogs = (): TabsProps['items'] => {
    const nodes = [];
    for (let i = 0; i < pods.length; i++) {
      const pod = pods[i];
      nodes.push({
        label: pod.metadata?.name,
        key: pod.metadata?.name,
        children: <PodContainerLog running={pod?.status?.phase === 'Running'} cluster={cluster} namespace={pod?.metadata?.namespace || ''} pod={pod?.metadata?.name || ''} containers={[
          ...(pod?.spec?.containers?.map(c => c.name) ?? []), ...(pod?.spec?.initContainers?.map(c => c.name) ?? [])
        ]} onSelectLog={handleLogSelect} />
      })
    }
    return nodes as TabsProps['items']
  }
  const podsTerminals = (): TabsProps['items'] => {
    const nodes = [];
    for (let i = 0; i < pods.length; i++) {
      const pod = pods[i];
      if (pod.status?.phase === 'Running') {
        nodes.push({
          label: pod.metadata?.name,
          key: pod.metadata?.name,
          children: <PodContainerTerminal cluster={cluster} namespace={pod?.metadata?.namespace || ''} pod={pod?.metadata?.name || ''} containers={pod?.spec?.containers.map((item) => item.name) || []} />
        })
      }
    }
    return nodes as TabsProps['items']
  }
  const columns: ProColumns<IReplicaSet>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'name',
      search: false,
      render: (dom, entity) => {
        return <>{entity?.metadata?.name}</>
      },
    },

    {
      title: intl.formatMessage({ id: 'cluster.resource.status' }),
      search: false,
      render: (dom, entity: IReplicaSet) => {
        let tags = [] as React.ReactNode[];
        if (entity.spec?.replicas > 0) {
          setCurrentReplicaSet(entity);
          tags.push(<Tag style={{ border: 0 }} key='Available' color='green'><FormattedMessage id='cluster.deployment.versions.current' /></Tag>);
        } else {
          tags.push(<Tag style={{ border: 0 }} key='UnAvailable' color='yellow'><FormattedMessage id='cluster.deployment.versions.history' /></Tag>);

        }
        return (
          <Flex gap="4px 0" wrap>  {tags}  </Flex>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.workload.container.image' }),
      search: false,
      render: (dom, entity: IReplicaSet) => {
        const containers = entity.spec?.template?.spec?.containers;
        const initContainers = entity.spec?.template?.spec?.initContainers;
        const containersNumber = entity.spec?.template?.spec?.containers?.length || 0;
        const initContainersNumber = entity.spec?.template?.spec?.initContainers?.length || 0;
        return (<div>
          {initContainersNumber > 0 && <>
            <Divider style={{ margin: '0 0', fontSize: '12px' }}> <FormattedMessage id='cluster.workload.initContainers' /></Divider>
            {initContainers?.map((item: IContainer) => <><Tag style={{ border: 0 }} key={item.name}>{item.name}={item.image}</Tag><br /></>)}
          </>}
          {containersNumber > 0 && <>
            <Divider style={{ margin: '0 0', fontSize: '12px' }}><FormattedMessage id='cluster.workload.containers' /></Divider>
            {containers?.map((item: IContainer) => <><Tag style={{ border: 0 }} key={item.name}>{item.name}={item.image}</Tag><br /></>)}

          </>}
        </div>)

      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: IReplicaSet) => {
        return (
          <span>{dayjs(entity.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm:ss')}</span>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      render: (_, record) => {
        const nodes = [
          <a onClick={() => {
            setPatchDeployment(record);
            setReplicaSetResourceDrawerVisible(true);
          }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.view.yaml' /></a>
        ];
        if (record.status?.readyReplicas) {

        } else {
          nodes.unshift(<a onClick={() => {
            setPatchDeployment(record);
            setRollbackVisible(true);
          }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.deployment.versions.rollback.to.selected' /></a>)
        }
        return nodes;
      },
    },
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
  ];
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
  ];
  return (<>
    {info && <PageContainer header={{ breadcrumb: {}, onBack: () => window.history.back() }}
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
      <Tabs defaultActiveKey='base'
        onChange={(key) => {
          if (key === 'log' || key === 'terminal') {
            if (pods.length == 0) {
              getPods()
            }
          } else if (key === 'versions') {
            getReplicaSets();
          }
        }}
        key='information'
        items={(() => {
          const tabs = [];
          tabs.push({
            key: 'base', label: <FormattedMessage id='cluster.resource.base' />, children: <>
              <Card variant={'borderless'} key='base'  >
                <Row gutter={16}>
                  <Col lg={10} md={10} sm={24} >
                    <ProDescriptions column={1} key='base'  >
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.namespace' />} valueType="text"  >{info?.metadata?.namespace}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.creationTimestamp' />} valueType="text"  >{dayjs(info.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm:ss')}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.status' />} valueType="text"  >{status(info)}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.workload.replicas' />} valueType="text"  >{getReplicas(info)}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.workload.strategy' />} valueType="text"  >{DeploymentStrategy(info.spec?.strategy || {})}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.workload.terminationGracePeriodSeconds' />} valueType="text"  >{info.spec?.template.metadata?.deletionGracePeriodSeconds}</ProDescriptions.Item>
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
                      }} >{info.spec?.template.spec?.restartPolicy}</ProDescriptions.Item>
                      {Object.keys(info.spec?.template.spec?.securityContext || {}).length > 0 && <ProDescriptions.Item label={<FormattedMessage id='cluster.workload.securityContext' />} valueType="text"  ><RenderPodSecurityContext securityContext={info.spec?.template.spec?.securityContext} /></ProDescriptions.Item>}
                      {info.spec?.template.spec?.serviceAccount !== 'default' && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.serviceaccount' />} valueType="text"  >{info.spec?.template.spec?.serviceAccount}</ProDescriptions.Item>}

                    </ProDescriptions>
                  </Col>
                  <Col lg={14} md={14} sm={24} >
                    <Tabs
                      items={(() => {
                        const tabs = [];
                        tabs.push(
                          {
                            label: intl.formatMessage({ id: 'cluster.pod.selector' }),
                            key: 'podSelector',
                            children: <>
                              <ProDescriptions.Item valueType="code"  ><RenderLabels labels={info.spec?.selector.matchLabels || {}} type='ReactNode' /></ProDescriptions.Item>
                            </>
                          },
                          {
                            label: intl.formatMessage({ id: 'cluster.resource.labels' }),
                            key: 'labels',
                            children: <>
                              <ProDescriptions.Item valueType="code" ><RenderLabels labels={info.metadata?.labels || {}} type='ReactNode' /></ProDescriptions.Item>
                            </>
                          }
                        );
                        if (info.spec?.template.spec?.hostAliases && info.spec?.template.spec?.hostAliases.length > 0) {
                          tabs.push({
                            label: intl.formatMessage({ id: 'cluster.resource.pod.hostAliases' }),
                            key: 'hostAliases',
                            children: <>
                              <ProTable<IIoK8sApiCoreV1HostAlias>
                                key='host-aliases'
                                scroll={{ x: 'max-content' }}
                                className="no-search-form"
                                size="small"
                                dataSource={info.spec?.template.spec?.hostAliases || []}
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
                <Row gutter={16}>
                  <Col span={24} >
                    <Tabs
                      items={[
                        {
                          label: intl.formatMessage({ id: 'cluster.resource.conditions' }),
                          key: 'conditions',
                          children: <>
                            <ProTable<IIoK8sApiAppsV1DeploymentCondition>
                              key='deployment-condition'
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
            { key: 'pods', label: <FormattedMessage id='cluster.workload.pods' />, children: <RenderPods key='pods' cluster={cluster} namespace={namespace} labelSelectors={info?.spec?.template.metadata?.labels || {}} ownerReferenceName={info?.metadata?.name || ''} /> },
            {
              key: 'accessMethod', label: <FormattedMessage id='cluster.workload.accessMethod' />, children: <>
                <Card style={{ border: 0 }} key='accessMethod'>
                  <Tabs
                    defaultActiveKey='service'
                    items={
                      [
                        {
                          label: <FormattedMessage id='cluster.resource.service' />,
                          key: 'service',
                          children: <RelatedServices cluster={cluster} namespace={namespace} podLabels={info?.spec?.template.metadata?.labels || {}} />
                        },
                      ]
                    }
                  />
                </Card>
              </>
            },
            {
              key: 'log', label: <FormattedMessage id='cluster.resource.container.log' />, children: <Card>
                <Tabs
                  items={podsLogs()} />
              </Card>
            });
          if (info.status?.availableReplicas > 0 || info.status?.readyReplicas > 0) {
            tabs.push({
              key: 'terminal', label: <FormattedMessage id='cluster.resource.container.terminal' />, children: <Card>
                <Tabs
                  items={podsTerminals()} />
              </Card>
            });
          }
          tabs.push(
            {
              key: 'event', label: <FormattedMessage id='cluster.resource.event' />, children: <RelatedEvents cluster={cluster} namespace={namespace}
                fieldSelectors={{
                  'kind': 'Deployment',
                  'name': `${info?.metadata?.name}`,
                  'namespace': `${info?.metadata?.namespace}`,
                }} />
            },
            {
              key: 'monitor', label: <FormattedMessage id='cluster.view.monitor' />, children: <>
                <Card><RenderWorkloadMetrics cluster={cluster} namespace={info.metadata?.namespace || ''} workload={info.metadata?.name || ''} workloadType='deployment' /></Card>
              </>
            },
            {
              key: 'versions', label: <FormattedMessage id='cluster.deployment.versions' />, children: <>
                <Card>
                  <ProTable< IReplicaSet >
                    key='replica-set'
                    scroll={{ x: 'max-content' }}
                    rowKey={(record: IReplicaSet) => `${record?.metadata?.name}-${record.metadata?.resourceVersion}`}
                    search={false}
                    pagination={{
                      showQuickJumper: true,
                      showSizeChanger: true,
                      locale: {
                        items_per_page: intl.formatMessage({ id: 'pages.pagination.items_per_page' }),
                        jump_to: intl.formatMessage({ id: 'pages.pagination.jump_to' }),
                        page: intl.formatMessage({ id: 'pages.pagination.page' }),
                      },
                    }}
                    toolBarRender={false}
                    locale={{
                      emptyText: intl.formatMessage({ id: 'pages.not.found.data' })
                    }}
                    dataSource={dataSource}
                    columns={columns}
                  />
                </Card>
              </>

            });

          return tabs;
        })()}
      />
      {patchLabelVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='labels' title={<FormattedMessage id='cluster.patch.labels' />} key='label' kind="Deployment" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchLabelVisible} labels={info?.metadata?.labels || {}} />}
      {patchAnnotationsVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='annotations' title={<FormattedMessage id='cluster.patch.annotations' />} key='annotations' kind="Deployment" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchAnnotationsVisible} labels={info?.metadata?.annotations || {}} />}
      {patchVisible && <PatchReplicas setVisible={patchVisibleReflash} key='replicas' kind="Deployment" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchVisible} replicas={info?.spec?.replicas || 0} />}
      <Drawer destroyOnHidden={true}
        key={info?.metadata?.name}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={<>{getClusterResource('Deployment')}:&nbsp;&nbsp;{info?.metadata?.name}</>}
      >
        <ResourceEditor key={info?.metadata?.resourceVersion || 'edit'} edit={editorResource} address={`${BaseApi}/${name}`} kind='Deployment' name={info?.metadata?.name || ''} cluster={cluster} content={info} />
      </Drawer>
      <Drawer destroyOnHidden={true}
        key={patchDeployment?.metadata?.name}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceReplicaSetDrawerVisible}
        onClose={() => setReplicaSetResourceDrawerVisible(false)}
        closable={true}
        title={<>{getClusterResource('ReplicaSet')}:&nbsp;&nbsp;{patchDeployment?.metadata?.name}</>}
      >
        <ResourceEditor key={patchDeployment?.metadata?.resourceVersion || 'edit'} edit={false} address={`${BaseApi}/${name}`} kind='ReplicaSet' name={patchDeployment?.metadata?.name || ''} cluster={cluster} content={patchDeployment} />
      </Drawer>
      <ModalForm
        key={patchDeployment?.metadata?.resourceVersion}
        title={<><FormattedMessage id='cluster.deployment.versions.rollback' />:&nbsp;&nbsp;{patchDeployment?.metadata?.ownerReferences ? patchDeployment?.metadata?.ownerReferences[0].name : null}</>}
        width="90vw"
        open={rollbackVisible}
        destroyOnHidden={true}
        onOpenChange={setRollbackVisible}
        onOk={() => {
          setRollbackVisible(false);
        }}
        onFinish={async () => {
          if (info?.metadata?.name && patchDeployment) {
            delete patchDeployment.spec?.template?.metadata?.labels['pod-template-hash']
            let patchs = [] as PatchSubsetValue[];
            patchs.push({
              op: 'replace',
              path: `/spec/template`,
              value: patchDeployment.spec?.template || info.spec?.template,
            })
            await clusterPatchProxy({ cluster, address: `apis/${resourceGroup.groupVersion}namespaces/${namespace}/deployments/${info?.metadata?.name}` }, patchs)

          }
          setRollbackVisible(false);
        }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      >
        <ResourceDiffEditor key={patchDeployment?.metadata?.resourceVersion + 'diff'} edit={false} address={`${BaseApi}/${name}`} kind='Deployment' name={patchDeployment?.metadata?.name || ''} cluster={cluster} original={currentReplicaSet?.spec?.template} modified={patchDeployment?.spec?.template} />

      </ModalForm>
      {imageVisible && <>
        <PatchImages
          title={intl.formatMessage({ id: 'cluster.resource.images.change' })}
          key={info?.metadata?.namespace + '-' + info?.metadata?.name}
          setVisible={setImageVisible}
          address={`apis/${resourceGroup.groupVersion}/namespaces/${info?.metadata?.namespace}/deployments/${info?.metadata?.name}`}

          cluster={cluster}
          namespace={info?.metadata?.namespace || ''}
          name={info?.metadata?.name || ''}
          kind="DaemonSet"
          visible={imageVisible}
          containers={info?.spec?.template.spec?.containers || []}
          initContainers={info?.spec?.template.spec?.initContainers || []}
        />
      </>}
      {info.apiVersion &&
        <AICopilot
          view='detail'
          cluster={cluster}
          namespace={namespace || ''}
          name={info.metadata?.name || ''}
          kind="Deployment"
          apiVersion={resourceGroup.groupVersion}
          status={getWorkloadStatus(info, 'Deployment')}
          externalMessage={externalAiMessage}
          externalSkills={['k8s-troubleshoot', 'k8s-log-diagnose-from-user-content']}
        />}
    </PageContainer>}

  </>

  )
};
export default DetailView;