import { appendKubernetesViewQuery, base64Decode, getColorPrimary, getCurrentViewInfo, getHeight, getHelmData } from '@/utils/global';
import { PageContainer, ProDescriptions } from "@ant-design/pro-components";
import { useParams, useIntl, FormattedMessage } from "@umijs/max";
import { ReactNode, useEffect, useState } from "react";
import { Button, Card, Popconfirm, message, Dropdown, Drawer, Collapse, CollapseProps } from "antd";
import { clusterGetProxy, clusterDeleteProxy } from '@/services/cluster_proxy.api';
import { Secret } from "kubernetes-models/v1";
import { MoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { getClusterResource } from "@/utils/cluster";
import { IntlShape } from "react-intl";
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';

import Editor from '@monaco-editor/react';
import { decompressGzip } from '@/utils/global';
import { decodeBase64 } from "@/utils/crypto";
const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const { name } = useParams();
  const [info, setInfo] = useState<Secret>();
  const [decodeInfo, setDecodeInfo] = useState<Secret>();
  const intl = useIntl();
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const BaseApi = `api/v1/namespaces/${namespace}/secrets`;
  const BaseAddress = `/kubernetes/namespace/config/secrets`
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as Secret;
    setInfo(res);
    try {
      if (res) {
        const decodeData = { ...res } as Secret
        decodeData.stringData = {} as Record<string, string>;
        for (const key in decodeData.data) {
          decodeData.stringData[key] = base64Decode(decodeData.data[key]);
        }
        delete decodeData.data;
        setDecodeInfo(decodeData);
      }
    } catch (e) {
      setDecodeInfo(res);
    }
  }
  const patchVisibleReflash = (visible: boolean) => {
    setPatchLabelVisible(false);
    setResourceDrawerVisible(false);
    setEditorResource(false);
    getInfo();
  };
  useEffect(() => {
    getInfo();
  }, [name]);
  const handleRemove = async (intl: IntlShape, deploy: Secret) => {
    const params = { cluster, address: BaseApi };
    await clusterDeleteProxy(params);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    window.location.href = appendKubernetesViewQuery(BaseAddress);
    return true;
  };
  const moreItems = () => {
    let nodes = [];
    nodes.push({
      key: 'view-yaml',
      label: <a onClick={() => {
        setEditorResource(false);
        setResourceDrawerVisible(true);
      }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.view.yaml' /></a>,
    });
    if (info && info?.type !== 'helm.sh/release.v1' && info.type !== 'kubernetes.io/service-account-token') {
      nodes.push({
        key: 'edit',
        label: <a style={{ color: colorPrimary }} onClick={() => {
          window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/config/secrets/${info?.metadata?.name}/update`, { cluster: cluster, namespace: info?.metadata?.namespace })
        }}><FormattedMessage id='cluster.resource.operation.edit' /></a>
      })
      if (!(info.metadata?.ownerReferences && info.metadata?.ownerReferences?.length > 0)) {
        nodes.push({
          key: 'edit-yaml',
          label: <a onClick={() => {
            setEditorResource(true);
            setResourceDrawerVisible(true);
          }} style={{ color: colorPrimary }}><FormattedMessage id='cluster.edit.yaml' /></a>,
        });
      }
      nodes.push({
        key: 'delete',
        label: <Popconfirm
          key={info.metadata?.resourceVersion + '-delete'}
          description={intl.formatMessage({ id: 'cluster.resource.secret.delete.description' })}
          title={intl.formatMessage({ id: 'pages.operation.delete.description' }) +
            getClusterResource('Secret') + '【' + info.metadata?.name + '】'}
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

    return nodes;
  }
  const items = (): CollapseProps['items'] => {
    let nodes = [] as ReactNode[];
    const keys = Object.keys(info?.data || {});
    if (keys.length == 0) {
      return
    }
    for (let i = 0; i < keys.length; i++) {
      let lang = 'yaml'
      let content = decodeBase64(info.data[keys[i]]);
      if (keys[i].indexOf('.dockerconfigjson') > -1) {
        lang = 'json'
        content = JSON.stringify(JSON.parse(content || '{}'), null, 2);
      }
      if (keys[i].indexOf('.json') > 1) {
        lang = 'json'

      }
      if (keys[i].indexOf('.yaml.gz') > 1) {
        lang = 'yaml'
        content = decompressGzip(content)
      }
      if (info?.type === 'helm.sh/release.v1') {
        content = getHelmData(content)
        const data = JSON.parse(content)
        if (data['chart'] && data['chart']['templates']) {
          for (let i = 0; i < data['chart']['templates'].length; i++) {
            let item = data['chart']['templates'][i];
            item.data = decodeBase64(item.data)
            if (item.data) {
              data['chart']['templates'][i] = item
            }
          }
        }
        if (Object.keys(data).length > 0) {
          content = JSON.stringify(data, null, 2);
        }

      }
      const height = getHeight(content)
      nodes.push({
        key: keys[i],
        label: <>{keys[i]}</>,
        children: <Editor
          language={lang}
          options={{
            readOnly: true,
            tabSize: 2,
            insertSpaces: true,
          }}
          height={height}
          theme="vs-dark"
          defaultValue={content}
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
      })
    }
    return nodes;
  };
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

        <Button onClick={() => getInfo()}><ReloadOutlined /></Button>,
      ]}
    >
      <Card variant={'borderless'}   >
        <ProDescriptions style={{ marginBottom: 16 }} column={3}  >
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.name' />} valueType="text" fieldProps={{ style: { color: colorPrimary } }} >{info?.metadata?.name}</ProDescriptions.Item>
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.type' />} fieldProps={{ style: { color: colorPrimary } }}
            valueEnum={{
              'Opaque': {
                text: intl.formatMessage({ id: 'cluster.resource.secret.type.Opaque' }),
              },
              'IngressTLS': {
                text: intl.formatMessage({ id: 'cluster.resource.secret.type.ingressTLS' }),
              },
              'kubernetes.io/tls': {
                text: intl.formatMessage({ id: 'cluster.resource.secret.type.ingressTLS' }),
              },
              'kubernetes.io/dockerconfigjson': {
                text: intl.formatMessage({ id: 'cluster.resource.container.image.pullSecrets' }),
              },
              'kubernetes.io/service-account-token': {
                text: intl.formatMessage({ id: 'cluster.resource.secret.type.serviceAccountToken' }),
              },

            }}
          >{info?.type}</ProDescriptions.Item>
        </ProDescriptions>
        <ProDescriptions style={{ marginBottom: 16 }} column={1} >
          <ProDescriptions.Item label={<FormattedMessage id='cluster.resource.content' />}>
            {info.data && <Collapse accordion items={items()} style={{ width: '100%' }} />}
          </ProDescriptions.Item>
        </ProDescriptions>
      </Card>
    </PageContainer>}
    {patchLabelVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='labels' title={<FormattedMessage id='cluster.patch.labels' />} key='label' kind="Secret" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchLabelVisible} labels={info?.metadata?.labels || {}} />}
    <Drawer destroyOnHidden={true}
      size={drawerSize}
      resizable={{
        onResize: (newSize) => setDrawerSize(newSize),
      }}
      open={resourceDrawerVisible}
      onClose={() => setResourceDrawerVisible(false)}
      closable={true}
      title={<>{getClusterResource('Secret')}:&nbsp;&nbsp;{info?.metadata?.name}</>}
    >
      <ResourceEditor key={info?.metadata?.resourceVersion || 'edit'} edit={editorResource} address={`${BaseApi}/${name}`} kind='Secret' name={info?.metadata?.name || ''} cluster={cluster} content={decodeInfo} />
    </Drawer>
  </>
  )
};
export default DetailView;