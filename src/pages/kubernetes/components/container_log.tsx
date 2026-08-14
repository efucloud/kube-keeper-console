import { Editor } from '@monaco-editor/react';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Select, Space, Switch, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { getToken } from '@/utils/global';
import { RobotFilled } from '@ant-design/icons';

export type LogProps = {
  cluster: string;
  namespace: string;
  pod: string;
  containers: string[];
  running: boolean;
  onSelectLog?: (logQuestion: string) => void;
};

const buildLogStreamUrl = (
  cluster: string,
  namespace: string,
  pod: string,
  container: string,
  previous: boolean,
  tailLines: string,
): string => {
  return `/api/stream/cluster/${cluster}/namespaces/${namespace}/pods/${pod}/logs?previous=${previous}&container=${container}&tailLines=${tailLines}`;
};

export const PodContainerLog: React.FC<LogProps> = (props) => {
  const [container, setContainer] = React.useState(props.containers[0]);
  const orgToken = getToken();
  const [logs, setLogs] = useState('');
  const intl = useIntl();
  const [selectedText, setSelectedText] = useState<string>('');
  const editorRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [tailLines, setTailLines] = useState<string>('100');
  const [previous, setPrevious] = useState<boolean>(false);
  
  // 修改：只存储相对于编辑器视口的偏移量，不再存储绝对坐标
  const [buttonOffset, setButtonOffset] = useState<{ top: number; left: number } | null>(null);

  const startLogStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const token = orgToken?.access_token || '';
    const url = buildLogStreamUrl(
      props.cluster,
      props.namespace,
      props.pod,
      container,
      previous,
      tailLines
    );
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchLogs = async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/x-ndjson',
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          message.error(
            intl.formatMessage({ id: 'cluster.log.stream.failed' }, { status: response.status })
          );
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const payload = JSON.parse(line);
              if (typeof payload.line === 'string') {
                setLogs((prev) => prev + payload.line);
              }
            } catch (e) {
              console.warn('Invalid NDJSON line:', line);
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Log stream error:', err);
          message.error(intl.formatMessage({ id: 'cluster.log.stream.error' }));
        }
      }
    };
    fetchLogs();
  };

  useEffect(() => {
    if (props.containers.length > 0 && orgToken?.access_token) {
      setLogs('');
      startLogStream();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [container, previous, props.cluster, props.namespace, props.pod, orgToken?.access_token, tailLines]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection();
      if (selection.isEmpty()) {
        setSelectedText('');
        setButtonOffset(null);
        return;
      }

      const model = editor.getModel();
      if (model) {
        const text = model.getValueInRange(selection).trim();
        setSelectedText(text);

        if (text) {
          // 获取选区结束位置（光标位置）
          const position = selection.getEndPosition();
          
          // 【关键修改】getScrolledVisiblePosition 返回的就是相对于编辑器可视区域顶部的像素坐标
          // 它已经自动处理了滚动偏移，不需要再手动加 scrollTop 或 rect.top
          const viewPos = editor.getScrolledVisiblePosition(position);

          if (viewPos) {
            // 直接保存这个相对偏移量
            // +10px 是为了让按钮出现在选区下方一点点，避免遮挡文字
            setButtonOffset({ 
              top: viewPos.top + 25, 
              left: viewPos.left 
            });
          } else {
            setButtonOffset(null);
          }
        } else {
          setButtonOffset(null);
        }
      }
    });
  };

  // 自动滚动到底部
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const lineCount = model.getLineCount();
        editorRef.current.setPosition({ lineNumber: lineCount, column: 1 });
        editorRef.current.revealLineInCenterIfOutsideViewport(lineCount);
      }
    }
  }, [logs]);

  const handleSendToAI = () => {
    if (selectedText && props.onSelectLog) {
      props.onSelectLog(
        intl.formatMessage(
          {
            id: 'copilot.log.analysis',
            defaultMessage:
              '请分析命名空间 {namespace} 中 Pod {pod} 的容器 {container} 以下容器日志中是否存在错误或异常，如果存在请分析原因并给出解决方案：\n\n```log\n{selectedText}\n```',
          },
          {
            namespace: props.namespace,
            pod: props.pod,
            container,
            selectedText,
          }
        )
      );
    }
  };

  return (
    <>
      <Space style={{ paddingBottom: '10px' }}>
        <FormattedMessage id="cluster.resource.containers" />
        :&nbsp;
        <Select
          notFoundContent={intl.formatMessage({ id: 'pages.no.data' })}
          size="small"
          style={{ minWidth: '200px' }}
          value={container}
          options={props.containers.map((item) => ({
            value: item,
            label: item,
          }))}
          onChange={(value) => {
            setLogs('');
            setContainer(value);
          }}
        />
        <Select
          size="small"
          style={{ minWidth: '200px' }}
          value={tailLines}
          onChange={(value) => {
            setTailLines(value);
          }}
          options={[
            {
              label: intl.formatMessage({ id: 'cluster.pod.log.all' }),
              value: '',
            },
            {
              label: intl.formatMessage({ id: 'cluster.pod.log.100' }),
              value: '100',
            },
            {
              label: intl.formatMessage({ id: 'cluster.pod.log.500' }),
              value: '500',
            },
            {
              label: intl.formatMessage({ id: 'cluster.pod.log.1000' }),
              value: '1000',
            },
            {
              label: intl.formatMessage({ id: 'cluster.pod.log.5000' }),
              value: '5000',
            },
          ]}
        />
        <Switch
          checkedChildren={intl.formatMessage({ id: 'cluster.pod.log.previous' })}
          unCheckedChildren={intl.formatMessage({ id: 'cluster.pod.log.current' })}
          onChange={(value) => setPrevious(value)}
        />
      </Space>
      
      {/* 外层容器设置为 relative，作为按钮 absolute 定位的参考系 */}
      <div style={{ position: 'relative', height: '85vh' }}>
        <Editor
          height="100%"
          defaultLanguage="plaintext"
          theme="log-theme"
          value={logs}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            insertSpaces: true,
            contextmenu: false,
            selectOnLineNumbers: true,
            automaticLayout: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
          onMount={handleEditorDidMount}
        />
        
        {/* 按钮渲染逻辑 */}
        {selectedText && buttonOffset && (
          <Button
            type="primary"
            size="small"
            onClick={handleSendToAI}
            icon={<RobotFilled />}
            style={{
              position: 'absolute', // 改为 absolute，相对于父容器 div 定位
              top: `${buttonOffset.top}px`,
              left: `${buttonOffset.left}px`,
              zIndex: 100,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)', // 加点阴影更明显
            }}
          >
            {intl.formatMessage({ id: 'copilot.log.ai.diagnosis' })}
          </Button>
        )}
      </div>
    </>
  );
};

export default PodContainerLog;