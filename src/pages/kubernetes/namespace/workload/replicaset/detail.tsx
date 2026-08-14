import { getColorPrimary, getCurrentViewInfo, normalizeKubernetesPath } from '@/utils/global';
import { PageContainer, ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import { useParams, useIntl, FormattedMessage } from "@umijs/max";
import { useEffect, useState } from "react";
import { Button, Card, Popconfirm, message, Dropdown, Space, Drawer, Row, Col, Tag, Flex, Tabs, TabsProps } from "antd";
import { clusterGetProxy, clusterDeleteProxy } from '@/services/cluster_proxy.api';
import { IIoK8sApiAppsV1ReplicaSetCondition, ReplicaSet } from "kubernetes-models/apps/v1";
import { EditOutlined, MoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { getClusterResource, getWorkloadStatus } from "@/utils/cluster";
import { IntlShape } from "react-intl";
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import PatchReplicas from '@/pages/kubernetes/components/patch_replicas';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { RenderLabels, RenderVolumes, RenderPodSecurityContext } from '@/pages/kubernetes/components/render';
import { RenderPods } from '@/pages/kubernetes/components/pod';
import dayjs from "dayjs";
import { RelatedServices } from "@/pages/kubernetes/components/service";
import { RenderContainers } from "@/pages/kubernetes/components/container";
import { RelatedEvents } from "@/pages/kubernetes/components/event";
import { IIoK8sApiCoreV1HostAlias } from "kubernetes-models/v1";
import AICopilot from "@/pages/kubernetes/components/ai";
import * as yaml from 'js-yaml';
import { cleanK8sResourceForAI } from "@/utils/copilot";

const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const { name } = useParams();
  const [info, setInfo] = useState<ReplicaSet>();
  const intl = useIntl();
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchAnnotationsVisible, setPatchAnnotationsVisible] = useState<boolean>(false);
  const [patchReplicasVisible, setPatchReplicasVisible] = useState<boolean>(false);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<string>('containers');
  const BaseApi = `apis/apps/v1/namespaces/${namespace}/replicasets`;
  const BaseAddress = `/kubernetes/cluster/${cluster}/namespace/${namespace}/workload/replicasets`
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as ReplicaSet;
    setInfo(res);
  }
  const patchVisibleReflash = (visible: boolean) => {
    setPatchAnnotationsVisible(false);
    setPatchReplicasVisible(false);
    setPatchLabelVisible(false);
    setResourceDrawerVisible(false);
    setEditorResource(false);
    getInfo();
  };
  useEffect(() => {
    getInfo();
  }, [name]);
  const handleRemove = async (intl: IntlShape, deploy: ReplicaSet) => {
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
        key: 'edit',
        label: <a onClick={() => { window.location.href = normalizeKubernetesPath(`${BaseAddress}/${info.metadata?.name}/update`) }} style={{ color: colorPrimary }}><FormattedMessage id='model.update' /></a>,
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
          setPatchReplicasVisible(true);
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
          description={intl.formatMessage({ id: 'cluster.resource.replicaset.delete.description' })}
          title={intl.formatMessage({ id: 'pages.operation.delete.description' }) +
            getClusterResource('ReplicaSet') + '【' + info.metadata?.name + '】'}
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
  const status = (info: ReplicaSet) => {
    const readyReplicas = info?.status?.readyReplicas || 0;
    let tags = [] as React.ReactNode[];
    if (readyReplicas > 0) {
      tags.push(<Tag style={{ border: 0 }} key='Available' color='green'><FormattedMessage id='cluster.resource.Available' /></Tag>);
    } else if (readyReplicas === 0) {
      tags.push(<Tag style={{ border: 0 }} key='UnAvailable' color='red'><FormattedMessage id='cluster.resource.UnAvailable' /></Tag>);

    } else if (readyReplicas < info?.spec?.replicas || 0) {
      tags.push(<Tag style={{ border: 0 }} key='notReadyReplicas' color='orange'><FormattedMessage id='cluster.resource.SomeAvailable' /></Tag>);
    }
    return (
      <Flex gap="4px 0" wrap>  {tags}  </Flex>
    );
  };
  const getReplicas = (info: ReplicaSet) => {
    const health = info?.status?.availableReplicas || (info?.status?.replicas - info?.status?.unavailableReplicas) || 0;
    const edit = !info.metadata?.ownerReferences;
    if (health > 0) {
      return (<><a style={{ color: '#52c41a' }}>{health}&nbsp;</a>{'/ ' + info.spec?.replicas} &nbsp;&nbsp;&nbsp;&nbsp;{edit && <a onClick={() => { setPatchReplicasVisible(true) }}><EditOutlined /></a>}</>);
    } else {
      return (<><a style={{ color: 'red' }}>0&nbsp;</a>{'/ ' + info.spec?.replicas}&nbsp;&nbsp;&nbsp;&nbsp;{edit && <a onClick={() => { setPatchReplicasVisible(true) }}><EditOutlined /></a>}</>);
    }
  };
  const onChange = (key: string) => {
    setActiveKey(key);
  };

  const items: TabsProps['items'] = [
    {
      key: 'containers', label: <FormattedMessage id='cluster.resource.pod' />, children:
        <RenderContainers

          cluster={cluster}
          namespace={namespace}
          inits={info?.spec?.template?.spec?.initContainers || []}
          containers={info?.spec?.template?.spec?.containers || []}
          ephemerals={info?.spec?.template?.spec?.ephemeralContainers || []}
        />
    },

    { key: 'storage', label: <FormattedMessage id='cluster.resource.volume' />, children: <RenderVolumes volumes={info?.spec?.template.spec?.volumes || []} /> },

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
  ]
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
        items={[
          {
            key: 'base', label: <FormattedMessage id='cluster.resource.base' />, children: <>
              <Card variant={'borderless'}   >
                <Row gutter={16}>
                  <Col lg={10} md={10} sm={24} >
                    <ProDescriptions column={1}  >
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.name' />} valueType="text"  >{info?.metadata?.name}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.namespace' />} valueType="text"  >{info?.metadata?.namespace}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.creationTimestamp' />} valueType="text"  >{dayjs(info.metadata?.creationTimestamp).format('YYYY-MM-DD HH:mm:ss')}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.status' />} valueType="text"  >{status(info)}</ProDescriptions.Item>
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.workload.replicas' />} valueType="text"  >{getReplicas(info)}</ProDescriptions.Item>
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
                      {Object.keys(info.spec?.template.spec?.securityContext).length > 0 && <ProDescriptions.Item label={<FormattedMessage id='cluster.workload.securityContext' />} valueType="text"  ><RenderPodSecurityContext securityContext={info.spec?.template.spec?.securityContext} /></ProDescriptions.Item>}
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.serviceaccount' />} valueType="text"  >{info.spec?.template.spec?.serviceAccount}</ProDescriptions.Item>

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
                                key='host-alias'
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
                            <ProTable<IIoK8sApiAppsV1ReplicaSetCondition>
                              key='condition'
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
            key: 'pods',
            label: <FormattedMessage id='cluster.workload.pods' />,
            children: <RenderPods cluster={cluster} namespace={namespace} labelSelectors={info?.spec?.template.metadata?.labels || {}} ownerReferenceName={info?.metadata?.name || ''} />
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
                        children: <RelatedServices cluster={cluster} namespace={namespace} podLabels={info?.spec?.template.metadata?.labels || {}} />
                      },
                    ]
                  }
                />
              </Card>
            </>
          },
          {
            key: 'event', label: <FormattedMessage id='cluster.resource.event' />, children: <RelatedEvents cluster={cluster} namespace={namespace}
              fieldSelectors={{
                'kind': 'ReplicaSet',
                'name': `${info?.metadata?.name}`,
                'namespace': `${info?.metadata?.namespace}`,
              }} />
          },

        ]} />
      {info.apiVersion &&
        <AICopilot
          view='detail'
          cluster={cluster}
          namespace={namespace || ''}
          name={info.metadata?.name || ''}
          kind="ReplicaSet"
          resourceContent={yaml.dump(cleanK8sResourceForAI(info))}
          status={getWorkloadStatus(info, 'ReplicaSet')}
          externalSkills={['k8s-troubleshoot', 'k8s-log-diagnose-from-user-content']}
        />}
      {patchLabelVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='labels' title={<FormattedMessage id='cluster.patch.labels' />} key='label' kind="ReplicaSet" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchLabelVisible} labels={info?.metadata?.labels || {}} />}
      {patchAnnotationsVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='annotations' title={<FormattedMessage id='cluster.patch.annotations' />} key='annotations' kind="ReplicaSet" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchAnnotationsVisible} labels={info?.metadata?.annotations || {}} />}
      {patchReplicasVisible && <PatchReplicas setVisible={patchVisibleReflash} key='replicas' kind="ReplicaSet" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchReplicasVisible} replicas={info?.spec?.replicas || 0} />}
      <Drawer destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={<>{getClusterResource('ReplicaSet')}:&nbsp;&nbsp;{info?.metadata?.name}</>}
      >
        <ResourceEditor key={info?.metadata?.resourceVersion || 'edit'} edit={editorResource} address={`${BaseApi}/${name}`} kind='ReplicaSet' name={info?.metadata?.name || ''} cluster={cluster} content={info} />
      </Drawer>
    </PageContainer>}

  </>
  )
};
export default DetailView;