import { CheckCircleFilled, CloseCircleOutlined, DeleteOutlined, InsertRowBelowOutlined, LineChartOutlined, MoreOutlined, UnorderedListOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProDescriptions, ProFormDateTimeRangePicker, ProFormDependency, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea, ProTable, StepsForm } from '@ant-design/pro-components';
import { Access, FormattedMessage, useAccess, useIntl } from '@umijs/max';
import { Button, Divider, Drawer, Modal, message, Popconfirm, Popover, Space, Tag, Typography, Dropdown, Row, Col, Timeline, Result, Tabs, Tooltip, Checkbox, Badge, FloatButton } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
const { Text } = Typography;
import type { IIoK8sApimachineryPkgApisMetaV1ObjectMeta } from '@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta';
import type { TabsProps } from 'antd/lib';
import dayjs from 'dayjs';
import type { Role } from 'kubernetes-models/rbac.authorization.k8s.io/v1';
import type { INamespace, Namespace, NamespaceList } from 'kubernetes-models/v1';
import type { IntlShape } from 'react-intl';
import Continue from '@/pages/kubernetes/components/continue';
import FilterSelector from '@/pages/kubernetes/components/filter_selector';
import PatchLabels from '@/pages/kubernetes/components/patch_labels';
import { clusterGetProxy, clusterPostProxy, clusterPutProxy } from '@/services/cluster_proxy.api';
import type { ClusterRoleTemplate, ClusterRoleTemplateList, NamespaceAuthorizeByTemplate } from '@/services/cluster_role_template';
import { listClusterRoleTemplate } from '@/services/cluster_role_template.api';
import { syncClusterNamespace } from '@/services/cluster.api';
import { getClusterResource } from '@/utils/cluster';
import { appendKubernetesViewQuery, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import AICopilot from '@/pages/kubernetes/components/ai';
import FormAnnotation from '@/pages/kubernetes/components/form_annotation';
import FormLabel from '@/pages/kubernetes/components/form_label';
import { RenderNamespaceWorkloadMetrics } from '@/pages/kubernetes/components/namespace_workload_metrics';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { SystemUser } from '@/components';
import { namespaceDelete, } from '@/services/namespace.api';
import { ClusterAccountDetailList } from '@/services/cluster_account';
import { clusterAccountAuthorizeNamespaceByTemplate, listClusterAccount } from '@/services/cluster_account.api';
import { TableListPagination } from '@/services/common';
import { ClusterNamespaceAccountRoleDetail } from '@/services/cluster_namespace_account_role';
import { deleteClusterNamespaceAccountRole, listClusterNamespaceAccountRole } from '@/services/cluster_namespace_account_role.api';



export interface NamespaceFormProps {
  name: string;
  description?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

const ProtectedNamespaces = [
  'default',
  'kube-system',
  'kube-public',
  'kube-node-lease',
  'efucloud',
  'efucloud-system',
  'local-path-storage',
  'hostpath-provisioner',
];
const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const { cluster } = getCurrentViewInfo();
  const formRef = useRef<ProFormInstance>(undefined);
  const clusterResourceAddress = 'api/v1/namespaces';
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [patchLabelVisible, setPatchLabelVisible] = useState<boolean>(false);
  const [patchNamespace, setPatchNamespace] = useState<INamespace>();
  const [patchModalKey, setPatchModalKey] = useState<string>('');
  const intl = useIntl();
  const access = useAccess();
  const [searchName, setSearchName] = useState<string>('');
  const [monitorDrawerVisible, setMonitorDrawerVisible] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [labelSelectorVisible, setLabelSelectorVisible] = useState<boolean>(false);
  const [searchLabels, setSearchLabels] = useState<{ [key: string]: string }>({});
  const [fieldSelectorVisible, setFieldSelectorVisible] = useState<boolean>(false);
  const [searchFields, setSearchFields] = useState<{ [key: string]: string }>({});
  const [currnetNumber, setCurrnetNumber] = useState<number>(0);
  const [remainingItemCount, setRemainingItemCount] = useState<number>(0);
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [editorResource, setEditorResource] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<INamespace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [createVisible, setCreateVisible] = useState<boolean>(false);
  const [createdNamespace, setCreatedNamespace] = useState<INamespace>();
  const [activeKey, setActiveKey] = useState<string>('autoCreateRoles');
  const [info, setInfo] = useState<NamespaceFormProps>({} as NamespaceFormProps);
  const [roleTemplates, setRoleTemplate] = useState<ClusterRoleTemplate[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [createdRoles, setCreatedRoles] = useState<ClusterRoleTemplate[]>([]);
  const [authorizeVisible, setAuthorizeVisible] = useState<boolean>(false);
  const [namespaceUsersVisible, setNamespaceUsersVisible] = useState<boolean>(false);
  const roleActionRef = useRef<ActionType>(null);

  const getNamespaceRoleTemplates = async () => {
    const data = (await listClusterRoleTemplate({
      category: 'Role',
      pageSize: 1000,
    })) as ClusterRoleTemplateList;
    setRoleTemplate(data?.data || []);
    setSelectedRoles(
      data.data?.map((item: ClusterRoleTemplate) => item.name) || [],
    );
  };

  useEffect(() => {
    getNamespaceRoleTemplates();
  }, []);
  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };
  useEffect(() => {
    listNamespaces();

  }, []);


  const createNamespace = async (values: Record<string, any>) => {
    if (info.labels) {
      delete info.labels['efucloud.com/workspace'];
    }
    const createData = {
      metadata: {
        labels: info.labels || {},
        annotations: info.annotations || {},
      },
    } as Namespace;
    if (createData.metadata && createData.metadata.annotations && createData.metadata.labels) {
      createData.metadata.name = values['name'];
      if (values && values['description'] && values['description'] !== '') {
        createData.metadata.annotations['efucloud.com/description'] = values['description']
      };
      const res = (await clusterPostProxy({ cluster, address: 'api/v1/namespaces' }, createData)) as INamespace;
      setCreatedNamespace(res);
    }
  }

  const createNamespaceRole = async (role: string) => {
    const existRole = roleTemplates.filter(
      (item: ClusterRoleTemplate) => item.name === role,
    );
    if (existRole.length > 0) {
      const waitCreateRole = existRole[0] as ClusterRoleTemplate;
      const metadata = {} as IIoK8sApimachineryPkgApisMetaV1ObjectMeta;
      metadata.name = role;
      metadata.labels = waitCreateRole.rule.labels;
      metadata.namespace = createdNamespace?.metadata?.name;
      const nsRole = { metadata: metadata } as Role;
      nsRole.rules = waitCreateRole.rule.rules;
      (await clusterPostProxy(
        {
          cluster,
          address: `apis/rbac.authorization.k8s.io/v1/namespaces/${metadata.namespace}/roles`,
        },
        nsRole,
      )) as Role;
      setCreatedRoles((prev) => [...prev, waitCreateRole]);
    }
  };
  useEffect(() => {
    if (createdNamespace?.apiVersion) {
      selectedRoles.forEach((item: string) => {
        createNamespaceRole(item);
      });
    }
  }, [createdNamespace]);
  const listNamespaces = async () => {
    setLoading(true);
    try {
      const params = {
        cluster,
        address: clusterResourceAddress,
      } as Record<string, any>;
      const fieldSelector = {} as Record<string, string>;
      if (searchName !== '') {
        fieldSelector['metadata.name'] = searchName;
      }
      if (status !== '') {
        fieldSelector['status.phase'] = status;
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
      const data = (await clusterGetProxy(params)) as NamespaceList;
      if (data?.metadata?.remainingItemCount) {
        setRemainingItemCount(data.metadata?.remainingItemCount || 0);
      }
      setCurrnetNumber(data?.items?.length || 0);
      for (let i = 0; i < data.items.length; i++) {
        data.items[i].apiVersion = data.apiVersion;
        data.items[i].kind = 'Namespace';
      }
      setDataSource(data.items);

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
  const handleForceDelete = async (intl: IntlShape, selectedRow: INamespace) => {
    if (!selectedRow) return true;
    const waitDeleteNs = { ...selectedRow }
    if (waitDeleteNs.spec?.finalizers) {
      waitDeleteNs.spec.finalizers = []
      delete waitDeleteNs.status
    }
    await clusterPutProxy({ cluster, address: `api/v1/namespaces/${selectedRow.metadata?.name}/finalize` }, waitDeleteNs);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  }
  const handleRemove = async (intl: IntlShape, selectedRow: INamespace) => {
    if (!selectedRow) return true;
    //先删除系统中数据库中的命名空间和用户授权等信息
    await namespaceDelete({ cluster, namespace: selectedRow.metadata?.name! })
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    actionRef.current?.reload();
    return true;
  };
  const moreItems = (record: INamespace) => {
    const nodes = [
      {
        key: 'edit-labels',
        label: (
          <a
            key="edit-labels"
            onClick={() => {
              setPatchNamespace(record);
              setPatchModalKey('labels-' + record?.metadata?.name);
              setPatchLabelVisible(true);
            }}
            style={{ color: colorPrimary }}
          >
            <FormattedMessage id="cluster.patch.labels" />
          </a>
        ),
      },
      {
        key: 'view-yaml',
        label: (
          <a
            key="view-yaml"
            onClick={() => {
              setPatchNamespace(record);
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
              setPatchNamespace(record);
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
      key: 'permission',
      label: <a onClick={() => { setPatchNamespace(record); setAuthorizeVisible(true); }}
        style={{ color: colorPrimary }}><FormattedMessage id='pages.operation.authorize' /></a>
    })
    return nodes;
  };




  const columns: ProColumns<INamespace>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      order: 100,
      dataIndex: 'name',
      search: { transform: (value: string) => setSearchName(value) },
      render: (dom, entity) => {
        const description =
          entity?.metadata?.annotations?.['efucloud.com/description'] || '';
        if (description !== '') {
          return (
            <>

              <Tooltip placement="right" color={colorPrimary} title={description}>
                <a
                  onClick={() => {
                    window.open(
                      appendKubernetesViewQuery(`/kubernetes/namespace/dashboard/overview`, { cluster: cluster, namespace: entity?.metadata?.name }),
                    );
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
              </Tooltip>
            </>
          );
        } else {
          return (
            <a
              onClick={() => {
                window.open(
                  appendKubernetesViewQuery(`/kubernetes/namespace/dashboard/overview`, { cluster: cluster, namespace: entity?.metadata?.name }),
                );
              }}
            >
              {entity?.metadata?.name}
            </a>
          );
        }
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.namespace.users' }),
      search: false,
      align: 'center',
      render: (dom, entity: INamespace) => {
        return <a onClick={() => { setPatchNamespace(entity); setNamespaceUsersVisible(true) }}>  <UsergroupAddOutlined style={{ color: colorPrimary, fontSize: '20px' }} /></a>
      },
    },
    {
      title: intl.formatMessage({ id: 'workspace' }),
      search: false,
      render: (dom, entity: INamespace) => {
        if (entity?.metadata?.labels && entity?.metadata?.labels['efucloud.com/workspace']) {
          return entity?.metadata?.labels['efucloud.com/workspace'];
        }
        return '-'
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
      render: (dom, entity: INamespace) => {
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
      title: intl.formatMessage({ id: 'cluster.resource.status' }),
      dataIndex: 'status',
      search: { transform: (value: string) => setStatus(value) },
      valueEnum: {
        Active: {
          text: intl.formatMessage({ id: 'cluster.resource.status.Active' }),
          status: 'Success',
        },

        Terminating: {
          text: intl.formatMessage({
            id: 'cluster.resource.status.Terminating',
          }),
          status: 'Error',
        },
      },
      render: (dom, entity: INamespace) => {
        return (
          <span>
            {entity.status?.phase === 'Active' ? (
              <Badge
                color="green"
                text={<FormattedMessage id="cluster.resource.status.Active" />}
              />
            ) : (
              <Badge
                color="red"
                text={
                  <FormattedMessage id="cluster.resource.status.Terminating" />
                }
              />
            )}
          </span>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: INamespace) => {
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
      width: 60,
      fixed: 'right',
      render: (_, record) => {
        const nodes = [
          <span
            key="update"
            onClick={() => {
              setPatchNamespace(record);
              setMonitorDrawerVisible(true);
            }}
          >
            <LineChartOutlined style={{ color: colorPrimary }} />
          </span>
        ];
        if (!(ProtectedNamespaces.includes(record.metadata?.name || '') || record.metadata?.name?.startsWith('openshift')) && access.clusterAdminAccess) {
          if (record.status?.phase === 'Terminating') {
            nodes.push(
              <Popconfirm
                key={record.metadata?.resourceVersion + '-delete'}
                description={intl.formatMessage({
                  id: 'cluster.namespace.force.delete.description',
                })}
                title={
                  intl.formatMessage({ id: 'pages.operation.delete.description' }) +
                  intl.formatMessage({ id: 'cluster.namespace' }) + '【' + record.metadata?.name + '】'}
                onConfirm={() => {
                  handleForceDelete(intl, record);
                }}
                okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
                cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
              >
                <DeleteOutlined style={{ color: 'red' }} />
              </Popconfirm>,
            );
          } else {
            nodes.push(
              <Popconfirm
                key={record.metadata?.resourceVersion + '-delete'}
                description={intl.formatMessage({
                  id: 'cluster.namespace.delete.description',
                })}
                title={
                  intl.formatMessage({ id: 'pages.operation.delete.description' }) +
                  intl.formatMessage({ id: 'cluster.namespace' }) + '【' + record.metadata?.name + '】'}
                onConfirm={() => {
                  handleRemove(intl, record);
                }}
                okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
                cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
              >
                <DeleteOutlined style={{ color: 'red' }} />
              </Popconfirm>,
            );
          }

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
  const updateLabels = (labels: Record<string, string>) => {
    setInfo({ ...info, labels });
  };
  const updateAnnotations = (annotations: Record<string, string>) => {
    setInfo({ ...info, annotations });
  };
  const getList = () => {
    const nodes = [];
    for (let i = 0; i < roleTemplates.length; i++) {
      nodes.push(
        <p style={{ display: 'block' }}>
          <Checkbox
            defaultChecked={selectedRoles.includes(roleTemplates[i].name)}
            onChange={(value) => {
              if (value.target.checked) {
                setSelectedRoles((prev) => [...prev, roleTemplates[i].name]);
              } else {
                setSelectedRoles((prev) =>
                  prev.filter((item) => item !== roleTemplates[i].name),
                );
              }
            }}
          >

            {roleTemplates[i].name} :&nbsp;&nbsp;{roleTemplates[i].description}
          </Checkbox>
        </p>,
      );
    }
    return nodes;
  };
  const items: TabsProps['items'] = [
    {
      label: intl.formatMessage({ id: 'cluster.namespace.autocreate.role' }),
      key: 'autoCreateRoles',
      children: (
        <>
          <p>
            <FormattedMessage id="cluster.namespace.autocreate.role.description" />
          </p>
          {getList()}
        </>
      ),
    }, //
    {
      label: intl.formatMessage({ id: 'cluster.resource.labels' }),
      key: 'labels',
      children: (
        <FormLabel labels={info?.labels || {}} setLabels={updateLabels} />
      ),
    },
    {
      label: intl.formatMessage({ id: 'cluster.resource.annotations' }),
      key: 'annotations',
      children: (
        <FormAnnotation
          annotations={info?.annotations || {}}
          setAnnotations={updateAnnotations}
        />
      ),
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.namespace' })}
      content={<Continue current={currnetNumber} remainingItemCount={remainingItemCount} />}
    >
      <ProTable<INamespace>
        key='namespace'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        formRef={formRef}
        rowKey={(record: INamespace) => record?.metadata?.name || ''}
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


                  listNamespaces();
                }}
              >
                {searchText}
              </Button>,
            ];
          },
        }}
        options={{
          reload: () => {


            listNamespaces();
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



            <a style={{ color: colorPrimary }} onClick={() => syncNamespace()}>
              <FormattedMessage id="cluster.namespace.sync" />
            </a>
            <a style={{ color: colorPrimary }} onClick={() => setExpandInfo(!expandInfo)}  >
              {expandInfo ? (<FormattedMessage id="cluster.node.shrink" />) : (<FormattedMessage id="cluster.node.expand" />)}
            </a>
            <Access accessible={access.clusterAdminAccess} key={'create'}>
              <Button
                type="primary"
                key="create"
                onClick={() => {
                  setCreateVisible(true);
                }}
              >
                <FormattedMessage id="pages.operation.create" />
              </Button>
            </Access>
          </Space>
        ]}
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowSelection={false}
      />

      {patchLabelVisible && (
        <PatchLabels
          setVisible={patchVisibleReflash}
          patchType="labels"
          title={<FormattedMessage id="cluster.patch.labels" />}
          key={'labels-' + patchModalKey}
          kind="Namespace"
          address={`api/v1/namespaces/${patchNamespace?.metadata?.name}`}

          cluster={cluster}
          name={patchNamespace?.metadata?.name || ''}
          visible={patchLabelVisible}
          labels={patchNamespace?.metadata?.labels || {}}
        />
      )}
      {labelSelectorVisible && (
        <FilterSelector
          title={<FormattedMessage id="cluster.labelSelector" />}
          key={'label' + Date.now().toString()}
          visible={labelSelectorVisible}
          labels={searchLabels}
          setVisible={setLabelSelectorVisible}
          updateLabels={setSearchLabels}
        />
      )}
      {fieldSelectorVisible && (
        <FilterSelector
          title={<FormattedMessage id="cluster.fieldSelector" />}
          key={'filed' + Date.now().toString()}
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
            {getClusterResource('Namespace')}:&nbsp;&nbsp;
            {patchNamespace?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={patchNamespace?.metadata?.resourceVersion || 'edit'}
          edit={editorResource}
          address={`api/v1/namespaces/${patchNamespace?.metadata?.name}`}
          kind="Namespace"
          name={patchNamespace?.metadata?.name || ''}

          cluster={cluster}
          content={patchNamespace}
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
            {getClusterResource('Namespace')}:&nbsp;&nbsp;
            {patchNamespace?.metadata?.name}&nbsp;
            <FormattedMessage id="cluster.resource.monitor" />
          </>
        }
      >
        {patchNamespace && (
          <RenderNamespaceWorkloadMetrics

            cluster={cluster}
            namespace={patchNamespace.metadata?.name || ''}
            legend="top"
          />
        )}
      </Drawer>
      <Modal
        title={intl.formatMessage({ id: 'cluster.namespace.create' })}
        width="70vw"
        open={createVisible}
        destroyOnHidden={true}
        onCancel={() => {
          setInfo({} as NamespaceFormProps);
          setCreateVisible(false);
        }}
        onOk={() => {
          setInfo({} as NamespaceFormProps);
          setCreateVisible(false);
        }}

        footer={false}
      >
        <StepsForm
          submitter={{
            render: (props) => {
              if (props.step === 0) {
                return (
                  <div>
                    <br />
                    <Button
                      onClick={() => {
                        props.onSubmit();
                      }}
                      type="primary"
                    >
                      <FormattedMessage id="pages.operation.create" />
                    </Button>
                  </div>
                );
              }
              return null;
            },
          }}
        >
          <StepsForm.StepForm
            title={intl.formatMessage({ id: 'cluster.resource.base' })}
            onFinish={async (values: any) => {
              await createNamespace(values);
              actionRef.current?.reload();
              return true;
            }}
          >
            <Row gutter={64}>
              <Col lg={12} md={12} sm={24}>
                <ProFormText
                  label={intl.formatMessage({ id: 'cluster.namespace' })}
                  name="name"
                  rules={[
                    {
                      max: 253,
                      message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 253 }),
                    },
                    {
                      required: true,
                      message:
                        intl.formatMessage({ id: 'pages.input.text.tips' }) +
                        intl.formatMessage({ id: 'cluster.namespace' }),
                    },
                    {
                      message: (
                        <FormattedMessage id="cluster.resource.data.format.invalid" />
                      ),
                      pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                    },
                  ]}
                  placeholder={`${intl.formatMessage({ id: 'pages.input.example' })}: eucloud-autotest`}
                />
              </Col>

              {/* <Col lg={12} md={12} sm={24}>
                <ProFormSelect
                  showSearch
                  label={intl.formatMessage({ id: 'cluster.namespace.exclusive.user' })}
                  tooltip={{ color: colorPrimary, title: intl.formatMessage({ id: 'cluster.namespace.exclusive.user.description' }) }}
                  name="exclusiveUser"
                  request={async (values: Record<string, string>) => {
                    const res = (await listAccount({
                      
                      search: values?.keyWords || '',
                    })) as AccountDetailList;
                    return (
                      res.data?.map((item: AccountDetail) => ({
                        label: (
                          <SystemUser
                            enable={item.enable}
                            avatar={item.avatar}
                            username={item.username}
                            nickname={item.nickname}
                            jobNumber={item.jobNumber}
                          />
                        ),
                        value: item.id,
                      })) || []
                    );
                  }}
                />
              </Col> */}
              <Col lg={24} md={24} sm={24}>
                <ProFormTextArea
                  label={intl.formatMessage({
                    id: 'cluster.resource.description',
                  })}
                  name="description"
                  rules={[
                    {
                      max: 255,
                      message: intl.formatMessage({ id: 'pages.input.text.max.length' }, { max: 255 }),
                    },
                  ]}
                />
              </Col>
            </Row>
            <Tabs
              activeKey={activeKey}
              items={items}
              onChange={(key) => setActiveKey(key)}
            />
          </StepsForm.StepForm>
          <StepsForm.StepForm
            title={intl.formatMessage({ id: 'cluster.resource.form.step.result' })}
          >
            <Result
              icon={
                <CheckCircleFilled style={{ color: '#52c41a', fontSize: 40 }} />
              }
              title={
                <p style={{ fontSize: 20 }}>
                  {intl.formatMessage({ id: 'pages.operation.create' }) +
                    `【${createdNamespace?.metadata?.name}】` +
                    intl.formatMessage({
                      id: 'pages.operation.create.success',
                    })}
                </p>
              }
              style={{
                maxWidth: '40vw',
                margin: '0 auto',
                padding: '2px 0 8px',
              }}
            >
              <Timeline
                items={createdRoles.map((item: ClusterRoleTemplate) => {
                  return {
                    color: '#52c41a',
                    children: (
                      <>
                        <p>
                          {intl.formatMessage({
                            id: 'pages.operation.create',
                          }) +
                            intl.formatMessage({ id: 'cluster.role' }) +
                            `【${item.name}】` +
                            intl.formatMessage({
                              id: 'pages.operation.create.success',
                            })}
                        </p>
                        <p>{item.description}</p>
                      </>
                    ),
                  };
                })}
              />
            </Result>
          </StepsForm.StepForm>
        </StepsForm>
      </Modal>

      <ModalForm
        title={intl.formatMessage({ id: 'cluster.namespace.authorize' })}
        key={'authorize-' + patchNamespace?.metadata?.resourceVersion}
        width="40vw"
        open={authorizeVisible}
        initialValues={info}
        clearOnDestroy={true}
        onOpenChange={setAuthorizeVisible}
        onFinish={async (values: Record<string, any>) => {
          const data = {} as NamespaceAuthorizeByTemplate;
          data.accountIds = values['accountIds'] || [];
          data.templateId = values['templateId'];
          data.namespaces = values['namespaces'] || [patchNamespace?.metadata?.name];

          await clusterAccountAuthorizeNamespaceByTemplate({ cluster }, data)
          setAuthorizeVisible(false);
          setPatchNamespace(undefined)
        }}
        modalProps={{ maskClosable: true, destroyOnHidden: true, forceRender: true }}>
        <ProDescriptions column={1} style={{ marginBottom: 16 }}>
          <ProDescriptions.Item label={intl.formatMessage({ id: 'cluster.namespace' })}>{patchNamespace?.metadata?.name}</ProDescriptions.Item>
        </ProDescriptions>

        <ProFormSelect
          name='templateId'
          showSearch
          label={intl.formatMessage({ id: 'cluster.resource.role' })}
          debounceTime={1000}
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.select.text.tips' }) +
                intl.formatMessage({ id: 'cluster.resource.role' }),
            },
          ]}
          request={async (values: Record<string, string>) => {
            const res = (await listClusterRoleTemplate({
              search: values?.keyWords || '',
              category: 'Role'
            })) as ClusterRoleTemplateList;
            return res.data?.map((item: ClusterRoleTemplate) => ({
              label: <><Tooltip placement='right' color={colorPrimary} title={item.description}>{item.name}</Tooltip> </>,
              value: item.name,
            })) || [];
          }}
        />
        <ProFormSelect
          name='accountIds'
          showSearch
          label={intl.formatMessage({ id: 'cluster.account' })}
          debounceTime={1000}
          mode="multiple"
          rules={[
            {
              required: true,
              message:
                intl.formatMessage({ id: 'pages.select.text.tips' }) +
                intl.formatMessage({ id: 'cluster.account' }),
            },
          ]}
          request={async (values: Record<string, string>) => {
            const res = (await listClusterAccount({

              cluster: cluster,
              name: values?.keyWords || '',
            })) as ClusterAccountDetailList;
            return res.data?.map(item => ({
              label: `${item.account?.username}(${item.account?.nickname || ''})`,
              value: item.accountId,
              account: item.account, // 把原始数据挂载，供 optionItemRender 使用
            })) || [];
          }}
        />


      </ModalForm>
      <Drawer
        destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={namespaceUsersVisible}
        onClose={() => setNamespaceUsersVisible(false)}
        closable={true}
        title={
          <>
            {getClusterResource('Namespace')}:&nbsp;&nbsp;
            {patchNamespace?.metadata?.name}&nbsp;
            <FormattedMessage id="cluster.namespace.users.permission" />
          </>
        }
      >

        <ProTable<ClusterNamespaceAccountRoleDetail, TableListPagination>
          key='namespace-user-permission'
          scroll={{ x: 'max-content' }}
          rowKey="id"
          search={false}
          actionRef={roleActionRef}
          toolBarRender={() => [
            <Access accessible={access.clusterAdminAccess === true} key={'create'}>
              <Button
                type="primary"
                key="create"
                onClick={() => {
                  setNamespaceUsersVisible(false);
                  setAuthorizeVisible(true);
                }}
              >
                <FormattedMessage id="pages.operation.authorize" />
              </Button>
            </Access>,
          ]}
          locale={{
            emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
          }}
          params={{ cluster: cluster, namespace: patchNamespace?.metadata?.name }}
          request={listClusterNamespaceAccountRole}
          columns={[
            {
              title: intl.formatMessage({ id: 'model.user.username' }),
              render: (_, record) => {
                return <SystemUser
                  enable={record.account?.enable}
                  avatar={record.account?.avatar}
                  username={record.account?.username!}
                  nickname={record.account?.nickname}
                  jobNumber={record.account?.jobNumber}
                />
              },
            },
            {
              title: intl.formatMessage({ id: 'cluster.resource.role' }),
              dataIndex: 'roleName',
            },

            {
              title: intl.formatMessage({ id: 'pages.operation' }),
              dataIndex: 'option',
              search: false,
              align: 'center',
              render: (_, record) => {
                const nodes = [
                  <Popconfirm
                    key={record.id + '-delete'}
                    description={<>{intl.formatMessage({ id: 'cluster.resource.role' }) + '【' + record.roleName + '】'}</>}
                    title={intl.formatMessage({ id: 'cluster.namespace.users.permission.delete' })}
                    onConfirm={async () => {
                      if (patchNamespace?.metadata?.name) {
                        await deleteClusterNamespaceAccountRole({ cluster, namespace: patchNamespace?.metadata?.name! }, { ids: [record.id] })
                        roleActionRef.current?.reload();
                      }
                    }}
                    okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
                    cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
                  >
                    <DeleteOutlined style={{ color: 'red' }} />
                  </Popconfirm>,
                ];


                return <Space>{nodes}</Space>;
              },
            },

          ]}
        />
      </Drawer>
      <AICopilot
        view='list'
        cluster={cluster}
        kind="Namespace"
        apiVersion=""
        questions={[{ mode: 'plan', skill: 'k8s-namespace-inspect', question: intl.formatMessage({ id: 'copilot.namespace.inspection' }) }]}
      />
    </PageContainer >
  );
};

export default IndexDashboard;
