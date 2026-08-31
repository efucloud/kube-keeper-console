import { ReloadOutlined } from '@ant-design/icons';
import type { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from '@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta';
import type { TypeMeta } from '@kubernetes-models/base';
import Editor from '@monaco-editor/react';
import type { RadioChangeEvent } from 'antd';
import { Button, Empty, Radio, Select, Space, message } from 'antd';
import { saveAs } from 'file-saver';
import * as yaml from 'js-yaml';
import debounce from 'lodash/debounce';
import { useEffect, useState } from 'react';
import type { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterPostProxy, clusterPutProxy } from '@/services/cluster_proxy.api';
import type { KubernetesResource } from '@/services/common';
// 非多租户版本：引入 cluster.api 中的同步方法
import { syncClusterNamespace } from '@/services/cluster.api';
// 非多租户版本：引入 personal.api 中的权限方法
import { canAccessClusterNamespaces } from '@/services/personal.api';
import { useIntl, FormattedMessage } from '@umijs/max';
import { appendKubernetesViewQuery } from '@/utils/global';

export type ResourceJsonOrYamlFormProps = {
  key: string;
  kind: string;
  scope: string;
  namespace?: string;
  apiVersion?: string;
  cluster: string;
  name: string;
  content: any;
  requestAPI: string;
  listPage: string;
  detailPage?: string;
  create: boolean;
};

const ResourceJsonOrYamlForm: React.FC<ResourceJsonOrYamlFormProps> = (props) => {
  const intl = useIntl();

  // 修复：修正了 metadata 下 name 的缩进 (2 个空格)，防止初始解析失败
  const getDefaultContent = () => {
    const base = `apiVersion: ${props.apiVersion || ''}\nkind: ${props.kind || ''}\nmetadata:\n  name: wait-change`;
    if (props.namespace) {
      return `${base}\n  namespace: ${props.namespace}\n`;
    }
    return `${base}\n`;
  };

  const [content, setContent] = useState<string>(getDefaultContent());
  const [selectedNamespace, setSelectedNamespace] = useState<string>(props?.namespace || '');
  const [userNamespaces, setUserNamespaces] = useState<ClusterNamespaceDetail[]>([]);
  const [language, setLanguage] = useState<string>('yaml');
  const [saveDisplay, setSaveDisplay] = useState<boolean>(false);
  const [searchNamespace, setSearchNamespace] = useState<string>('');

  let requestAPI = props.requestAPI;

  // 辅助函数：安全地清理资源对象 (用于创建场景)
  const cleanResourceForCreate = (data: any) => {
    if (!data) return {};

    // 确保 metadata 存在
    if (!data.metadata) {
      data.metadata = {};
    }

    // 强制设置 namespace (如果是命名空间作用域)
    if (props.scope === 'namespace' && selectedNamespace) {
      data.metadata.namespace = selectedNamespace;
    }

    // 删除系统自动生成的字段
    const fieldsToDelete = [
      'generation', 'resourceVersion', 'selfLink', 'uid',
      'finalizers', 'managedFields', 'creationTimestamp'
    ];

    fieldsToDelete.forEach(field => {
      if (data.metadata[field]) delete data.metadata[field];
    });

    // 清理特定的 annotations
    if (data.metadata.annotations) {
      const annoToDelete = [
        'kubectl.kubernetes.io/last-applied-configuration',
        'deployment.kubernetes.io/revision'
      ];
      annoToDelete.forEach(key => {
        if (data.metadata.annotations[key]) {
          delete data.metadata.annotations[key];
        }
      });
      // 如果 annotations 为空对象，也可以考虑删除它
      if (Object.keys(data.metadata.annotations).length === 0) {
        delete data.metadata.annotations;
      }
    }

    // 删除 status
    if (data.status) delete data.status;

    return data;
  };

  const onChange = (e: RadioChangeEvent) => {
    const newLang = e.target.value;

    try {
      if (newLang === 'yaml') {
        // JSON -> YAML
        const parsedData = JSON.parse(content || '{}');
        const dataToConvert = props.create ? cleanResourceForCreate(parsedData) : parsedData;
        setContent(yaml.dump(dataToConvert, { indent: 2, noRefs: true }));
      } else if (newLang === 'json') {
        // YAML -> JSON
        // 修复：增加空值处理和异常捕获
        const parsedData = yaml.load(content) as any || {};
        const dataToConvert = props.create ? cleanResourceForCreate(parsedData) : parsedData;
        setContent(JSON.stringify(dataToConvert, null, 2));
      }
    } catch (error) {
      console.error(`Failed to convert to ${newLang}:`, error);
      message.error(`格式转换失败：${newLang === 'yaml' ? 'JSON 转 YAML' : 'YAML 转 JSON'} 出错，请检查内容语法。`);
      return;
    }

    setLanguage(newLang);
  };

  // 初始化或更新内容 (非创建模式)
  useEffect(() => {
    if (props.create === false && props.content) {
      const data = { ...props.content }; // 浅拷贝避免修改原 props
      if (data?.metadata?.managedFields) {
        delete data.metadata.managedFields;
      }
      try {
        setContent(yaml.dump(data, { indent: 2, noRefs: true }));
      } catch (e) {
        console.error('Failed to dump initial data to YAML:', e);
        setContent('# Error rendering YAML');
      }
    }
  }, [props.create, props.content, props.kind, props.apiVersion]);

  // 监听内容变化，校验是否显示保存按钮
  useEffect(() => {
    let requestData: any = {};
    try {
      if (language === 'yaml') {
        // 修复：增加空值处理和异常捕获
        const parsed = yaml.load(content);
        requestData = (parsed as Record<string, any>) || {};
      } else {
        requestData = JSON.parse(content || '{}');
      }
    } catch (e) {
      // 解析中（用户正在输入），暂时不显示保存按钮
      setSaveDisplay(false);
      return;
    }

    // 校验 kind 和 apiVersion
    if (requestData?.kind === props.kind && requestData?.apiVersion) {
      setSaveDisplay(true);
    } else {
      setSaveDisplay(false);
    }
  }, [content, language, props.kind]);

  const saveDataToFile = () => {
    const extension = language === 'yaml' ? 'yaml' : 'json';
    const mimeType = language === 'yaml' ? 'application/x-yaml' : 'application/json';
    const dataBlob = new Blob([content], { type: mimeType });
    saveAs(dataBlob, `${props.name}.${extension}`);
  };

  const save = async () => {
    let requestData: any = {};
    try {
      if (language === 'yaml') {
        const parsed = yaml.load(content);
        requestData = (parsed as Record<string, any>) || {};
      } else {
        requestData = JSON.parse(content) || {};
      }
    } catch (error) {
      message.error('内容格式错误，无法保存。请检查 YAML/JSON 语法。');
      return;
    }

    // 处理 Namespace 逻辑
    if (props.scope === 'namespace' && selectedNamespace && requestData?.metadata) {
      requestData.metadata.namespace = selectedNamespace;
      // 动态替换 API 路径中的 namespace
      const apiArr = requestAPI.split('/');
      const nsIndex = apiArr.indexOf('namespaces');
      if (nsIndex !== -1 && nsIndex + 1 < apiArr.length) {
        apiArr[nsIndex + 1] = selectedNamespace;
        requestAPI = apiArr.join('/');
      }
    } else if (props.scope === 'cluster' && requestData?.metadata) {
      // 集群作用域资源不应包含 namespace
      delete requestData.metadata.namespace;
    }

    // 创建时的额外清理
    if (props.create && requestData?.metadata) {
      const fieldsToDelete = ['uid', 'resourceVersion', 'generation', 'creationTimestamp'];
      fieldsToDelete.forEach(f => {
        if (requestData.metadata[f]) delete requestData.metadata[f];
      });
    }

    try {
      // 非多租户版本：移除 organization 参数
      if (props.create) {
        await clusterPostProxy(
          {
            cluster: props.cluster,
            address: requestAPI,
          },
          requestData as KubernetesResource,
        );
        message.success('创建成功');
      } else {
        await clusterPutProxy(
          {
            cluster: props.cluster,
            address: requestAPI,
          },
          requestData as KubernetesResource,
        );
        message.success('更新成功');
      }

      // 跳转
      const targetUrl = props.create
        ? (props.detailPage ? `${props.detailPage}` : props.listPage)
        : (props.detailPage ? `${props.detailPage}/${requestData.metadata.name}` : props.listPage);

      window.location.href = appendKubernetesViewQuery(targetUrl);
    } catch (error: any) {
      console.error('Save failed:', error);
      message.error(`操作失败：${error.message || '未知错误'}`);
    }
  };

  const debouncedNamespaceChange = debounce((value) => {
    setSearchNamespace(value);
  }, 1000);

  const listNamespaces = async () => {
    try {
      // 非多租户版本：移除 organization 参数
      const params = {
        cluster: props.cluster,
        search: searchNamespace
      };
      const data = (await canAccessClusterNamespaces(params)) as ClusterNamespaceDetailList;
      setUserNamespaces(data.data || []);
    } catch (error) {
      console.error('Failed to load namespaces:', error);
      setUserNamespaces([]);
    }
  };

  useEffect(() => {
    // 当搜索词变化或初始加载时获取列表
    listNamespaces();
  }, [searchNamespace, props.cluster]);

  const syncNamespace = async () => {
    try {
      // 非多租户版本：移除 organization 参数
      await syncClusterNamespace({
        cluster: props.cluster,
      });
      message.success('命名空间同步成功');
      setSearchNamespace(''); // 触发重新加载
    } catch (error) {
      message.error('同步失败');
    }
  };

  return (
    <div key="resource-form">
      <div style={{ marginBottom: '10px' }}>
        <Space wrap>
          <Radio.Group onChange={onChange} value={language}>
            <Radio value="yaml">Yaml</Radio>
            <Radio value="json">Json</Radio>
          </Radio.Group>

          {props.create === true && props.scope === 'namespace' && !props.namespace && (
            <Select
              notFoundContent={intl.formatMessage({ id: 'pages.no.data' })}
              placeholder={intl.formatMessage({ id: 'cluster.namespace.select' })}
              showSearch={{
                filterOption: false,
                onSearch: (value) => debouncedNamespaceChange(value),
              }}
              allowClear
              size="small"
              style={{ minWidth: 280 }}
              value={selectedNamespace || undefined}
              onChange={(value) => setSelectedNamespace(value || '')}
              popupRender={(menu) => {
                if (userNamespaces.length === 0) {
                  return (
                    <div style={{ padding: 16, textAlign: 'center' }}>
                      <Empty
                        description={intl.formatMessage({ id: 'pages.no.data' })}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                      <Button type="primary" onClick={syncNamespace}>
                        <FormattedMessage id="cluster.namespace.sync" />
                      </Button>
                    </div>
                  );
                }
                return menu;
              }}
            >
              {userNamespaces.map((item) => (
                <Select.Option key={item.namespace} value={item.namespace}>
                  {item.namespace}
                </Select.Option>
              ))}
            </Select>
          )}

          {saveDisplay && (
            <>
              <Button type="primary" size="small" onClick={save}>
                <FormattedMessage id="pages.operation.save" />
              </Button>
              <Button size="small" onClick={saveDataToFile}>
                <FormattedMessage id="pages.operation.download" />
              </Button>
            </>
          )}
        </Space>
      </div>

      <Editor
        key={language} // 切换语言时重置编辑器
        language={language}
        height="90vh"
        options={{
          tabSize: 2,
          insertSpaces: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
        theme="vs-dark"
        onChange={(value) => setContent(value || '')}
        defaultValue={content}
      />
    </div>
  );
};

export default ResourceJsonOrYamlForm;
