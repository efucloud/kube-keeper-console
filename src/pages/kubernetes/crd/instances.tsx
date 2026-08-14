import { CloseCircleOutlined, DeleteOutlined, InsertRowBelowOutlined, MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl, useParams } from '@umijs/max';
import { Button, Drawer, Dropdown, Modal, message, Popconfirm, Popover, Space, Tag, Typography } from 'antd';
import React, { useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import type { CustomResourceDefinition, CustomResourceDefinitionList } from 'kubernetes-models/apiextensions.k8s.io/v1';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterResource } from '@/utils/cluster';
import { getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import AICopilot from '@/pages/kubernetes/components/ai';

const InstanceDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const params = useParams();
  // group/:version/:plural
  const group = params.group;
  const kind = params.kind;
  const version = params.version;
  const plural = params.plural;
  const { cluster, namespace } = getCurrentViewInfo();
  const [selectedRowsState, setSelectedRows] = useState<CustomResourceDefinition[]>([]);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  // apis/apps.titanide.cn/v1alpha1/templates
  const address = `apis/${group}/${version}/${plural}`;
  const [searchName, setSearchName] = useState<string>('');
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const intl = useIntl();
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [patchCustomResourceDefinition, setPatchCustomResourceDefinition] = useState<CustomResourceDefinition>();
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const listDatas = async () => {
    const params = { cluster, address: address } as Record<string, any>;
    const fieldSelector = {} as Record<string, string>;
    //  crd不支持spec.scope过滤
    if (namespace) {
      fieldSelector['spec.scope'] = 'Namespaced';
    }
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
    const data = (await clusterGetProxy(
      params,
    )) as CustomResourceDefinitionList;
    if (data?.metadata?.remainingItemCount) {
      setRemainingItemCount(data.metadata?.remainingItemCount || 0);
    }
    setCurrnetNumber(data?.items?.length || 0);
    for (let i = 0; i < data.items.length; i++) {
      data.items[i].apiVersion = data.apiVersion;
      data.items[i].kind = kind || 'CustomResourceDefinition';
    }
    return {
      data: data.items,
      success: true,
      total: data.items?.length,
    };
  };

  const moreItems = (record: CustomResourceDefinition) => {
    const nodes = [
      {
        key: 'view-yaml',
        label: (
          <a
            onClick={() => {
              setPatchCustomResourceDefinition(record);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.view.yaml" />
          </a>
        ),
      },
      {
        key: 'edit-yaml',
        label: (
          <a
            onClick={() => {
              setPatchCustomResourceDefinition(record);
              setEditorResource(true);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.edit.yaml" />
          </a>
        ),
      },
    ];
    nodes.push({
      key: 'annotation',
      label: (
        <a
          onClick={() => {
            setPatchCustomResourceDefinition(record);
          }}
          style={{ color: colorPrimary }}
        >
          <FormattedMessage id="cluster.patch.annotations" />
        </a>
      ),
    });
    return nodes;
  };
  const handleRemove = async (
    intl: IntlShape,
    selectedRows: CustomResourceDefinition[],
  ) => {
    if (!selectedRows) return true;
    // 批量删除，根据 entity 是否有 namespace 判断资源作用域
    await Promise.all(
      selectedRows.map(async (entity: CustomResourceDefinition) => {
        const resourceName = entity.metadata?.name;
        const entityNamespace = entity.metadata?.namespace;
        const resourceAddress = entityNamespace
          ? `apis/${group}/${version}/namespaces/${entityNamespace}/${plural}/${resourceName}`
          : `${address}/${resourceName}`;
        await clusterDeleteProxy({
          cluster,
          address: resourceAddress,
        });
      }),
    );
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };

  const columns: ProColumns<CustomResourceDefinition>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'name',
      search: { transform: (value: string) => setSearchName(value) },
      render: (dom, entity) => {
        return <a onClick={() => {
          setPatchCustomResourceDefinition(entity);
          setResourceDrawerVisible(true);
        }}>{entity?.metadata?.name}</a>;
      },
    },

    {
      title: intl.formatMessage({ id: 'cluster.resource.labels' }),

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
      render: (dom, entity: CustomResourceDefinition) => {
        const keys = Object.keys(entity?.metadata?.labels || {});
        if (keys.length === 0) {
          return <span>-</span>;
        }
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
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: CustomResourceDefinition) => {
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
          <Popconfirm
            key={record.metadata?.resourceVersion + '-delete'}
            description={intl.formatMessage({
              id: 'cluster.resource.crd.instance.delete.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              getClusterResource(`${kind}`) + `【${record.metadata?.name}】`
            }
            onConfirm={() => {
              handleRemove(intl, [record]);
            }}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <DeleteOutlined style={{ color: 'red' }} />
          </Popconfirm>,
        ];
        nodes.push(
          <Dropdown menu={{ items: moreItems(record) }} key="more">
            <a
              style={{ color: colorPrimary }}
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              <Space>
                <MoreOutlined style={{ color: colorPrimary }} />
              </Space>
            </a>
          </Dropdown>,
        );
        return nodes;
      },
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title={intl.formatMessage({ id: 'menu.crd' })}
      subTitle={`${kind}`}
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<CustomResourceDefinition>
        key='custom-resource-def'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey={(record: CustomResourceDefinition) =>
          record?.metadata?.name ||
          record.metadata?.resourceVersion ||
          Date.now().toString()
        }
        search={{
          showHiddenNum: true,
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
        toolBarRender={() => [
          <a style={{ color: colorPrimary }} onClick={() => setExpandInfo(!expandInfo)}  >
            {expandInfo ? (
              <FormattedMessage id="cluster.node.shrink" />
            ) : (
              <FormattedMessage id="cluster.node.expand" />
            )}
          </a>,
          <Access accessible={true} key={'create'}>
            <Button
              type="primary"
              key="create"
              onClick={() => {
                // navigate(`${BaseAddress}/create`)
              }}
            >
              <FormattedMessage id="pages.operation.create" />
            </Button>
          </Access>,
        ]}

        request={listDatas}
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
                  id: 'cluster.resource.crd.delete.description',
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
            {kind}:&nbsp;&nbsp;{patchCustomResourceDefinition?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={
            patchCustomResourceDefinition?.metadata?.resourceVersion || 'edit'
          }
          edit={editorResource}
          address={patchCustomResourceDefinition?.metadata?.namespace ? `apis/${group}/${version}/namespaces/${patchCustomResourceDefinition?.metadata?.namespace}/${plural}/${patchCustomResourceDefinition?.metadata?.name}` : `${address}/${patchCustomResourceDefinition?.metadata?.name}`}
          kind={`${kind}`}
          name={patchCustomResourceDefinition?.metadata?.name || ''}

          cluster={cluster}
          content={patchCustomResourceDefinition}
        />
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        kind={kind}
        apiVersion={`${group}/${version}`}
      />
    </PageContainer>
  );
};

export default InstanceDashboard;
