import { getClusterApiVersions, getColorPrimary, getCurrentViewInfo, getHeight, normalizeKubernetesPath } from '@/utils/global';
import { PageContainer, ProColumns, ProDescriptions, ProTable } from "@ant-design/pro-components";
import { useParams, useIntl, FormattedMessage } from "@umijs/max";
import { ReactNode, useEffect, useState } from "react";
import { Button, Card, Popconfirm, message, Dropdown, Drawer, Collapse, CollapseProps, Flex, Tag, Space, Row, Col, Tooltip } from "antd";
import { clusterGetProxy, clusterDeleteProxy } from '@/services/cluster_proxy.api';
import type { IIoK8sApiNetworkingV1HTTPIngressPath, IIoK8sApiNetworkingV1IngressRule, IIoK8sApiNetworkingV1IngressTLS, Ingress } from 'kubernetes-models/networking.k8s.io/v1';
import { EyeOutlined, MoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { getClusterResource } from "@/utils/cluster";
import { IntlShape } from "react-intl";
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { Typography } from 'antd';
const { Text, Link, Title, Paragraph } = Typography;
import { RenderPods } from "@/pages/kubernetes/components/pod";
import { IService } from "kubernetes-models/v1";


const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const { name } = useParams();
  const [info, setInfo] = useState<Ingress>();
  const intl = useIntl();
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const resourceGroup = getClusterApiVersions(cluster, ['networking.k8s.io/v1', 'extensions/v1', 'extensions/v1beta1'], 'Ingress');
  const BaseApi = `apis/${resourceGroup.groupVersion}/namespaces/${namespace}/ingresses`;
  const BaseAddress = `/kubernetes/cluster/${cluster}/namespace/${namespace}/networks/ingresses`;
  const [podVisible, setPodVisible] = useState<boolean>(false);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [selectedServiceName, setSelectedServiceName] = useState<string | undefined>(undefined);
  const getService = async (name: string) => {
    const service = await clusterGetProxy({ cluster, address: `api/v1/namespaces/${namespace}/services/${name}` }) as IService;
    setLabels(service.spec?.selector || {});
  }
  useEffect(() => {
    if (selectedServiceName) {
      getService(selectedServiceName);
    }
  }, [selectedServiceName]);
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as Ingress;
    setInfo(res);
  }

  useEffect(() => {
    getInfo();
  }, [name]);

  const handleRemove = async (intl: IntlShape, deploy: Ingress) => {
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
        window.location.href = normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${info?.metadata?.namespace}/networks/ingresses/${info?.metadata?.name}/update`)
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
            description={intl.formatMessage({ id: 'cluster.resource.Ingress.delete.description' })}
            title={intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              getClusterResource('Ingress') + '【' + info.metadata?.name + '】'}
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
        <ProDescriptions column={3} title={intl.formatMessage({ id: 'cluster.resource.base' })} >
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.name' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >{info?.metadata?.name}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.ingress.spec.ingressClassName' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >{info?.spec?.ingressClassName}</ProDescriptions.Item>
        </ProDescriptions>
        {info && info.spec?.tls && info.spec?.tls?.length > 0 &&
          <ProDescriptions style={{ marginTop: 16 }} column={3} title={intl.formatMessage({ id: 'cluster.resource.ingress.spec.tls' })}>
            {info.spec.tls.map((tlsItem: IIoK8sApiNetworkingV1IngressTLS) => {
              return (<>
                <ProDescriptions.Item key={`${tlsItem.secretName}-secret`} label={<FormattedMessage id='cluster.resource.ingress.spec.tls.secretName' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >{tlsItem.secretName}</ProDescriptions.Item>
                <ProDescriptions.Item key={`${tlsItem.secretName}-host`} label={<FormattedMessage id='cluster.resource.ingress.spec.tls.hosts' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} ><Space>{tlsItem?.hosts?.map((host: string) => <Tag key={host}>{host}</Tag>)}</Space></ProDescriptions.Item>
              </>)
            })}
          </ProDescriptions>}
        {info && info.spec?.rules && info.spec?.rules?.length > 0 &&
          <ProDescriptions style={{ marginTop: 16 }} column={3} title={intl.formatMessage({ id: 'cluster.resource.ingress.rules' })}>
            {info.spec.rules.map((ruleItem: IIoK8sApiNetworkingV1IngressRule) => {
              const host = ruleItem.host;
              const httpPrefix = info.spec?.tls ? 'https://' : "http://"
              const paths = ruleItem.http?.paths;
              return paths?.map((path: IIoK8sApiNetworkingV1HTTPIngressPath) => {
                const subPath = path.path;
                return (<>
                  <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.ingress.spec.rules.host' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} ><a href={`${httpPrefix}${host}${subPath}`} target='_blank'>{`${httpPrefix}${host}${subPath}`}</a></ProDescriptions.Item>
                  <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.ingress.spec.rules.pathType' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }}
                    valueEnum={{
                      'Exact': intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.pathType.Exact' }),
                      'Prefix': intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.pathType.Prefix' }),
                      'ImplementationSpecific': intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.pathType.ImplementationSpecific' }),
                    }}>{path.pathType}</ProDescriptions.Item>
                  {path.backend.service && <>
                    <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.ingress.spec.rules.backend.service' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >
                      <Space>
                        <span>{path.backend.service?.name}:{path.backend.service?.port?.name || path.backend.service?.port?.number}</span>
                        <Tooltip color={colorPrimary} title={intl.formatMessage({ id: 'cluster.resource.backend.service' })}>
                          <EyeOutlined style={{ color: colorPrimary }} onClick={() => {
                            setSelectedServiceName(path.backend.service?.name);
                            setPodVisible(true);
                          }} />
                        </Tooltip>
                      </Space>
                    </ProDescriptions.Item>
                  </>}
                  {path.backend?.serviceName && <>
                    <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.ingress.spec.rules.backend.service' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >
                      <Space>
                        <span>{path.backend.serviceName}:{path.backend?.servicePort}</span>
                        <Tooltip color={colorPrimary} title={intl.formatMessage({ id: 'cluster.resource.backend.service' })}>
                          <EyeOutlined style={{ color: colorPrimary }} onClick={() => {
                            setSelectedServiceName(path.backend.serviceName);
                            setPodVisible(true);
                          }} />
                        </Tooltip>
                      </Space>
                    </ProDescriptions.Item>
                  </>}
                  {path.backend.resource && <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.ingress.spec.rules.backend.service' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >{path.backend.resource.apiGroup}/{path.backend.resource.kind}/{path.backend.resource.name}</ProDescriptions.Item>}
                </>)
              })

            })}
          </ProDescriptions>}

      </Card>

    </PageContainer>}
    <Drawer destroyOnHidden={true}
      size={drawerSize}
      resizable={{
        onResize: (newSize) => setDrawerSize(newSize),
      }}
      key='resurce-view'
      open={resourceDrawerVisible}
      onClose={() => setResourceDrawerVisible(false)}
      closable={true}
      title={<>{getClusterResource('Ingress')}:&nbsp;&nbsp;{info?.metadata?.name}</>}
    >
      <ResourceEditor key={info?.metadata?.resourceVersion || 'edit'} edit={editorResource} address={`${BaseApi}/${name}`} kind='Ingress' name={info?.metadata?.name || ''} cluster={cluster} content={info} />

    </Drawer>
    <Drawer destroyOnHidden={true}
      size={drawerSize}
      resizable={{
        onResize: (newSize) => setDrawerSize(newSize),
      }}
      key='pods'
      className='ant-drawer-body-no-padding'
      open={podVisible}
      onClose={() => setPodVisible(false)}
      closable={true}
      title={intl.formatMessage({ id: 'cluster.resource.backend.service' }) + ': ' + intl.formatMessage({ id: 'cluster.resource.pod' })}
    >
      {Object.keys(labels).length > 0 &&
        <RenderPods key='pods' cluster={cluster} namespace={namespace} labelSelectors={labels} ownerReferenceName='' />}
    </Drawer>
  </>
  )
};
export default DetailView;