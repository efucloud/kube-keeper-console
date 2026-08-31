import { appendKubernetesViewQuery, getColorPrimary, getCurrentViewInfo, getHeight } from '@/utils/global';
import { PageContainer, ProDescriptions } from "@ant-design/pro-components";
import { useParams, useIntl, FormattedMessage } from "@umijs/max";
import { useEffect, useState } from "react";
import { Button, Card, Popconfirm, message, Dropdown, Drawer, Collapse, CollapseProps } from "antd";
import { clusterGetProxy, clusterDeleteProxy } from '@/services/cluster_proxy.api';
import { ConfigMap } from "kubernetes-models/v1";
import { MoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { getClusterResource } from "@/utils/cluster";
import { IntlShape } from "react-intl";
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';

import Editor from '@monaco-editor/react';


const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const { name } = useParams();
  const [info, setInfo] = useState<ConfigMap>();
  const intl = useIntl();
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const BaseApi = `api/v1/namespaces/${namespace}/configmaps`;
  const BaseAddress = `/kubernetes/namespace/config/configmaps`
  const getInfo = async () => {
    let params = { cluster, address: `${BaseApi}/${name}` } as Record<string, any>;
    const res = await clusterGetProxy(params) as ConfigMap;
    setInfo(res);
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
  const handleRemove = async (intl: IntlShape, deploy: ConfigMap) => {
    const params = { cluster, address: BaseApi };
    await clusterDeleteProxy(params);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    window.location.href = appendKubernetesViewQuery(BaseAddress);
    return true;
  };
  const moreItems = () => {
    let nodes = [];
    if (info && info.metadata?.name !== 'kube-root-ca.crt') {
      nodes.push({
        key: 'edit',
        label: <a style={{ color: colorPrimary }} onClick={() => {
          window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/config/configmaps/${info?.metadata?.name}/update`, { cluster: cluster, namespace: info?.metadata?.namespace })
        }}><FormattedMessage id='cluster.resource.operation.edit' /></a>
      })
    }
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
            description={intl.formatMessage({ id: 'cluster.resource.ConfigMap.delete.description' })}
            title={intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              getClusterResource('ConfigMap') + '【' + info.metadata?.name + '】'}
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
  const items = (): CollapseProps['items'] => {
    let nodes = [] as CollapseProps['items'][];
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
        </ProDescriptions>
        <ProDescriptions style={{ marginBottom: 16 }} column={1} title={<FormattedMessage id='cluster.resource.content' />} >
          <Collapse accordion items={items()} style={{ width: '100%' }} />
        </ProDescriptions>
      </Card>
    </PageContainer>}
    {patchLabelVisible && <PatchLabels setVisible={patchVisibleReflash} patchType='labels' title={<FormattedMessage id='cluster.patch.labels' />} key='label' kind="ConfigMap" address={`${BaseApi}/${name}`} cluster={cluster} name={info?.metadata?.name || ''} visible={patchLabelVisible} labels={info?.metadata?.labels || {}} />}
    <Drawer destroyOnHidden={true}
      size={drawerSize}
      resizable={{
        onResize: (newSize) => setDrawerSize(newSize),
      }}
      open={resourceDrawerVisible}
      onClose={() => setResourceDrawerVisible(false)}
      closable={true}
      title={<>{getClusterResource('ConfigMap')}:&nbsp;&nbsp;{info?.metadata?.name}</>}
    >
      <ResourceEditor key={info?.metadata?.resourceVersion || 'edit'} edit={editorResource} address={`${BaseApi}/${name}`} kind='ConfigMap' name={info?.metadata?.name || ''} cluster={cluster} content={info} />
    </Drawer>
  </>
  )
};
export default DetailView;