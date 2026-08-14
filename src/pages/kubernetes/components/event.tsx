import {
  type ActionType,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import type { Event, EventList, IEvent } from 'kubernetes-models/v1';
import { useEffect, useRef, useState } from 'react';
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import { getColorPrimary } from '@/utils/global';
import { Drawer } from 'antd';
import { getClusterResource } from '@/utils/cluster';
import ResourceEditor from './resource_editor';
export type RelatedEventsProps = {
  
  cluster: string;
  namespace: string;
  fieldSelectors: Record<string, string>;

};
export const RelatedEvents: React.FC<RelatedEventsProps> = (props) => {
  const { cluster, namespace, fieldSelectors } = props;
  const [resourceDrawerVisible, setResourceDrawerVisible] = useState<boolean>(false);
  const [drawerSize, setDrawerSize] = useState<number>(800);
  const intl = useIntl();
  const [expandInfo, setExpandInfo] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event>({} as Event)
  const colorPrimary = getColorPrimary();
  const actionRef = useRef<ActionType>(null);
  const address = `api/v1/namespaces/${namespace}/events`;
  const listEvents = async () => {
    const params = { cluster, address: address } as Record<string, any>;
    const data = (await clusterGetProxy(params)) as EventList;
    let matchEvents = [] as IEvent[];
    if (props.fieldSelectors) {
      for (let i = 0; i < data.items.length; i++) {
        const event = data.items[i];
        let match = true;
        if (props.fieldSelectors['kind']) {
          if (event.involvedObject.kind !== props.fieldSelectors['kind']) {
            match = false;
          }
        }
        if (props.fieldSelectors['name']) {
          if (event.involvedObject.name !== props.fieldSelectors['name']) {
            match = false;
          }
          if (props.fieldSelectors['kind'] !== "Pod") {
            if (event.involvedObject.name?.startsWith(`${props.fieldSelectors['name']}-`)) {
              match = true;
            }
          }
        }
        if (match) {
          matchEvents.push(event);
        }
      }
    }
    matchEvents = [...matchEvents].reverse();
    return {
      data: matchEvents,
      success: true,
      total: matchEvents?.length,
    };
  };


  const columns: ProColumns<Event>[] = [
    {
      title: intl.formatMessage({ id: 'cluster.resource.event.type' }),
      dataIndex: 'type',
      render: (dom, entity: Event) => {
        return <>{entity.type}</>;
      },
    },

    {
      title: intl.formatMessage({ id: 'cluster.resource.event.name' }),
      dataIndex: 'name',
      search: false,
      render: (dom, entity) => {
        return <a onClick={() => {
          setResourceDrawerVisible(true)
          setSelectedEvent(entity)
        }}>{entity?.metadata?.name}</a>;
      },
    },

    {
      title: intl.formatMessage({ id: 'cluster.resource.event.reason' }),
      search: false,
      render: (dom, entity: Event) => {
        return <>{entity.reason}</>;
      },
    },

    {
      title: intl.formatMessage({
        id: 'cluster.resource.event.reportingComponent',
      }),
      render: (dom, entity: Event) => {
        return <>{entity.reportingComponent}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.event.count' }),
      render: (dom, entity: Event) => {
        return <>{entity.count}</>;
      },
    },
    {
      title: intl.formatMessage({ id: 'cluster.resource.creationTimestamp' }),
      search: false,
      render: (dom, entity: Event) => {
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
      <ProTable<Event>
        key='event'
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey={(record: Event) =>
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
        request={listEvents}
        columns={columns}
        rowSelection={false}
      />
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
            {getClusterResource('Event')}:&nbsp;&nbsp;
            {selectedEvent?.metadata?.name}
          </>
        }
      >
        <ResourceEditor
          key={selectedEvent.metadata?.uid!}
          edit={false}
          address=''
          kind="Event"
          name={selectedEvent?.metadata?.name || ''}

          cluster={cluster}
          content={selectedEvent}
        />
      </Drawer>
    </>
  );
};
