import { ActionType, PageContainer, ProColumns, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { useParams, useIntl, useNavigate, FormattedMessage, useAccess } from '@umijs/max';
import { Card, message, Popconfirm, Drawer, Tag, Tabs } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import React, { useEffect, useRef, useState } from 'react';
import { getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { ClusterRoleBinding, ClusterRoleBindingList, RoleBindingList, RoleBinding, ClusterRole, Role } from 'kubernetes-models/rbac.authorization.k8s.io/v1';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';
import { getClusterAccount } from '@/services/cluster_account.api';
import { ClusterAccountDetail } from '@/services/cluster_account';
import { SystemUser } from '@/components';
import { IntlShape } from 'react-intl';
import ResourceEditor from '@/pages/kubernetes/components/resource_editor';
import { getClusterResource } from '@/utils/cluster';



const DetailView: React.FC = () => {
  const access = useAccess();
  const navigate = useNavigate();
  const colorPrimary = getColorPrimary();
  const roleBindingActionRef = useRef<ActionType>(null);
  const clusterRoleBindingActionRef = useRef<ActionType>(null);
  const intl = useIntl();
  const params = useParams();
  const [info, setInfo] = useState<ClusterAccountDetail>();
  const { cluster, namespace } = getCurrentViewInfo();
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const [resourceDrawerTitlePrefix, setResourceDrawerTitlePrefix] = useState<string>('');
  const [resourceDrawerData, setResourceDrawerData] = useState<any>();
  const [resourceAddress, setResourceAddress] = useState<string>('');
  const [resourceName, setResourceName] = useState<string>('');
  const getInfo = async () => {
    const data = await getClusterAccount({ cluster, id: params.id || '' }) as ClusterAccountDetail;
    setInfo(data as ClusterAccountDetail);
  };

  useEffect(() => {
    getInfo();
  }, [params.id]);
  const getClusterRoleBindings = async () => {
    const data = await clusterGetProxy({

      cluster: cluster,
      address: 'apis/rbac.authorization.k8s.io/v1/clusterrolebindings',
      labelSelector: `efucloud.com/owner=${info?.accountId}`
    }) as ClusterRoleBindingList;
    for (let i = 0; i < data.items.length; i++) {
      data.items[i].apiVersion = data.apiVersion
      data.items[i].kind = 'ClusterRoleBinding'
    }
    return {
      data: data.items,
      success: true,
      total: data.items?.length,
    };
  };
  const getRoleBindings = async () => {
    const data = await clusterGetProxy({

      cluster: cluster,
      address: 'apis/rbac.authorization.k8s.io/v1/rolebindings',
      labelSelector: `efucloud.com/owner=${info?.accountId}`

    }) as RoleBindingList;
    for (let i = 0; i < data.items.length; i++) {
      data.items[i].apiVersion = data.apiVersion
      data.items[i].kind = 'RoleBinding'
    }
    return {
      data: data.items,
      success: true,
      total: data.items?.length,
    };
  };
  const getClusterRole = async (name: string) => {
    const data = await clusterGetProxy({

      cluster: cluster,
      address: `apis/rbac.authorization.k8s.io/v1/clusterroles/${name}`,
    }) as ClusterRole;
    setResourceDrawerData(data);
    setResourceDrawerVisible(true);
  }
  const getRole = async (namespace: string, name: string) => {
    const data = await clusterGetProxy({

      cluster: cluster,
      address: `apis/rbac.authorization.k8s.io/v1/namespaces/${namespace}/roles/${name}`,
    }) as Role;
    setResourceDrawerData(data);
    setResourceDrawerVisible(true);
  }
  const handleRemoveRoleBinding = async (intl: IntlShape, selected: RoleBinding) => {
    const params = { cluster, address: `apis/rbac.authorization.k8s.io/v1/namespaces/${selected.metadata?.namespace}/rolebindings/${selected.metadata?.name}` };
    await clusterDeleteProxy(params);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    roleBindingActionRef.current?.reload();
    return true;
  };
  const handleRemoveClusterRoleBinding = async (intl: IntlShape, selected: ClusterRoleBinding) => {
    const params = { cluster, address: `apis/rbac.authorization.k8s.io/v1/clusterrolebindings/${selected.metadata?.name}` };
    await clusterDeleteProxy(params);
    message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    clusterRoleBindingActionRef.current?.reload();
    return true;
  };
  const clusterRoleBindingcolumns: ProColumns<ClusterRoleBinding>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      sorter: false,
      copyable: true,
      render: (dom, entity) => {
        return (
          <a
            onClick={
              () => {
                setResourceDrawerTitlePrefix('ClusterRoleBinding');
                setResourceName(entity.metadata?.name || '');
                setResourceAddress(`apis/rbac.authorization.k8s.io/v1/clusterrolebindings/${entity.metadata?.name}`)
                setResourceDrawerData(entity);
                setResourceDrawerVisible(true);
              }
            }
          >{entity.metadata?.name}</a>
        );
      },
    },
    {
      title: <FormattedMessage id="cluster.rolebinding.kind.ClusterRole" />,
      sorter: false,
      render: (dom, entity) => {
        return (
          <a
            onClick={
              () => {
                setResourceDrawerTitlePrefix('ClusterRole');
                setResourceName(entity.roleRef.name);
                setResourceAddress(`apis/rbac.authorization.k8s.io/v1/clusterroles/${entity.roleRef.name}`)
                getClusterRole(entity.roleRef.name);
              }
            }
          >{entity.roleRef.name}</a>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.permission.email' }),
      sorter: false,
      render: (dom, entity) => {
        return (
          <>{entity.subjects?.map((item) => {
            return <Tag>{item.name}</Tag>
          })
          }</>
        );
      },
    },

    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      hideInTable: !access.clusterAccess,
      render: (_, record) => {
        const nodes = [
          <Popconfirm
            key={record.metadata?.resourceVersion + '-delete'}
            description={intl.formatMessage({ id: 'cluster.clusterrolebinding.delete.description' })}
            title={intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              intl.formatMessage({ id: 'cluster.clusterrolebinding' }) + '【' + record.metadata?.name + '】'}
            onConfirm={() => {
              handleRemoveClusterRoleBinding(intl, record)
            }}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <DeleteOutlined style={{ color: 'red' }} />
          </Popconfirm>
        ];

        return nodes;
      },
    },
  ];
  const roleBindingcolumns: ProColumns<RoleBinding>[] = [
    {
      title: <FormattedMessage id="cluster.namespace" />,
      sorter: false,
      render: (dom, entity) => {
        return (
          <>{entity.metadata?.namespace}</>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      sorter: false,
      render: (dom, entity) => {
        return (
          <a
            onClick={
              () => {
                setResourceDrawerTitlePrefix('RoleBinding');
                setResourceName(entity.metadata?.name || '');
                setResourceAddress(`apis/rbac.authorization.k8s.io/v1/rolebindings/${entity.metadata?.namespace}/${entity.metadata?.name}`)
                setResourceDrawerData(entity);
                setResourceDrawerVisible(true);
              }
            }
          >{entity.metadata?.name}</a>
        );
      },
    },


    {
      title: <FormattedMessage id="cluster.rolebinding.kind.Role" />,
      sorter: false,
      render: (dom, entity) => {
        return (
          <a
            onClick={
              () => {
                if (entity.roleRef.kind === 'ClusterRole') {
                  setResourceDrawerTitlePrefix('ClusterRole');
                  setResourceAddress(`apis/rbac.authorization.k8s.io/v1/roles/${entity.roleRef.name}`)
                  getClusterRole(entity.roleRef.name);
                } else {
                  setResourceDrawerTitlePrefix('Role');
                  setResourceAddress(`apis/rbac.authorization.k8s.io/v1/namespaces/${entity.roleRef.name}/roles/${entity.roleRef.name}`)
                  getRole(entity.metadata?.namespace || '', entity.roleRef.name);
                }
                setResourceName(entity.roleRef.name);

              }
            }
          >{entity.roleRef.name}</a>
        );
      },
    },

    {
      title: intl.formatMessage({ id: 'cluster.permission.email' }),
      sorter: false,
      render: (dom, entity) => {
        return (
          <>{entity.subjects?.map((item) => {
            return <Tag>{item.name}</Tag>
          })
          }</>
        );
      },
    },

    {
      title: intl.formatMessage({ id: 'pages.operation' }),
      dataIndex: 'option',
      search: false,
      align: 'center',
      hideInTable: !access.clusterAccess,
      render: (_, record) => {
        const nodes = [
          <Popconfirm
            key={record.metadata?.resourceVersion + '-delete'}
            description={intl.formatMessage({ id: 'cluster.role.delete.description' })}
            title={intl.formatMessage({ id: 'pages.operation.delete.description' }) +
              intl.formatMessage({ id: 'cluster.role' }) + '【' + record.metadata?.name + '】'}
            onConfirm={() => {
              handleRemoveRoleBinding(intl, record);
            }}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
          >
            <DeleteOutlined style={{ color: 'red' }} />
          </Popconfirm>
        ];

        return nodes;
      },
    },
  ];

  return (
    <PageContainer header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      title={intl.formatMessage({ id: 'cluster.account' })}
      content={<a><FormattedMessage id='cluster.permission.view' /></a>}
    >
      <Card variant={'borderless'}
      >
        <ProDescriptions column={3} title={intl.formatMessage({ id: 'pages.detail.baseinfo' })}
        >
          <ProDescriptions.Item label={intl.formatMessage({ id: 'model.user.username' })}>
            <SystemUser key={info?.account?.id} enable={info?.account?.enable} avatar={info?.account?.avatar} username={info?.account?.username || ''} nickname={info?.account?.nickname} jobNumber={info?.account?.jobNumber} />
          </ProDescriptions.Item>
          {info?.userAccessMethod === 'csr' &&
            <>
              <ProDescriptions.Item label={intl.formatMessage({ id: 'model.cluster.userAccessMethod' })}
                valueEnum={{
                  'csr': {
                    text: intl.formatMessage({ id: 'model.cluster.userAccessMethod.csr' }),
                  },
                  'token': {
                    text: intl.formatMessage({ id: 'model.cluster.userAccessMethod.token' }),
                  },
                  'impersonation': {
                    text: intl.formatMessage({ id: 'model.cluster.userAccessMethod.impersonation' }),
                  }
                }}
              >
                {info.userAccessMethod}
              </ProDescriptions.Item>
              <ProDescriptions.Item copyable label={intl.formatMessage({ id: 'cluster.resource.CertificateSigningRequest' })}>
                {info.csrName}
              </ProDescriptions.Item></>}
        </ProDescriptions>
      </Card> {info?.accountId && <Card style={{ marginTop: 16 }}>
        <Tabs
          items={[
            {
              label: intl.formatMessage({ id: 'cluster.clusterrolebinding' }),
              key: 'clusterrolebinding',
              children: <>
                <ProTable< ClusterRoleBinding >
                  key='cluster-role-binding'
                  scroll={{ x: 'max-content' }}
                  rowKey={(record: ClusterRoleBinding) => `${record?.metadata?.name}-${record.metadata?.resourceVersion}`}
                  search={false}
                  toolBarRender={false}
                  request={getClusterRoleBindings}
                  columns={clusterRoleBindingcolumns}
                  rowSelection={false}
                />
              </>
            }, {
              label: intl.formatMessage({ id: 'cluster.rolebinding' }),
              key: 'rolebinding',
              children: <>
                <ProTable< RoleBinding >
                  key='role-binding'
                  scroll={{ x: 'max-content' }}
                  actionRef={roleBindingActionRef}
                  rowKey={(record: RoleBinding) => `${record?.metadata?.name}-${record.metadata?.resourceVersion}`}
                  search={false}
                  toolBarRender={false}
                  request={getRoleBindings}
                  columns={roleBindingcolumns}
                  rowSelection={false}
                />
              </>
            }
          ]}
        />
      </Card>}
      <Drawer destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={resourceDrawerVisible}
        onClose={() => setResourceDrawerVisible(false)}
        closable={true}
        title={<>{getClusterResource(resourceDrawerTitlePrefix)}:&nbsp;&nbsp;{resourceName}</>}
      >
        <ResourceEditor key='' edit={false} address={resourceAddress} kind='-' name={resourceName} cluster={cluster} content={resourceDrawerData} />
      </Drawer>
    </PageContainer>
  );
};
export default DetailView;



