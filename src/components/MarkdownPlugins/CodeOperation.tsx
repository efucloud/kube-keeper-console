import React from 'react';
import { CopyOutlined, PlayCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { Space, Tooltip, Tag } from 'antd';

import HighlightCode from '@ant-design/x-markdown';
interface CodeProps {
  code: string;
  language?: string;
  cluster?: string;
  namespace?: string;
  apiVersion?: string;
  kind?: string;
}
interface CodeOPerationProps {
  cluster: string;
  namespace?: string;
  apiVersion?: string;
  kind?: string;
  name?: string;
  resourceContent?: string;
}


const CodeComponent: React.FC<CodeProps> = ({ code, language = 'yaml', cluster, namespace, apiVersion, kind }) => {
  const handleDeploy = () => {
    if (!cluster || !namespace) {
      alert('缺少集群或命名空间信息');
      return;
    }
    alert(`部署到集群: ${cluster}, 命名空间: ${namespace}\nAPI版本: ${apiVersion}\n资源类型: ${kind}`);
    // 这里可以调用实际的部署逻辑
  };

  const handleViewLogs = () => {
    if (!kind) {
      alert('未指定资源对象');
      return;
    }
    alert(`查看资源 ${kind} 的日志`);
  };

  return (
    <div style={{ position: 'relative', margin: '16px 0' }}>
      {/* 右上角操作区 */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
          display: 'flex',
          gap: 8,
        }}
      >
        {cluster && (
          <Tag color="blue" style={{ fontSize: 12 }}>
            {cluster}
          </Tag>
        )}
        {namespace && (
          <Tag color="green" style={{ fontSize: 12 }}>
            {namespace}
          </Tag>
        )}
        {apiVersion && (
          <Tag color="purple" style={{ fontSize: 12 }}>
            API: {apiVersion}
          </Tag>
        )}
        {kind && (
          <Tag color="orange" style={{ fontSize: 12 }}>
            资源: {kind}
          </Tag>
        )}

        <Space size="small">
          <Tooltip title="部署到集群">
            <PlayCircleOutlined
              style={{ cursor: 'pointer', fontSize: 16 }}
              onClick={handleDeploy}
            />
          </Tooltip>
          {kind && (
            <Tooltip title="查看日志">
              <SettingOutlined
                style={{ cursor: 'pointer', fontSize: 16 }}
                onClick={handleViewLogs}
              />
            </Tooltip>
          )}
          <Tooltip title="复制代码">
            <CopyOutlined
              style={{ cursor: 'pointer', fontSize: 16 }}
              onClick={() => navigator.clipboard.writeText(code)}
            />
          </Tooltip>
        </Space>
      </div>

      {/* 代码高亮区域 */}
      <HighlightCode
        lang={language}
      >
        {code}
      </HighlightCode>
    </div>
  );
};

function Code(cluster: string, namespace: string, apiVersion: string, kind: string) {
  return (props: { code: string, language?: string }) => (
    <CodeComponent
      {...props}
      cluster={cluster}
      namespace={namespace}
      apiVersion={apiVersion}
      kind={kind}
    />
  );
}

export default Code;
// const DynamicCode = Code("prod-cluster", "default", "apps/v1", "Deployment");