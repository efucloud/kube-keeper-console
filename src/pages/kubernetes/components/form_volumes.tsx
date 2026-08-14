import { DeleteFilled, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Card, Col, List, Popconfirm, Row, Space, Typography } from 'antd';
import { ConfigMapList, IConfigMap, IIoK8sApiCoreV1Volume, IPersistentVolumeClaim, ISecret, PersistentVolumeClaimList, SecretList } from 'kubernetes-models/v1';
import React, { useEffect, useRef, useState } from 'react';
import { getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { createStyles } from 'antd-style';
import { ModalForm, ProFormInstance, ProFormSelect, ProFormSwitch, ProFormText } from '@ant-design/pro-components';
import { clusterVolumeProviderOptions } from '@/utils/options';
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getVolumeType } from '@/utils/cluster';
const { Text } = Typography;

type VolumesProps = {
  namespace: string;
  volumes: IIoK8sApiCoreV1Volume[];
  setVolumes: (volumes: IIoK8sApiCoreV1Volume[]) => void;
  timezoneSync?: boolean;
};
const useStyles = createStyles(({ token }) => {
  return {
    card: {
      '.ant-card-meta-title': {
        marginBottom: '12px',
        '& > a': {
          display: 'inline-block',
          maxWidth: '100%',
          color: token.colorTextHeading,
        },
      },
      '.ant-card-body:hover': {
        '.ant-card-meta-title > a': {
          color: token.colorPrimary,
        },
      },
      '.ant-card-body': {
        padding: '10px 10px 10px 10px',
        height: '150px',
      },
    },
    item: {
      // height: '64px',
      marginBottom: '0',
    },
    newButton: {
      width: '100%',
      height: '150px',
      color: token.colorTextSecondary,
      backgroundColor: token.colorBgContainer,
      borderColor: token.colorBorder,
    },

  };
});
const FormVolumeList: React.FC<VolumesProps> = (props) => {
  let { cluster, namespace } = getCurrentViewInfo();
  if (!namespace || namespace === '' || namespace === '-') {
    namespace = props.namespace
  }
  const formRef = useRef<ProFormInstance>(undefined);
  const colorPrimary = getColorPrimary();
  const intl = useIntl();
  const { styles } = useStyles();
  const [dataSource, setDataSource] = useState<IIoK8sApiCoreV1Volume[]>(props.volumes || []);
  const [info, setInfo] = useState<Record<string, any>>();
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [configMaps, setConfigMaps] = useState<IConfigMap[]>([]);
  const [secrets, setSecrets] = useState<ISecret[]>([]);
  const [persistentVolumeClaims, setPersistentVolumeClaims] = useState<IPersistentVolumeClaim[]>([]);
  const [provider, setProvider] = useState<string>('')

  useEffect(() => {
    props.setVolumes(dataSource);
  }, [dataSource]);
  const checkExist = (rule: any, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const names = dataSource.filter(item => item.name !== info?.name)?.map(item => item.name) || [];
      if (names.filter(item => item === value).length > 0) {
        reject(intl.formatMessage({ id: 'cluster.resource.volume.exist' }));
      } else {
        resolve();
      }
    });
  };
  useEffect(() => {
    if (provider === 'secret') {
      listSecrets()
    } else if (provider === 'configMap') {
      listConfigMaps()
    } else if (provider === 'persistentVolumeClaim') {
      listPersistentVolumeClaims();
    }
  }, [provider])
  const listConfigMaps = async () => {
    const address = `api/v1/namespaces/${namespace}/configmaps`
    const params = { cluster, address: address } as Record<string, any>;
    const fieldSelector = {} as Record<string, string>;
    fieldSelector['metadata.namespace'] = namespace;
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
    const address = `api/v1/namespaces/${namespace}/secrets`
    const params = { cluster, address: address } as Record<string, any>;
    const fieldSelector = {} as Record<string, string>;
    fieldSelector['metadata.namespace'] = namespace;
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
  const listPersistentVolumeClaims = async () => {
    const address = `api/v1/namespaces/${namespace}/persistentvolumeclaims`
    const params = { cluster, address: address } as Record<string, any>;
    const fieldSelector = {} as Record<string, string>;
    fieldSelector['metadata.namespace'] = namespace;
    if (Object.keys(fieldSelector).length > 0) {
      const fieldSelectors = [] as string[];
      for (const key in fieldSelector) {
        fieldSelectors.push(`${key}=${fieldSelector[key]}`);
      }
      params['fieldSelector'] = fieldSelectors.join(',');
    }
    const data = (await clusterGetProxy(params)) as PersistentVolumeClaimList;
    for (let i = 0; i < data.items.length; i++) {
      data.items[i].apiVersion = data.apiVersion;
      data.items[i].kind = 'PersistentVolumeClaim';
    }
    setPersistentVolumeClaims(data.items || []);
  };
  const nullData: Partial<IIoK8sApiCoreV1Volume> = {};
  const canEdit = (item: IIoK8sApiCoreV1Volume | undefined): boolean => {
    if (item && props.timezoneSync) {
      if (item.hostPath?.path === '/etc/timezone' || item.hostPath?.path === '/etc/localtime') {
        return false
      }

    }
    return true
  }
  return (
    <div>
      <List<IIoK8sApiCoreV1Volume>
        locale={{
          emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
        }}
        rowKey="name"
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
        dataSource={[nullData, ...dataSource || []]}
        renderItem={(item) => {
          if (item && item.name) {
            return (
              <List.Item key={item.name} onClick={() => setInfo(item)} className={styles.newButton}>
                <Card
                  hoverable
                  className={styles.card}
                  key={item.name}
                  style={{ position: 'relative' }}
                >
                  <div>
                    <Space orientation="vertical" size="small">
                      <Text>{intl.formatMessage({ id: `cluster.resource.volume.provider` })}:&nbsp;{intl.formatMessage({ id: `cluster.resource.volume.provider.${getVolumeType(item)}` })}</Text>
                      <Text><FormattedMessage id='cluster.resource.name' />:&nbsp;{item.name}</Text>
                      {item.secret && <>
                        <Text><FormattedMessage id='cluster.resource.volume.provider.secret' />:&nbsp;{item.secret?.secretName}</Text>
                        <Text><FormattedMessage id='cluster.resource.volume.provider.secret.defaultMode' />:&nbsp;{item.secret?.defaultMode}</Text>
                      </>}
                      {item.configMap && <>
                        <Text><FormattedMessage id='cluster.resource.volume.provider.configMap' />:&nbsp;{item.configMap?.name}</Text>
                        <Text><FormattedMessage id='cluster.resource.volume.provider.configMap.defaultMode' />:&nbsp;{item.configMap?.defaultMode}</Text>
                      </>}
                      {item.persistentVolumeClaim && <>
                        <Text><FormattedMessage id='cluster.resource.volume.provider.persistentVolumeClaim' />:&nbsp;{item.persistentVolumeClaim?.claimName}</Text>
                        <Text><FormattedMessage id='cluster.resource.volume.provider.persistentVolumeClaim.readOnly' />:&nbsp;
                          {item.persistentVolumeClaim?.readOnly ? <><FormattedMessage id='model.true' /></> : <><FormattedMessage id='model.false' /></>}</Text>
                      </>}
                      {item.hostPath && <>
                        <Text><FormattedMessage id='cluster.resource.volume.provider.hostPath' />:&nbsp;{item.hostPath?.path}</Text>
                        <Text><FormattedMessage id='cluster.resource.volume.provider.hostPath.type' />:&nbsp;{item.hostPath?.type}</Text>
                      </>}
                    </Space>
                  </div>
                  {canEdit(item) &&
                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000 }}>
                      <Space>
                        <EditOutlined style={{ color: colorPrimary }} onClick={() => {
                          if (item) {
                            let data = { ...item } as Record<string, any>;
                            if (item.configMap) {
                              data['provider'] = 'configMap'
                              data['configMapName'] = item.configMap?.name
                              data['defaultMode'] = item.configMap.defaultMode
                            } else if (item.secret) {
                              data['provider'] = 'secret'
                              data['secretName'] = item.secret.secretName
                              data['defaultMode'] = item.secret.defaultMode
                            } else if (item.persistentVolumeClaim) {
                              data['provider'] = 'persistentVolumeClaim'
                              data['claimName'] = item.persistentVolumeClaim.claimName
                              data['readOnly'] = item.persistentVolumeClaim.readOnly
                            } else if (item.hostPath) {
                              data['provider'] = 'hostPath'
                              data['hostPath'] = item.hostPath.path
                              data['hostPathType'] = item.hostPath.type
                            } else if (item.nfs) {
                              data['provider'] = 'nfs'
                              data['server'] = item.nfs.server
                              data['path'] = item.nfs.path
                              data['readOnly'] = item.nfs.readOnly
                            } else if (item.csi) {
                              data['provider'] = 'csi'
                              data['driver'] = item.csi.driver
                              data['fsType'] = item.csi.fsType
                              data['readOnly'] = item.csi.readOnly
                              data['volumeAttributes'] = item.csi.volumeAttributes
                              data['nodePublishSecretRef'] = item.csi.nodePublishSecretRef?.name
                            }
                            setProvider(data['provider']);
                            setInfo(data);
                          }
                          setDrawerVisible(true);
                        }} />
                        <Popconfirm
                          key={item.name + '--delete'}
                          title=""
                          description={
                            intl.formatMessage({
                              id: 'pages.operation.delete.description',
                            }) +
                            intl.formatMessage({ id: 'cluster.resource.workload.volumes' }) +
                            '【' +
                            item.name +
                            '】'
                          }
                          onConfirm={() => {
                            setDataSource((prev) => prev.filter((item) => item.name !== item.name));
                            setInfo(undefined);
                          }}
                          okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
                          cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
                        > <DeleteFilled style={{ color: 'red' }} /></Popconfirm>
                      </Space>
                    </div>}
                </Card>
              </List.Item>
            );
          }
          return (
            <List.Item key="add">
              <Button
                type="dashed"
                className={styles.newButton}
                onClick={() => {
                  setInfo(undefined);
                  setDrawerVisible(true);
                }}
              >
                <PlusOutlined style={{ color: colorPrimary }} />
                <span style={{ color: colorPrimary }}>
                  <FormattedMessage id="cluster.resource.workload.volumes.add" />
                </span>
              </Button>
            </List.Item>
          );
        }}
      />
      <ModalForm
        key={props.volumes.length + info?.name}
        formRef={formRef}
        title={info?.name ? `${intl.formatMessage({ id: 'cluster.resource.update' })}【${info.name}】` : <FormattedMessage id="cluster.resource.workload.volumes.add" />}
        width="40vw"
        open={drawerVisible}
        clearOnDestroy={true}
        onOpenChange={setDrawerVisible}
        request={async () => {
          if (!info) return { defaultMode: '0644' };
          // 确保 provider 字段被包含在初始化数据中
          let initData = { ...info };
          // 如果 info 是原始 volume 对象（没有 provider 字段），手动补充
          if (!initData.provider) {
            if (info.configMap) {
              initData.provider = 'configMap';
              initData.configMapName = info.configMap.name;
              initData.defaultMode = info.configMap.defaultMode;
            } else if (info.secret) {
              initData.provider = 'secret';
              initData.secretName = info.secret.secretName;
              initData.defaultMode = info.secret.defaultMode;
            } else if (info.persistentVolumeClaim) {
              initData.provider = 'persistentVolumeClaim';
              initData.claimName = info.persistentVolumeClaim.claimName;
              initData.readOnly = info.persistentVolumeClaim.readOnly;
            } else if (info.hostPath) {
              initData.provider = 'hostPath';
              initData.hostPath = info.hostPath.path;
              initData.hostPathType = info.hostPath.type;
            } else if (info.nfs) {
              initData.provider = 'nfs';
              initData.server = info.nfs.server;
              initData.path = info.nfs.path;
              initData.readOnly = info.nfs.readOnly;
            } else if (info.csi) {
              initData.provider = 'csi';
              initData.driver = info.csi.driver;
              initData.path = info.csi.path; // 注意：这里你代码里写的是 path，但 CSI 应该是 volumeAttributes？需确认
              initData.readOnly = info.csi.readOnly;
              initData.nodePublishSecretRef = info.csi.nodePublishSecretRef?.name;
            }
          }
          return initData;
        }}
        onFinish={async (values: any) => {

          const name = values['name'];
          const provider = values['provider']
          if (provider === 'emptyDir') {
            setDataSource(prev => [...prev.filter(item => item.name !== info?.name), { name, emptyDir: {} }])
          } else if (provider === 'secret') {
            setDataSource(prev => [...prev.filter(item => item.name !== info?.name), { name, secret: { secretName: values['secretName'], defaultMode: values['defaultMode'] || '0644' } }])
          } else if (provider === 'configMap') {
            setDataSource(prev => [...prev.filter(item => item.name !== info?.name), { name, configMap: { name: values['configMapName'], defaultMode: values['defaultMode'] || '0644' } }])
          } else if (provider === 'persistentVolumeClaim') {
            setDataSource(prev => [...prev.filter(item => item.name !== info?.name), { name, persistentVolumeClaim: { claimName: values['claimName'], readOnly: values['readOnly'] } }])
          } else if (provider === 'hostPath') {
            setDataSource(prev => [...prev.filter(item => item.name !== info?.name), { name, hostPath: { path: values['hostPath'], type: values['hostPathType'] } }])
          } else if (provider === 'nfs') {
            setDataSource(prev => [...prev.filter(item => item.name !== info?.name), { name, nfs: { server: values['server'], path: values['path'], readOnly: values['readOnly'] } }])
          } else if (provider === 'csi') {
            setDataSource(prev => [...prev.filter(item => item.name !== info?.name), { name, csi: { driver: values['driver'], path: values['path'], readOnly: values['readOnly'] } }])
          }
          setDrawerVisible(false);
          setInfo(undefined);
          setProvider('');
          formRef.current?.resetFields();
        }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}
      >
        <Row gutter={64}>
          <Col span={24}>
            <ProFormText
              label={intl.formatMessage({ id: 'cluster.resource.name' })}
              name="name"
              rules={[
                {
                  max: 255,
                  message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 255 }),
                },
                {
                  required: true,
                  message:
                    intl.formatMessage({ id: 'pages.input.text.tips' }) +
                    intl.formatMessage({ id: 'cluster.resource.name' }),
                },
                {
                  message: <FormattedMessage id="cluster.resource.data.format.invalid" />,
                  pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                },
                { validator: checkExist }
              ]}
              placeholder={`${intl.formatMessage({ id: 'pages.input.example' })}: eucloud-volume`}
            />
          </Col>
          <Col span={24}>
            <ProFormSelect
              name='provider'
              label={intl.formatMessage({ id: 'cluster.resource.volume.provider' })}
              options={clusterVolumeProviderOptions}
              onChange={(value: string) => {
                setProvider(value)
              }}
              rules={[
                {
                  required: true,
                  message:
                    intl.formatMessage({ id: 'pages.select.text.tips' }) +
                    intl.formatMessage({ id: 'cluster.resource.volume.provider' }),
                },
              ]}
            />
          </Col>
          {provider === 'secret' && <>
            <Col span={24}>
              <ProFormSelect
                fieldProps={{
                  showSearch: true,
                  filterOption: true,
                  allowClear: true,
                }}
                name='secretName'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.secret' })}
                placeholder={intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.secret' })}
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.secret' }) },
                ]}
                options={secrets.map(item => { return { label: item.metadata?.name, value: item.metadata?.name } }) || []}
              />
            </Col>
            <Col span={24}>
              <ProFormText
                rules={[{
                  max: 10,
                  message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 10 }),
                },]}
                name='defaultMode'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.secret.defaultMode' })}
                placeholder={intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.secret.defaultMode' })}
              />
            </Col>
          </>}
          {provider === 'configMap' && <>
            <Col span={24}>
              <ProFormSelect
                fieldProps={{
                  showSearch: true,
                  filterOption: true,
                  allowClear: true,
                }}
                name='configMapName'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.configMap' })}
                placeholder={intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.configMap' })}
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.configMap' }) },
                ]}
                options={configMaps.map(item => { return { label: item.metadata?.name, value: item.metadata?.name } }) || []}
              />
            </Col>
            <Col span={24}>
              <ProFormText
                name='defaultMode'
                rules={[{
                  max: 10,
                  message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 10 }),
                },]}
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.configMap.defaultMode' })}
                placeholder={intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.configMap.defaultMode' })}
              />
            </Col>
          </>}
          {provider === 'persistentVolumeClaim' && <>
            <Col span={24}>
              <ProFormSelect
                fieldProps={{
                  showSearch: true,
                  filterOption: true,
                  allowClear: true,
                }}
                name='claimName'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.persistentVolumeClaim' })}
                placeholder={intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.persistentVolumeClaim' })}
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.persistentVolumeClaim' }) },
                ]}
                options={persistentVolumeClaims.map(item => { return { label: item.metadata?.name, value: item.metadata?.name } }) || []}
              />
            </Col>
            <Col span={24}>
              <ProFormSwitch
                name='readOnly'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.persistentVolumeClaim.readOnly' })}
              />
            </Col>
          </>}
          {provider === 'hostPath' && <>
            <Col span={24}>
              <ProFormText
                fieldProps={{
                  allowClear: true,
                }}
                name='hostPath'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.hostPath' })}
                placeholder={intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.hostPath' })}
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.hostPath' }) },
                ]}
              />
            </Col>
            <Col span={24}>
              <ProFormSelect
                name='hostPathType'
                fieldProps={{
                  showSearch: true,
                  filterOption: true,
                  allowClear: true,
                }}
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.hostPath.type' })}
                options={["", "DirectoryOrCreate", "Directory", "FileOrCreate", "File", "Socket", "CharDevice", "BlockDevice"]}
              />
            </Col>
          </>}
          {provider === 'nfs' && <>
            <Col span={24}>
              <ProFormText
                fieldProps={{
                  allowClear: true,
                }}
                name='server'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.nfs.server' })}
                placeholder={intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.nfs.server' })}
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.nfs.server' }) },
                ]}
              />
            </Col>
            <Col span={24}>
              <ProFormText
                fieldProps={{
                  allowClear: true,
                }}
                name='path'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.nfs.path' })}
                placeholder={intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.nfs.path' })}
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.nfs.path' }) },
                ]}
              />
            </Col>
            <Col span={24}>
              <ProFormSwitch
                name='readOnly'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.nfs.readOnly' })}
              />
            </Col>
          </>}
          {provider === 'csi' && <>
            <Col span={24}>
              <ProFormText
                fieldProps={{
                  allowClear: true,
                }}
                name='driver'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.csi.driver' })}
                placeholder={intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.csi.driver' })}
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.csi.driver' }) },
                ]}
              />
            </Col>
            <Col span={24}>
              <ProFormText
                fieldProps={{
                  allowClear: true,
                }}
                name='path'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.nfs.path' })}
                placeholder={intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.nfs.path' })}
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'pages.input.text.tips' }) + intl.formatMessage({ id: 'cluster.resource.volume.provider.nfs.path' }) },
                ]}
              />
            </Col>
            <Col span={24}>
              <ProFormSwitch
                name='readOnly'
                label={intl.formatMessage({ id: 'cluster.resource.volume.provider.nfs.readOnly' })}
              />
            </Col>
          </>}
        </Row>
      </ModalForm>
    </div>
  );
};
export default FormVolumeList;
