import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { FitAddon } from '@xterm/addon-fit';
import { type IImageAddonOptions, ImageAddon } from '@xterm/addon-image';
import { SerializeAddon } from '@xterm/addon-serialize';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import { Terminal } from '@xterm/xterm';
import { Drawer, Space, Tabs } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import type { TableListPagination } from '@/services/common.d';
import type { TerminalAuditLogDetail } from '@/services/terminal_audit_log';
import { listTerminalAuditLog } from '@/services/terminal_audit_log.api';
import { getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import '@xterm/xterm/css/xterm.css';
import { SystemUser } from '@/components';
import { FileDoneOutlined, LineChartOutlined, OrderedListOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

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
const PodTerminalAuditLogTableList: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const termRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(new FitAddon()).current;
  const clipboardAddon = new ClipboardAddon();
  const imageAddon = new ImageAddon(customSettings);
  const serializeAddon = new SerializeAddon();
  const unicode11Addon = new Unicode11Addon();
  /** 新建窗口的弹窗 */
  const actionRef = useRef<ActionType>(null);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [info, setInfo] = useState<TerminalAuditLogDetail>();
  /** 国际化配置 */
  const intl = useIntl();
  const { cluster, namespace } = getCurrentViewInfo();
  useEffect(() => {
    if (info?.id) {
      // 检查 ref 是否已绑定到 DOM 元素
      if (!termRef.current) {
        return;
      }
      // 初始化终端
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
      terminal.current.loadAddon(unicode11Addon);
      terminal.current.loadAddon(serializeAddon);
      terminal.current.loadAddon(clipboardAddon);
      terminal.current.loadAddon(imageAddon);
      terminal.current.open(termRef.current);
      terminal.current.loadAddon(new WebglAddon());
      terminal.current.writeln(info?.content || '');
      fitAddon.fit();
      return () => {
        terminal.current.dispose();
      };
    }
  }, [info]);
  const columns: ProColumns<TerminalAuditLogDetail>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.containers' }),
      dataIndex: 'container',

    },
    {
      title: intl.formatMessage({ id: 'model.user.username' }),
      sorter: false,
      render: (dom, entity) => {
        return (
          <>
            {entity?.account && (
              <SystemUser
                key={entity?.account?.id}
                enable={entity.account?.enable}
                avatar={entity?.account?.avatar}
                username={entity?.account?.username || ''}
                nickname={entity?.account?.nickname}
                jobNumber={entity?.account?.jobNumber}
              />
            )}
          </>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.namespace' }),
      dataIndex: 'namespace',
      hidden: namespace ? true : false,
      valueType: 'text',
    },
    {
      title: intl.formatMessage({ id: 'cluster.workload.pods' }),
      dataIndex: 'podName',
      valueType: 'text',
    },
    {
      title: intl.formatMessage({ id: 'model.time' }),
      search: false,
      sorter: false,
      render: (_, record) => {
        let nodes = [];
        nodes.push(<span key="start">{dayjs(record.startTime).format('YYYY-MM-DD HH:mm:ss')}</span>);
        nodes.push(<span key="end">{dayjs(record.endTime).format('YYYY-MM-DD HH:mm:ss')}</span>);
        return <Space orientation='vertical'>{nodes}</Space>;
      },
    },

    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      width: 60,
      render: (_, record) => {
        const nodes = [
          <span
            key="history"
            onClick={() => {
              setInfo(record);
              setDrawerVisible(true);
            }}
          >
            <FileDoneOutlined style={{ color: colorPrimary }} />
          </span>
        ];
        return <Space>{nodes}</Space>;

      },
    }
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.pod.terminal.auditlog' })}
    >
      <ProTable<TerminalAuditLogDetail, TableListPagination>
        key='terminal-audit-log'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey="id"
        search={{
          showHiddenNum: true,
        }}
        params={{

          cluster: cluster,
          namespace: namespace,
        }}
        request={listTerminalAuditLog}
        columns={columns}
        rowSelection={false}
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
      />
      <Drawer
        destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setInfo(undefined);
        }}
        closable={true}
      >
        <Tabs

          items={[
            {
              key: 'history',
              label: intl.formatMessage({ id: 'cluster.resource.container.log' }),
              children: <div
                key={info?.id}
                ref={termRef}
                style={{ width: '100%', height: '88vh' }}
              />
            },
            {
              key: 'command',
              label: intl.formatMessage({ id: 'cluster.resource.container.terminal.command' }),
              children: <ProTable
                search={false}
                toolBarRender={false}
                pagination={false}
                request={async () => {
                  const commands = info?.commands || {} as Record<string, string>;
                  const list = [];
                  // 1. 获取所有 [time, command] 对
                  const entries = Object.entries(commands || {});
                  // 2. 按时间字符串排序（升序：早 → 晚）
                  entries.sort((a, b) => {
                    const timeA = dayjs(a[0]); // a[0] 是时间字符串
                    const timeB = dayjs(b[0]);
                    return timeA - timeB; // 升序：旧的在前，新的在后
                  });
                  // 3. 转换为格式化后的列表
                  for (const [timeKey, commandText] of entries) {
                    list.push({
                      time: dayjs(timeKey).format('YYYY-MM-DD HH:mm:ss'),
                      command: commandText
                    });
                  }
                  return { data: list };
                }}
                columns={[
                  {
                    title: intl.formatMessage({ id: 'model.time' }),
                    dataIndex: 'time',
                    width: 200,
                  },
                  {
                    title: intl.formatMessage({ id: 'cluster.resource.container.terminal.command' }),
                    dataIndex: 'command',
                    valueType: 'text',
                  }
                ]}
              />
            }
          ]}
        />

      </Drawer>
    </PageContainer>
  );
};

export default PodTerminalAuditLogTableList;
