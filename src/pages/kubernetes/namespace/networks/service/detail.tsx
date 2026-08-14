import { getColorPrimary, getCurrentViewInfo, normalizeKubernetesPath } from '@/utils/global';
import { PageContainer, ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import { useParams, useIntl, FormattedMessage } from "@umijs/max";
import { useEffect, useState } from "react";
import { Button, Card, Popconfirm, message, Dropdown, Drawer, Tag, Space, Row, Col } from "antd";
import { clusterGetProxy, clusterDeleteProxy } from '@/services/cluster_proxy.api';
import { IIoK8sApiCoreV1ServicePort, Service } from "kubernetes-models/v1";
import { MoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { getClusterResource } from "@/utils/cluster";
import { IntlShape } from "react-intl";
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { RenderPods } from "@/pages/kubernetes/components/pod";


const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const { name } = useParams();
  const [info, setInfo] = useState<Service>();
  const intl = useIntl();
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const BaseApi = `api/v1/namespaces/${namespace}/services`;
  const BaseAddress = `/kubernetes/cluster/${cluster}/namespace/${namespace}/networks/services`
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as Service;
    setInfo(res);
  }

  useEffect(() => {
    getInfo();
  }, [name]);

  const handleRemove = async (intl: IntlShape, deploy: Service) => {
    const params = { cluster, address: BaseApi };
    await clusterDeleteProxy(params);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    window.location.pathname = normalizeKubernetesPath(BaseAddress);
    return true;
  };
  const moreItems = () => {
    let nodes = [];
    nodes.push({
      key: 'edit',
      label: <a style={{ color: colorPrimary }} onClick={() => {
        window.location.href = normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${info?.metadata?.namespace}/networks/services/${info?.metadata?.name}/update`)
      }}><FormattedMessage id='cluster.resource.operation.edit' /></a>
    })
    nodes.push({
      key: 'view-yaml',
      label: <a onClick={() => {
        setEditorResource(false);
        setResourceDrawerVisible(true);
      }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.view.yaml' /></a>,
    });
    if (info && info.metadata && info.metadata.name !== 'kube-root-ca.crt') {
      nodes.push({
        key: 'edit-yaml',
        label: <a onClick={() => {
          setEditorResource(true);
          setResourceDrawerVisible(true);
        }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.edit.yaml' /></a>,
      });
      if (info) {
        nodes.push({
          key: 'delete',
          label: <Popconfirm
            key={info.metadata?.resourceVersion + '-delete'}
            description={intl.formatMessage({ id: 'cluster.resource.Service.delete.description' })}
            title={intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              getClusterResource('Service') + '【' + info.metadata?.name + '】'}
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
    }
    return nodes;
  }
  const columns: ProColumns<IIoK8sApiCoreV1ServicePort>[] = [
    {
      title: <FormattedMessage id="cluster.resource.service.ports.name" />,
      dataIndex: 'name',
    },
    {
      title: <FormattedMessage id="cluster.resource.service.ports.protocol" />,
      dataIndex: 'protocol',
    },
    {
      title: <FormattedMessage id="cluster.resource.service.ports.targetPort" />,
      dataIndex: 'targetPort',
    },
    {
      title: <FormattedMessage id="cluster.resource.service.ports.port" />,
      dataIndex: 'port',
    },

    {
      title: <FormattedMessage id="cluster.resource.service.ports.nodePort" />,
      dataIndex: 'nodePort',
    },
  ]
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
        <Button onClick={() => getInfo()}>
          <ReloadOutlined />
        </Button>,
      ]}
    >
      <Card variant={'borderless'}    >
        <ProDescriptions style={{ marginBottom: 16 }} column={3} title={intl.formatMessage({ id: 'cluster.resource.base' })} >
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.name' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >{info?.metadata?.name}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.service.type' />} fieldProps={{ style: { color: colorPrimary } }}
            valueEnum={{
              "ClusterIP": intl.formatMessage({ id: 'cluster.resource.service.type.ClusterIP' }),
              "ExternalName": intl.formatMessage({ id: 'cluster.resource.service.type.ExternalName' }),
              "LoadBalancer": intl.formatMessage({ id: 'cluster.resource.service.type.LoadBalancer' }),
              "NodePort": intl.formatMessage({ id: 'cluster.resource.service.type.NodePort' }),
            }}
          >{info?.spec?.type}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.service.sessionAffinity' />} fieldProps={{ style: { color: colorPrimary } }}
            valueEnum={{
              "None": intl.formatMessage({ id: 'cluster.resource.service.sessionAffinity.None' }),
              "ClientIP": intl.formatMessage({ id: 'cluster.resource.service.sessionAffinity.ClientIP' }),
            }}
          >{info?.spec?.sessionAffinity}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.service.type.ClusterIP' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >{info?.spec?.clusterIP}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.service.ipFamilies' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} ><Space>{info?.spec?.ipFamilies?.map((item) => <Tag key={item}>{item}</Tag>)}</Space></ProDescriptions.Item>
          {info?.spec?.type === 'ClusterIP' && <>
          </>}
          {info?.spec?.type === 'LoadBalancer' && <>
            <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.service.type.LoadBalancer.loadBalancerIP' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >{info?.spec?.loadBalancerIP}</ProDescriptions.Item>
            {info?.spec?.loadBalancerClass && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.service.loadBalancerClasss' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >{info?.spec?.loadBalancerClass}</ProDescriptions.Item>}

          </>}
          {info?.spec?.type === 'ExternalName' && <>
            <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.service.type.ExternalName' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >{info?.spec?.externalName}</ProDescriptions.Item>
            <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.service.type.ExternalName' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} ><Space>{info?.spec?.externalIPs?.map((item) => <Tag key={item}>{item}</Tag>)}</Space></ProDescriptions.Item>

          </>}
        </ProDescriptions>
        <ProDescriptions title={intl.formatMessage({ id: 'cluster.resource.service.ports' })}>
        </ProDescriptions>
        <Row>
          <Col span={24}>
            <ProTable<IIoK8sApiCoreV1ServicePort>
              key='service-ports'
              scroll={{ x: 'max-content' }}
              rowKey="targetPort"
              search={false}
              dataSource={info.spec?.ports || []}
              columns={columns}
              rowSelection={false}
              pagination={false}
              locale={{
                emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
              }}
              toolBarRender={false}
            />
          </Col>
        </Row>

      </Card>
      <Card style={{ marginTop: 16 }}><Card.Meta title={intl.formatMessage({ id: 'cluster.workload.pods' })} />
        {info.metadata?.name && <RenderPods key='pods' cluster={cluster} namespace={namespace} labelSelectors={info?.spec?.selector || {}} ownerReferenceName='' />}
      </Card>
    </PageContainer>}
    <Drawer destroyOnHidden={true}
      size={drawerSize}
      resizable={{
        onResize: (newSize) => setDrawerSize(newSize),
      }}
      open={resourceDrawerVisible}
      onClose={() => setResourceDrawerVisible(false)}
      closable={true}
      title={<>{getClusterResource('Service')}:&nbsp;&nbsp;{info?.metadata?.name}</>}
    >
      <ResourceEditor key={info?.metadata?.resourceVersion || 'edit'} edit={editorResource} address={`${BaseApi}/${name}`} kind='Service' name={info?.metadata?.name || ''} cluster={cluster} content={info} />
    </Drawer>
  </>
  )
};
export default DetailView;