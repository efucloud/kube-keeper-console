import Editor from '@monaco-editor/react';
import { Button, Drawer, message, Modal, Space } from 'antd';
import * as yaml from 'js-yaml';
import { saveAs } from 'file-saver';
import { useState } from 'react';
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { IIoK8sApimachineryPkgApisMetaV1OwnerReference } from '@kubernetes-models/apimachinery/apis/meta/v1/OwnerReference';
import { getClusterApiVersionDetail, getHeight } from '@/utils/global';
import { ClusterServerGroup } from '@/services/kubernetes';
import { FormattedMessage, useIntl } from '@umijs/max';
export type OwnerReferencesProps = {
  cluster: string;
  namespace: string;
  ownerReferences: Array<IIoK8sApimachineryPkgApisMetaV1OwnerReference>;
  visibleView: boolean;
  setVisible: (v: boolean) => void;
  plural?: string;
  api: string;
};

const OwnerReferencesView: React.FC<OwnerReferencesProps> = (props) => {
  const intl = useIntl();
  const [content, setContent] = useState<string>('');
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const getOwnerReferenceInfo = async (address: string) => {
    const params = {

      cluster: props.cluster,
      address: address,
    } as Record<string, any>;
    const res = await clusterGetProxy(params);
    setContent(yaml.dump(res));
  };

  const saveDataToFile = (name: string) => {
    const dataBlob = new Blob([yaml.dump(content)], { type: 'application/json' });
    saveAs(dataBlob, `${name}.yaml`);
  };
  if (!props.ownerReferences || props.ownerReferences.length === 0) {
    return null;
  } else if (props.ownerReferences.length == 1) {
    const ownerReference = props.ownerReferences[0];
    let group = '';
    const sp = ownerReference.apiVersion.split('/');
    if (sp.length > 1) {
      group = sp[0];
    }
    const apiVersion = getClusterApiVersionDetail(props.
      props.cluster, group, ownerReference.apiVersion, ownerReference.kind) as ClusterServerGroup;
    const address = props.namespace
      ? `${props.api}/${apiVersion?.groupVersion}/namespaces/${props.namespace}/${apiVersion.name || props.plural}/${ownerReference.name}`
      : `${props.api}/${apiVersion?.groupVersion}/${apiVersion.name}/${ownerReference.name}`;
    getOwnerReferenceInfo(address);
    return (
      <>
        <Drawer
          destroyOnHidden={true}
          size={drawerSize}
          resizable={{
            onResize: (newSize) => setDrawerSize(newSize),
          }}
          open={props.visibleView}
          onClose={() => props.setVisible(false)}
          closable={true}
          title={<>{ownerReference.kind}:&nbsp;&nbsp;{ownerReference.name} &nbsp;&nbsp;&nbsp;&nbsp;<Button size='small' onClick={() => saveDataToFile(ownerReference.name)}>
            <FormattedMessage id="pages.operation.download" />
          </Button></>}
        >
          {content.length > 1 && <>
            <Editor
              key={ownerReference.name}
              language="yaml"
              height={getHeight(content)}
              options={{
                readOnly: true,
                tabSize: 2,
                insertSpaces: true,
              }}
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

          </>}
        </Drawer>
      </>
    );
  } else {
    return (
      <></>
    );
  }

};
export default OwnerReferencesView;
