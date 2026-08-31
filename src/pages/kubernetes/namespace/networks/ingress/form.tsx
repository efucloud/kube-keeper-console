import { RenderPods } from "@/pages/kubernetes/components/pod";
import { ClusterNamespaceDetail, ClusterNamespaceDetailList } from "@/services/cluster_namespace";
import { clusterGetProxy, clusterPostProxy, clusterPutProxy } from "@/services/cluster_proxy.api";
import { canAccessClusterNamespaces } from "@/services/personal.api";
import { getClusterResource } from "@/utils/cluster";
import { appendKubernetesViewQuery, getClusterApiVersions, getColorPrimary, getCurrentViewInfo, getHeight } from '@/utils/global';
import { ActionType, ModalForm, ProForm, ProFormInstance, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea, ProTable } from "@ant-design/pro-components";
import { FooterToolbar, PageContainer } from "@ant-design/pro-layout";
import { FormattedMessage, useIntl, useParams } from "@umijs/max";
import { Button, Card, Col, Drawer, message, Modal, Popconfirm, Row, Space, Tag, Tooltip } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import type { IIoK8sApiNetworkingV1IngressTLS, Ingress, IIoK8sApiNetworkingV1HTTPIngressPath, IIngress } from 'kubernetes-models/networking.k8s.io/v1';
import { DeleteOutlined, EditOutlined, EyeOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { getClusterIngressClass } from "@/services/cluster.api";
import { IIoK8sApiCoreV1ServicePort, ISecret, ISecretList, IService, IServiceList } from "kubernetes-models/v1";
import { Editor } from "@monaco-editor/react";
import * as yaml from 'js-yaml';
import { saveAs } from 'file-saver';
interface PathInfo extends IIoK8sApiNetworkingV1HTTPIngressPath {
  host: string;
  url: string;
}
const IngressForm: React.FC = () => {
  const formRef = useRef<ProFormInstance>(undefined);
  const ruleFormRef = useRef<ProFormInstance>(undefined);
  const actionRef = useRef<ActionType>(undefined);
  const colorPrimary = getColorPrimary();
  const params = useParams();
  const action = params.action;
  const name = params.name;
  const intl = useIntl();
  const { cluster, namespace } = getCurrentViewInfo();
  const resourceGroup = getClusterApiVersions(cluster, ['networking.k8s.io/v1', 'extensions/v1', 'extensions/v1beta1'], 'Ingress');
  const [info, setInfo] = useState<IIngress>({ apiVersion: 'networking.k8s.io/v1', kind: 'Ingress', metadata: { namespace: namespace }, spec: {} } as IIngress);
  const BaseApi = `apis/${resourceGroup.groupVersion}/namespaces/${namespace}/ingresses`;
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [tlsEnable, setTlsEnable] = useState<boolean>(false);
  const [tlsAddVisible, setTlsAddVisible] = useState<boolean>(false);
  const [ruleAddVisible, setRuleAddVisible] = useState<boolean>(false);
  const [selectedTls, setSelectedTls] = useState<IIoK8sApiNetworkingV1IngressTLS | undefined>(undefined);
  const [selectedRulePath, setSelectedRulePath] = useState<PathInfo>({ path: '/' });
  const [podVisible, setPodVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [selectedServiceName, setSelectedServiceName] = useState<string | undefined>(undefined);
  const [ports, setPorts] = useState<number[]>([]);
  const [yamlVisible, setYamlVisible] = useState<boolean>(false);
  const renderRules = useMemo<IIoK8sApiNetworkingV1HTTPIngressPath[]>(() => {
    let results = []
    const rules = info.spec?.rules || [];
    const prefix = info.spec?.tls ? `https://` : `http://`;
    for (let i = 0; i < rules.length; i++) {
      const paths = rules[i].http?.paths || [];
      for (let j = 0; j < paths.length; j++) {
        if (paths[j] && paths[j].backend) {
          let p = {
            ...paths[j],
            host: rules[i].host,
            url: `${prefix}${rules[i].host}${paths[j].path}`
          }
          results.push(p);
        }
      }
    }
    return results
  }, [info]);
  const getService = async (name: string) => {
    const service = await clusterGetProxy({ cluster, address: `api/v1/namespaces/${info.metadata?.namespace}/services/${name}` }) as IService;
    setLabels(service.spec?.selector || {})
  }
  useEffect(() => {
    if (selectedServiceName && info.metadata?.namespace) {
      getService(selectedServiceName);
    }
  }, [selectedServiceName]);
  const saveDataToFile = (name: string) => {
    const dataBlob = new Blob([yaml.dump(info)], { type: 'application/json' });
    saveAs(dataBlob, `${name}.yaml`);
  };
  const onFinish = async (values: Record<string, any>) => {
    if (action === 'update') {
      let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
      await clusterPutProxy(params, info) as Ingress;
      window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/networks/ingresses/${info.metadata?.name}/update`, { cluster: cluster, namespace: info.metadata?.namespace })
    } else {
      if (!info?.metadata) { info.metadata = {} }
      info.metadata.name = values.metadata.name;
      info.metadata.namespace = values.metadata.namespace;
      let params = { cluster, address: `${BaseApi}` } as Record<string, any>;
      await clusterPostProxy(params, info) as Ingress;
      window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/networks/ingresses/${info.metadata?.name}/update`, { cluster: cluster, namespace: info.metadata?.namespace })
    }
  };
  return (
    <PageContainer
      title={intl.formatMessage({ id: `pages.operation.${action}` }) + getClusterResource('Ingress')}
      header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      extra={<Button onClick={() => { setYamlVisible(true) }}>{intl.formatMessage({ id: 'cluster.view.yaml' })}</Button>}
    >
      <Card>
        <ProForm
          layout="vertical"
          submitter={{
            render: (props, dom) => {
              return <FooterToolbar> {dom} </FooterToolbar>;
            },
          }}
          onFinish={onFinish}
          formRef={formRef}
          request={async () => {
            if (action === 'update') {
              let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
              const res = await clusterGetProxy(params) as Ingress;
              setInfo(res);
              setTlsEnable(!!res.spec?.tls)
              return res;
            } else {
              return { metadata: { namespace: namespace } } as Ingress
            }
          }}
        >
          <Row gutter={64}>
            {action === 'update' && <>
              <Col lg={8} md={12} sm={24} >
                <ProFormText
                  name={['metadata', 'namespace']}
                  label={intl.formatMessage({ id: 'cluster.namespace' })}
                  disabled
                />
              </Col>
              <Col lg={8} md={12} sm={24} >
                <ProFormText
                  name={['metadata', 'name']}
                  label={intl.formatMessage({ id: 'cluster.resource.name' })}
                  disabled
                />
              </Col>
            </>}
            {action === 'create' && <>
              {namespace && <Col lg={8} md={12} sm={24} >
                <ProFormText
                  name={['metadata', 'namespace']}
                  label={intl.formatMessage({ id: 'cluster.namespace' })}
                  disabled
                />
              </Col>}
              {!namespace && <Col lg={8} md={12} sm={24} >
                <ProFormSelect
                  showSearch
                  name={['metadata', 'namespace']}
                  label={intl.formatMessage({ id: 'cluster.namespace' })}
                  rules={[
                    {
                      required: true,
                      message:
                        intl.formatMessage({ id: 'pages.select.text.tips' }) +
                        intl.formatMessage({ id: 'cluster.namespace' }),
                    },
                  ]}
                  onChange={(value: string) => {
                    setInfo(prev => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        namespace: value
                      }
                    }));
                  }}
                  request={async (values: Record<string, string>) => {
                    const params = { cluster: cluster, search: values?.keyWords || '' } as Record<string, any>;
                    const res = (await canAccessClusterNamespaces(params)) as ClusterNamespaceDetailList;
                    return res?.data?.map((item: ClusterNamespaceDetail) => ({
                      label: item.namespace,
                      value: item.namespace,
                    })) || [];
                  }}
                />
              </Col>}
              <Col lg={8} md={12} sm={24} >
                <ProFormText
                  name={['metadata', 'name']}
                  label={intl.formatMessage({ id: 'cluster.resource.name' })}
                  rules={[
                    {
                      max: 253,
                      message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 253 }),
                    },
                    {
                      required: true,
                      message:
                        intl.formatMessage({ id: 'pages.select.text.tips' }) +
                        intl.formatMessage({ id: 'cluster.namespace' }),
                    },
                    {
                      message: (
                        <FormattedMessage id="cluster.resource.data.format.invalid" />
                      ),
                      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                    },
                  ]}
                  onChange={(e) => {
                    setInfo(prev => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        name: e.target.value
                      }
                    }));
                  }}

                />
              </Col>

            </>}
            <Col lg={8} md={12} sm={24} >
              <ProFormSelect
                allowClear
                label={intl.formatMessage({ id: 'cluster.resource.ingressClass' })}
                name={['spec', 'ingressClassName']}
                onChange={(value: string) => {
                  setInfo(prev => ({
                    ...prev,
                    spec: { ...prev.spec, ingressClassName: value }
                  }));
                }}
                request={async () => {
                  const result = await getClusterIngressClass({ cluster }) as string[];
                  return result.map((item: string) => ({
                    label: item,
                    value: item,
                  })) || [];
                }}
              />
            </Col>
          </Row>
          <Row gutter={64}>
            <Col lg={8} md={12} sm={24} >
              <ProFormSwitch
                label={intl.formatMessage({ id: 'cluster.resource.ingress.tls.enable' })}
                name='tlsEnable'
                onChange={(meta) => {
                  setTlsEnable(meta)
                }}
                fieldProps={{
                  defaultValue: !!info.spec?.tls
                }}
                addonAfter={tlsEnable ? <Button type="text"
                  onClick={() => {
                    setSelectedTls(undefined);
                    setTlsAddVisible(true);
                  }}
                  style={{ color: colorPrimary }}>{intl.formatMessage({ id: 'cluster.resource.ingress.tls.add' })}</Button> : null}
              />
            </Col>
          </Row>
          {tlsEnable && <Row gutter={64}>
            <Col lg={24} md={24} sm={24} >
              <ProTable<IIoK8sApiNetworkingV1IngressTLS>
                columns={[
                  {
                    title: <FormattedMessage id="cluster.resource.ingress.tls.secretName" />,
                    dataIndex: 'secretName',
                  },
                  {
                    title: <FormattedMessage id="cluster.resource.ingress.tls.hosts" />,
                    render: (dom, entity) => {
                      return <Space>{entity.hosts?.map((item: string) => {
                        return <Tag key={item}>{item}</Tag>
                      })}</Space>
                    },
                  },
                  {
                    title: <FormattedMessage id="pages.operation" />,
                    dataIndex: 'option',
                    search: false,
                    align: 'center',
                    render: (_, record) => {
                      return <Space><a key="edit"
                        onClick={() => {
                          setSelectedTls(record);
                          setTlsAddVisible(true);
                        }}
                      >
                        <EditOutlined />
                      </a>
                        <Popconfirm
                          key={record.secretName + '-delete'}
                          title=''
                          description={
                            intl.formatMessage({
                              id: 'pages.operation.delete.description',
                            }) +
                            intl.formatMessage({ id: 'cluster.resource.ingress.tls.secretName' }) +
                            `【${record.secretName}】`
                          }
                          onConfirm={() => {
                            const newInfo = { ...info }
                            if (!newInfo.spec) {
                              newInfo.spec = {}
                            }
                            if (!newInfo.spec?.tls) {
                              newInfo.spec.tls = []
                            }
                            newInfo.spec.tls = newInfo.spec?.tls || []
                            newInfo.spec.tls = newInfo.spec?.tls.filter((item: IIoK8sApiNetworkingV1IngressTLS) => item.secretName !== record.secretName)
                            setInfo(newInfo);
                          }}
                          okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
                          cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
                        >
                          <DeleteOutlined style={{ color: 'red' }} />
                        </Popconfirm>
                      </Space>;
                    },
                  },
                ]}
                key='tls-host'
                scroll={{ x: 'max-content' }}
                rowKey="key"
                dataSource={info.spec?.tls || []}
                search={false}
                options={false}
                pagination={false}
                locale={{
                  emptyText: intl.formatMessage({
                    id: 'pages.not.found.data',
                  }),
                }}
              />
            </Col>
          </Row>}
        </ProForm>
      </Card>
      <Card style={{ marginTop: 16 }} title={intl.formatMessage({ id: 'cluster.resource.ingress.rules' })}
        extra={<Button type='text' style={{ color: colorPrimary }}
          onClick={() => { setRuleAddVisible(true); setSelectedRulePath({ path: '/' }) }}
        >{intl.formatMessage({ id: 'pages.operation.add' })}</Button>}
      >
        <Row gutter={64}>
          <Col span={24}>
            <ProTable<PathInfo>
              columns={[
                {
                  title: <FormattedMessage id="cluster.resource.ingress.spec.rules.host" />,
                  dataIndex: 'url',
                  render(dom, entity) {
                    if (entity?.url) {
                      return <a href={entity.url} target='_blank'>{entity.url}</a>
                    } else {
                      return '-'
                    }
                  },
                },

                {
                  title: <FormattedMessage id="cluster.resource.ingress.spec.rules.pathType" />,
                  dataIndex: 'pathType',
                  valueEnum: {
                    'Exact': {
                      text: intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.pathType.Exact' }),
                    },
                    'Prefix': {
                      text: intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.pathType.Prefix' }),
                    },
                    'ImplementationSpecific': {
                      text: intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.pathType.ImplementationSpecific' }),
                    }
                  }
                },
                {
                  title: <FormattedMessage id="cluster.resource.ingress.spec.rules.backend.service" />,
                  render(dom, entity) {
                    if (entity.backend) {
                      if (entity.backend.service) {
                        return <Space>
                          {entity.backend?.service?.name && <span>{entity.backend.service?.name || '-'}:{entity.backend.service?.port?.number || entity.backend.service?.port?.name || '-'}</span>}
                          <Tooltip color={colorPrimary} title={intl.formatMessage({ id: 'cluster.resource.backend.service' })}>
                            <EyeOutlined style={{ color: colorPrimary }} onClick={() => {
                              if (entity.backend.service?.name) {
                                setSelectedServiceName(entity.backend?.service?.name)
                                setPodVisible(true);
                              } else if (entity.backend?.serviceName) {
                                setSelectedServiceName(entity.backend.serviceName);
                                setPodVisible(true);
                              }
                            }} />
                          </Tooltip>
                        </Space>
                      } else {
                        return <>{entity.backend.resource?.apiGroup || '-'}:{entity.backend.resource?.kind || '-'}:{entity.backend.resource?.name || '-'}</>
                      }
                    } else {
                      return '-'
                    }
                  },
                },
                {
                  title: <FormattedMessage id="pages.operation" />,
                  dataIndex: 'option',
                  search: false,
                  align: 'center',
                  render: (_, record) => {
                    return <Space><a key="edit"
                      onClick={() => {
                        setSelectedRulePath(record);
                        setRuleAddVisible(true)
                      }}
                    >
                      <EditOutlined />
                    </a>
                      <Popconfirm
                        key={record.backend.service?.name + '-delete'}
                        title=''
                        description={
                          intl.formatMessage({
                            id: 'pages.operation.delete.description',
                          }) +
                          intl.formatMessage({ id: 'cluster.resource.ingress.rules' }) +
                          `【${record.backend.service?.name || record.backend.resource?.name}】`
                        }
                        onConfirm={() => {
                          const newInfo = { ...info }
                          if (!newInfo.spec) {
                            newInfo.spec = {}
                          }
                          if (!newInfo.spec?.rules) {
                            newInfo.spec.rules = []
                          }
                          newInfo.spec.rules = newInfo.spec?.rules || []
                          let newRules = [];
                          for (let i = 0; i < newInfo.spec.rules.length; i++) {
                            const rule = { ...newInfo.spec.rules[i] };
                            if (rule.http?.paths && rule.http?.paths?.length > 0) {
                              for (let j = 0; j < rule.http?.paths?.length; j++) {
                                const p = { ...rule.http.paths[j] }
                                if (record.path === p.path && record.pathType === p.pathType && record.backend.service?.name === p.backend.service?.name && record.backend.service?.port === p.backend.service?.port) {
                                  if (rule.http.paths.length > 1) {
                                    delete rule.http.paths[j]
                                    newRules.push(rule)
                                  }
                                } else {
                                  newRules.push(rule)
                                }

                              }
                            }
                          }
                          let okRules = []
                          for (let i = 0; i < newRules.length; i++) {
                            const rule = { ...newRules[i] };
                            console.log(JSON.stringify(rule))
                            if (rule.http?.paths && rule.http?.paths?.length > 0) {
                              okRules.push(rule)
                            }
                          }
                          newInfo.spec.rules = okRules
                          setInfo(newInfo);
                        }}
                        okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
                        cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
                      >
                        <DeleteOutlined style={{ color: 'red' }} />
                      </Popconfirm>
                    </Space>;
                  },
                },
              ]}
              key='tls-host'
              scroll={{ x: 'max-content' }}
              rowKey="path"
              dataSource={renderRules}
              search={false}
              options={false}
              pagination={false}
              locale={{
                emptyText: intl.formatMessage({
                  id: 'pages.not.found.data',
                }),
              }}

            />
          </Col>
        </Row>
      </Card>
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
        {Object.keys(labels).length > 0 && <RenderPods key='pods' cluster={cluster} namespace={namespace} labelSelectors={labels} ownerReferenceName='' />}
      </Drawer>
      {tlsAddVisible && info.metadata?.namespace && <ModalForm
        title={intl.formatMessage({ id: 'cluster.resource.ingress.tls.add' })}
        width="40vw"
        key={selectedTls?.secretName || `${info.metadata?.namespace}-add`}
        open={tlsAddVisible}
        initialValues={selectedTls}
        clearOnDestroy={true}
        onOpenChange={setTlsAddVisible}
        onFinish={async (values: Record<string, any>) => {
          const newInfo = { ...info }
          if (!newInfo.spec) {
            newInfo.spec = {}
          }
          if (!newInfo.spec?.tls) {
            newInfo.spec.tls = []
          }
          newInfo.spec.tls = newInfo.spec?.tls || []
          if (selectedTls) {
            newInfo.spec.tls = newInfo.spec?.tls.filter((item: IIoK8sApiNetworkingV1IngressTLS) => item.secretName !== selectedTls.secretName)
          }
          newInfo.spec?.tls.push({ secretName: values['secretName'] || '', hosts: values['hosts']?.split(',') || [] } as IIoK8sApiNetworkingV1IngressTLS)
          setInfo(newInfo);
          setTlsAddVisible(false);
          setSelectedTls(undefined)
        }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      >
        <ProFormSelect
          name='secretName'
          label={intl.formatMessage({ id: 'cluster.resource.ingress.tls.secretName' })}
          request={async () => {
            if (info.metadata?.namespace) {
              const params = { cluster, address: `api/v1/namespaces/${info.metadata?.namespace}/secrets?fieldSelector=type%3Dkubernetes.io/tls` } as Record<string, any>;
              const res = await clusterGetProxy(params) as ISecretList;
              return res.items.map((item: ISecret) => {
                return { label: item.metadata?.name, value: item.metadata?.name }
              })
            }
            return [];
          }}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.select.text.tips' }) +
                intl.formatMessage({ id: 'cluster.resource.ingress.tls.secretName' }),
            }
          ]}
        />
        <ProFormTextArea
          name='hosts'
          label={<>{intl.formatMessage({ id: 'cluster.resource.ingress.tls.hosts' })}&nbsp;<Tooltip color={colorPrimary} title={intl.formatMessage({ id: 'cluster.resource.ingress.tls.hosts.placeholder' })}><QuestionCircleOutlined /></Tooltip></>}
          placeholder={intl.formatMessage({ id: 'cluster.resource.ingress.tls.hosts.placeholder' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.input.text.tips' }) +
                intl.formatMessage({ id: 'cluster.resource.ingress.tls.hosts' }),
            }
          ]}
        />
      </ModalForm>}
      {ruleAddVisible && info.metadata?.namespace && <ModalForm
        title={intl.formatMessage({ id: 'cluster.resource.ingress.tls.add' })}
        width="40vw"
        key={selectedTls?.secretName || `${info.metadata?.namespace}-add`}
        open={ruleAddVisible}
        initialValues={selectedRulePath}
        clearOnDestroy={true}
        onOpenChange={setRuleAddVisible}
        onFinish={async (values: Record<string, any>) => {
          console.log(selectedRulePath)
          const host = values['host']
          const newInfo = { ...info }
          if (!newInfo.spec) {
            newInfo.spec = { rules: [] }
          }
          if (!newInfo.spec.rules) {
            newInfo.spec.rules = []
          }
          let setRecord = false
          if (!newInfo.spec?.rules || newInfo.spec?.rules.length === 0) {
            newInfo.spec.rules = [{
              host, http: {
                paths: [
                  {
                    path: values['path'] || '/',
                    pathType: values['pathType'] || 'Prefix',
                    backend: values['backend'] || {},
                  }
                ]
              }
            }]
          } else {
            const oldHost = selectedRulePath.host || '';
            const oldPath = selectedRulePath.path
            for (let i = 0; i < newInfo.spec?.rules?.length; i++) {
              const rule = newInfo.spec?.rules[i];
              if (rule.host === oldHost && rule.http) {
                for (let j = 0; j < rule.http.paths.length; j++) {
                  const path = rule.http.paths[j];
                  if (path.path === oldPath) {
                    rule.http.paths[j] = {
                      path: values['path'] || '/',
                      pathType: values['pathType'] || 'Prefix',
                      backend: values['backend'] || {},
                    }
                    newInfo.spec.rules[i] = rule
                    setRecord = true
                  }
                }
              }

            }
          }
          if (!setRecord) {
            newInfo.spec.rules.push({
              host, http: {
                paths: [
                  {
                    path: values['path'] || '/',
                    pathType: values['pathType'] || 'Prefix',
                    backend: values['backend'] || {},
                  }
                ]
              }
            })
          }
          setInfo(newInfo);
          setRuleAddVisible(false);
        }}
        formRef={ruleFormRef}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      >
        <ProFormText
          name='host'
          label={intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.host' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.input.text.tips' }) +
                intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.host' }),
            }
          ]}
        />
        <ProFormSelect
          name='pathType'
          label={intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.pathType' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.select.text.tips' }) +
                intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.pathType' }),
            }
          ]}

          options={[
            {
              label: intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.pathType.Prefix' }),
              value: 'Prefix',
            },
            {
              label: intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.pathType.ImplementationSpecific' }),
              value: 'ImplementationSpecific',
            },
            {
              label: intl.formatMessage({ id: 'cluster.resource.ingress.spec.rules.pathType.Exact' }),
              value: 'Exact',
            },
          ]}
        />
        <ProFormText
          name='path'
          label={intl.formatMessage({ id: 'cluster.resource.ingress.rules.http.path' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.input.text.tips' }) +
                intl.formatMessage({ id: 'cluster.resource.ingress.rules.http.path' }),
            }
          ]}
        />

        <ProFormSelect
          name={['backend', 'service', 'name']}
          label={intl.formatMessage({ id: 'cluster.resource.backend.service' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.select.text.tips' }) +
                intl.formatMessage({ id: 'cluster.resource.backend.service' }),
            }
          ]}
          onChange={(value: string, option) => {
            const p = option?.ports as IIoK8sApiCoreV1ServicePort[] || [] as IIoK8sApiCoreV1ServicePort[]
            let po = [] as number[];
            p.map((item: IIoK8sApiCoreV1ServicePort) => {
              po.push(item.port)
            })
            setPorts(po);
            ruleFormRef.current?.setFieldValue(['backend', 'service', 'port', 'number'], po[0])
          }}
          request={async () => {
            if (info.metadata?.namespace) {
              const params = { cluster, address: `api/v1/namespaces/${info.metadata?.namespace}/services` } as Record<string, any>;
              const res = await clusterGetProxy(params) as IServiceList;
              return res.items.map((item: IService) => {
                return { label: item.metadata?.name, value: item.metadata?.name, ports: item.spec?.ports || [] }
              })
            }
            return [];
          }}

        />
        <ProFormSelect
          name={['backend', 'service', 'port', 'number']}
          label={intl.formatMessage({ id: 'cluster.resource.backend.service' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.select.text.tips' }) +
                intl.formatMessage({ id: 'cluster.resource.backend.service' }),
            }
          ]}
          options={ports.map((item: number) => {
            return {
              label: item,
              value: item
            }
          })}
        />

      </ModalForm>}
      <Modal
        key='yaml'
        title={<>{getClusterResource(info.kind)}:&nbsp;{info.metadata?.name}
          &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp;<Button size='small' onClick={() => saveDataToFile(info.metadata?.name || 'ingress')}>
            <FormattedMessage id="pages.operation.download" />
          </Button>
        </>}
        width="65vw"
        height='40vh'
        open={yamlVisible}
        destroyOnHidden={true}
        onCancel={() => setYamlVisible(false)}
        onOk={() => setYamlVisible(false)}
        footer={false}
      >
        <Editor
          key={info.metadata?.name}
          language="yaml"
          height={getHeight(yaml.dump(info))}
          options={{
            readOnly: true,
            tabSize: 2,
            insertSpaces: true,
          }}
          theme="vs-dark"
          defaultValue={yaml.dump(info)}
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
      </Modal>
    </PageContainer>
  )
}
export default IngressForm;