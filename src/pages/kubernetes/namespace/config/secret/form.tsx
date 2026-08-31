import { ClusterNamespaceDetail, ClusterNamespaceDetailList } from "@/services/cluster_namespace";
import { clusterGetProxy, clusterPostProxy, clusterPutProxy } from "@/services/cluster_proxy.api";
import { canAccessClusterNamespaces } from "@/services/personal.api";
import { getClusterResource } from "@/utils/cluster";
import { decodeBase64 } from "@/utils/crypto";
import { appendKubernetesViewQuery, getCurrentViewInfo, getHeight } from '@/utils/global';
import { safeFormatJson } from "@/utils/tools";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { ModalForm, ProForm, ProFormInstance, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { FooterToolbar, PageContainer } from "@ant-design/pro-layout";
import { Editor } from "@monaco-editor/react";
import { FormattedMessage, useIntl, useParams } from "@umijs/max";
import { Button, Card, Col, Collapse, Popconfirm, Row } from "antd";
import { CollapseProps } from "antd/lib";
import { ISecret } from "kubernetes-models/v1";
import { ReactNode, useRef, useState } from "react";

const ConfigMapForm: React.FC = () => {
  const formRef = useRef<ProFormInstance>(undefined);
  const params = useParams();
  const action = params.action;
  const name = params.name;
  const intl = useIntl();
  const [info, setInfo] = useState<ISecret>({ metadata: {}, data: {} } as ISecret);
  const { cluster, namespace } = getCurrentViewInfo();
  const [addVisible, setAddVisible] = useState(false)
  const BaseApi = `api/v1/namespaces/${namespace}/secrets`;
  const [secretType, setSecretType] = useState('');
  const onFinish = async (values: Record<string, any>) => {
    const payload: ISecret = {
      ...info,
      metadata: info.metadata ? { ...info.metadata } : {},
      stringData: info.stringData ? { ...info.stringData } : {},
    };
    if (values.stringData) {
      payload.stringData = values.stringData;
    }
    payload.stringData = payload.stringData || {};

    if (action === 'update') {
      const params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
      await clusterPutProxy(params, payload) as ISecret;
      window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/config/secrets/${payload.metadata?.name}/update`, { cluster: cluster, namespace: payload.metadata?.namespace })
    } else {
      payload.metadata = payload.metadata || {};
      payload.type = values.type;
      payload.metadata.name = values.metadata.name;
      payload.metadata.namespace = values.metadata.namespace;
      const params = { cluster, address: `${BaseApi}` } as Record<string, any>;
      await clusterPostProxy(params, payload) as ISecret;
      window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/config/secrets/${payload.metadata?.name}/update`, { cluster: cluster, namespace: payload.metadata?.namespace })
    }
  };

  const items = (): CollapseProps['items'] => {
    let nodes = [] as ReactNode[];
    const keys = Object.keys(info?.stringData || {});
    for (let i = 0; i < keys.length; i++) {
      let lang = 'yaml'
      let content = info.stringData[keys[i]]
      if (keys[i].indexOf('.json') > 1) {
        lang = 'json'
        content = JSON.stringify(JSON.parse(info.stringData[keys[i]] || '{}'), null, 2);
      }
      const height = getHeight(content)
      nodes.push({
        key: keys[i],
        label: keys[i],
        extra: <><Popconfirm
          key={keys[i]}
          description={intl.formatMessage({ id: 'cluster.resource.Secret.key.delete.description' })}
          title={intl.formatMessage({ id: 'pages.operation.delete' }) + intl.formatMessage({ id: 'cluster.resource.Secret.key' }) + `【${keys[i]}】`
          }
          onConfirm={(e) => {
            e?.stopPropagation();
            setInfo(prev => {
              const newData = { ...prev.stringData }; // 浅拷贝
              delete newData[keys[i]];        // 彻底删除 key
              return {
                ...prev,
                stringData: newData
              };
            });
          }}
          okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
          cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
        >
          <DeleteOutlined style={{ color: 'red' }} />
        </Popconfirm></>,
        children: <Editor
          language={lang}
          options={{
            tabSize: 2,
            fontFamily: '"Fira Code", "Source Code Pro", "Microsoft YaHei Mono", "Noto Sans Mono", "DejaVu Sans Mono", monospace',
            insertSpaces: true,
          }}
          height={height}
          theme="vs-dark"
          defaultValue={content}
          onChange={(value) => {
            setInfo(prev => {
              const newData = { ...prev.stringData }; // 浅拷贝
              newData[keys[i]] = value;        // 彻底删除 key
              return {
                ...prev,
                stringData: newData
              };
            })
          }}
        />
      })
    }
    return nodes;
  };
  return (
    <PageContainer
      title={intl.formatMessage({ id: `pages.operation.${action}` }) + getClusterResource('Secret')}
      header={{ breadcrumb: {}, onBack: () => window.history.back() }}
    >
      <Card style={{ marginBottom: 16 }}>
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
              const res = await clusterGetProxy(params) as ISecret;
              if (res) {
                if (res?.data) {
                  res.stringData = {}
                  Object.keys(res?.data).forEach(key => {
                    if (res.type === 'kubernetes.io/dockerconfigjson') {
                      res.stringData[key] = safeFormatJson(decodeBase64(res?.data[key]), 2)
                    } else {
                      res.stringData[key] = decodeBase64(res?.data[key])
                    }
                  })
                }
              }

              setSecretType(res?.type || 'Opaque')
              delete res.data;
              setInfo(res);
              return res;
            } else {
              return { apiVersion: 'v1', kind: 'Secret', metadata: { namespace: namespace }, data: {}, binaryData: {} } as ISecret
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
              <Col lg={16} md={16} sm={24} >
                <ProFormText
                  name={['metadata', 'name']}
                  label={intl.formatMessage({ id: 'cluster.resource.name' })}
                  disabled
                />
              </Col>
              <Col lg={8} md={12} sm={24} >
                <ProFormSelect
                  disabled
                  name='type'
                  label={intl.formatMessage({ id: 'cluster.resource.type' })}
                  rules={[
                    {
                      required: true,
                      message:
                        intl.formatMessage({ id: 'pages.select.text.tips' }) +
                        intl.formatMessage({ id: 'cluster.resource.type' }),
                    },
                  ]}
                  options={[
                    {
                      label: intl.formatMessage({ id: 'cluster.resource.secret.type.Opaque' }),
                      value: 'Opaque',
                    },

                    {
                      label: intl.formatMessage({ id: 'cluster.resource.secret.type.ingressTLS' }),
                      value: 'kubernetes.io/tls',
                    },
                    {
                      label: intl.formatMessage({ id: 'cluster.resource.container.image.pullSecrets' }),
                      value: 'kubernetes.io/dockerconfigjson',
                    },
                    {
                      label: intl.formatMessage({ id: 'cluster.resource.secret.type.helm' }),
                      value: 'helm.sh/release.v1',
                    },
                    {
                      label: intl.formatMessage({ id: 'cluster.resource.secret.type.serviceAccountToken' }),
                      value: 'kubernetes.io/service-account-token',
                    },
                    {
                      label: intl.formatMessage({ id: 'cluster.resource.secret.type.bootstrapToken' }),
                      value: 'bootstrap.kubernetes.io/token',
                    },
                  ]}
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
              {!namespace && <Col lg={16} md={16} sm={24} >
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
              <Col lg={16} md={16} sm={24} >
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
              <Col lg={8} md={12} sm={24} >
                <ProFormSelect
                  name='type'
                  label={intl.formatMessage({ id: 'cluster.resource.type' })}
                  rules={[
                    {
                      required: true,
                      message:
                        intl.formatMessage({ id: 'pages.select.text.tips' }) +
                        intl.formatMessage({ id: 'cluster.resource.type' }),
                    },
                  ]}
                  onChange={(value: string) => {
                    setSecretType(value)
                  }}
                  options={[
                    {
                      label: intl.formatMessage({ id: 'cluster.resource.secret.type.Opaque' }),
                      value: 'Opaque',
                    },

                    {
                      label: intl.formatMessage({ id: 'cluster.resource.secret.type.ingressTLS' }),
                      value: 'kubernetes.io/tls',
                    },
                    {
                      label: intl.formatMessage({ id: 'cluster.resource.container.image.pullSecrets' }),
                      value: 'kubernetes.io/dockerconfigjson',
                    },
                  ]}
                />
              </Col>
            </>}
          </Row>
          {secretType === 'kubernetes.io/tls' && <>
            <Row gutter={64}>
              <Col lg={12} md={12} sm={24} >
                <ProFormTextArea
                  name={['stringData', 'tls.crt']}
                  label='tls.crt'
                  fieldProps={{ rows: 20 }}
                  rules={[
                    {
                      required: true,
                      message:
                        intl.formatMessage({ id: 'pages.input.text.tips' }) +
                        intl.formatMessage({ id: 'tls.crt' }),
                    },
                  ]}
                />
              </Col>
              <Col lg={12} md={12} sm={24} >
                <ProFormTextArea
                  name={['stringData', 'tls.key']}
                  label='tls.key'
                  fieldProps={{ rows: 20 }}
                  rules={[
                    {
                      required: true,
                      message:
                        intl.formatMessage({ id: 'pages.input.text.tips' }) +
                        intl.formatMessage({ id: 'tls.key' }),
                    },
                  ]}
                />
              </Col>
            </Row>
          </>}
          {secretType === 'IngressTLS' && <>
            <Row gutter={64}>
              <Col lg={12} md={12} sm={24} >
                <ProFormTextArea
                  name={['stringData', 'tls.crt']}
                  label='tls.crt'
                  fieldProps={{ rows: 20 }}
                  rules={[
                    {
                      required: true,
                      message:
                        intl.formatMessage({ id: 'pages.input.text.tips' }) +
                        intl.formatMessage({ id: 'tls.crt' }),
                    },
                  ]}
                />
              </Col>
              <Col lg={12} md={12} sm={24} >
                <ProFormTextArea
                  name={['stringData', 'tls.key']}
                  label='tls.key'
                  fieldProps={{ rows: 20 }}
                  rules={[
                    {
                      required: true,
                      message:
                        intl.formatMessage({ id: 'pages.input.text.tips' }) +
                        intl.formatMessage({ id: 'tls.key' }),
                    },
                  ]}
                />
              </Col>
            </Row>
          </>}
          {secretType === 'kubernetes.io/dockerconfigjson' && <>
            <Row gutter={64}>
              <Col lg={24} md={24} sm={24} >
                <ProFormTextArea
                  fieldProps={{ rows: 10 }}
                  name={['stringData', '.dockerconfigjson']}
                  label={intl.formatMessage({ id: 'cluster.resource.images.registry.address' })}
                  rules={[
                    {
                      required: true,
                      message:
                        intl.formatMessage({ id: 'pages.input.text.tips' }) +
                        intl.formatMessage({ id: 'cluster.resource.images.registry.address' }),
                    },
                  ]}
                />
              </Col>
            </Row></>}
        </ProForm>
      </Card>
      {secretType !== 'kubernetes.io/dockerconfigjson' && secretType !== 'kubernetes.io/tls' && secretType !== 'IngressTLS' &&
        <Card title={<FormattedMessage id='cluster.resource.content' />}
          extra={
            <Button type="primary" onClick={() => {
              setAddVisible(true)
            }} >
              <PlusOutlined />
              <FormattedMessage id='cluster.resource.Secret.add' />
            </Button>
          }
        >
          {info && info.stringData && Object.keys(info.stringData).length > 0 && <>
            <Collapse accordion items={items()} style={{ width: '100%' }} />
          </>}
        </Card>}
      <ModalForm
        title={intl.formatMessage({ id: 'cluster.resource.Secret.add' })}
        key={Object.keys(info?.stringData || {}).length}
        width="40vw"
        open={addVisible}
        clearOnDestroy={true}
        onOpenChange={setAddVisible}
        onFinish={async (values: Record<string, any>) => {
          if (!info?.stringData) {
            info.stringData = {} as Record<string, any>;
          }
          info.stringData[values.name] = values.value || '';
          setAddVisible(false);
        }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      >
        <ProFormText
          name='name'
          label={intl.formatMessage({ id: 'cluster.resource.Secret.key' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.input.text.tips' }) +
                intl.formatMessage({ id: 'cluster.resource.Secret.key' }),
            },
          ]}
        />
        <ProFormTextArea
          name='value'
          label={intl.formatMessage({ id: 'cluster.resource.Secret.value' })}
        />
      </ModalForm>
    </PageContainer>
  )
}
export default ConfigMapForm;
