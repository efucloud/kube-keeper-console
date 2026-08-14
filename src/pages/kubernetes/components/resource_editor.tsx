import Editor from '@monaco-editor/react';
import type { RadioChangeEvent } from 'antd';
import { Alert, Button, message, Radio, Space } from 'antd';
import { saveAs } from 'file-saver';
import * as yaml from 'js-yaml';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { clusterGetProxy, clusterPutProxy } from '@/services/cluster_proxy.api';
export type ResourceEditorProps = {
  key: string;
  cluster: string;
  kind: string;
  name: string;
  address?: string; //请求资源地址
  content: any;
  edit: boolean;
};

const ResourceEditor: React.FC<ResourceEditorProps> = (props) => {
  const intl = useIntl();
  const [content, setContent] = useState<string>('');
  const [language, setLanguage] = useState<string>('yaml');
  const [success, setSuccess] = useState<boolean>(false);
  const [key, setKey] = useState<string>(props.key);
  const onChange = (e: RadioChangeEvent) => {
    if (e.target.value === 'yaml') {
      setContent(yaml.dump(JSON.parse(content) || {}));
    } else if (e.target.value === 'json') {
      setContent(JSON.stringify(yaml.load(content), null, 2));
    }
    setLanguage(e.target.value);
  };
  useEffect(() => {
    const data = props.content;
    if (props.edit && data?.metadata?.managedFields) {
      delete data.metadata.managedFields;
    }
    delete data?.metadata?.annotations?.['kubectl.kubernetes.io/last-applied-configuration'];
    setContent(yaml.dump(data));
  }, [props.content]);
  const saveDataToFile = () => {
    if (language === 'yaml') {
      const dataBlob = new Blob([content], { type: 'application/json' });
      saveAs(dataBlob, `${props.name}.yaml`);
    } else {
      const dataBlob = new Blob([content], { type: 'application/json' });
      saveAs(dataBlob, `${props.name}.json`);
    }
  };

  const save = async () => {
    let obj = { metadata: {} as Record<string, any> };
    if (language === 'yaml') {
      obj = yaml.load(content) || {}
    } else {
      obj = JSON.parse(content) || {}
    }
    const raw = yaml.load(props.content)
    if (raw.metadata?.labels && raw.metadata?.labels?.['efucloud.com/workspace']) {
      if (!obj?.metadata?.labels) {
        obj.metadata.labels = {}
      }
      obj.metadata.labels['efucloud.com/workspace'] = raw.metadata?.labels?.['efucloud.com/workspace']
    } else {
      if (obj?.metadata) { delete obj.metadata?.labels?.['efucloud.com/workspace'] }
    }
    await clusterPutProxy({ cluster: props.cluster, address: props.address }, obj);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };
  const getInfo = async () => {
    const params = {

      cluster: props.cluster,
      address: props.address,
    } as Record<string, any>;
    const res = await clusterGetProxy(params);
    if (res.metadata?.managedFields) {
      delete res.metadata.managedFields;
    }
    if (language === 'json') {
      setContent(JSON.stringify(res, null, 2));
    } else {
      setContent(yaml.dump(JSON.parse(JSON.stringify(res, null, 2))));
    }
    if (res?.metadata?.resourceVersion) {
      setKey(res?.metadata?.resourceVersion);
    }
  };
  return (
    <div key={`${props.kind}-${key}`}>
      <div style={{ marginBottom: '10px' }}>
        <Radio.Group onChange={onChange} value={language}>
          <Radio value="yaml">Yaml</Radio>
          <Radio value="json">Json</Radio>
        </Radio.Group>
        <Space size='large'>
          <Button size='small' onClick={() => saveDataToFile()}>
            <FormattedMessage id="pages.operation.download" />
          </Button>
          {props.address && <Button size='small' onClick={() => getInfo()}>
            <FormattedMessage id="pages.operation.refresh" />
          </Button>}
          {props.edit && props.address && (
            <>
              <Button type="primary" size='small' onClick={() => save()}>
                <FormattedMessage id="cluster.resource.update" />
              </Button>
            </>
          )}
        </Space>
      </div>
      <div style={{ marginBottom: '10px' }}>
        {success && (
          <Alert
            type="success"
            title={<FormattedMessage id="cluster.pages.operation.success" />}
          />
        )}
      </div>
      {content && (
        <Editor
          key={`${language}-${key}`}
          language={language}
          options={{
            readOnly: !props.edit,
            tabSize: 2,
            insertSpaces: true,
          }}
          height="90vh"
          theme="vs-dark"
          onChange={(value) => {
            setContent(value || '');
          }}
          defaultValue={content}
          onMount={(editor, monaco) => {
            if (!props.edit) {
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
            }
          }}
        />
      )}
    </div>
  );
};
export default ResourceEditor;
