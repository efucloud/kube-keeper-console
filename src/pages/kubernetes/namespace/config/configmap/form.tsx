import { ClusterNamespaceDetail, ClusterNamespaceDetailList } from "@/services/cluster_namespace";
import { clusterGetProxy, clusterPostProxy, clusterPutProxy } from "@/services/cluster_proxy.api";
import { canAccessClusterNamespaces } from "@/services/personal.api";
import { getClusterResource } from "@/utils/cluster";
import { getCurrentViewInfo, getHeight, normalizeKubernetesPath } from '@/utils/global';
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { ModalForm, ProForm, ProFormInstance, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-components";
import { FooterToolbar, PageContainer } from "@ant-design/pro-layout";
import { Editor } from "@monaco-editor/react";
import { FormattedMessage, useIntl, useParams } from "@umijs/max";
import { Button, Card, Col, Collapse, Popconfirm, Row } from "antd";
import { CollapseProps } from "antd/lib";
import { ConfigMap } from "kubernetes-models/v1";
import { ReactNode, useRef, useState } from "react";
const ConfigMapForm: React.FC = () => {
  const formRef = useRef<ProFormInstance>(undefined);
  const params = useParams();
  const action = params.action;
  const name = params.name;
  const intl = useIntl();
  const [info, setInfo] = useState<ConfigMap>({ metadata: {}, data: {} } as ConfigMap);
  const { cluster, namespace } = getCurrentViewInfo();
  const [addVisible, setAddVisible] = useState(false)
  const BaseApi = `api/v1/namespaces/${namespace}/configmaps`;
  const onFinish = async (values: Record<string, any>) => {
    if (action === 'update') {
      let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
      await clusterPutProxy(params, info) as ConfigMap;
      window.location.href = normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${info.metadata?.namespace}/config/configmaps/${info.metadata?.name}/update`)
    } else {
      if (!info?.metadata) {
        info.metadata = {}
      }
      info.metadata.name = values.metadata.name;
      info.metadata.namespace = values.metadata.namespace;
      let params = { cluster, address: `${BaseApi}` } as Record<string, any>;
      await clusterPostProxy(params, info) as ConfigMap;
      window.location.href = normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${info.metadata?.namespace}/config/configmaps/${info.metadata?.name}/update`)
    }
  };

  const items = (): CollapseProps['items'] => {
    let nodes = [] as ReactNode[];
    const keys = Object.keys(info?.data || {});
    for (let i = 0; i < keys.length; i++) {
      let lang = 'yaml'
      let content = info.data[keys[i]]
      if (keys[i].indexOf('.json') > 1) {
        lang = 'json'
        content = JSON.stringify(JSON.parse(info.data[keys[i]] || '{}'), null, 2);
      }
      const height = getHeight(content)
      nodes.push({
        key: keys[i],
        label: keys[i],
        extra: <><Popconfirm
          key={keys[i]}
          description={intl.formatMessage({ id: 'cluster.resource.ConfigMap.key.delete.description' })}
          title={intl.formatMessage({ id: 'pages.operation.delete' }) + intl.formatMessage({ id: 'cluster.resource.ConfigMap.key' }) + `【${keys[i]}】`
          }
          onConfirm={(e) => {
            e?.stopPropagation();
            setInfo(prev => {
              const newData = { ...prev.data }; // 浅拷贝
              delete newData[keys[i]];        // 彻底删除 key
              return {
                ...prev,
                data: newData
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
            insertSpaces: true,
          }}
          height={height}
          theme="vs-dark"
          defaultValue={content}
          onChange={(value) => {
            setInfo(prev => {
              const newData = { ...prev.data }; // 浅拷贝
              newData[keys[i]] = value;        // 修改 key 的值
              return {
                ...prev,
                data: newData
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
      title={intl.formatMessage({ id: `pages.operation.${action}` }) + getClusterResource('ConfigMap')}
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
              const res = await clusterGetProxy(params) as ConfigMap;
              setInfo(res);
              return res;
            } else {
              return { metadata: { namespace: namespace }, data: {}, binaryData: {} } as ConfigMap
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
              <Col lg={16} md={12} sm={24} >
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
          </Row>
        </ProForm>
      </Card>
      <Card title={<FormattedMessage id='cluster.resource.content' />}
        extra={
          <Button type="primary" onClick={() => {
            setAddVisible(true)
          }} >
            <PlusOutlined />
            <FormattedMessage id='cluster.resource.ConfigMap.add' />
          </Button>
        }
      >
        {info && info.data && Object.keys(info.data).length > 0 && <>
          <Collapse accordion items={items()} style={{ width: '100%' }} />
        </>}
      </Card>
      <ModalForm
        title={intl.formatMessage({ id: 'cluster.resource.ConfigMap.add' })}
        key={Object.keys(info?.data || {}).length}
        width="40vw"
        open={addVisible}
        clearOnDestroy={true}
        onOpenChange={setAddVisible}
        onFinish={async (values: Record<string, any>) => {
          if (!info?.data) {
            info.data = {} as Record<string, any>;
          }
          info.data[values.name] = values.value || '';
          setAddVisible(false);
        }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      >
        <ProFormText
          name='name'
          label={intl.formatMessage({ id: 'cluster.resource.ConfigMap.key' })}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.input.text.tips' }) +
                intl.formatMessage({ id: 'cluster.resource.ConfigMap.key' }),
            },
          ]}
        />
        <ProFormTextArea
          name='value'
          label={intl.formatMessage({ id: 'cluster.resource.ConfigMap.value' })}
        />
      </ModalForm>
    </PageContainer>
  )
}
export default ConfigMapForm;