import { type ActionType, FooterToolbar, type ProColumns, ProTable, } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Button, Flex, Modal, message, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import type {
  IIoK8sApiCoreV1ServicePort, Service, ServiceList, } from 'kubernetes-models/v1';
import { useRef, useState } from 'react';
import type { IntlShape } from 'react-intl';
import { clusterDeleteProxy, clusterGetProxy } from '@/services/cluster_proxy.api';
import { appendKubernetesViewQuery, getColorPrimary } from '@/utils/global';
export type RenderServiceProps = {
  cluster: string;
  namespace: string;
  podLabels: Record<string, string>;
};
export const RelatedServices: React.FC<RenderServiceProps> = (props) => {
  const { cluster, namespace, podLabels } = props;
  const intl = useIntl();
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const [selectedRowsState, setSelectedRows] = useState<Service[]>([]);
  const [expandInfo, setExpandInfo] = useState<boolean>(false);

  const address = `api/v1/namespaces/${namespace}/services`;
  const listServices = async () => {
    const params = { cluster, address: address } as Record<string, any>;
    const matchServices = [] as Service[];
    const data = (await clusterGetProxy(params)) as ServiceList;
    for (let i = 0; i < data.items.length; i++) {
      const service = data.items[i];
      let matched = 0 as number;
      if (!podLabels) {
        matched = 0;
        continue;
      }
      if (service.spec?.selector && podLabels) {
        for (const key of Object.keys(service.spec?.selector)) {
          if (podLabels[key] === service.spec?.selector[key]) {
            matched = matched + 1;
          }
        }
      }
      if (
        matched > 0 &&
        matched === Object.keys(service.spec?.selector).length
      ) {
        matchServices.push(service);
      }
    }
    return {
      data: matchServices,
      success: true,
      total: matchServices?.length,
    };
  };
  const handleRemove = async (intl: IntlShape, selectedRows: Service[]) => {
    if (!selectedRows) return true;
    // 批量删除
    selectedRows.forEach(async (entity: Service) => {
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
  const columns: ProColumns<Service>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.name' }),
      dataIndex: 'name',
      render: (dom, entity) => {
        return (
          <>
            <a
              onClick={() => {
                window.location.href = appendKubernetesViewQuery(`/kubernetes/namespace/networks/services/${entity?.metadata?.name}`, { cluster: cluster, namespace: entity?.metadata?.namespace });
              }}
            >
              {entity?.metadata?.name}
            </a>
          </>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.pod.selector' }),
      render: (dom, entity: Service) => {
        const keys = Object.keys(entity?.spec?.selector || {});
        return (
          <div>
            {Object.keys(entity?.spec?.selector || {})?.map((key: string) => (
              <>
                <Tag style={{ border: 0 }} key={key}>
                  {key}={entity?.spec?.selector[key]}
                </Tag>
                <br />
              </>
            ))}
          </div>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.service.port' }),
      render: (dom, entity: Service) => {
        const tags = [] as React.ReactNode[];

        if (expandInfo) {
          for (let i = 0; i < entity.spec?.ports?.length; i++) {
            const item = entity.spec?.ports[i] as IIoK8sApiCoreV1ServicePort;
            tags.push(
              <Tag style={{ border: 0 }}>
                <FormattedMessage id="cluster.service.port.protocol" />
                :&nbsp;{item.protocol || 'TCP'}&nbsp;
                {item.name && (
                  <>
                    <FormattedMessage id="cluster.service.port.name" />
                    :&nbsp;{item.name}&nbsp;
                  </>
                )}
                {item.port && (
                  <>
                    <FormattedMessage id="cluster.service.port.port" />
                    :&nbsp;{item.port}&nbsp;
                  </>
                )}
                {item.targetPort && (
                  <>
                    <FormattedMessage id="cluster.service.port.targetPort" />
                    :&nbsp;{item.targetPort}&nbsp;
                  </>
                )}
                <br />
              </Tag>,
            );
          }
        } else {
          for (let i = 0; i < entity.spec?.ports?.length; i++) {
            const item = entity.spec?.ports[i] as IIoK8sApiCoreV1ServicePort;
            tags.push(
              <Tag style={{ border: 0 }}>
                {item.name && (
                  <>
                    <FormattedMessage id="cluster.service.port.name" />
                    :&nbsp;{item.name}&nbsp;
                  </>
                )}
                {item.port && (
                  <>
                    <FormattedMessage id="cluster.service.port.port" />
                    :&nbsp;{item.port}&nbsp;
                  </>
                )}
                <br />
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
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: Service) => {
        return (
          <span>
            {dayjs(entity.metadata?.creationTimestamp).format(
              'YYYY-MM-DD HH:mm:ss',
            )}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <ProTable<Service>
        key='service'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey={(record: Service) =>
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
        request={listServices}
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
    </>
  );
};
