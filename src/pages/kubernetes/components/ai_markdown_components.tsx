// EnhancedCodeBlock.tsx
import React, { useState } from 'react';
import * as yaml from 'js-yaml';
import { CodeHighlighter } from '@ant-design/x';
import { Button, Col, Row, message } from 'antd';
import { useIntl } from '@umijs/max';
import { Editor } from '@monaco-editor/react';
import { getCurrentViewInfo, getHeight } from '@/utils/global';
import { ModalForm, ProFormSelect } from '@ant-design/pro-components';
import { canAccessClusterNamespaces } from '@/services/personal.api';
import { ClusterNamespaceDetail, ClusterNamespaceDetailList } from '@/services/cluster_namespace';
import { clusterPatchProxy, clusterPostProxy, clusterPutProxy } from '@/services/cluster_proxy.api';
import { KubernetesResource } from '@/services/common';

export interface EnhancedCodeBlockProps {
  language: string;
  code: string;
}

export type MermaidDirection = "LR" | "TD";

export const normalizeMermaidDirection = (
  code: string,
  direction: MermaidDirection
): string => {
  const content = (code || "").trim();
  if (!content) {
    return `graph ${direction}\nA[Empty]`;
  }

  if (/^graph\s+(LR|TD)\b/i.test(content)) {
    return content.replace(/^graph\s+(LR|TD)\b/i, `graph ${direction}`);
  }

  return `graph ${direction}\n${content}`;
};

export const EnhancedCodeBlock: React.FC<EnhancedCodeBlockProps> = (props) => {
  const [modalVisible, setModalVisible] = useState(false);
  const intl = useIntl();
  const [yamlContent, setYamlContent] = useState<string>('');
  const [requestMethod, setRequestMethod] = useState<string>('');
  const [requestUrl, setRequestUrl] = useState<string>('');
  const [needNamespace, setNeedNamespace] = useState<boolean>(false);
  const [namespace, setNamespace] = useState<string>('');
  const { cluster } = getCurrentViewInfo();
  // 判断是否应显示 Deploy 按钮（纯计算，无副作用）
  const shouldShowDeployButton = () => {
    if (props.language === 'yaml') {
      const firstLine = props.code.split('\n')[0];
      return firstLine.trim().includes('# RequestMethod:POST') ||
        firstLine.trim().includes('# RequestMethod:PUT') ||
        firstLine.trim().includes('# RequestMethod:PATCH');
    }
    return false
  };

  // 点击按钮时解析并设置状态
  const handleDeployClick = () => {
    const lines = props.code.split('\n');
    const firstLine = lines[0].trim();
    const newCode = lines.slice(1).join('\n');
    // 解析第一行：# RequestMethod: POST/PUT/PATCH
    if (firstLine.includes('# RequestMethod:')) {
      const splits = firstLine.split(' ');
      if (splits.length >= 3) {
        setRequestMethod(splits[1].replace(/^RequestMethod:/, ''));
        if (splits[2].startsWith('Address:')) {
          const address = splits[2].replace(/^Address:/, '');
          setRequestUrl(address);
          setNeedNamespace(address.includes('/${targetNamespace}/'));
        }
      }
    }
    setYamlContent(newCode);
    // 设置状态
    setModalVisible(true);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 'none',
      padding: '12px 0',
    }}>
      <CodeHighlighter lang={props.language}>
        {props.code}
      </CodeHighlighter>
      <div style={{ marginTop: '8px' }}>
        {shouldShowDeployButton() && (
          <Button
            size="small"
            type="primary"
            onClick={handleDeployClick}
          >
            {intl.formatMessage({ id: 'copilot.cluster.resource.deploy' })}
          </Button>
        )}
      </div>
      {modalVisible && (
        <ModalForm
          title={intl.formatMessage({ id: 'copilot.cluster.resource.push' })}
          width="70vw"
          open={modalVisible}
          onOpenChange={setModalVisible}
          initialValues={{ method: requestMethod, url: requestUrl }}
          clearOnDestroy
          onFinish={async (values: Record<string, any>) => {
            const address = requestUrl.replace('${targetNamespace}', namespace);
            try {
              const data = yaml.load(yamlContent)
              if (requestMethod === 'POST') {
                await clusterPostProxy({ cluster: cluster, address: address }, data as KubernetesResource);
                message.success(intl.formatMessage({ id: 'pages.operation.add.success' }));
              } else if (requestMethod === 'PUT') {
                await clusterPutProxy({ cluster: cluster, address: address }, data as KubernetesResource);
                message.success(intl.formatMessage({ id: 'pages.operation.update.success' }));
              } else if (requestMethod === 'PATCH') {
                await clusterPatchProxy({ cluster: cluster, address: address }, data as KubernetesResource);
                message.success(intl.formatMessage({ id: 'pages.operation.update.success' }));
              }
              setModalVisible(false);
            } catch (error) {

            }

          }}
          modalProps={{
            maskClosable: true,
            destroyOnHidden: true,
            forceRender: true,
          }}
        >
          {needNamespace &&
            <Row gutter={{ xs: 16, sm: 32, md: 32, lg: 128 }}>
              <Col span={24}>
                <ProFormSelect name='namespace' label={intl.formatMessage({ id: 'cluster.namespace' })}
                  showSearch
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: 'pages.select.text.tips' }) + intl.formatMessage({ id: 'cluster.namespace' }),
                    },
                  ]}
                  debounceTime={1000}
                  onChange={(value: string) => setNamespace(value)}
                  request={async (params) => {
                    const res = await canAccessClusterNamespaces({

                      cluster: cluster,
                      search: params?.keyWords || '',
                    }) as ClusterNamespaceDetailList;
                    const list = (res.data || []).filter((item: ClusterNamespaceDetail) => item.cluster?.code === cluster);
                    return list.map((item: ClusterNamespaceDetail) => ({
                      label: `${item.namespace} | ${item.cluster?.name}(${item.cluster?.code})`,
                      value: item.namespace,   // 值
                    }));
                  }}
                />
              </Col>
            </Row>}
          <Editor
            key="yaml"
            language="yaml"
            height='60vh'
            options={{
              tabSize: 2,
              insertSpaces: true,
            }}
            onChange={(value) => {
              setYamlContent(value || '');
            }}
            theme="vs-dark"
            defaultValue={yamlContent}
          />
        </ModalForm>
      )}
    </div>
  );
};
