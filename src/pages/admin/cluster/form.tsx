import { FooterToolbar, PageContainer, ProForm, type ProFormInstance, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useNavigate, useParams } from '@umijs/max';
import { Card, Col, message, Row } from 'antd';
import * as YAML from 'js-yaml';
import type { FC } from 'react';
import { useRef, useState } from 'react';
import { createCluster, getClusterById, updateCluster } from '@/services/cluster.api';
import type { ClusterCreate, ClusterDetail, ClusterUpdate } from '@/services/cluster.d';
import { getColorPrimary } from '@/utils/global';
const Update = 'update';
const Create = 'create';
import { Typography } from 'antd';
import type { AuditLogConfig, ClusterExtendConfig, MonitorPrometheusConfig } from '@/services/common';
const { Paragraph } = Typography;

const AdvancedForm: FC<Record<string, any>> = () => {
  const navigate = useNavigate();
  const intl = useIntl();
  const params = useParams();
  const mode = params.id ? Update : Create;

  const BaseAddress = `/admin/cluster`;
  const [updateConnect, setUpdateConnect] = useState<boolean>(false);
  const colorPrimary = getColorPrimary();
  const formRef = useRef<ProFormInstance>(undefined);
  const [info, setInfo] = useState<ClusterDetail>();

  const onFinish = async (values: Record<string, any>) => {
    let detail = {} as ClusterDetail;
    let extendConfig = {
      auditLogConfig: {} as AuditLogConfig,
      monitorPrometheusConfig: {} as MonitorPrometheusConfig,
    } as ClusterExtendConfig;
    if (values['prometheusAddress']) {
      extendConfig.monitorPrometheusConfig.address =
        values['prometheusAddress'];
    }
    if (values['prometheusCluster']) {
      extendConfig.monitorPrometheusConfig.cluster =
        values['prometheusCluster'];
    }
    values['extendConfig'] = extendConfig;
    if (mode === Create) {
      detail = await createCluster(

        values as ClusterCreate,
      );
    } else {
      values['updateConnect'] = updateConnect;
      values['id'] = params.id || '';
      detail = await updateCluster(

        values as ClusterUpdate,
      );
    }
    if (detail.id) {
      // 跳转到详情页
      navigate(`${BaseAddress}/detail/${detail.id}`);
    }
  };

  const onInitData = async () => {
    let initData = {} as ClusterDetail;
    if (mode !== Create) {
      const res = (await getClusterById({

        id: params.id || '',
      })) as ClusterDetail;
      initData = res;
      initData['prometheusCluster'] =
        res.extendConfig?.monitorPrometheusConfig?.cluster || '';
      initData['prometheusAddress'] =
        res.extendConfig?.monitorPrometheusConfig?.address || '';
      setInfo(initData);
    }
    return initData;
  };

  const kubeConfigChange = (kubeconfig: string) => {
    const kubeconfigContent = YAML.load(kubeconfig);
    const currentCtx = kubeconfigContent['current-context'];
    if (currentCtx) {
      const contexts = kubeconfigContent['contexts'];
      let currentCluster = undefined;
      let currentUser = '';
      contexts.forEach((item: any) => {
        if (item?.name === currentCtx) {
          currentCluster = item?.context?.cluster;
          currentUser = item?.context?.user;
        }
      })
      if (currentUser?.length > 0) {
        const users = kubeconfigContent['users'];
        users.forEach((item: any) => {
          if (item.name === currentUser) {
            const userConfig = item['user'];
            const clientCertificateData = userConfig['client-certificate-data'];
            const clientKeyData = userConfig['client-key-data'];
            const clientCertificate = Buffer.from(
              clientCertificateData,
              'base64',
            ).toString('utf-8');
            const clientKey = Buffer.from(clientKeyData, 'base64').toString(
              'utf-8',
            );
            formRef.current?.setFieldsValue({ clientCertificate, clientKey });
          }
        });
      }
      if (currentCluster) {
        const clusters = kubeconfigContent['clusters'];
        const clusterMap = {} as Record<string, any>;
        clusters.forEach((item: any) => {
          clusterMap[item.name] = item
        });
        const existCluster = clusterMap[currentCluster];
        if (existCluster) {
          const clusterConfig = existCluster['cluster'];
          let apiServer = clusterConfig['server'];
          let caData = clusterConfig['certificate-authority-data'];
          if (!caData && clusterConfig['insecure-skip-tls-verify']) {
            const tlsClusterIndex = `${currentCluster}TLSVerify`;
            const tlsCluster = clusterMap[tlsClusterIndex];
            if (tlsCluster) {
              caData = tlsCluster?.cluster['certificate-authority-data'];
              if (tlsCluster.cluster['server']) {
                apiServer = tlsCluster.cluster['server']
              }
            }
          }
          const certificateAuthority = Buffer.from(caData, 'base64').toString('utf-8');
          formRef.current?.setFieldsValue({
            apiServer,
            certificateAuthority,
          });
        }
      }
    } else {
      message.error(intl.formatMessage({ id: 'cluster.kubeconfig.not.found.current.context' }));
      return
    }
  }


  const visible = () => {
    return mode === Create || (mode === Update && updateConnect);
  };

  return (
    <ProForm
      layout="vertical"
      submitter={{
        render: (props, dom) => {
          return <FooterToolbar> {dom} </FooterToolbar>;
        },
      }}
      request={onInitData}
      onFinish={onFinish}
      formRef={formRef}
    >
      <PageContainer
        title={intl.formatMessage({ id: 'menu.cluster' })}
        header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      >
        <Card
          title={
            mode === Create
              ? intl.formatMessage({ id: 'model.cluster.create' })
              : intl.formatMessage({ id: 'model.cluster.edit' })
          }
          variant={'borderless'}
        >
          <Row gutter={64}>
            <Col lg={8} md={12} sm={24}>
              <ProFormText
                width="md"
                label={intl.formatMessage({ id: 'model.cluster.name' })}
                name="name"
                rules={[
                  {
                    max: 50,
                    message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 50 }),
                  },
                  {
                    required: true,
                    message:
                      intl.formatMessage({ id: 'pages.input.text.tips' }) +
                      intl.formatMessage({ id: 'model.cluster.name' }),
                  },
                ]}
              />
            </Col>
            <Col lg={8} md={12} sm={24}>
              <ProFormText
                width="md"
                label={intl.formatMessage({ id: 'model.cluster.code' })}
                name="code"
                rules={[
                  {
                    max: 50,
                    message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 50 }),
                  },
                  {
                    required: true,
                    message:
                      intl.formatMessage({ id: 'pages.input.text.tips' }) +
                      intl.formatMessage({ id: 'model.cluster.code' }),
                  },
                ]}
              />
            </Col>

          </Row>

          <Row gutter={{ xs: 16, sm: 32, md: 32, lg: 128 }}>
            <Col lg={24} md={24} sm={24}>
              <ProFormText
                label={intl.formatMessage({ id: 'model.cluster.apiserver' })}
                name="apiServer"
                rules={[
                  {
                    max: 255,
                    message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 255 }),
                  },
                  {
                    required: true,
                    message:
                      intl.formatMessage({ id: 'pages.input.text.tips' }) +
                      intl.formatMessage({ id: 'model.cluster.apiserver' }),
                  },
                ]}
              />
            </Col>
          </Row>
          <Row gutter={{ xs: 16, sm: 32, md: 32, lg: 128 }}>
            <Col lg={24} md={24} sm={24}>
              <ProFormTextArea
                label={intl.formatMessage({ id: 'model.description' })}
                name="description"
              />
            </Col>
          </Row>
          {mode === Update && (
            <Row gutter={64}>
              <Col lg={24} md={24} sm={24}>
                <ProFormSwitch
                  label={intl.formatMessage({
                    id: 'model.cluster.updateConnect',
                  })}
                  name="updateConnect"
                  onChange={(meta) => {
                    setUpdateConnect(meta);
                  }}
                />
              </Col>
            </Row>
          )}
          {visible() && (
            <Row gutter={64}>
              <Col lg={24} md={24} sm={24}>
                <ProFormTextArea
                  label={intl.formatMessage({ id: 'model.cluster.kubeConfig' })}
                  placeholder={intl.formatMessage({ id: 'model.cluster.kubeConfig.placeholder' })}
                  name="kubeConfig"
                  onChange={(e) => {
                    kubeConfigChange(e.target.value);
                  }}
                />
              </Col>
            </Row>
          )}
          {visible() && (
            <Row gutter={64}>
              <Col lg={24} md={24} sm={24}>
                <ProFormTextArea
                  label={intl.formatMessage({ id: 'model.cluster.certificateAuthority' })}
                  name="certificateAuthority"
                  rules={[
                    {
                      required:
                        mode === Create || (mode === Update && updateConnect),
                      message:
                        intl.formatMessage({ id: 'pages.input.text.tips' }) +
                        intl.formatMessage({
                          id: 'model.cluster.certificateAuthority',
                        }),
                    },
                  ]}
                />
              </Col>
            </Row>
          )}
          <Row gutter={64}>

            {visible() && (
              <>
                <Col lg={12} md={12} sm={24}>
                  <ProFormTextArea
                    placeholder={intl.formatMessage({ id: 'model.cluster.clientCertificate.placeholder' })}
                    label={intl.formatMessage({ id: 'model.cluster.clientCertificate' })}
                    name="clientCertificate"
                    rules={[
                      {
                        required:
                          mode === Create || (mode === Update && updateConnect),
                        message:
                          intl.formatMessage({ id: 'pages.input.text.tips' }) +
                          intl.formatMessage({
                            id: 'model.cluster.clientCertificate',
                          }),
                      },
                    ]}
                  />
                </Col>
                <Col lg={12} md={12} sm={24}>
                  <ProFormTextArea
                    placeholder={intl.formatMessage({ id: 'model.cluster.clientKey.placeholder' })}
                    label={intl.formatMessage({ id: 'model.cluster.clientKey' })}
                    name="clientKey"
                    rules={[
                      {
                        required:
                          mode === Create || (mode === Update && updateConnect),
                        message:
                          intl.formatMessage({ id: 'pages.input.text.tips' }) +
                          intl.formatMessage({ id: 'model.cluster.clientKey' }),
                      },
                    ]}
                  />
                </Col>
              </>
            )}
          </Row>
        </Card>
        <Card
          style={{ marginTop: 20 }}
        >
          <Paragraph>
            <FormattedMessage id="cluster.extend.monitor.description" />
          </Paragraph>
          <Row gutter={64}>
            <Col lg={24} md={24} sm={24}>
              <ProFormText
                label={intl.formatMessage({ id: 'cluster.prometheus.address' })}
                name="prometheusAddress"
              />
            </Col>

          </Row>
        </Card>
      </PageContainer>
    </ProForm>
  );
};
export default AdvancedForm;
