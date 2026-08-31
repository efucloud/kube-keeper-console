import { RenderPods } from "@/pages/kubernetes/components/pod";
import { RenderLabels } from "@/pages/kubernetes/components/render";
import { ClusterNamespaceDetail, ClusterNamespaceDetailList } from "@/services/cluster_namespace";
import { clusterGetProxy, clusterPostProxy, clusterPutProxy } from "@/services/cluster_proxy.api";
import { canAccessClusterNamespaces } from "@/services/personal.api";
import { getClusterResource } from "@/utils/cluster";
import { appendKubernetesViewQuery, getCurrentViewInfo, getHeight } from '@/utils/global';
import { ActionType, EditableProTable, ProColumns, ProDescriptions, ProForm, ProFormInstance, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { FooterToolbar, PageContainer } from "@ant-design/pro-layout";
import { Editor } from "@monaco-editor/react";
import { FormattedMessage, useIntl, useParams } from "@umijs/max";
import { Button, Card, Col, Divider, message, Modal, Row } from "antd";
import { DeploymentList, IDeployment, IStatefulSet, StatefulSetList } from "kubernetes-models/apps/v1";
import { IIoK8sApiCoreV1ServicePort, IService } from "kubernetes-models/v1";
import { useEffect, useRef, useState } from "react";
import * as yaml from 'js-yaml';
import { saveAs } from 'file-saver';
const ServiceForm: React.FC = () => {
  const formRef = useRef<ProFormInstance>(undefined);
  const actionRef = useRef<ActionType>(undefined);
  const params = useParams();
  const action = params.action;
  const name = params.name;
  const intl = useIntl();
  const [type, setType] = useState<string>('ClusterIP');
  const { cluster, namespace } = getCurrentViewInfo();
  const [info, setInfo] = useState<IService>({ apiVersion: 'v1', kind: 'Service', metadata: { namespace: namespace }, spec: { type: type, ports: [] } } as IService);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const BaseApi = `api/v1/namespaces/${namespace}/services`;
  const [namespaceOptions, setNamespaceOptions] = useState([]);
  const [yamlVisible, setYamlVisible] = useState<boolean>(false);
  const onFinish = async (values: Record<string, any>) => {
    if (action === 'update') {
      let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
      await clusterPutProxy(params, info) as IService;
      window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/networks/services/${info.metadata?.name}/update`, { cluster: cluster, namespace: info.metadata?.namespace })
    } else {
      if (!info?.metadata) { info.metadata = {} }
      info.metadata.name = values.metadata.name;
      info.metadata.namespace = values.metadata.namespace;
      let params = { cluster, address: `${BaseApi}` } as Record<string, any>;
      await clusterPostProxy(params, info) as IService;
      window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/config/services/${info.metadata?.name}/update`, { cluster: cluster, namespace: info.metadata?.namespace })
    }
  };
  const columns: ProColumns<IIoK8sApiCoreV1ServicePort>[] = [
    {
      title: <FormattedMessage id="cluster.resource.service.ports.name" />,
      dataIndex: 'name',
    },
    {
      title: <FormattedMessage id="cluster.resource.service.ports.protocol" />,
      dataIndex: 'protocol',
      editable: false,
    },
    {
      title: <FormattedMessage id="cluster.resource.service.ports.targetPort" />,
      dataIndex: 'targetPort',
      editable: false,
    },
    {
      title: <FormattedMessage id="cluster.resource.service.ports.port" />,
      dataIndex: 'port',
    },
    {
      title: <FormattedMessage id="cluster.resource.service.ports.nodePort" />,
      dataIndex: 'nodePort',
      hidden: type !== 'NodePort',
    },
    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      valueType: 'option',
      render: (_, row) => [
        <a
          key="delete"
          onClick={() => {
            setInfo(prev => {
              const newSpec = {
                ...prev.spec,
                ports: prev.spec?.ports?.filter(item => item.targetPort !== row.targetPort)
              };
              return {
                ...prev,
                spec: newSpec
              };
            });
          }}
        >
          {intl.formatMessage({ id: 'pages.operation.delete' })}
        </a>,
        <a
          key="edit"
          onClick={() => {
            actionRef.current?.startEditable(row.targetPort);
          }}
        >
          {intl.formatMessage({ id: 'pages.operation.edit' })}
        </a>,
      ],
    },
  ];
  const getOptions = async (selectedNamespace: string) => {
    let options = [];
    if (selectedNamespace) {
      let params = { cluster, address: `apis/apps/v1/namespaces/${selectedNamespace}/deployments` } as Record<string, any>;
      const deploys = await clusterGetProxy(params, info) as DeploymentList;
      let params2 = { cluster, address: `apis/apps/v1/namespaces/${selectedNamespace}/statefulsets` } as Record<string, any>;
      const stats = await clusterGetProxy(params2, info) as StatefulSetList;

      if (deploys.items) {
        const deploysOptions = deploys.items.map((item: IDeployment) => {
          return {
            label: item.metadata?.name,
            value: JSON.stringify(item.spec?.template.metadata?.labels || {}),
            type: 'deployment',
            data: item,
          }
        })
        options.push({
          label: <Divider style={{ margin: 0, fontSize: 12 }}>{intl.formatMessage({ id: 'cluster.workload.deployment' })}</Divider>,
          options: deploysOptions,
        })
      }
      if (stats.items) {
        const stOptions = stats.items.map((item: IStatefulSet) => {
          return {
            label: item.metadata?.name,
            value: JSON.stringify(item.spec?.template.metadata?.labels || {}),
            type: 'statefulset',
            data: item,
          }
        })
        options.push({
          label: <Divider style={{ margin: 0, fontSize: 12 }}>{intl.formatMessage({ id: 'cluster.workload.statefulset' })}</Divider>,
          options: stOptions,
        })
      }
    }

    setNamespaceOptions(options);
  }
  useEffect(() => {
    if (info.metadata?.namespace) {
      getOptions(info.metadata?.namespace)
    }
  }, [info.metadata?.namespace]);
  const saveDataToFile = (name: string) => {
    const dataBlob = new Blob([yaml.dump(info)], { type: 'application/json' });
    saveAs(dataBlob, `${name}.yaml`);
  };
  return (
    <PageContainer
      title={intl.formatMessage({ id: `pages.operation.${action}` }) + getClusterResource('Service')}
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
              const res = await clusterGetProxy(params) as IService;
              setInfo(res);
              setLabels(res.spec?.selector || {});
              return res;
            } else {
              return { metadata: { namespace: namespace } } as IService
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
                    getOptions(value);
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
                />
              </Col>

            </>}
            <Col lg={8} md={12} sm={24} >
              <ProFormSelect
                showSearch
                label={intl.formatMessage({ id: 'cluster.resource.backend.service' })}
                name={['spec', 'selector']}
                rules={[
                  {
                    required: Object.keys(labels).length === 0,
                    message:
                      intl.formatMessage({ id: 'pages.select.text.tips' }) +
                      intl.formatMessage({ id: 'cluster.resource.backend.service' }),
                  }
                ]}
                onChange={(values: string, options: any) => {
                  if (values) {
                    setLabels(JSON.parse(values))
                    const containers = options?.data?.spec?.template?.spec?.containers;
                    let ports = [] as IIoK8sApiCoreV1ServicePort[];
                    for (let i = 0; i < containers?.length; i++) {
                      const container = containers[i];
                      for (let j = 0; j < container?.ports?.length; j++) {
                        ports.push({
                          targetPort: container?.ports[j]?.containerPort,
                          port: container?.ports[j]?.containerPort,
                          name: container?.ports[j]?.name || '',
                          protocol: container?.ports[j]?.protocol || 'TCP',
                        })
                      }
                    }
                    setInfo((prev: IService) => {
                      const newSpec = {
                        ...prev.spec,
                        ports: ports,
                      };
                      return {
                        ...prev,
                        spec: newSpec
                      };
                    });
                  } else {
                    setLabels({})
                    setInfo((prev: IService) => {
                      const newSpec = {
                        ...prev.spec,
                        ports: [],
                      };
                      return {
                        ...prev,
                        spec: newSpec
                      };
                    });
                  }

                }}
                options={namespaceOptions}
              />
            </Col>
            <Col lg={8} md={12} sm={24} >
              <ProFormSelect
                label={intl.formatMessage({ id: 'cluster.resource.service.type' })}
                name={['spec', 'type']}
                onChange={(value: string) => {
                  setType(value)
                }}
                options={[
                  { label: intl.formatMessage({ id: 'cluster.resource.service.type.ClusterIP' }), value: 'ClusterIP' },
                  { label: intl.formatMessage({ id: 'cluster.resource.service.type.NodePort' }), value: 'NodePort' },
                  { label: intl.formatMessage({ id: 'cluster.resource.service.type.LoadBalancer' }), value: 'LoadBalancer' },
                  { label: intl.formatMessage({ id: 'cluster.resource.service.type.ExternalName' }), value: 'ExternalName' },
                ]}
                rules={[
                  {
                    required: true,
                    message:
                      intl.formatMessage({ id: 'pages.select.text.tips' }) +
                      intl.formatMessage({ id: 'cluster.resource.service.type' }),
                  }
                ]}
              />
            </Col>
            <Col lg={8} md={12} sm={24} >
              <ProFormSelect
                name={['spec', 'sessionAffinity']}
                label={intl.formatMessage({ id: 'cluster.resource.service.sessionAffinity' })}
                options={[
                  {
                    label: intl.formatMessage({ id: 'cluster.resource.service.sessionAffinity.None' }),
                    value: 'None'
                  },
                  {
                    label: intl.formatMessage({ id: 'cluster.resource.service.sessionAffinity.ClientIP' }),
                    value: 'ClientIP'
                  }
                ]}
              />
            </Col>
            <Col lg={8} md={12} sm={24} >
              <ProDescriptions>
                <ProDescriptions.Item label={intl.formatMessage({ id: 'cluster.labelSelector' })}>
                  <RenderLabels labels={labels || {}} type='ReactNode' />
                </ProDescriptions.Item>
              </ProDescriptions>
            </Col>
          </Row>
        </ProForm>
        <ProDescriptions title={intl.formatMessage({ id: 'cluster.resource.service.ports' })}>
        </ProDescriptions>
        <EditableProTable<IIoK8sApiCoreV1ServicePort>
          recordCreatorProps={false}
          value={info.spec?.ports || []}
          columns={columns}
          actionRef={actionRef}
          rowKey='targetPort'
          locale={{ emptyText: intl.formatMessage({ id: 'pages.no.data' }) }}
          onChange={(values: IIoK8sApiCoreV1ServicePort[]) => {
            let newValues = values;
            if (type !== 'NodePort') {
              // 创建新对象，排除 nodePort
              newValues = values.map(item => {
                const { nodePort, ...rest } = item; // 解构排除 nodePort
                return rest;
              });
            }
            setInfo(prev => {
              const newSpec = {
                ...prev.spec,
                ports: newValues
              };
              return {
                ...prev,
                spec: newSpec
              };
            });
          }}
        />
      </Card>
      <Card style={{ marginTop: 16 }}><Card.Meta title={intl.formatMessage({ id: 'cluster.workload.pods' })} />
        {Object.keys(labels) && namespace && <RenderPods key={JSON.stringify(labels)} cluster={cluster} namespace={namespace} labelSelectors={labels} ownerReferenceName='' />}
      </Card>
      <Modal
        key='yaml'
        title={<>{getClusterResource(info.kind)}:&nbsp;{info.metadata?.name}
          &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp;<Button size='small' onClick={() => saveDataToFile(info.metadata?.name || 'service')}>
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
export default ServiceForm;