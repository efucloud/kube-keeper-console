import { nanoid, PageContainer, ProForm, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useParams } from '@umijs/max';
import { Alert, Button, Card, Col, Divider, Empty, type FormInstance, message, Modal, Result, Row, Space, Steps, Tabs } from 'antd';
import { type FC, Fragment, useEffect, useRef, useState } from 'react';
import * as yaml from 'js-yaml';
import { saveAs } from 'file-saver';
const Update = 'update';
const Create = 'create';
import type { SelectProps } from 'antd/lib';
import { IIoK8sApiCoreV1Container, IIoK8sApiCoreV1LocalObjectReference, type IIoK8sApiCoreV1Volume } from 'kubernetes-models/v1';
import debounce from 'lodash/debounce';
import FormAnnotation from '@/pages/kubernetes/components/form_annotation';
import FormLabel from '@/pages/kubernetes/components/form_label';
import FormPodTemplate from '@/pages/kubernetes/components/form_pod_template';
import type { ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { listNamespaceImagePullSecret } from '@/services/namespace.api';
import { syncClusterNamespace } from '@/services/cluster.api';
import { canAccessClusterNamespaces } from '@/services/personal.api';
import { getClusterResource } from '@/utils/cluster';
import { getClusterApiVersions, getColorPrimary, getCurrentViewInfo, getHeight, normalizeKubernetesPath } from '@/utils/global';
import { IDeployment } from 'kubernetes-models/apps/v1';
import { Editor } from '@monaco-editor/react';
import { FormIContainer } from '@/pages/kubernetes/components/form_kubernetes_resource';
import { clusterPostProxy } from '@/services/cluster_proxy.api';
import { KubernetesResource } from '@/services/common';
import { CheckCircleFilled } from '@ant-design/icons';
import AICopilot from '@/pages/kubernetes/components/ai';


const AdvancedStepForm: FC<Record<string, any>> = () => {
  const { cluster, namespace } = getCurrentViewInfo();
  const [selectedNamespace, setSelectedNamespace] = useState<string>(namespace || '');
  const colorPrimary = getColorPrimary();
  const intl = useIntl();
  const resourceGroup = getClusterApiVersions(cluster, ['apps/v1', 'apps/v1beta1', 'apps/v1beta2'], 'Deployment');
  const [info, setInfo] = useState<IDeployment>({ apiVersion: resourceGroup.groupVersion, kind: 'Deployment', metadata: { namespace: namespace }, spec: { replicas: 1 } } as IDeployment);

  let BaseAddress = `/kubernetes/cluster/${cluster}/namespace/${selectedNamespace}/workload/deployments`;
  if (!namespace || namespace === '' || namespace === '-') {
    BaseAddress = `/kubernetes/cluster/${cluster}/workload/deployments`;
  }
  const params = useParams();
  const mode = params.action === Update ? Update : Create; // update or create
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [yamlVisible, setYamlVisible] = useState<boolean>(false);
  const baseFormRef = useRef<FormInstance>(null);
  const [searchNamespace, setSearchNamespace] = useState<string>('');
  const [namespaceList, setNamespaceList] = useState<SelectProps['options']>([]);
  const [nsImagePullSecrets, setNsImagePullSecrets] = useState<string[]>([]);
  const [timezoneSync, setTimezoneSync] = useState<boolean>(false);
  const [containers, setContainers] = useState<FormIContainer[]>([]);
  const [success, setSuccess] = useState<boolean>(false);
  const debouncedHandleChange = debounce((value) => {
    setSearchNamespace(value);
  }, 500);
  const handleChange = (newNs: string) => {
    setSelectedNamespace(newNs);
    baseFormRef.current?.resetFields(['imagePullSecrets']);
  };
  useEffect(() => {
    if (selectedNamespace) {
      setInfo((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          namespace: selectedNamespace,
        },
      }))
    }
  }, [selectedNamespace]);
  const loadNamespaceImagePullSecrets = async () => {
    if (selectedNamespace) {
      const data = (await listNamespaceImagePullSecret({

        cluster,
        namespace: selectedNamespace,
      })) as string[];
      setNsImagePullSecrets(data);
    } else {
      setNsImagePullSecrets([]);
    }
  };
  useEffect(() => {
    if (!namespace || namespace === '' || namespace === '-') {
      setSelectedNamespace('');
    }
    loadNamespaceImagePullSecrets();
  }, [selectedNamespace]);
  useEffect(() => {
    searchNamespaceList();
  }, [searchNamespace]);
  const searchNamespaceList = async () => {
    const res = (await canAccessClusterNamespaces({

      cluster: cluster,
      search: searchNamespace,
    })) as ClusterNamespaceDetailList;
    if (res) {
      let options = [] as SelectProps['options'];
      if (res.data && options) {
        for (let i = 0; i < res.data?.length; i++) {
          options.push({
            label: res.data[i].namespace,
            value: res.data[i].namespace,
          });
        }
      }
      setNamespaceList(options);
    } else {
      setNamespaceList([]);
    }
  };
  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
  };
  const updateLabels = (newLabels: Record<string, string>) => {
    setInfo((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        labels: { ...newLabels },
      },
      spec: {
        ...prev.spec,
        selector: { matchLabels: { ...newLabels } },
        template: {
          ...prev.spec?.template,
          metadata: {
            labels: { ...prev.spec?.template.metadata?.labels, ...newLabels }
          },
        }
      }
    } as IDeployment))
  };
  const updateAnnotations = (annotations: Record<string, string>) => {
    setInfo((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        annotations: annotations,
      },
    }))
  };
  const onContainersChange = (allContainers: FormIContainer[]) => {
    setContainers(allContainers)
  }
  useEffect(() => {
    let bizContainers = [] as IIoK8sApiCoreV1Container[];
    let initContainers = [] as IIoK8sApiCoreV1Container[];
    for (let i = 0; i < containers.length; i++) {
      const item = containers[i] as FormIContainer;
      if (item.isInit === true) {
        initContainers.push(item.IContainer)
      } else {
        bizContainers.push(item.IContainer)
      }
    }
    setInfo((prev) => ({
      ...prev,
      spec: {
        ...prev.spec,
        template: {
          ...prev.spec?.template,
          spec: {
            ...prev.spec?.template?.spec,
            containers: bizContainers.length > 0 ? bizContainers : undefined,
            initContainers: initContainers.length > 0 ? initContainers : undefined,
          }
        },
      }
    } as IDeployment));
  }, [containers])

  const onVolumesChange = (volumes: IIoK8sApiCoreV1Volume[]) => {
    setInfo((prev) => ({
      ...prev,
      spec: {
        ...prev.spec,
        template: {
          ...prev.spec?.template,
          spec: {
            ...prev.spec?.template.spec,
            volumes: volumes
          }
        },
      }
    } as IDeployment));
  }
  const saveDataToFile = () => {
    const dataBlob = new Blob([yaml.dump(info)], { type: 'application/json' });
    saveAs(dataBlob, `${info.metadata?.name}.yaml`);
  };
  const defaultVolumes = [
    {
      name: 'timezone',
      hostPath: { path: '/etc/localtime', type: 'File' },
    },
    {
      name: 'timezone-config', hostPath: { path: '/etc/timezone', type: 'File' },
    }
  ] as IIoK8sApiCoreV1Volume[];
  const debouncedOnValuesChange = debounce((_, values) => {
    if (values['timezoneSync'] && values['timezoneSync'] === true) {
      setTimezoneSync(true);
      // 增加挂载时区信息
      setContainers((prev) => {
        if (prev.length === 0) {
          return [];
        }

        return prev.map(container => {
          // 1. 克隆容器对象（避免修改原对象）
          const newContainer = { ...container };
          // 2. 克隆 IContainer（因为它是嵌套对象）
          newContainer.IContainer = { ...container.IContainer };
          // 3. 处理 volumeMounts
          const existingVolumeMounts = container.IContainer.volumeMounts || [];
          const filtered = existingVolumeMounts.filter(
            item => item.mountPath !== '/etc/localtime' && item.mountPath !== '/etc/timezone'
          );
          // 4. 添加新的 timezone volumeMounts
          const newVolumeMounts = [
            ...filtered,
            { name: 'timezone', mountPath: '/etc/localtime', readOnly: true },
            { name: 'timezone-config', mountPath: '/etc/timezone', readOnly: true }
          ];

          // 5. 赋值给新对象
          newContainer.IContainer.volumeMounts = newVolumeMounts;
          return newContainer;
        });
      });
      setInfo((prev) => {
        const existingVolumes = prev.spec?.template?.spec?.volumes || [];
        // 过滤掉旧的时区相关 volume（避免重复）
        const filteredVolumes = existingVolumes.filter(
          (item) =>
            item?.hostPath?.path !== '/etc/localtime' &&
            item?.hostPath?.path !== '/etc/timezone'
        );
        return {
          ...prev,
          spec: {
            ...prev.spec,
            template: {
              ...prev.spec?.template,
              spec: {
                ...prev.spec?.template?.spec,
                volumes: [...filteredVolumes, ...defaultVolumes],

              },
            },
          },
        } as IDeployment;
      });
    } else {
      setTimezoneSync(false);
    }
    if (values['name'] != undefined) {
      const appName = values['name'];
      setInfo((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          name: appName,
          labels: { ...prev.metadata?.labels, 'app': appName }
        },
        spec: {
          ...prev.spec,
          selector: { matchLabels: { ...prev.spec?.selector?.matchLabels, 'app': appName } },
          template: {
            ...prev.spec?.template,
            metadata: {
              labels: { ...prev.spec?.template?.metadata?.labels, 'app': appName }
            }
          }
        }
      } as IDeployment))
    }
    if (values['description'] != undefined) {
      setInfo((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          annotations: { ...prev.metadata?.annotations, 'efucloud.com/description': values['description'] }
        },
      }))
    }
    if (values['replicas'] !== undefined) {
      setInfo((prev) => ({
        ...prev,
        spec: {
          ...prev.spec,
          replicas: values['replicas']
        },
      } as IDeployment))
    } else {
      setInfo((prev) => ({
        ...prev,
        spec: {
          ...prev.spec,
          replicas: 1
        },
      } as IDeployment))
    }
    if (values['imagePullSecrets'] !== undefined && values['imagePullSecrets'].length > 0) {
      let imagePullSecrets = [] as IIoK8sApiCoreV1LocalObjectReference[];
      for (let i = 0; i < values['imagePullSecrets'].length; i++) {
        imagePullSecrets.push({ name: values['imagePullSecrets'][i] })
      }
      setInfo((prev) => ({
        ...prev,
        spec: {
          ...prev.spec,
          template: {
            ...prev.spec?.template,
            spec: {
              ...prev.spec?.template?.spec,
              imagePullSecrets: imagePullSecrets,
            }
          },
        },
      } as IDeployment))
    } else {
      setInfo((prev) => {
        const template = prev.spec?.template;
        if (!template) return prev; // 无 template，无需操作
        const podSpec = template.spec;
        if (podSpec) {
          const { imagePullSecrets, ...newPodSpec } = podSpec;
          return {
            ...prev,
            spec: {
              ...prev.spec,
              template: {
                ...template,
                spec: newPodSpec,
              },
            },
          } as IDeployment;
        }
        return prev;
      });
    }
  }, 1000);
  const onFinish = async () => {
    await clusterPostProxy({ cluster, address: `apis/${resourceGroup.groupVersion}/namespaces/${info.metadata?.namespace}/deployments` }, info as KubernetesResource);
    setSuccess(true)
  }
  return (
    <PageContainer
      title={getClusterResource('Deployment', false)}
      header={{ breadcrumb: {}, onBack: () => { window.history.back(); } }}
      extra={info.metadata?.name && info.metadata.namespace && <Button onClick={() => setYamlVisible(true)}><FormattedMessage id='cluster.view.yaml' /></Button>}
    >
      <Card>
        <Steps
          current={currentStep}
          onChange={(index) => { setCurrentStep(index) }}
          items={[
            {
              title: intl.formatMessage({ id: 'cluster.resource.form.step.base' }),
              description: intl.formatMessage({ id: 'cluster.resource.form.step.base.description' }),
            },
            {
              title: intl.formatMessage({ id: 'cluster.resource.form.step.container' }),
              description: intl.formatMessage({ id: 'cluster.resource.form.step.container.description' }),
            },
            {
              title: intl.formatMessage({ id: 'cluster.resource.form.step.lego' }),
              description: intl.formatMessage({ id: 'cluster.resource.form.step.lego.description' }),
            },
            {
              title: intl.formatMessage({ id: 'cluster.resource.form.step.result' }),
              description: intl.formatMessage({ id: 'cluster.resource.form.step.result.description' }),
            },
          ]}
        />
        <div style={{ textAlign: 'right', marginTop: 10 }}>
          <Space >
            {currentStep > 0 && <Button key='prev' onClick={() => {
              setCurrentStep((prev) => prev - 1 > -1 ? prev - 1 : 0)
            }}><FormattedMessage id='pages.operation.prev' /></Button>}
            {currentStep >= 0 && currentStep < 2 && <Button key='next' type='primary'
              onClick={() => {
                if (currentStep < 3 && currentStep >= 0) {
                  setCurrentStep((prev) => prev + 1);
                }
              }}
            ><FormattedMessage id='pages.operation.next' /></Button>}
            {currentStep === 2 && <Button key='commit' type='primary'
              onClick={() => {
                setCurrentStep((prev) => prev + 1);
                onFinish();
              }}
            ><FormattedMessage id='pages.operation.commit' /></Button>}
          </Space>
        </div>
        <Divider variant='dotted' style={{ padding: 2, margin: 5 }} />
        {currentStep === 0 && <>
          {info && <ProForm
            formRef={baseFormRef}
            submitter={false}
            onValuesChange={(_, values) => {
              debouncedOnValuesChange(_, values);
            }}
          >
            <Row gutter={64}>
              <Col lg={8} md={12} sm={24}>
                {namespace && (
                  <ProFormText
                    fieldProps={{
                      defaultValue: info.metadata?.namespace,
                      disabled: true,
                      style: {
                        color: '#000',
                        opacity: 1,
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                    label={intl.formatMessage({ id: 'cluster.namespace' })}
                    name="namespace"
                    disabled
                    rules={[{
                      max: 255,
                      message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 255 }),
                    },]}
                  />
                )}
                {!namespace && (
                  <>
                    <ProFormSelect
                      allowClear
                      onChange={handleChange}
                      debounceTime={500}
                      fieldProps={{
                        defaultValue: info.metadata?.namespace,
                        showSearch: true,
                        onSearch: (value) => {
                          debouncedHandleChange(value);
                        },
                        filterOption: false,
                        allowClear: true,
                        notFoundContent: (
                          <div style={{ padding: 16, textAlign: 'center' }}>
                            <Empty description={intl.formatMessage({ id: 'pages.no.data' })} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            <Button type="primary" onClick={syncNamespace}   >
                              <FormattedMessage id='cluster.namespace.sync' />
                            </Button>
                          </div>
                        ),
                      }}

                      options={namespaceList}
                      label={<FormattedMessage id="cluster.namespace" />}
                      name="namespace"
                      rules={[
                        {
                          required: true,
                          message:
                            intl.formatMessage({
                              id: 'pages.select.text.tips',
                            }) +
                            intl.formatMessage({ id: 'cluster.namespace' }),
                        },
                        {
                          message: (
                            <FormattedMessage id="cluster.resource.data.format.invalid" />
                          ),
                          pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                        },
                      ]}
                      placeholder={`${intl.formatMessage({ id: 'pages.input.example' })}: eucloud-autotest`}
                    />
                  </>
                )}
              </Col>
              <Col lg={8} md={12} sm={24}>
                <ProFormText
                  label={intl.formatMessage({ id: 'cluster.resource.name' })}
                  fieldProps={{
                    defaultValue: info.metadata?.name,
                  }}
                  rules={[{
                    max: 255,
                    message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 255 }),
                  },]}
                  name="name"
                  rules={[
                    {
                      required: true,
                      message:
                        intl.formatMessage({ id: 'pages.input.text.tips' }) +
                        intl.formatMessage({ id: 'cluster.resource.name' }),
                    },
                    {
                      message: (
                        <FormattedMessage id="cluster.resource.data.format.invalid" />
                      ),
                      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                    },
                  ]}
                  placeholder={`${intl.formatMessage({ id: 'pages.input.example' })}: eucloud-workload`}
                />
              </Col>
              <Col lg={8} md={12} sm={24}>
                <ProFormDigit
                  label={intl.formatMessage({ id: 'cluster.replicas' })}
                  fieldProps={{ defaultValue: info.spec?.replicas }}
                  name="replicas"
                />
              </Col>
              <Col lg={8} md={8} sm={24}>
                <ProFormSwitch
                  tooltip={{
                    color: colorPrimary, title: intl.formatMessage({ id: 'cluster.resource.pod.timezone.sync.with.host.description' }),
                  }}
                  fieldProps={{
                    defaultValue: timezoneSync,
                  }}
                  label={intl.formatMessage({ id: 'cluster.resource.pod.timezone.sync.with.host' })}
                  name="timezoneSync"
                />
              </Col>
              <Col lg={8} md={8} sm={24}>
                <ProFormTextArea
                  fieldProps={{
                    rows: 1,
                    defaultValue: info.metadata?.annotations ? info.metadata?.annotations['efucloud.com/description'] ? info.metadata?.annotations['efucloud.com/description'] : '' : ''
                  }}
                  label={intl.formatMessage({ id: 'cluster.resource.description' })}
                  name="description"
                  rules={[{
                    max: 255,
                    message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 255 }),
                  },]}
                />
              </Col>
              {nsImagePullSecrets && <Col lg={8} md={8} sm={24}>
                <ProFormSelect
                  fieldProps={{
                    mode: 'multiple',
                    defaultValue: info.spec?.template?.spec?.imagePullSecrets
                      ?.map((item: IIoK8sApiCoreV1LocalObjectReference) => item.name)
                      .filter((name): name is string => !!name), // 可选：过滤掉 undefined/null
                  }}
                  label={intl.formatMessage({ id: 'cluster.resource.container.image.pullSecrets' })}
                  name="imagePullSecrets"
                  options={nsImagePullSecrets?.map((item: string) => {
                    return {
                      label: item,
                      value: item,
                    };
                  })}
                />
              </Col>}
            </Row>
            <Tabs
              items={[
                {
                  label: intl.formatMessage({ id: 'cluster.resource.labels' }),
                  key: 'labels',
                  children: (
                    <FormLabel labels={info.metadata?.labels || {}} setLabels={updateLabels} />
                  ),
                },
                {
                  label: intl.formatMessage({ id: 'cluster.resource.annotations' }),
                  key: 'annotations',
                  children: (
                    <FormAnnotation annotations={info?.metadata?.annotations || {}} setAnnotations={updateAnnotations} />
                  ),
                },
              ]}
            />
          </ProForm>}
        </>}
        {currentStep === 1 && <>
          {(!info.metadata?.namespace || !info.metadata?.name) && <>
            <div style={{ textAlign: 'center' }}>
              <Alert title={<FormattedMessage id='cluster.resource.form.step.base.first' />} type="error" />
            </div>
          </>}
          {info.metadata?.namespace && info.metadata.name &&
            <FormPodTemplate
              key='pod-template'
              namespace={info.metadata?.namespace}
              onContainersChange={onContainersChange}
              action={mode}
              containers={containers}
              volumes={info?.spec?.template?.spec?.volumes || []}
              onVolumesChange={onVolumesChange}
              timezoneSync={timezoneSync}
            />}
        </>}
        {currentStep === 2 && <>
          {(!info.metadata?.namespace || !info.metadata?.name) && <>
            <div style={{ textAlign: 'center' }}>
              <Alert title={<FormattedMessage id='cluster.resource.form.step.base.first' />} type="error" />
            </div>
          </>}
          {info.metadata?.namespace && info.metadata.name && info.spec?.template.spec?.containers.length == 0 && <>
            <div style={{ textAlign: 'center' }}>
              <Alert title={<FormattedMessage id='cluster.resource.form.step.container.first' />} type="error" />
            </div>
          </>}
          {info.metadata?.namespace && info.metadata.name && <Tabs
            tabBarGutter={2}
            tabPlacement="start"
            items={[
              {
                label: intl.formatMessage({
                  id: 'cluster.resource.container.form.strategy',
                }),
                key: 'strategy',
                children: <></>,
              },
              {
                label: intl.formatMessage({
                  id: 'cluster.resource.container.form.affinity',
                }),
                key: 'affinity',
                children: <></>,
              },
              {
                label: intl.formatMessage({
                  id: 'cluster.resource.container.form.tolerations',
                }),
                key: 'tolerations',
                children: <></>,
              },
              {
                label: intl.formatMessage({
                  id: 'cluster.resource.container.form.dns',
                }),
                key: 'dns',
                children: <></>,
              },
            ]}
          />}
        </>}
        {currentStep === 3 && <>
          {success && <Result
            icon={
              <CheckCircleFilled style={{ color: '#52c41a', fontSize: 40 }} />
            }
            title={
              <p style={{ fontSize: 20 }}>
                {intl.formatMessage({ id: 'pages.operation.create' }) +
                  `【${info?.metadata?.name}】` +
                  intl.formatMessage({
                    id: 'pages.operation.create.success',
                  })}
              </p>
            }
            style={{
              maxWidth: '40vw',
              margin: '0 auto',
              padding: '2px 0 8px',
            }}
            extra={
              <Fragment>
                <Button type="primary"
                  onClick={() => {
                    window.location.href = normalizeKubernetesPath(`/kubernetes/cluster/${cluster}/namespace/${info.metadata?.namespace}/workload/deployments/${info.metadata?.name}`)
                  }}
                ><FormattedMessage id='pages.operation.go.detail' /></Button>
                <Button
                  onClick={() => {
                    window.location.href = normalizeKubernetesPath(BaseAddress)
                  }}
                ><FormattedMessage id='pages.operation.go.list' /></Button>
                <Button><FormattedMessage id='cluster.resource.service.create' /></Button>
              </Fragment>
            }
          >

          </Result>}
        </>}
      </Card>
      <Modal
        key='yaml'
        title={<>{getClusterResource(info.kind)}:&nbsp;{info.metadata?.name}
          &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp;<Button size='small' onClick={() => saveDataToFile()}>
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
      <AICopilot
        view='list'
        cluster={cluster}
        namespace={namespace || ''}
        kind="Deployment"
        apiVersion={resourceGroup.groupVersion}
      />
    </PageContainer>
  );
};
export default AdvancedStepForm;
