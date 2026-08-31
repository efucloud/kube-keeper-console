import { appendKubernetesViewQuery, getClusterApiVersions, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { PageContainer, ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import { useParams, useIntl, FormattedMessage } from "@umijs/max";
import { useEffect, useState } from "react";
import { Button, Card, Popconfirm, message, Dropdown, Space, Drawer, Row, Col, Tag, Tabs, TabsProps } from "antd";
import { clusterGetProxy, clusterDeleteProxy } from '@/services/cluster_proxy.api';
import { DaemonSet, IIoK8sApiAppsV1DaemonSetCondition } from "kubernetes-models/apps/v1";
import { MoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { getClusterResource, getWorkloadStatus } from "@/utils/cluster";
import { IntlShape } from "react-intl";
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { RenderLabels, RenderVolumes, DaemonSetStrategy, RenderPodSecurityContext } from '@/pages/kubernetes/components/render';
import { RenderPods } from '@/pages/kubernetes/components/pod';
import dayjs from "dayjs";
import { RenderContainers } from "@/pages/kubernetes/components/container";
import { RelatedEvents } from "@/pages/kubernetes/components/event";
import { RenderWorkloadMetrics } from "@/pages/kubernetes/components/workload_metrics";
import { IIoK8sApiCoreV1HostAlias } from "kubernetes-models/v1";
import PatchImages from "@/pages/kubernetes/components/patch_image";
import AICopilot from "@/pages/kubernetes/components/ai";
import * as yaml from 'js-yaml';
import { cleanK8sResourceForAI } from "@/utils/copilot";

const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const { name } = useParams();
  const [info, setInfo] = useState<DaemonSet>();
  const intl = useIntl();
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchAnnotationsVisible, setPatchAnnotationsVisible] = useState<boolean>(false);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<string>('containers');
  const resourceGroup = getClusterApiVersions(cluster, ['apps/v1', 'apps/v1beta1', 'apps/v1beta2'], 'DaemonSet');
  const BaseApi = `apis/${resourceGroup.groupVersion}/namespaces/${namespace}/daemonsets`;
  const BaseAddress = `/kubernetes/namespace/workload/daemonsets`;
  const [imageVisible, setImageVisible] = useState<boolean>(false);
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as DaemonSet;
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
  const handleRemove = async (intl: IntlShape, deploy: DaemonSet) => {
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
          description={intl.formatMessage({ id: 'cluster.resource.daemonset.delete.description' })}
          title={intl.formatMessage({ id: 'pages.operation.delete.description' }) +
            getClusterResource('DaemonSet') + '【' + info.metadata?.name + '】'}
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
  const status = (info: DaemonSet) => {
    const health = info?.status?.numberReady || 0;
    if (health > 0) {
      if (health === info.status?.desiredNumberScheduled) {
        return (<Tag style={{ border: 0 }} color='green'><FormattedMessage id='cluster.resource.AllAvailable' /></Tag>);
      } else {
        return (<Tag style={{ border: 0 }} color='orange'><FormattedMessage id='cluster.resource.SomeAvailable' /></Tag>);
      }
    } else {
      return (<Tag style={{ border: 0 }} color='red'><FormattedMessage id='cluster.resource.UnAvailable' /></Tag>);
    }
  };
  const getReplicas = (info: DaemonSet) => {
    const health = info?.status?.numberReady || 0;
    if (health > 0) {
      if (health === info.status?.desiredNumberScheduled) {
        return (<><a style={{ color: '#52c41a' }}>{health}&nbsp;</a>{'/ ' + info.status?.desiredNumberScheduled}</>);
      } else {
        return (<><a style={{ color: '#FA8C16' }}>{health}&nbsp;</a>{'/ ' + info.status?.desiredNumberScheduled}</>);
      }
    } else {
      return (<><a style={{ color: 'red' }}>0&nbsp;</a>{'/ ' + info.status?.desiredNumberScheduled}</>);
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
          inits={info?.spec?.template.spec?.initContainers || []}
          containers={info?.spec?.template.spec?.containers || []}
          ephemerals={info?.spec?.template.spec?.ephemeralContainers || []}
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
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.workload.strategy' />} valueType="text"  >{DaemonSetStrategy(info.spec?.strategy || {})}</ProDescriptions.Item>
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
                            <ProTable<IIoK8sApiAppsV1DaemonSetCondition>
                              key='daemonset-condition'
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
          { key: 'pods', label: <FormattedMessage id='cluster.workload.pods' />, children: <RenderPods cluster={cluster} namespace={namespace} labelSelectors={info?.spec?.template.metadata?.labels || {}} ownerReferenceName={info?.metadata?.name || ''} /> },
          {
            key: 'event', label: <FormattedMessage id='cluster.resource.event' />, children: <RelatedEvents cluster={cluster} namespace={namespace}
              fieldSelectors={{
                'kind': 'DaemonSet',
                'name': `${info?.metadata?.name}`,
                'namespace': `${info?.metadata?.namespace}`,
              }} />
          },
          {
            key: 'monitor', label: <FormattedMessage id='cluster.view.monitor' />, children: <>
              <Card><RenderWorkloadMetrics cluster={cluster} namespace={info.metadata?.namespace || ''} workload={info.metadata?.name || ''} workloadType='daemonset' /></Card>
            </>
          },
        ]} />
      {patchLabelVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='labels' title={<FormattedMessage id='cluster.patch.labels' />} key='label' kind="DaemonSet" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchLabelVisible} labels={info?.metadata?.labels || {}} />}
      {patchAnnotationsVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='annotations' title={<FormattedMessage id='cluster.patch.annotations' />} key='annotations' kind="DaemonSet" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchAnnotationsVisible} labels={info?.metadata?.annotations || {}} />}
      <Drawer destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={<>{getClusterResource('DaemonSet')}:&nbsp;&nbsp;{info?.metadata?.name}</>}
      >
        <ResourceEditor key={info?.metadata?.resourceVersion || 'edit'} edit={editorResource} address={`${BaseApi}/${name}`} kind='DaemonSet' name={info?.metadata?.name || ''} cluster={cluster} content={info} />
      </Drawer>
      {imageVisible && <>
        <PatchImages
          title={intl.formatMessage({ id: 'cluster.resource.images.change' })}
          key={info?.metadata?.namespace + '-' + info?.metadata?.name}
          setVisible={setImageVisible}
          address={`apis/${resourceGroup.groupVersion}/namespaces/${info?.metadata?.namespace}/daemonsets/${info?.metadata?.name}`}

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
          kind="DaemonSet"
          apiVersion={resourceGroup.groupVersion}
          resourceContent={yaml.dump(cleanK8sResourceForAI(info))}
          status={getWorkloadStatus(info, 'DaemonSet')}
          externalSkills={['k8s-troubleshoot', 'k8s-log-diagnose-from-user-content']}
        />}
    </PageContainer>}

  </>
  )
};
export default DetailView;