import { appendKubernetesViewQuery, getClusterApiVersions, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { PageContainer, ProDescriptions } from "@ant-design/pro-components";
import { useParams, useIntl, FormattedMessage } from "@umijs/max";
import { useEffect, useState } from "react";
import { Button, Card, Popconfirm, message, Dropdown, Drawer, Row, Col, Tabs, TabsProps } from "antd";
import { clusterGetProxy, clusterDeleteProxy } from '@/services/cluster_proxy.api';
import { CronJob } from 'kubernetes-models/batch/v1';
import { MoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { getClusterResource, getWorkloadStatus } from "@/utils/cluster";
import { IntlShape } from "react-intl";
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { RenderLabels, RenderVolumes } from '@/pages/kubernetes/components/render';
import dayjs from "dayjs";
import { RenderContainers } from "@/pages/kubernetes/components/container";
import { RenderCronJobInstances } from "@/pages/kubernetes/components/cronjob";
import { RelatedEvents } from "@/pages/kubernetes/components/event";
import PatchImages from "@/pages/kubernetes/components/patch_image";
import AICopilot from "@/pages/kubernetes/components/ai";
import * as yaml from 'js-yaml';
import { cleanK8sResourceForAI } from "@/utils/copilot";

const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const { name } = useParams();
  const [info, setInfo] = useState<CronJob>();
  const intl = useIntl();
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchAnnotationsVisible, setPatchAnnotationsVisible] = useState<boolean>(false);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<string>('containers');
  const resourceGroup = getClusterApiVersions(cluster, ['batch/v1', 'batch/v1beta1'], 'CronJob');
  const BaseApi = `apis/${resourceGroup.groupVersion}/namespaces/${namespace}/cronjobs`
  const BaseAddress = `/kubernetes/namespace/workload/cronjobs`;
  const [imageVisible, setImageVisible] = useState<boolean>(false);
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as CronJob;
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
  const handleRemove = async (intl: IntlShape, deploy: CronJob) => {
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
          description={intl.formatMessage({ id: 'cluster.resource.cronjob.delete.description' })}
          title={intl.formatMessage({ id: 'pages.operation.delete.description' }) +
            getClusterResource('CronJob') + '【' + info.metadata?.name + '】'}
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
          inits={info?.spec?.jobTemplate.spec?.template.spec?.initContainers || []}
          containers={info?.spec?.jobTemplate.spec?.template.spec?.containers || []}
          ephemerals={info?.spec?.jobTemplate.spec?.template.spec?.ephemeralContainers || []}
        />
    },
    { key: 'storage', label: <FormattedMessage id='cluster.resource.volume' />, children: <RenderVolumes volumes={info?.spec?.jobTemplate.spec?.template.spec?.volumes || []} /> },

  ];
  return (<>
    {info && <PageContainer header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title={info?.metadata?.name}

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
                    </ProDescriptions>
                  </Col>
                  <Col lg={14} md={14} sm={24} >
                    <ProDescriptions column={1}  >
                      <ProDescriptions.Item label={<FormattedMessage id='cluster.workload.cronjob.schedule' />} valueType="code"  >{info?.spec?.schedule}</ProDescriptions.Item>
                      {info.metadata?.labels && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.labels' />} valueType="code"  ><RenderLabels labels={info.metadata?.labels || {}} type='text' /></ProDescriptions.Item>}
                    </ProDescriptions>
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
          { key: 'pods', label: <FormattedMessage id='cluster.workload.pods' />, children: <RenderCronJobInstances instances={info?.status?.active || []} /> },
          {
            key: 'event', label: <FormattedMessage id='cluster.resource.event' />, children: <RelatedEvents cluster={cluster} namespace={namespace}
              fieldSelectors={{
                'kind': 'CronJob',
                'name': `${info?.metadata?.name}`,
                'namespace': `${info?.metadata?.namespace}`,
              }} />
          },
          {
            key: 'monitor', label: <FormattedMessage id='cluster.view.monitor' />, children: <></>
          },
        ]} />
      {patchLabelVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='labels' title={<FormattedMessage id='cluster.patch.labels' />} key='label' kind="CronJob" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchLabelVisible} labels={info?.metadata?.labels || {}} />}
      {patchAnnotationsVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='annotations' title={<FormattedMessage id='cluster.patch.annotations' />} key='annotations' kind="CronJob" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchAnnotationsVisible} labels={info?.metadata?.annotations || {}} />}
      <Drawer destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={<>{getClusterResource('CronJob')}:&nbsp;&nbsp;{info?.metadata?.name}</>}
      >
        <ResourceEditor key={info?.metadata?.resourceVersion || 'edit'} edit={editorResource} address={`${BaseApi}/${name}`} kind='CronJob' name={info?.metadata?.name || ''} cluster={cluster} content={info} />
      </Drawer>
      {imageVisible && <>
        <PatchImages
          title={intl.formatMessage({ id: 'cluster.resource.images.change' })}
          key={info?.metadata?.namespace + '-' + info?.metadata?.name}
          setVisible={setImageVisible}
          address={`apis/${resourceGroup?.groupVersion}/namespaces/${info?.metadata?.namespace}/cronjobs/${info?.metadata?.name}`}

          cluster={cluster}
          namespace={info?.metadata?.namespace || ''}
          name={info?.metadata?.name || ''}
          kind="CronJob"
          visible={imageVisible}
          containers={info?.spec?.jobTemplate.spec?.template.spec?.containers || []}
          initContainers={info?.spec?.jobTemplate.spec?.template.spec?.initContainers || []}
        />
      </>}
      {info.apiVersion &&
        <AICopilot
          view='detail'
          cluster={cluster}
          namespace={namespace || ''}
          kind="CronJob"
          name={info.metadata?.name || ''}
          apiVersion={resourceGroup.groupVersion}
          resourceContent={yaml.dump(cleanK8sResourceForAI(info))}
          status={getWorkloadStatus(info, 'CronJob')}
          externalSkills={['k8s-troubleshoot', 'k8s-log-diagnose-from-user-content']}
        />}
    </PageContainer>}

  </>
  )
};
export default DetailView;