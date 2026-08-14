import { ClipboardAddon } from '@xterm/addon-clipboard';
import { FitAddon } from '@xterm/addon-fit';
import { type IImageAddonOptions, ImageAddon } from '@xterm/addon-image';
import { SerializeAddon } from '@xterm/addon-serialize';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import { Terminal } from '@xterm/xterm';
import React, { useEffect, useRef, useState } from 'react';
import '@xterm/xterm/css/xterm.css'; // 必须引入样式
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Drawer, Input, Row, Select, Space } from 'antd';
import { getColorPrimary, getToken } from '@/utils/global';
import { BugOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import { ActionType, ProList } from '@ant-design/pro-components';
import { BuiltinShellCommandDetail } from '@/services/builtin_shell_command';
import { listBuiltinShellCommand } from '@/services/builtin_shell_command.api';
export type TerminalOperation = {
  operation: string;
  data: string;
  rows: number;
  cols: number;
};
export type TerminalProps = {
  cluster: string;
  namespace: string;
  pod: string;
  containers: string[];
  disableWelcomeMessage?: boolean;
};
const customSettings: IImageAddonOptions = {
  enableSizeReports: true, // whether to enable CSI t reports (see below)
  pixelLimit: 16777216, // max. pixel size of a single image
  sixelSupport: true, // enable sixel support
  sixelScrolling: true, // whether to scroll on image output
  sixelPaletteLimit: 256, // initial sixel palette size
  sixelSizeLimit: 25000000, // size limit of a single sixel sequence
  storageLimit: 128, // FIFO storage limit in MB
  showPlaceholder: true, // whether to show a placeholder for evicted images
  iipSupport: true, // enable iTerm IIP support
  iipSizeLimit: 20000000, // size limit of a single IIP sequence
};
export const PodContainerTerminal: React.FC<TerminalProps> = (props) => {
  const colorPrimary = getColorPrimary();
  const [container, setContainer] = React.useState(props.containers[0]);
  const [command, setCommand] = React.useState('sh');
  const intl = useIntl();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef(new FitAddon()).current;
  const clipboardAddon = new ClipboardAddon();
  const imageAddon = new ImageAddon(customSettings);
  const serializeAddon = new SerializeAddon();
  const wsRef = useRef<WebSocket | null>(null);
  let ws: WebSocket;
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const orgToken = getToken();
  const [builtinCommandVisible, setBuiltinCommandVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(400);

  const actionRef = useRef<ActionType>(null);
  const debouncedCommandChange = debounce((value: string) => {
    setCommand(value.trim());
  }, 2000);
  useEffect(() => {
    if (props.containers.length > 0) {
      terminal.current = new Terminal({
        fontFamily: '"Courier New", Consolas, "Microsoft Yahei", monospace',
        allowProposedApi: true, // 👈 必须加上这一行
        cursorBlink: true,
        allowTransparency: true,
        experimentalCharAtlas: 'dynamic',
        unicodeVersion: '11',
        fontSize: 14,
        theme: {
          background: '#000000', // 黑色背景
          foreground: '#00FF00', // 绿色字体
          cursor: '#FFFFFF', // 白色光标（可选）
          cursorAccent: '#000000', // 光标突出显示颜色（通常与背景相同以达到反转效果，这里是黑色）
          selection: 'rgba(255, 255, 255, 0.3)', // 选择文本的颜色（半透明白色）
        },
      });
      terminal.current.loadAddon(fitAddon);
      terminal.current.loadAddon(new WebLinksAddon());
      terminal.current.loadAddon(serializeAddon);
      terminal.current.loadAddon(clipboardAddon);
      terminal.current.loadAddon(imageAddon);
      terminal.current.loadAddon(new WebglAddon());
      terminal.current.loadAddon(new Unicode11Addon());
      terminal.current.unicode.activeVersion = '11';
      if (terminalRef && terminalRef.current) {
        terminal.current.open(terminalRef.current);
      }

      const syncTerminalSize = () => {
        fitAddon.fit();
        if (terminal && terminal.current) {
          terminal.current.scrollToBottom();
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              operation: 'resize',
              data: '',
              rows: terminal.current.rows,
              cols: terminal.current.cols,
            }));
          }
        }
      };
      const debouncedSyncTerminalSize = debounce(syncTerminalSize, 80);
      syncTerminalSize();
      wsRef.current = new WebSocket(
        `${protocol}://${location.host}/api/ws/cluster/${props.cluster}/namespace/${props.namespace}/pod/${props.pod}/${container}/terminal?command=${command}&access_token=${orgToken.access_token}`,
      );
      wsRef.current.onopen = () => {
        syncTerminalSize();
        if (terminal && terminal.current) {
          if (!props.disableWelcomeMessage) {
            terminal.current.writeln(
              `${intl.formatMessage({ id: 'cluster.namespace' })}: ${props.namespace} Pod: ${props.pod} ${intl.formatMessage({ id: 'cluster.resource.containers' })}: ${container} ${intl.formatMessage({ id: 'cluster.resource.container.terminal.command' })}: ${command || 'sh'} `,
            );
          }

        }
      };
      wsRef.current.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data) as TerminalOperation;
          if (response.operation === 'stdout') {
            if (terminal && terminal.current) {
              terminal.current.write(response.data);
            }
          }
        } catch {
          if (terminal && terminal.current) {
            terminal.current.write(event.data);
          }
        }
      };
      // 打印所有数据
      // terminal.current.onData((data) => {
      //   console.log(data)
      // })
      wsRef.current.onerror = (error) => console.error('WebSocket error:', error);
      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed.');
      };
      // 监听窗口与容器大小变化，自动调整终端大小
      const resizeHandler = () => debouncedSyncTerminalSize();
      window.addEventListener('resize', resizeHandler);
      const terminalResizeObserver = new ResizeObserver(() => {
        debouncedSyncTerminalSize();
      });
      if (terminalRef.current) {
        terminalResizeObserver.observe(terminalRef.current);
      }
      window.visualViewport?.addEventListener('resize', resizeHandler);
      return () => {
        if (wsRef && wsRef.current) {
          wsRef.current.close();
        }
        if (terminal && terminal.current) {
          terminal.current.dispose();
        }
        debouncedSyncTerminalSize.cancel();
        terminalResizeObserver.disconnect();
        window.visualViewport?.removeEventListener('resize', resizeHandler);
        window.removeEventListener('resize', resizeHandler);
      };
    }
  }, [container, command]);
  const onTerminalInput = (data) => {
    if (wsRef && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ operation: 'stdin', data: data }));
    }
  };
  useEffect(() => {
    if (terminal && terminal.current) {
      const disposable = terminal.current.onData(onTerminalInput);
      return () => {
        disposable.dispose();
      };
    }
  }, [container, command]);
  return (
    < >
      <Space style={{ paddingBottom: '10px' }}>
        <FormattedMessage id="cluster.resource.containers" />
        :&nbsp;
        <Select
          notFoundContent={intl.formatMessage({ id: 'pages.no.data' })}
          size="small"
          style={{ minWidth: '200px' }}
          defaultValue={props.containers[0]}
          options={props.containers.map((item) => ({
            value: item,
            label: item,
          }))}
          onChange={(value) => {
            setContainer(value);
          }}
        />
        &nbsp;&nbsp;
        <FormattedMessage id="cluster.resource.container.terminal.command" />
        :&nbsp;
        <Input
          size="small"
          defaultValue={'sh'}
          placeholder={intl.formatMessage({ id: 'cluster.resource.container.terminal.command.default' })}
          onChange={(value) => {
            debouncedCommandChange(value.target.value);
          }}
        />
        <a style={{ color: colorPrimary }} onClick={() => { setBuiltinCommandVisible(true) }}>{intl.formatMessage({ id: 'builtin_command' })}</a>
        <BugOutlined style={{ color: colorPrimary }} />
        <span><FormattedMessage id='cluster.pod.terminal.tootip' key='tootip' /></span>
      </Space>
      <Row gutter={16}>
        <div
          key={`${container}-${command}`}
          ref={terminalRef}
          style={{ width: '100%', height: '85vh' }}
        />
      </Row>
      <Drawer
        destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={builtinCommandVisible}
        onClose={() => setBuiltinCommandVisible(false)}
        closable={true}
        title={intl.formatMessage({ id: 'builtin_command' })}>
        <ProList<BuiltinShellCommandDetail>
          key='command-list'
          scroll={{ x: 'max-content' }}
          actionRef={actionRef}
          rowKey="id"
          search={false}
          request={listBuiltinShellCommand}
          metas={{
            title: {
              dataIndex: 'name',
              title: intl.formatMessage({ id: 'builtin_command.name' }),
            },
            subTitle: {
              dataIndex: 'description',
              search: false,
            },
            description: {
              dataIndex: 'command',
              search: false,
            },
            actions: {
              render: (text, row) => [
                <Button
                  type='text'
                  style={{ color: colorPrimary }}
                  onClick={() => {
                    setBuiltinCommandVisible(false);
                    if (wsRef.current) {
                      wsRef.current.send(JSON.stringify({ operation: 'stdin', data: `${row.command}\r` }));
                    }
                  }}
                >
                  {intl.formatMessage({ id: 'builtin_command.use' })}
                </Button>
              ],
              search: false,
            },
          }}

          pagination={{
            showQuickJumper: true,
            showSizeChanger: true,
            locale: {
              items_per_page: intl.formatMessage({
                id: 'pages.pagination.items_per_page',
              }),
              jump_to: intl.formatMessage({ id: 'pages.pagination.jump_to' }),
              page: intl.formatMessage({ id: 'pages.pagination.page' }),
            },
          }}
          locale={{
            emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
          }}
          toolBarRender={false}
        />
      </Drawer>
    </ >
  );
};
export default PodContainerTerminal;
