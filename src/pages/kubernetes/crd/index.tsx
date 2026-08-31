import { CloseCircleOutlined, DeleteOutlined, InsertRowBelowOutlined, MoreOutlined, OrderedListOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Drawer, Dropdown, Modal, message, Popconfirm, Popover, Space, Tag, Typography, Divider, Flex } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import type { CustomResourceDefinitionList, ICustomResourceDefinition } from 'kubernetes-models/apiextensions.k8s.io/v1';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';

import { getClusterResource } from '@/utils/cluster';
import { appendKubernetesViewQuery, getClusterApiVersions, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';

import AICopilot from '@/pages/kubernetes/components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const access = useAccess();
  const { cluster, namespace } = getCurrentViewInfo();
  const [selectedRowsState, setSelectedRows] = useState<ICustomResourceDefinition[]>([]);
  const [dataSource, setDataSource] = useState<ICustomResourceDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const resourceGroup = getClusterApiVersions(cluster, ['apiextensions.k8s.io/v1', 'apiextensions.k8s.io/v1beta1'], 'CustomResourceDefinition');
  const address = `apis/${resourceGroup.groupVersion}/customresourcedefinitions`;
  const [searchName, setSearchName] = useState<string>('');
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const intl = useIntl();
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [patchCustomResourceDefinition, setPatchCustomResourceDefinition] = useState<ICustomResourceDefinition>();
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);

  const listDatas = async () => {
    setLoading(true);
    try {
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
      const data = (await clusterGetProxy(params)) as CustomResourceDefinitionList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'CustomResourceDefinition';
      }
      setDataSource(data.items || [])

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listDatas();

  }, []);

  const moreItems = (record: ICustomResourceDefinition) => {
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
      }
    ];
    return nodes;
  };
  const handleRemove = async (
    intl: IntlShape,
    selectedRows: ICustomResourceDefinition[],
  ) => {
    if (!selectedRows) return true;
    // 批量删除，按资源作用域决定是否带 namespace
    await Promise.all(
      selectedRows.map(async (entity: ICustomResourceDefinition) => {
        const resourceName = entity.metadata?.name;
        const entityNamespace = entity.metadata?.namespace;
        const address = entityNamespace
          ? `apis/${resourceGroup.groupVersion}/namespaces/${entityNamespace}/customresourcedefinitions/${resourceName}`
          : `apis/${resourceGroup.groupVersion}/customresourcedefinitions/${resourceName}`;
        await clusterDeleteProxy({ cluster, address });
      }),
    );
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };





  const columns: ProColumns<ICustomResourceDefinition>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'name',
      search: { transform: (value: string) => setSearchName(value) },
      render: (dom, entity) => {
        return (
          <>
            <a
              onClick={() => {
                window.location.href = appendKubernetesViewQuery(`/kubernetes/cluster/customresourcedefinitions/${entity?.metadata?.name}`, { cluster: cluster });
              }}
            >
              {entity?.metadata?.name}
            </a>
          </>
        );
      },
    },
    //    "cluster.resource.crd.group": "群组",
    // "cluster.resource.crd.plural": "名称复数",
    // "cluster.resource.crd.singular": "名称单数",
    // "cluster.resource.crd.kind": "类型",
    // "cluster.resource.crd.scope": "作用域",
    // "cluster.resource.crd.shortNames": "短命称",
    // "cluster.resource.crd.listKind": "列表类型",
    {
      title: intl.formatMessage({ id: 'cluster.resource.crd.group' }),
      dataIndex: ['spec', 'group'],
      search: false,

    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.crd.scope' }),
      dataIndex: ['spec', 'scope'],
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.crd.kind' }),
      dataIndex: ['spec', 'names', 'kind'],
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.crd.plural' }),
      dataIndex: ['spec', 'names', 'plural'],
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.crd.singular' }),
      dataIndex: ['spec', 'names', 'singular'],
      hidden: !expandInfo,
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.crd.shortNames' }),
      dataIndex: ['spec', 'names', 'shortNames'],
      hidden: !expandInfo,
      search: false,
      render: (dom, entity: ICustomResourceDefinition) => {
        return (
          <Flex>
            {entity.spec?.names?.shortNames?.map((item: string) => {
              return <Tag key={item}>{item}</Tag>
            })
            }
          </Flex>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: ICustomResourceDefinition) => {
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
          <a
            onClick={() => {
              //apps.titanide.cn/v1alpha1/templates
              let name = '';
              if (record.spec.versions.length > 0) {
                name = `${record.spec.names.kind}/${record.spec.group}/${record.spec.versions[0].name}/${record.spec.names.plural}`;
              } else {
                name = `${record.spec.names.kind}/${record.spec.group}/${record.spec.versions[0].name}/${record.spec.names.plural}`;
              }
              window.location.href = appendKubernetesViewQuery(`/kubernetes/cluster/customresourcedefinitions/${name}`, { cluster: cluster });
            }}
          >
            <OrderedListOutlined />
          </a>,
          <Popconfirm
            key={record.metadata?.resourceVersion + '-delete'}
            description={intl.formatMessage({
              id: 'cluster.resource.crd.delete.description',
            })}
            title={
              intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              getClusterResource('CustomResourceDefinition') + `【${record.metadata?.name}】`
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
        return <Space>{nodes}</Space>;
      },
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'menu.crd' })}
      subTitle="CustomResourceDefinition"
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<ICustomResourceDefinition>
        key='custom-resource-definition'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey={(record: ICustomResourceDefinition) =>
          `${record?.metadata?.name}-${record.metadata?.resourceVersion}`
        }
        search={{
          showHiddenNum: true,
          span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 },
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
          <Space separator={<Divider orientation="vertical" />}>



            <a style={{ color: colorPrimary }} onClick={() => setExpandInfo(!expandInfo)}  >
              {expandInfo ? (
                <FormattedMessage id="cluster.node.shrink" />
              ) : (
                <FormattedMessage id="cluster.node.expand" />
              )}
            </a>
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
            </Access></Space>
        ]}
        loading={loading}
        dataSource={dataSource}
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
            {getClusterResource('CustomResourceDefinition')}:&nbsp;&nbsp;
            {patchCustomResourceDefinition?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={
            patchCustomResourceDefinition?.metadata?.resourceVersion || 'edit'
          }
          edit={editorResource}
          address={`apis/${resourceGroup.groupVersion}/customresourcedefinitions/${patchCustomResourceDefinition?.metadata?.name}`}
          kind="CustomResourceDefinition"
          name={patchCustomResourceDefinition?.metadata?.name || ''}

          cluster={cluster}
          content={patchCustomResourceDefinition}
        />
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        kind="CustomResourceDefinition"
        apiVersion={resourceGroup.groupVersion}
      />
    </PageContainer>
  );
};

export default IndexDashboard;
