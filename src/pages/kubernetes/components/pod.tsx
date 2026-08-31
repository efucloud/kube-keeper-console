import { CodeOutlined, DeleteOutlined, LineChartOutlined, ProfileOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { type ActionType, FooterToolbar, type ProColumns, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Divider, Drawer, Flex, Modal, message, Popconfirm, Popover, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import type { IContainer, Pod, PodList } from 'kubernetes-models/v1';
import { useRef, useState } from 'react';
import type { IntlShape } from 'react-intl';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterResource } from '@/utils/cluster';
import { appendKubernetesViewQuery, getColorPrimary } from '@/utils/global';
import PodContainerLog from '@/pages/kubernetes/components/container_log';
import PodContainerTerminal from '@/pages/kubernetes/components/container_terminal';
import { RenderPodMetrics } from '@/pages/kubernetes/components/pod_metrics';
export type RenderPodsProps = {
  cluster: string;
  namespace: string;
  labelSelectors: Record<string, string>;
  ownerReferenceName?: string;
  onSelectLog?: (logQuestion: string) => void;

};
export const RenderPods: React.FC<RenderPodsProps> = (props) => {
  const intl = useIntl();
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const [selectedRowsState, setSelectedRows] = useState<Pod[]>([]);
  const { cluster, namespace, labelSelectors } = props;
  const [logDrawerVisible, setLogDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [monitorDrawerVisible, setMonitorDrawerVisible] = useState<boolean>(false);
  const [terminalDrawerVisible, setTerminalDrawerVisible] = useState<boolean>(false);
  const [patchPod, setPatchPod] = useState<Pod>();

  const address = `api/v1/namespaces/${namespace}/pods`;
  const listPods = async () => {
    const params = { cluster, address: address } as Record<string, any>;
    if (Object.keys(labelSelectors).length > 0) {
      const labels = [] as string[];
      for (const key in labelSelectors) {
        labels.push(`${key}=${labelSelectors[key]}`);
      }
      params['labelSelector'] = labels.join(',');
    }
    const data = (await clusterGetProxy(params)) as PodList;
    const items = data.items.filter((item) => {
      if (props.ownerReferenceName && props.ownerReferenceName !== '') {
        return item.metadata?.name?.startsWith(props.ownerReferenceName);
      }
      return true;
    }) || [];
    return {
      data: items,
      success: true,
      total: items.length,
    };
  };

  const handleRemove = async (intl: IntlShape, selectedRows: Pod[]) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: Pod) => {
      const params = {

        cluster,
        address: `api/v1/namespaces/${entity.metadata?.namespace}/pods/${entity.metadata?.name}`,
      };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };
  const columns: ProColumns<Pod>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'name',
      render: (dom, entity) => {
        return (
          <>
            <a
              onClick={() => {
                window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/workload/pods/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace });
              }}
            >
              {entity?.metadata?.name}
            </a>
          </>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.workload.container.number' }),
      search: false,
      render: (dom, entity: Pod) => {
        const containers = entity.spec?.containers;
        const initContainers = entity.spec?.initContainers;
        const containersNumber = entity.spec?.containers?.length || 0;
        const initContainersNumber = entity.spec?.initContainers?.length || 0;
        if (expandInfo) {
          return (
            <div>
              {initContainersNumber > 0 && (
                <>
                  <Divider style={{ margin: '0 0', fontSize: '12px' }}>

                    <FormattedMessage id="cluster.workload.initContainers" />
                  </Divider>
                  {initContainers?.map((item: IContainer) => (
                    <>
                      <Tag style={{ border: 0 }} key={item.name}>
                        {item.name}={item.image}
                      </Tag>
                      <br />
                    </>
                  ))}
                </>
              )}
              {containersNumber > 0 && (
                <>
                  <Divider style={{ margin: '0 0', fontSize: '12px' }}>
                    <FormattedMessage id="cluster.workload.containers" />
                  </Divider>
                  {containers?.map((item: IContainer) => (
                    <>
                      <Tag style={{ border: 0 }} key={item.name}>
                        {item.name}={item.image}
                      </Tag>
                      <br />
                    </>
                  ))}
                </>
              )}
            </div>
          );
        } else {
          const tags = [] as React.ReactNode[];
          if (containersNumber > 0) {
            tags.push(
              <Tag style={{ border: 0 }} key="containers">
                <FormattedMessage id="cluster.workload.containers" />
                &nbsp;:&nbsp;{containersNumber}
              </Tag>,
            );
          }
          if (initContainersNumber > 0) {
            tags.push(
              <Tag style={{ border: 0 }} key="initContainersNumber">
                <FormattedMessage id="cluster.workload.initContainers" />
                &nbsp;:&nbsp;{initContainersNumber}
              </Tag>,
            );
          }
          return (
            <Popover
              placement="right"
              title={
                <div>
                  {initContainersNumber > 0 && (
                    <>
                      <Divider style={{ margin: '0 0', fontSize: '12px' }}>

                        <FormattedMessage id="cluster.workload.initContainers" />
                      </Divider>
                      {initContainers?.map((item: IContainer) => (
                        <>
                          <Tag style={{ border: 0 }} key={item.name}>
                            {item.name}={item.image}
                          </Tag>
                          <br />
                        </>
                      ))}
                    </>
                  )}
                  {containersNumber > 0 && (
                    <>
                      <Divider style={{ margin: '0 0', fontSize: '12px' }}>
                        <FormattedMessage id="cluster.workload.containers" />
                      </Divider>
                      {containers?.map((item: IContainer) => (
                        <>
                          <Tag style={{ border: 0 }} key={item.name}>
                            {item.name}={item.image}
                          </Tag>
                          <br />
                        </>
                      ))}
                    </>
                  )}
                </div>
              }
            >
              <Flex gap="4px 0" wrap>
                {tags}
              </Flex>
            </Popover>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.container.restartCount' }),
      search: false,
      align: 'center',
      render: (dom, entity: Pod) => {
        const status = entity?.status?.containerStatuses;
        let restartCount = 0;
        status?.forEach((item) => {
          restartCount += item.restartCount;
        });
        return <span>{restartCount}</span>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.node' }),
      search: false,
      align: 'center',
      render: (dom, entity: Pod) => {
        return <span>{entity.spec?.nodeName}</span>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.labels' }),

      render: (dom, entity: Pod) => {
        const keys = Object.keys(entity?.metadata?.labels || {});
        if (expandInfo) {
          return (
            <Space orientation='vertical' size='small'>
              {Object.keys(entity?.metadata?.labels || {})?.map(
                (key: string) => (
                  <>
                    <Tag style={{ border: 0 }} key={key}>
                      {key}={entity?.metadata?.labels[key]}
                    </Tag>
                  </>
                ),
              )}
            </Space>
          );
        } else {
          return (
            <Popover
              placement="right"
              title={
                <div>
                  {keys?.map((key: string) => (
                    <>
                      <Tag style={{ border: 0 }} key={key}>
                        {key}={entity?.metadata?.labels[key]}
                      </Tag>
                      <br />
                    </>
                  ))}
                </div>
              }
            >
              <UnorderedListOutlined style={{ color: colorPrimary }} />
            </Popover>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.status' }),
      render: (dom, entity: Pod) => {
        // "Failed" | "Pending" | "Running" | "Succeeded" | "Unknown";
        const phase = entity?.status?.phase || 'Unknown';
        if (phase === 'Running') {
          return (
            <Tag style={{ border: 0 }} color="green">
              <FormattedMessage id="cluster.pod.status.Running" />
            </Tag>
          );
        } else if (phase === 'Pending') {
          return (
            <Tag style={{ border: 0 }} color="orange">
              <FormattedMessage id="cluster.pod.status.Pending" />
            </Tag>
          );
        } else if (phase === 'Succeeded') {
          return (
            <Tag style={{ border: 0 }} color="blue">
              <FormattedMessage id="cluster.pod.status.Succeeded" />
            </Tag>
          );
        } else if (phase === 'Failed') {
          return (
            <Tag style={{ border: 0 }} color="red">
              <FormattedMessage id="cluster.pod.status.Failed" />
            </Tag>
          );
        } else {
          return (
            <Tag style={{ border: 0 }} color="red">
              <FormattedMessage id="cluster.pod.status.Unknown" />
            </Tag>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: Pod) => {
        return (
          <span>
            {dayjs(entity.metadata?.creationTimestamp).format(
              'YYYY-MM-DD HH:mm:ss',
            )}
          </span>
        );
      },
    },

    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      render: (_, record) => {
        const nodes = [
          <span
            onClick={() => {
              setPatchPod(record);
              setMonitorDrawerVisible(true);
            }}
          >

            <LineChartOutlined style={{ color: colorPrimary }} />
          </span>,
          <span
            style={{ color: colorPrimary }}
            onClick={() => {
              setPatchPod(record);
              setLogDrawerVisible(true);
            }}
          >
            <ProfileOutlined />
          </span>
        ];
        if (record.status?.phase === 'Running') {
          nodes.push(<span
            style={{ color: colorPrimary }}
            onClick={() => {
              setPatchPod(record);
              setTerminalDrawerVisible(true);
            }}
          >
            <CodeOutlined />
          </span>);
        }
        nodes.push(<Popconfirm
          key={record.metadata?.resourceVersion + '-delete'}
          description={intl.formatMessage({
            id: 'cluster.resource.pod.delete.description',
          })}
          title={
            intl.formatMessage({ id: 'pages.operation.delete.description' }) +
            getClusterResource('Pod') +
            '【' +
            record.metadata?.name +
            '】'
          }
          onConfirm={() => {
            handleRemove(intl, [record]);
          }}
          okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
          cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
        >
          <DeleteOutlined style={{ color: 'red' }} />
        </Popconfirm>);
        return <Space>{nodes}</Space>;;
      },
    },
  ];
  return (
    <>
      <ProTable<Pod>
        key='pod'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey={(record: Pod) =>
          `${record?.metadata?.name}-${record.metadata?.resourceVersion}`
        }
        search={false}
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
        toolBarRender={() => [
          <a style={{ color: colorPrimary }} onClick={() => setExpandInfo(!expandInfo)}  >
            {expandInfo ? (
              <FormattedMessage id="cluster.node.shrink" />
            ) : (
              <FormattedMessage id="cluster.node.expand" />
            )}
          </a>,
        ]}
        params={{ cluster: cluster }}
        request={listPods}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              <FormattedMessage id="pages.operation.selected" />
              <a style={{ fontWeight: 600 }} >
                {selectedRowsState.length}
              </a>
              <FormattedMessage id="pages.operation.selected.term" defaultMessage="项" />
            </div>
          }
        >
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: intl.formatMessage({
                  id: 'pages.operation.delete.confirm.title',
                }),
                content: intl.formatMessage({
                  id: 'cluster.resource.pod.delete.description',
                }),
                okText: intl.formatMessage({ id: 'pages.operation.confirm' }),
                cancelText: intl.formatMessage({
                  id: 'pages.operation.cancel',
                }),
                onOk: async () => {
                  await handleRemove(intl, selectedRowsState);
                  setSelectedRows([]);
                  actionRef.current?.reloadAndRest?.();
                },
              });
            }}
          >
            <FormattedMessage id="pages.operation.batch.delete" />
          </Button>
        </FooterToolbar>
      )}
      <Drawer
        destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={logDrawerVisible}
        onClose={() => setLogDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('Pod')}:&nbsp;&nbsp;{patchPod?.metadata?.name}
            &nbsp;
            <FormattedMessage id="cluster.resource.container.log" />
          </>
        }
      >
        {logDrawerVisible && (
          <PodContainerLog
            running={patchPod?.status?.phase === 'Running'}
            cluster={cluster}
            namespace={patchPod?.metadata?.namespace || ''}
            pod={patchPod?.metadata?.name || ''}
            containers={[
              ...(patchPod?.spec?.containers?.map(c => c.name) ?? []),
              ...(patchPod?.spec?.initContainers?.map(c => c.name) ?? [])
            ]}
            onSelectLog={props.onSelectLog}
          />
        )}
      </Drawer>
      <Drawer
        key={patchPod?.metadata?.name + '-terminal'}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={terminalDrawerVisible}
        onClose={() => setTerminalDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('Pod')}:&nbsp;&nbsp;{patchPod?.metadata?.name}
            &nbsp;
            <FormattedMessage id="cluster.resource.container.terminal" />
          </>
        }
      >
        {patchPod && (
          <PodContainerTerminal
            key={patchPod?.metadata?.name + '-terminal'}

            cluster={cluster}
            namespace={patchPod?.metadata?.namespace || ''}
            pod={patchPod?.metadata?.name || ''}
            containers={
              patchPod?.spec?.containers.map((item) => item.name) || []
            }
          />
        )}
      </Drawer>
      <Drawer
        destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={monitorDrawerVisible}
        onClose={() => setMonitorDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('Pod')}:&nbsp;&nbsp;{patchPod?.metadata?.name}
            &nbsp;
            <FormattedMessage id="cluster.resource.monitor" />
          </>
        }
      >
        {patchPod && (
          <>
            <RenderPodMetrics

              cluster={cluster}
              namespace={patchPod.metadata?.namespace || ''}
              pod={patchPod.metadata?.name || ''}
            />
          </>
        )}
      </Drawer>
    </>
  );
};
