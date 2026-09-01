import { CloseCircleOutlined, InsertRowBelowOutlined, LineChartOutlined, MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { EditableProTable, FooterToolbar, ModalForm, PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Alert, Button, Divider, Drawer, Dropdown, Flex, Modal, message, Popconfirm, Popover, Space, Tag, Tooltip, Typography } from 'antd';
import React, { type ReactNode, useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import type { INode, ITaint, NodeAddress, NodeCondition, NodeList, NodeSystemInfo, Taint } from 'kubernetes-models/v1';
import type { IntlShape } from 'react-intl';
import { CIDR, CPU, Memory, Storage } from '@/components/icons';
import Logo from '@/components/Logo';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import { clusterGetProxy, clusterPatchProxy } from '@/services/cluster_proxy.api';

import type { PatchSubsetValue } from '@/services/common';
import { getClusterResource } from '@/utils/cluster';
import { getColorPrimary, getCurrentViewInfo, removeSuffix } from '@/utils/global';
import MetricsValue from '@/pages/kubernetes/components/metrics_value';
import { RenderNodeMetrics } from '@/pages/kubernetes/components/node_metrics';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';

import AICopilot from '../../components/ai';


type NodeTaintType = {
  id: string;
  effect: string;
  key: string;
  value?: string;
};

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const { cluster } = getCurrentViewInfo();
  const [selectedRowsState, setSelectedRows] = useState<INode[]>([]);
  const [nodes, setNodes] = useState<INode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const formRef = useRef<ProFormInstance>(undefined);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchNode, setPatchNode] = useState<INode>();
  const [patchModalKey, setPatchModalKey] = useState<string>('');
  const [taintsVisible, setTaintsVisible] = useState<boolean>(false);
  const [taintsNode, setTaintsNode] = useState<INode>();
  const [dataSource, setDataSource] = useState<NodeTaintType[]>([]);
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [searchName, setSearchName] = useState<string>('');
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const [monitorDrawerVisible, setMonitorDrawerVisible] = useState<boolean>(false);
  const intl = useIntl();
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);

  useEffect(() => {
    setEditableRowKeys(
      taintsNode?.spec?.taints?.map((item: ITaint) => item.key),
    );
    setDataSource(
      taintsNode?.spec?.taints?.map(
        (item: Taint) =>
          ({
            id: item.key,
            effect: item.effect,
            key: item.key,
            value: item.value,
          }) as NodeTaintType,
      ),
    );
  }, [taintsNode]);
  useEffect(() => {
    listNodes();

  }, []);


  const listNodes = async () => {
    setLoading(true);
    try {
      const params = { cluster, address: 'api/v1/nodes' } as Record<string, any>;
      const fieldSelector = {} as Record<string, string>;
      if (searchName !== '') {
        fieldSelector['metadata.name'] = searchName;
      }
      if (Object.keys(searchFields).length > 0) {
        for (const key in searchFields) {
          fieldSelector[key] = searchFields[key];
        }
      }
      if (Object.keys(fieldSelector).length > 0) {
        const fieldSelectors = [] as string[];
        for (const key in fieldSelector) {
          fieldSelectors.push(`${key}=${fieldSelector[key]}`);
        }
        params['fieldSelector'] = fieldSelectors.join(',');
      }
      if (Object.keys(searchLabels).length > 0) {
        const labelSelectors = [] as string[];
        for (const key in searchLabels) {
          labelSelectors.push(`${key}=${searchLabels[key]}`);
        }
        params['labelSelector'] = labelSelectors.join(',');
      }
      if (Object.keys(searchFields).length > 0) {
        for (const key in searchFields) {
          fieldSelector[key] = searchFields[key];
        }
      }
      if (Object.keys(fieldSelector).length > 0) {
        const fieldSelectors = [] as string[];
        for (const key in fieldSelector) {
          fieldSelectors.push(`${key}=${fieldSelector[key]}`);
        }
        params['fieldSelector'] = fieldSelectors.join(',');
      }
      const data = (await clusterGetProxy(params)) as NodeList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'Node';
      }
      setNodes(data.items || []);

    } finally {
      setLoading(false);
    }
  };

  const patchVisibleReflash = (visible: boolean) => {
    setPatchLabelVisible(false);
    setEditorResource(false);
    setResourceDrawerVisible(false);
    actionRef.current?.reload();
  };
  const handleNodePatch = async (
    intl: IntlShape,
    patchData: PatchSubsetValue,
    selectedRows: INode[],
  ) => {
    for (const entity of selectedRows) {
      const params = {

        cluster: cluster,
        address: `api/v1/nodes/${entity?.metadata?.name}`,
      };
      await clusterPatchProxy(params, [patchData] as PatchSubsetValue[]);
    }

    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
  };
  const moreItems = (record: INode) => {
    const nodes = [
      {
        key: 'edit-yaml',
        label: (
          <a
            onClick={() => {
              setPatchNode(record);
              setPatchModalKey('labels-' + record.metadata?.name);
              setPatchLabelVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            {<FormattedMessage id="cluster.patch.labels" />}
          </a>
        ),
      },
      {
        key: 'view-yaml',
        label: (
          <a
            onClick={() => {
              setPatchNode(record);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.view.yaml" />
          </a>
        ),
      },
    ];
    if (record.spec?.unschedulable === true) {
      nodes.push({
        key: record.metadata?.name + '-schedule',
        label: (
          <Popconfirm
            key={record.metadata?.name + '-schedule'}
            description={intl.formatMessage({
              id: 'cluster.node.schedule.description',
            })}
            title={
              intl.formatMessage({ id: 'cluster.node.schedule.title' }) +
              intl.formatMessage({ id: 'cluster.node' }) + `【${record.metadata?.name}】`
            }
            onConfirm={() => {
              const patchData = {} as PatchSubsetValue;
              patchData.path = '/spec/unschedulable';
              patchData.value = false;
              patchData.op = 'replace';
              handleNodePatch(intl, patchData, [record]);
            }}
            okButtonProps={{}}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <a style={{ color: colorPrimary }}>
              <FormattedMessage id="cluster.node.schedule" />
            </a>
          </Popconfirm>
        ),
      });
    } else {
      nodes.push({
        key: record.metadata?.name + '-unschedule',
        label: (
          <Popconfirm
            key={record.metadata?.name + '-unschedule'}
            description={intl.formatMessage({
              id: 'cluster.node.unschedule.description',
            })}
            title={
              intl.formatMessage({ id: 'cluster.node.unschedule.title' }) +
              intl.formatMessage({ id: 'cluster.node' }) + `【${record.metadata?.name}】`
            }
            onConfirm={() => {
              const patchData = {} as PatchSubsetValue;
              patchData.path = '/spec/unschedulable';
              patchData.value = true;
              patchData.op = 'replace';
              handleNodePatch(intl, patchData, [record]);
            }}
            okButtonProps={{}}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <a style={{ color: colorPrimary }}>
              <FormattedMessage id="cluster.node.unschedule" />
            </a>
          </Popconfirm>
        ),
      });
    }
    nodes.push({
      key: 'taints',
      label: (
        <a
          onClick={() => {
            setTaintsNode(record);
            setTaintsVisible(true);
          }}
          style={{ color: colorPrimary }}
        >
          <FormattedMessage id="cluster.resource.taints" />
        </a>
      ),
    });
    return nodes;
  };




  const columns: ProColumns<INode>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      order: 100,
      dataIndex: 'name',
      search: { transform: (value: string) => setSearchName(value) },
      render: (dom, entity) => {
        const tags = [] as ReactNode[];
        const addresses = entity?.status?.addresses || ([] as NodeAddress[]);
        // Hostname, ExternalIP or InternalIP
        for (const item of addresses) {
          if (item.type === 'Hostname') {
            tags.push(
              <Tag style={{ border: 0 }} key={item.address}>
                {item.address}
              </Tag>,
            );
          }
          if (item.type === 'ExternalIP') {
            tags.push(
              <Tag style={{ border: 0 }} key={item.address}>
                <FormattedMessage id="cluster.node.ExternalIP" />
                &nbsp;:&nbsp;{item.address}
              </Tag>,
            );
          } else if (item.type === 'InternalIP') {
            tags.push(
              <Tag style={{ border: 0 }} key={item.address}>
                <FormattedMessage id="cluster.node.InternalIP" />
                &nbsp;:&nbsp;{item.address}
              </Tag>,
            );
          }
        }
        return (
          <Flex gap="4px 0" wrap>
            {tags}
          </Flex>
        );
      },
    },

    {
      title: intl.formatMessage({ id: 'cluster.fieldSelector' }),
      dataIndex: 'hiddenFieldSelector',
      hideInTable: true, // 在表格中隐藏这个字段
      renderFormItem: (item, { defaultRender }) => {
        const labels = [] as string[];
        const keys = Object.keys(searchFields);
        if (keys.length > 0) {
          for (const key in searchFields) {
            labels.push(`${key}=${searchFields[key]}`);
          }
        }
        return (
          <Space>
            <div
              onClick={() => {
                if (labelSelectorVisible) {
                  setFieldSelectorVisible(false);
                }
                setFieldSelectorVisible(true);
              }}
            >
              <Popover
                placement="top"
                title={
                  <div>
                    <span style={{ color: colorPrimary, fontSize: '10px' }}>

                      <FormattedMessage id="cluster.fieldSelector.click" />
                    </span>
                    <div>
                      {keys?.map((key: string) => (
                        <>
                          <Tag style={{ border: 0 }} key={key}>
                            {key}={searchFields[key]}
                          </Tag>
                          <br />
                        </>
                      ))}
                    </div>
                  </div>
                }
              >
                <InsertRowBelowOutlined style={{ color: colorPrimary }} />
                {labels.length > 0 && (
                  <Text ellipsis>
                    &nbsp;&nbsp;{labels.join(',').substring(0, 10) + '...'}
                  </Text>
                )}
              </Popover>
            </div>
            {keys.length > 0 && (
              <CloseCircleOutlined
                style={{ color: 'red' }}
                onClick={() => setSearchFields({})}
              />
            )}
          </Space>
        );
      },
    },

    {
      title: intl.formatMessage({ id: 'cluster.node.resource' }),
      search: false,
      align: 'center',
      render: (dom, entity: INode) => {
        let cpuCore = 0;
        const cpu = entity?.status?.allocatable?.cpu;
        if (cpu?.indexOf('m') > 0) {
          cpuCore = Math.ceil(Number(removeSuffix(cpu, 'm')) / 1000);
        } else {
          cpuCore = cpu;
        }
        let memorygib = 0;
        const memory = entity?.status?.allocatable?.memory;
        if (memory?.indexOf('Ki') > 0) {
          memorygib = Math.ceil(
            Number(removeSuffix(memory, 'Ki')) / 1000 / 1000,
          );
        } else if (memory?.indexOf('m') > 0) {
          memorygib = Math.ceil(Number(removeSuffix(memory, 'm')) / 1000);
        }
        let storagegib = 0;
        const storage = entity.status?.allocatable['ephemeral-storage'] || '';
        if (storage?.indexOf('Ki') > 0) {
          storagegib = Math.floor(
            Number(removeSuffix(storage, 'Ki')) / 1000 / 1000 / 1000,
          );
        } else if (memory?.indexOf('m') > 0) {
          storagegib = Math.ceil(Number(removeSuffix(storage, 'm')) / 1000);
        }
        // nvidia gpu
        let gpuType = '';
        // nvidia gpu
        if (entity.metadata?.labels['nvidia.com/gpu.present']) {
          gpuType = 'nvidia';
        }
        if (entity.metadata?.labels['hygon.com/dcu']) {
          gpuType = 'hygon';
        }
        if (entity.metadata?.labels['accelerator']) {
          gpuType = 'ascend';
        }
        return (
          <Flex gap="4px 0" wrap>
            <Tag
              style={{
                border: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              key="cpu"
            >
              <CPU color={colorPrimary} size="20px" />
              {cpuCore}&nbsp;Core&nbsp;&nbsp;
              <MetricsValue

                node={entity.metadata?.name}
                cluster={cluster}
                view="node"
                height={10}
                title=""
                danger={85}
                metricsRequests={[
                  {
                    name: 'CPU Utilisation',
                    code: 'CPU Utilisation',
                    metricKey: 'instance',
                    toFixed: 2,
                    multiplier: 100,
                    tableUnit: '%',
                  },
                ]}
              />
            </Tag>
            <Tag
              style={{
                border: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              key="memory"
            >
              <Memory color={colorPrimary} size="20px" />
              {memorygib}&nbsp;GiB&nbsp;&nbsp;&nbsp;
              <MetricsValue

                node={entity.metadata?.name}
                cluster={cluster}
                view="node"
                height={10}
                title=""
                danger={75}
                metricsRequests={[
                  {
                    name: 'Memory Utilisation',
                    code: 'Memory Utilisation',
                    metricKey: 'instance',
                    toFixed: 2,
                    multiplier: 100,
                    tableUnit: '%',
                  },
                ]}
              />
            </Tag>
            {storagegib > 0 && (
              <Tag
                style={{
                  border: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                key="disk"
              >
                <Storage color={colorPrimary} size="20px" />
                {storagegib}&nbsp;T&nbsp;&nbsp;
                <MetricsValue

                  node={entity.metadata?.name}
                  cluster={cluster}
                  view="node"
                  height={10}
                  title=""
                  danger={75}
                  metricsRequests={[
                    {
                      name: 'Disk Space Utilisation',
                      code: 'Disk Space Utilisation',
                      metricKey: 'instance',
                      toFixed: 2,
                      multiplier: 100,
                      tableUnit: '%',
                    },
                  ]}
                />
              </Tag>
            )}
            {entity?.spec?.podCIDRs && (
              <Tag
                style={{
                  border: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                key="ip"
              >
                <CIDR color={colorPrimary} size="20px" />
                {entity?.spec?.podCIDRs || [].map((key) => key)}
              </Tag>
            )}
            {gpuType === 'nvidia' && (
              <Tag
                style={{
                  border: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                key="nvidia"
              >
                <Tooltip
                  color={colorPrimary}
                  title={entity.metadata?.labels['nvidia.com/gpu.product']}
                >
                  <span style={{ color: colorPrimary }}>GPU</span>
                </Tooltip>
                :&nbsp;{entity.metadata?.labels['nvidia.com/gpu.count']}&nbsp;
                {intl.formatMessage({ id: 'cluster.node.resource.gpu.board' })}
              </Tag>
            )}
          </Flex>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.node.resource.gpu' }),
      search: false,
      hidden: !expandInfo,
      render: (dom, entity: INode) => {
        let gpuType = '';
        // nvidia gpu
        if (entity.metadata?.labels['nvidia.com/gpu.present']) {
          gpuType = 'nvidia';
        }
        if (entity.metadata?.labels['hygon.com/dcu']) {
          gpuType = 'hygon';
        }
        if (entity.metadata?.labels['accelerator']) {
          gpuType = 'ascend';
        }
        return (
          <Flex gap="4px 0" wrap>
            {gpuType == 'nvidia' && (
              <>
                <span
                  style={{
                    textAlign: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                    fontSize: '12px',
                  }}
                >
                  <Logo name={gpuType} size={40} />
                  {entity.metadata?.labels['nvidia.com/gpu.product'] && (
                    <>{entity.metadata?.labels['nvidia.com/gpu.product']}</>
                  )}
                </span>
                <Tag
                  style={{ border: 0 }}
                  key="cluster.node.resource.gpu.board.number"
                >
                  <FormattedMessage id="cluster.node.resource.gpu.board.number" />
                  &nbsp;:&nbsp;{entity.metadata?.labels['nvidia.com/gpu.count']}
                  &nbsp;
                  {intl.formatMessage({
                    id: 'cluster.node.resource.gpu.board',
                  })}
                </Tag>
                <Tag
                  style={{ border: 0 }}
                  key="nvidia.com/cuda.driver-version.full"
                >
                  <FormattedMessage id="cluster.node.cuda.driver.version" />
                  &nbsp;:&nbsp;
                  {
                    entity.metadata?.labels[
                    'nvidia.com/cuda.driver-version.full'
                    ]
                  }
                </Tag>
                <Tag
                  style={{ border: 0 }}
                  key="nvidia.com/cuda.driver-version.full"
                >
                  <FormattedMessage id="cluster.node.cuda.runtime.version" />
                  &nbsp;:&nbsp;
                  {
                    entity.metadata?.labels[
                    'nvidia.com/cuda.runtime-version.full'
                    ]
                  }
                </Tag>
              </>
            )}
          </Flex>
        ); //
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.status' }),
      search: false,
      render: (dom, entity: INode) => {
        const conditions =
          entity?.status?.conditions || ([] as NodeCondition[]);
        const tags = [] as React.ReactNode[];
        for (let i = 0; i < conditions.length; i++) {
          if (
            conditions[i].type === 'Ready' &&
            conditions[i].status === 'True'
          ) {
            tags.push(
              <Tag style={{ border: 0 }} key={conditions[i].type} color="green">
                <FormattedMessage id="cluster.node.status.Running" />
              </Tag>,
            );
          } else if (
            conditions[i].type === 'MemoryPressure' &&
            conditions[i].status !== 'False'
          ) {
            tags.push(
              <Tag style={{ border: 0 }} key={conditions[i].type} color="red">
                <FormattedMessage id="cluster.node.status.MemoryPressure" />
              </Tag>,
            );
          } else if (
            conditions[i].type === 'DiskPressure' &&
            conditions[i].status !== 'False'
          ) {
            tags.push(
              <Tag style={{ border: 0 }} key={conditions[i].type} color="red">
                <FormattedMessage id="cluster.node.status.DiskPressure" />
              </Tag>,
            );
          } else if (
            conditions[i].type === 'PIDPressure' &&
            conditions[i].status !== 'False'
          ) {
            tags.push(
              <Tag style={{ border: 0 }} key={conditions[i].type} color="red">
                <FormattedMessage id="cluster.node.status.PIDPressure" />
              </Tag>,
            );
          }
        }

        if (entity.spec?.unschedulable === true) {
          tags.push(
            <Tag style={{ border: 0 }} key="unschedulable" color="red">
              <FormattedMessage id="cluster.node.unschedule" />
            </Tag>,
          );
        }
        return (
          <Flex gap="4px 0" wrap>

            {tags}
          </Flex>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.node.architecture' }),
      search: false,
      render: (dom, entity: INode) => {
        const nodeInfo = entity?.status?.nodeInfo || ({} as NodeSystemInfo);
        // Hostname, ExternalIP or InternalIP cluster.node.containerRuntimeVersion
        return (
          <>
            {nodeInfo.operatingSystem}/{nodeInfo.architecture}
          </>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.node.version' }),
      search: false,
      hidden: !expandInfo,
      render: (dom, entity: INode) => {
        const nodeInfo = entity?.status?.nodeInfo || ({} as NodeSystemInfo);
        // Hostname, ExternalIP or InternalIP cluster.node.containerRuntimeVersion
        return (
          <Flex gap="4px 0" wrap key={entity.metadata?.name}>
            <Tag style={{ border: 0 }} key={nodeInfo.containerRuntimeVersion}>
              <FormattedMessage id="cluster.node.containerRuntimeVersion" />
              &nbsp;:&nbsp;{nodeInfo.containerRuntimeVersion}
            </Tag>
            <Tag style={{ border: 0 }} key={nodeInfo.kubeProxyVersion}>
              <FormattedMessage id="cluster.node.kubeProxyVersion" />
              &nbsp;:&nbsp;{nodeInfo.kubeProxyVersion}
            </Tag>
            <Tag style={{ border: 0 }} key={nodeInfo.kubeletVersion}>
              <FormattedMessage id="cluster.node.kubeletVersion" />
              &nbsp;:&nbsp;{nodeInfo.kubeletVersion}
            </Tag>
            <Tag style={{ border: 0 }} key="kubeletEndpoint">
              <FormattedMessage id="cluster.node.kubeletEndpoint.Port" />
              &nbsp;:&nbsp;
              {entity.status?.daemonEndpoints?.kubeletEndpoint?.Port}
            </Tag>
          </Flex>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.labels/taints' }),
      renderFormItem: (item, { defaultRender }) => {
        const labels = [] as string[];
        const keys = Object.keys(searchLabels);
        if (keys.length > 0) {
          for (const key in searchLabels) {
            labels.push(`${key}=${searchLabels[key]}`);
          }
        }
        return (
          <Space>
            <div
              onClick={() => {
                if (labelSelectorVisible) {
                  setLabelSelectorVisible(false);
                }
                setLabelSelectorVisible(true);
              }}
            >
              <Popover
                placement="top"
                title={
                  <div>
                    <span style={{ color: colorPrimary, fontSize: '10px' }}>

                      <FormattedMessage id="cluster.labelSelector.click" />
                    </span>
                    <Space orientation='vertical' size='small'>
                      {keys?.map((key: string) => (
                        <>
                          <Tag style={{ border: 0 }} key={key}>
                            {key}={searchLabels[key]}
                          </Tag>
                        </>
                      ))}
                    </Space>
                  </div>
                }
              >
                <InsertRowBelowOutlined style={{ color: colorPrimary }} />
                {labels.length > 0 && (
                  <Text ellipsis>
                    &nbsp;&nbsp;{labels.join(',').substring(0, 10) + '...'}
                  </Text>
                )}
              </Popover>
            </div>
            {keys.length > 0 && (
              <CloseCircleOutlined
                style={{ color: 'red' }}
                onClick={() => setSearchLabels({})}
              />
            )}
          </Space>
        );
      },
      render: (dom, entity: INode) => {
        const keys = Object.keys(entity?.metadata?.labels || {});
        if (expandInfo) {
          return (
            <div>
              <Divider style={{ margin: '0 0', fontSize: '12px' }}>

                <FormattedMessage id="cluster.resource.labels" />
              </Divider>
              {Object.keys(entity?.metadata?.labels || {})?.map(
                (key: string) => (
                  <>
                    <Tag style={{ border: 0 }} key={key}>
                      {key}={entity?.metadata?.labels?.[key] ?? ''}
                    </Tag>
                    <br />
                  </>
                ),
              )}
              {entity?.spec?.taints && (
                <>
                  <Divider style={{ margin: '0 0', fontSize: '12px' }}>
                    <FormattedMessage id="cluster.resource.taints" />
                  </Divider>
                  {entity?.spec?.taints?.map((item: Taint) => (
                    <>
                      <Tag style={{ border: 0 }} key={item.key}>
                        {item.key}={item.value}:{item.effect}
                      </Tag>
                      <br />
                    </>
                  ))}
                </>
              )}
            </div>
          );
        } else {
          return (
            <Popover
              placement="right"
              title={
                <div>
                  <Divider style={{ margin: '0 0', fontSize: '12px' }}>
                    <FormattedMessage id="cluster.resource.labels" />
                  </Divider>
                  {keys?.map((key: string) => (
                    <>
                      <Tag style={{ border: 0 }} key={key}>
                        {key}={entity?.metadata?.labels?.[key] ?? ''}
                      </Tag>
                      <br />
                    </>
                  ))}
                  {entity?.spec?.taints && (
                    <>
                      <Divider style={{ margin: '0 0', fontSize: '12px' }}>
                        <FormattedMessage id="cluster.resource.taints" />
                      </Divider>
                      {entity?.spec?.taints?.map((item: ITaint) => (
                        <>
                          <Tag style={{ border: 0 }} key={item.key}>
                            {item.key}={item.value}:{item.effect}
                          </Tag>
                          <br />
                        </>
                      ))}
                    </>
                  )}
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
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      fixed: 'right',
      width: 80,
      render: (_, record) => {
        const nodes = [
          <span
            onClick={() => {
              setPatchNode(record);
              setMonitorDrawerVisible(true);
            }}
          >

            <LineChartOutlined style={{ color: colorPrimary }} />
          </span>,
        ];
        nodes.push(
          <Dropdown menu={{ items: moreItems(record) }} key="more">
            <a
              style={{ color: colorPrimary }}
              onClick={(e) => {
                setPatchNode(record);
                e.preventDefault();
              }}
            >
              <Space>
                <MoreOutlined style={{ color: colorPrimary }} />
              </Space>
            </a>
          </Dropdown>,
        );
        return <Space>{nodes}</Space>;
      },
    },
  ];
  const taintsColumns: ProColumns<NodeTaintType>[] = [
    {
      title: <FormattedMessage id="cluster.resource.key" />,
      dataIndex: 'key',
      width: '40%',
      formItemProps: {
        rules: [
          {
            required: true,
            whitespace: true,
            message: <FormattedMessage id="pages.inpug.not.empty" />,
          },
        ],
      },
    },
    {
      title: <FormattedMessage id="cluster.resource.value" />,
      dataIndex: 'value',
      width: '30%',
    },
    {
      title: <FormattedMessage id="cluster.resource.effect" />,
      dataIndex: 'effect',
      valueType: 'select',
      valueEnum: {
        NoSchedule: { text: 'NoSchedule' },
        PreferNoSchedule: { text: 'PreferNoSchedule' },
        NoExecute: { text: 'NoExecute' },
      },
      formItemProps: {
        rules: [
          {
            required: true,
            whitespace: true,
            message: <FormattedMessage id="pages.inpug.not.empty" />,
          },
        ],
      },
      width: '20%',
    },
    {
      title: <FormattedMessage id="pages.operation" />,
      valueType: 'option',
      width: '10%',
      render: () => {
        return null;
      },
    },
  ];
  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.node' })}
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<INode>
        key='node'
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        rowKey={(record: INode) =>
          `${record?.metadata?.name}-${record.metadata?.resourceVersion}`
        }
        search={{
          showHiddenNum: true,
          optionRender: ({ searchText, resetText }) => {
            return [
              <Button
                key="reset"
                onClick={() => {
                  setSearchLabels({});
                  setSearchFields({});
                  setSearchName('');
                  formRef?.current?.resetFields();


                }}
              >
                {resetText}
              </Button>,
              <Button
                key="search"
                type="primary"
                onClick={() => {


                  listNodes();
                }}
              >
                {searchText}
              </Button>,
            ];
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
        options={{
          reload: () => {


            listNodes();
          },
        }}
        locale={{
          emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
        }}
        toolBarRender={() => [
          <Space separator={<Divider orientation="vertical" />}>



            <a style={{ color: colorPrimary }} onClick={() => setExpandInfo(!expandInfo)}  >
              {expandInfo ? (
                <FormattedMessage id="cluster.node.shrink" />
              ) : (
                <FormattedMessage id="cluster.node.expand" />
              )}
            </a>
          </Space>
        ]}

        loading={loading}
        dataSource={nodes}
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
            onClick={() => {
              Modal.confirm({
                title: intl.formatMessage({
                  id: 'cluster.node.schedule.title',
                }),
                content: intl.formatMessage({
                  id: 'cluster.node.schedule.description',
                }),
                okText: intl.formatMessage({ id: 'pages.operation.confirm' }),
                cancelText: intl.formatMessage({
                  id: 'pages.operation.cancel',
                }),
                onOk: async () => {
                  const patchData = {} as PatchSubsetValue;
                  patchData.path = '/spec/unschedulable';
                  patchData.value = false;
                  patchData.op = 'replace';
                  await handleNodePatch(intl, patchData, selectedRowsState);
                  setSelectedRows([]);
                  actionRef.current?.reloadAndRest?.();
                },
              });
            }}
          >
            <FormattedMessage id="cluster.node.schedule" />
          </Button>
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: intl.formatMessage({
                  id: 'cluster.node.unschedule.title',
                }),
                content: intl.formatMessage({
                  id: 'cluster.node.unschedule.description',
                }),
                okText: intl.formatMessage({ id: 'pages.operation.confirm' }),
                cancelText: intl.formatMessage({
                  id: 'pages.operation.cancel',
                }),
                onOk: async () => {
                  const patchData = {} as PatchSubsetValue;
                  patchData.path = '/spec/unschedulable';
                  patchData.value = true;
                  patchData.op = 'replace';
                  await handleNodePatch(intl, patchData, selectedRowsState);
                  setSelectedRows([]);
                  actionRef.current?.reloadAndRest?.();
                },
              });
            }}
          >
            <FormattedMessage id="cluster.node.unschedule" />
          </Button>
        </FooterToolbar>
      )}
      {patchLabelVisible && (
        <PatchLabels
          setVisible={patchVisibleReflash}
          patchType="labels"
          title={<FormattedMessage id="cluster.patch.labels" />}
          key={patchModalKey}
          kind="Node"
          address={`api/v1/nodes/${patchNode?.metadata?.name}`}

          cluster={cluster}
          name={patchNode?.metadata?.name || ''}
          visible={patchLabelVisible}
          labels={patchNode?.metadata?.labels || {}}
        />
      )}
      {taintsVisible && (
        <ModalForm
          title={intl.formatMessage({ id: 'cluster.resource.taints' })}
          width="50vw"
          open={taintsVisible}
          onOpenChange={setTaintsVisible}
          onFinish={async () => {
            if (taintsNode) {
              const patchData = {} as PatchSubsetValue;
              patchData.path = '/spec/taints';
              patchData.value = dataSource.map(
                (item) =>
                  ({
                    key: item.key,
                    effect: item.effect,
                    value: item.value,
                  }) as Taint,
              );
              patchData.op = 'replace';
              handleNodePatch(intl, patchData, [taintsNode]);
              setTaintsVisible(false);
              setTaintsNode(undefined);
              setDataSource([]);
              setCurrnetNumber((prev) => 0);
              setEditableRowKeys([]);
              actionRef.current?.reloadAndRest?.();
            }
          }}
          modalProps={{
            maskClosable: true,
            destroyOnHidden: true,
            forceRender: true,
          }}
        >
          <Alert
            title={
              <>
                <FormattedMessage id="cluster.resource.kind" />
                &nbsp;:&nbsp;{getClusterResource('Node')}
                &nbsp;&nbsp;&nbsp;&nbsp;
                {<FormattedMessage id="cluster.resource.name" />}&nbsp;:&nbsp;
                {taintsNode?.metadata?.name}
              </>
            }
            type="warning"
          />
          <EditableProTable<NodeTaintType>
            locale={{
              emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
            }}
            columns={taintsColumns}
            rowKey="id"
            value={dataSource}
            onChange={setDataSource}
            recordCreatorProps={{
              newRecordType: 'dataSource',
              record: () => ({
                id: Date.now(),
              }),
            }}
            editable={{
              type: 'multiple',
              editableKeys,
              actionRender: (row, config, defaultDoms) => {
                return [defaultDoms.delete];
              },
              onValuesChange: (record, recordList) => {
                setDataSource(recordList);
              },
              onChange: setEditableRowKeys,
            }}
          />
        </ModalForm>
      )}
      {labelSelectorVisible && (
        <FilterSelector
          title={<FormattedMessage id="cluster.labelSelector" />}
          key={Date.now().toString()}
          visible={labelSelectorVisible}
          labels={searchLabels}
          setVisible={setLabelSelectorVisible}
          updateLabels={setSearchLabels}
        />
      )}
      {fieldSelectorVisible && (
        <FilterSelector
          title={<FormattedMessage id="cluster.fieldSelector" />}
          key={Date.now().toString()}
          visible={fieldSelectorVisible}
          labels={searchFields}
          setVisible={setFieldSelectorVisible}
          updateLabels={setSearchFields}
        />
      )}

      <Drawer
        destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('Node')}:&nbsp;&nbsp;{patchNode?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={patchNode?.metadata?.resourceVersion || 'edit'}
          edit={editorResource}
          address={`api/v1/nodes/${patchNode?.metadata?.name}`}
          kind="Node"
          name={patchNode?.metadata?.name || ''}

          cluster={cluster}
          content={patchNode}
        />
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
            {getClusterResource('Node')}:&nbsp;&nbsp;{patchNode?.metadata?.name}
            &nbsp;
            <FormattedMessage id="cluster.resource.monitor" />
          </>
        }
      >
        {patchNode && (
          <RenderNodeMetrics

            cluster={cluster}
            node={patchNode.metadata?.name || ''}
          />
        )}
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        kind="Node"
      />
    </PageContainer>
  );
};

export default IndexDashboard;
