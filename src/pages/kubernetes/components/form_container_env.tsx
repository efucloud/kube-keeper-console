import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { DeleteOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { ModalForm, ProFormSelect, ProFormText, ProList, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Empty, Popconfirm, Space } from 'antd';
import { ConfigMapList, IConfigMap, IIoK8sApiCoreV1ConfigMapKeySelector, IIoK8sApiCoreV1EnvVar, IIoK8sApiCoreV1EnvVarSource, IIoK8sApiCoreV1ObjectFieldSelector, IIoK8sApiCoreV1ResourceFieldSelector, IIoK8sApiCoreV1ResourceRequirements, IIoK8sApiCoreV1SecretKeySelector, ISecret, SecretList } from 'kubernetes-models/v1';
import React, { useEffect, useRef, useState } from 'react';

const FieldOptions = ['metadata.name', 'metadata.namespace', "metadata.labels['key']", "metadata.annotations['key']", 'spec.nodeName',
  'status.hostIP', 'status.podIP', 'spec.serviceAccountName', 'spec.containers[0].name']

type EnvFormProps = {
  namespace: string;
  envs: ContaineEnvProps[];
  setEnvs: (envs: ContaineEnvProps[]) => void;
  containerResource?: string[];
};
export type ContaineEnvProps = IIoK8sApiCoreV1EnvVar & {
  key: string | number;
  valueType: string;
};

const ContainerEnvList: React.FC<EnvFormProps> = (props) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<boolean>(false);
  const [info, setInfo] = useState<Record<string, any>>();
  const [valueType, setValueType] = useState<string>('direct');
  const { cluster } = getCurrentViewInfo();
  const [configMaps, setConfigMaps] = useState<IConfigMap[]>([]);
  const [selectedConfigMap, setSelectedConfigMap] = useState<string>();
  const [configMapKeyOptions, setConfigMapKeyOptions] = useState<string[]>([]);
  const [secrets, setSecrets] = useState<ISecret[]>([]);
  const [selectedSecret, setSelectedSecret] = useState<string>();
  const [secretKeyOptions, setSecretKeyOptions] = useState<string[]>([]);
  const action = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance>(undefined);

  const intl = useIntl();
  const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  };

  let SourceOptions = [
    { label: intl.formatMessage({ id: 'cluster.resource.container.env.valueType.direct' }), value: 'direct' },
    { label: intl.formatMessage({ id: 'cluster.resource.container.env.valueType.configMapKeyRef' }), value: 'configMapKeyRef' },
    { label: intl.formatMessage({ id: 'cluster.resource.container.env.valueType.secretKeyRef' }), value: 'secretKeyRef' },
    { label: intl.formatMessage({ id: 'cluster.resource.container.env.valueType.fieldRef' }), value: 'fieldRef' },
  ]
  if (props.containerResource && props.containerResource.length > 0) {
    SourceOptions.push({ label: intl.formatMessage({ id: 'cluster.resource.container.env.valueType.resourceFieldRef' }), value: 'resourceFieldRef' })
  }
  const checkNameExist = (rule: any, value: any, callback: any) => {
    if (props.envs) {
      let existName = props.envs.filter((item) => item.name === value);
      if (createForm) {
        if (existName.length > 0) {
          callback(
            intl.formatMessage({ id: 'cluster.resource.container.envName.exist' }),
          );
        } else {
          callback();
        }
      } else {
        if (existName.length > 1) {
          callback(
            intl.formatMessage({ id: 'cluster.resource.container.envName.exist' }),
          );
        } else {
          callback();
        }
      }

    } else {
      callback();
    }


  };
  const listConfigMaps = async () => {
    const address = `api/v1/namespaces/${props.namespace}/configmaps`
    const params = { cluster, address: address } as Record<string, any>;
    const fieldSelector = {} as Record<string, string>;
    fieldSelector['metadata.namespace'] = props.namespace;
    if (Object.keys(fieldSelector).length > 0) {
      const fieldSelectors = [] as string[];
      for (const key in fieldSelector) {
        fieldSelectors.push(`${key}=${fieldSelector[key]}`);
      }
      params['fieldSelector'] = fieldSelectors.join(',');
    }
    const data = (await clusterGetProxy(params)) as ConfigMapList;
    for (let i = 0; i < data.items.length; i++) {
      data.items[i].apiVersion = data.apiVersion;
      data.items[i].kind = 'ConfigMap';
    }
    setConfigMaps(data.items || []);
  };
  const listSecrets = async () => {
    const address = `api/v1/namespaces/${props.namespace}/secrets`
    const params = { cluster, address: address } as Record<string, any>;
    const fieldSelector = {} as Record<string, string>;
    fieldSelector['metadata.namespace'] = props.namespace;
    if (Object.keys(fieldSelector).length > 0) {
      const fieldSelectors = [] as string[];
      for (const key in fieldSelector) {
        fieldSelectors.push(`${key}=${fieldSelector[key]}`);
      }
      params['fieldSelector'] = fieldSelectors.join(',');
    }
    const data = (await clusterGetProxy(params)) as SecretList;
    for (let i = 0; i < data.items.length; i++) {
      data.items[i].apiVersion = data.apiVersion;
      data.items[i].kind = 'Secret';
    }
    setSecrets(data.items || []);
  };
  useEffect(() => {
    if (valueType === 'configMapKeyRef') {
      listConfigMaps();
    } else if (valueType === 'secretKeyRef') {
      listSecrets();
    }
  }, [valueType]);
  useEffect(() => {
    const configMapList = configMaps.filter((item) => item.metadata?.name === selectedConfigMap) as IConfigMap[]
    if (configMapList.length > 0) {
      const configMap = configMapList[0];
      setConfigMapKeyOptions(Object.keys(configMap?.data || {}) || []);
    }
  }, [selectedConfigMap]);
  useEffect(() => {
    const secretList = secrets.filter((item) => item.metadata?.name === selectedSecret) as ISecret[]
    if (secretList.length > 0) {
      const secret = secretList[0];
      setSecretKeyOptions(Object.keys(secret?.data || {}) || []);
    }
  }, [selectedSecret]);
  const columns: ProColumns<ContaineEnvProps>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.container.env.name' }),
      render: (dom, entity) => {
        return entity.name;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.container.env.valueType' }),
      dataIndex: 'valueType',
      valueType: 'select',
      valueEnum: {
        'direct': { text: <FormattedMessage id='cluster.resource.container.env.valueType.direct' /> },
        'configMapKeyRef': { text: <FormattedMessage id='cluster.resource.container.env.valueType.configMapKeyRef' /> },
        'secretKeyRef': { text: <FormattedMessage id='cluster.resource.container.env.valueType.secretKeyRef' /> },
        'resourceFieldRef': { text: <FormattedMessage id='cluster.resource.container.env.valueType.resourceFieldRef' /> },
        'fieldRef': { text: <FormattedMessage id='cluster.resource.container.env.valueType.fieldRef' /> },
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.container.env.value' }),
      render: (dom, entity) => {
        if (entity.valueType === 'direct') {
          return entity.value
        } else if (entity.valueType === 'configMapKeyRef') {
          return <> {entity.valueFrom?.configMapKeyRef?.name}/{entity.valueFrom?.configMapKeyRef?.key}</>
        } else if (entity.valueType === 'secretKeyRef') {
          return <> {entity.valueFrom?.secretKeyRef?.name}/{entity.valueFrom?.secretKeyRef?.key}</>
        } else if (entity.valueType === 'resourceFieldRef') {
          return <> {entity.valueFrom?.resourceFieldRef?.resource}/{entity.valueFrom?.resourceFieldRef?.divisor}</>
        } else if (entity.valueType === 'fieldRef') {
          return <> {entity.valueFrom?.fieldRef?.fieldPath}</>
        }
        return null;
      },
    },
    {
      title: <FormattedMessage id="pages.operation" />,
      valueType: 'option',
      align: 'center',
      render: (text, record, _, action) => {
        return <Space>
          <a
            key="editable"
            onClick={() => {
              let update = { ...record } as Record<string, any>;
              if (update.value) {
                update.valueType = 'direct';
              } else if (update.valueFrom?.configMapKeyRef) {
                update.valueType = 'configMapKeyRef';
                update['configMapKey'] = record.valueFrom?.configMapKeyRef?.key
                update['configMapName'] = record.valueFrom?.configMapKeyRef?.name
              } else if (update.valueFrom?.secretKeyRef) {
                update.valueType = 'secretKeyRef';
                update['secretKey'] = record.valueFrom?.secretKeyRef?.key
                update['secretName'] = record.valueFrom?.secretKeyRef?.name
              } else if (update.valueFrom?.resourceFieldRef) {
                update.valueType = 'resourceFieldRef';
                update['resourceFieldKey'] = record.valueFrom?.resourceFieldRef?.resource
                update['divisor'] = record.valueFrom?.resourceFieldRef?.divisor
              } else if (update.valueFrom?.fieldRef) {
                update.valueType = 'fieldRef';
                update['fieldPath'] = record.valueFrom?.fieldRef?.fieldPath
              }
              setCreateForm(false);
              setValueType(update.valueType);
              setInfo(update);
              setModalVisible(true);
            }}
          >
            <FormattedMessage id="cluster.resource.operation.edit" />
          </a>
          <Popconfirm title={intl.formatMessage({ id: 'cluster.resource.container.env.delete.title' })}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
            onConfirm={() => {
              props.setEnvs([...props.envs.filter(item => item.name !== record.name)])
            }}
          >
            <DeleteOutlined style={{ color: 'red' }} />
          </Popconfirm>
        </Space>
      },
    },
  ];
  return (
    <>
      <ProTable<ContaineEnvProps>
        key='container-env'
        scroll={{ x: 'max-content' }}
        rowKey="name"
        actionRef={action}
        dataSource={props?.envs || []}
        columns={columns}
        locale={{
          emptyText: <Empty description={intl.formatMessage({ id: 'pages.no.data' })} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
        }}
        search={false}
        toolbar={{
          actions: [
            <Button type="primary" key="add" onClick={() => {
              setModalVisible(true);
              setCreateForm(true);
            }}>
              <FormattedMessage id="pages.operation.add" />
            </Button>,
          ],
        }}
      />
      <ModalForm
        key={props.envs.length + `${createForm}` + info?.name}
        formRef={formRef}
        title={<>{createForm ? <FormattedMessage id="pages.operation.add" /> : <FormattedMessage id="pages.operation.edit" />}<FormattedMessage id='cluster.resource.container.env' /></>}
        {...formItemLayout}
        layout='horizontal'
        width="60vw"
        open={modalVisible}
        request={async () => {
          if (createForm) {
            return {};
          }
          return info || {}
        }}
        clearOnDestroy={true}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
        onOpenChange={setModalVisible}
        onFinish={async (values: Record<string, any>) => {
          let env = {} as ContaineEnvProps;
          env.name = values['name'] || undefined;
          env.key = env.name;
          const valueType = values['valueType']
          if (valueType === 'direct') {
            env.value = values['value'];
          } else if (valueType === 'configMapKeyRef') {
            env.valueFrom = { configMapKeyRef: { key: '', name: '' } as IIoK8sApiCoreV1ConfigMapKeySelector } as IIoK8sApiCoreV1EnvVarSource;
            if (env.valueFrom.configMapKeyRef) {
              env.valueFrom.configMapKeyRef.key = values['configMapKey'];
              env.valueFrom.configMapKeyRef.name = values['configMapName'];
            }
          } else if (valueType === 'secretKeyRef') {
            env.valueFrom = { secretKeyRef: { key: '', name: '' } as IIoK8sApiCoreV1SecretKeySelector } as IIoK8sApiCoreV1EnvVarSource;
            if (env.valueFrom.secretKeyRef) {
              env.valueFrom.secretKeyRef.key = values['secretKey'];
              env.valueFrom.secretKeyRef.name = values['secretName'];
            }
          } else if (valueType === 'resourceFieldRef') {
            env.valueFrom = { resourceFieldRef: { resource: '', divisor: '' } as IIoK8sApiCoreV1ResourceFieldSelector } as IIoK8sApiCoreV1EnvVarSource;
            if (env.valueFrom.resourceFieldRef) {
              let divisor = 1 as string | number;
              const k = values['resourceFieldKey'] as string;
              env.valueFrom.resourceFieldRef.resource = k;
              if (k.endsWith('.cpu')) {
                divisor = "1m"
              } else if (k.endsWith('.cpu')) {
                divisor = "1Mi"
              } else if (k.endsWith('.ephemeral-storage')) {
                divisor = "1Gi"
              }
              env.valueFrom.resourceFieldRef.divisor = values['divisor'] || divisor;
            }
          } else if (valueType === 'fieldRef') {
            env.valueFrom = { fieldRef: {} as IIoK8sApiCoreV1ObjectFieldSelector } as IIoK8sApiCoreV1EnvVarSource;
          }
          if (env.name && (env.value || env.valueFrom)) {
            props.setEnvs([...props.envs.filter(item => item.name != env.name), env])
          }
          setInfo({} as ContaineEnvProps);
          setModalVisible(false);
        }}
      >
        <ProFormText
          name='name'
          label={intl.formatMessage({ id: 'cluster.resource.container.env.name' })}
          placeholder={intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.name' })}
          rules={[
            {
              max: 255,
              message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 255 }),
            },
            { required: true, message: intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.name' }) },
            { validator: checkNameExist },
          ]}
        />
        <ProFormSelect
          label={intl.formatMessage({ id: 'cluster.resource.container.env.valueType' })}
          name="valueType"
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.select.text.tips' }) +
                intl.formatMessage({ id: 'cluster.resource.container.env.valueType' }),
            },
          ]}
          onChange={(value: string) => {
            setValueType(value)
          }}
          options={SourceOptions}
        />
        {valueType === 'direct' && <>
          <ProFormText
            name='value'
            label={intl.formatMessage({ id: 'cluster.resource.container.env.value' })}
            placeholder={intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.value' })}
            rules={[
              { required: true, message: intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.value' }) },
            ]}
          />
        </>}
        {valueType === 'configMapKeyRef' && <>
          <ProFormSelect
            name='configMapName'
            label={intl.formatMessage({ id: 'cluster.resource.container.env.value' })}
            placeholder={intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.valueType.configMapKeyRef' })}
            rules={[
              { required: true, message: intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.valueType.configMapKeyRef' }) },
            ]}
            onChange={(value: string) => {
              setSelectedConfigMap(value);
              formRef.current?.resetFields(['configMapKey'])

            }}
            options={configMaps.map(item => { return { label: item.metadata?.name, value: item.metadata?.name } })}
          />
          <ProFormSelect
            name='configMapKey'
            label={intl.formatMessage({ id: 'cluster.resource.container.env.value.key' })}
            placeholder={intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.value.key' })}
            rules={[
              { required: true, message: intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.value.key' }) },
            ]}
            options={configMapKeyOptions}
          />
        </>}

        {valueType === 'secretKeyRef' && <>
          <ProFormSelect
            name='secretName'
            label={intl.formatMessage({ id: 'cluster.resource.container.env.value' })}
            placeholder={intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.valueType.secretKeyRef' })}
            rules={[
              { required: true, message: intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.valueType.secretKeyRef' }) },
            ]}
            onChange={(value: string) => {
              setSelectedSecret(value);
              formRef.current?.resetFields(['secretKey'])

            }}
            options={secrets.map(item => { return { label: item.metadata?.name, value: item.metadata?.name } })}
          />
          <ProFormSelect
            name='secretKey'
            label={intl.formatMessage({ id: 'cluster.resource.container.env.value.key' })}
            placeholder={intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.value.key' })}
            rules={[
              { required: true, message: intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.value.key' }) },
            ]}
            options={secretKeyOptions}
          />
        </>}
        {valueType === 'resourceFieldRef' && <>
          <ProFormSelect
            name='resourceFieldKey'
            label={intl.formatMessage({ id: 'cluster.resource.container.env.value.key' })}
            placeholder={intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.value.key' })}
            rules={[
              { required: true, message: intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.value.key' }) },
            ]}
            options={props.containerResource || []}
          />
          <ProFormText
            label={intl.formatMessage({ id: 'cluster.resource.container.env.valueType.resourceFieldRef.divisor' })}
            name='divisor'
          />
        </>}
        {valueType === 'fieldRef' && <>
          <ProFormText
            name='fieldValue'
            label={intl.formatMessage({ id: 'cluster.resource.container.env.valueType.fieldRef' })}
            placeholder={intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.valueType.fieldRef' })}
            rules={[
              { required: true, message: intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.container.env.valueType.fieldRef' }) },
            ]}
            tooltip={{ placement: 'bottom', color: getColorPrimary(), title: <><ul>{FieldOptions.map((item: string) => <li>{item}</li>)}</ul></> }}
          />
        </>}
      </ModalForm >
    </>
  );
};
export default ContainerEnvList;