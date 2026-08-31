import { CloseCircleOutlined, DeleteOutlined, EditOutlined, InsertRowBelowOutlined, MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Drawer, Dropdown, Modal, message, Popconfirm, Popover, Space, Tag, Typography, Divider } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import dayjs from 'dayjs';
import type { IClusterRole, ClusterRoleList } from 'kubernetes-models/rbac.authorization.k8s.io/v1';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import { RenderRules } from '@/pages/kubernetes/components/policy';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';

import { getClusterResource } from '@/utils/cluster';
import { appendKubernetesViewQuery, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';

import AICopilot from '../../components/ai';

/**
 * 集群角色仪表盘组件
 * 用于展示和管理 Kubernetes 集群中的 IClusterRole 资源
 */
const IndexDashboard: React.FC = () => {
  // 获取主题主色
  const colorPrimary = getColorPrimary();
  // 创建操作引用，用于表格操作
  const actionRef = useRef<ActionType>(null);
  // 获取访问权限信息
  const access = useAccess();
  // 获取当前租户信息（组织和集群）
  const { cluster } = getCurrentViewInfo();


  // 状态管理
  const [selectedRowsState, setSelectedRows] = useState<IClusterRole[]>([]); // 选中的行数据
  const [dataSource, setDataSource] = useState<IClusterRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // 表格数据源
  const formRef = useRef<ProFormInstance>(undefined); // 表单引用
  const [expandInfo, setExpandInfo] = useState<boolean>(false); // 是否展开详情
  const [detailDrawerVisible, setDetailDrawerVisible] = useState<boolean>(false); // 详情抽屉是否可见
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [patchClusterRole, setPatchClusterRole] = useState<IClusterRole>(); // 当前操作的集群角色
  const intl = useIntl(); // 国际化实例
  const [searchName, setSearchName] = useState<string>(''); // 搜索名称
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false); // 标签选择器可见性
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({}); // 搜索标签
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false); // 字段选择器可见性
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({}); // 搜索字段
  const [currnetNumber, setCurrnetNumber] = useState<number>(0); // 当前显示的数量
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0); // 剩余项目数
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false); // 资源抽屉可见性
  const [editorResource, setEditorResource] = useState<boolean>(false); // 是否编辑资源

  const listClusterRoles = async () => {
    setLoading(true);
    try {
      const params = { cluster, address: 'apis/rbac.authorization.k8s.io/v1/clusterroles' } as Record<string, any>;
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
      // 如果有标签选择器，格式化并添加到参数
      if (Object.keys(searchLabels).length > 0) {
        const labelSelectors = [] as string[];
        for (const key in searchLabels) {
          labelSelectors.push(`${key}=${searchLabels[key]}`);
        }
        params['labelSelector'] = labelSelectors.join(',');
      }
      // 发送请求获取数据
      const data = (await clusterGetProxy(params)) as ClusterRoleList;
      // 更新剩余项目数
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      // 更新当前数量
      setCurrnetNumber(data?.items?.length || 0);
      // 处理数据，添加 apiVersion 和 kind
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'ClusterRole';
      }
      // 更新数据源
      setDataSource(data.items || []);

    } finally {
      setLoading(false);
    }
  };
  // 组件加载时获取数据
  useEffect(() => {
    listClusterRoles();

  }, []);

  /**
   * 处理删除操作
   * @param intl 国际化实例
   * @param selectedRows 选中的行数据
   */
  const handleRemove = async (intl: IntlShape, selectedRows: IClusterRole[]) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: IClusterRole) => {
      const params = { cluster, address: `apis/rbac.authorization.k8s.io/v1/clusterroles/${entity.metadata?.name}` };
      await clusterDeleteProxy(params);
    });
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };
  /**
   * 获取更多操作项
   * @param record 当前记录
   */
  const moreItems = (record: IClusterRole) => {
    const nodes = [
      {
        key: 'view-yaml',
        label: (
          <a
            onClick={() => {
              setPatchClusterRole(record);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.view.yaml" />
          </a>
        ),
      },
    ];
    // 如果不是系统标签，可以编辑
    if (
      !(
        record.metadata?.labels &&
        record.metadata?.labels['kubernetes.io/bootstrapping']
      )
    ) {
      nodes.push({
        key: 'edit-yaml',
        label: (
          <a
            onClick={() => {
              setPatchClusterRole(record);
              setEditorResource(true);
              setResourceDrawerVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.edit.yaml" />
          </a>
        ),
      });
    }
    return nodes;
  };
  /**
   * 表格列配置
   */




  const columns: ProColumns<IClusterRole>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'name',
      search: { transform: (value: string) => setSearchName(value) },
      render: (dom, entity) => {
        const description = entity?.metadata?.annotations?.['efucloud.com/description'] || '';
        if (description !== '') {
          return (
            <>

              <Popover placement="right" title={description}>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    setPatchClusterRole(entity);
                    setDetailDrawerVisible(true);
                  }}
                >
                  {entity?.metadata?.name}
                </a>
                {expandInfo && (
                  <>
                    <br />
                    <span style={{ fontSize: '12px' }}>{description}</span>
                  </>
                )}
              </Popover>
            </>
          );
        } else {
          return (
            <a
              onClick={(e) => {
                e.preventDefault();
                setPatchClusterRole(entity);
                setDetailDrawerVisible(true);
              }}
            >
              {entity?.metadata?.name}
            </a>
          );
        }
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
      render: (dom, entity: IClusterRole) => {
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
      render: (dom, entity: IClusterRole) => {
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
        const nodes = [];
        if (!(record.metadata?.labels && record.metadata?.labels['kubernetes.io/bootstrapping'])) {
          nodes.push(
            <a
              key="update"
              onClick={() => {
                window.location.href = appendKubernetesViewQuery(`/kubernetes/cluster/access/clusterroles/${record?.metadata?.name}/update`, { cluster: cluster });
              }}
            >
              <EditOutlined style={{ color: colorPrimary }} />
            </a>,
            <Popconfirm
              key={record.metadata?.resourceVersion + '-delete'}
              description={intl.formatMessage({
                id: 'cluster.clusterrole.delete.description',
              })}
              title={
                intl.formatMessage({
                  id: 'pages.operation.delete.description',
                }) +
                intl.formatMessage({ id: 'cluster.clusterrole' }) +
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
            </Popconfirm>,
          );
        }

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
      title={intl.formatMessage({ id: 'cluster.clusterrole' })}
      subTitle="ClusterRole"
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<IClusterRole>
        key='cluster-role'
        actionRef={actionRef}
        formRef={formRef}
        scroll={{ x: 'max-content' }}
        rowKey={(record: IClusterRole) =>
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
                  listClusterRoles();


                }}
              >
                {searchText}
              </Button>,
            ];
          },
        }}
        options={{
          reload: () => {
            listClusterRoles();


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
        toolBarRender={() => [
          <Space separator={<Divider orientation="vertical" />}>



            <a style={{ color: colorPrimary }} onClick={() => setExpandInfo(!expandInfo)}  >
              {expandInfo ? (<FormattedMessage id="cluster.node.shrink" />) : (<FormattedMessage id="cluster.node.expand" />)}
            </a>
          </Space>
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
                  id: 'cluster.clusterrole.delete.description',
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
        open={detailDrawerVisible}
        key="view"
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        onClose={() => setDetailDrawerVisible(false)}
        closable={true}
        title={patchClusterRole?.metadata?.name || ''}
      >
        <RenderRules
          name={
            patchClusterRole?.metadata?.annotations?.['efucloud.com/description'] || ''
          }
          rules={patchClusterRole?.rules || []}
          aggregationRule={patchClusterRole?.aggregationRule}
        />
      </Drawer>
      <Drawer
        destroyOnHidden={true}
        key="resource-view"
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('ClusterRole')}:&nbsp;&nbsp;
            {patchClusterRole?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={patchClusterRole?.metadata?.resourceVersion || 'edit'}
          edit={editorResource}
          address={`apis/rbac.authorization.k8s.io/v1/clusterroles/${patchClusterRole?.metadata?.name}`}
          kind="ClusterRole"
          name={patchClusterRole?.metadata?.name || ''}

          cluster={cluster}
          content={patchClusterRole}
        />
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        kind="ClusterRole"
        apiVersion='rbac.authorization.k8s.io/v1'
      />
    </PageContainer>
  );
};

export default IndexDashboard;
