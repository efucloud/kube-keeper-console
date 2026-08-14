import type { ProColumns } from '@ant-design/pro-components';
import { EditableProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Alert, Modal, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { clusterPatchProxy } from '@/services/cluster_proxy.api';
import type { PatchSubsetValue } from '@/services/common';
import { getClusterResource } from '@/utils/cluster';

export type PatchLabelsProps = {
  title: React.ReactNode | string;
  patchType: string;
  key: string;
  cluster: string;
  kind: string;
  name: string;
  address: string; //请求资源地址
  labels: { [key: string]: string };
  visible: boolean;
  setVisible: (visible: boolean) => void;
};
type DataSourceType = {
  id: string;
  key: string;
  value?: string;
};

const PatchLabels: React.FC<PatchLabelsProps> = (props) => {
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>(
    Object.keys(props.labels),
  );
  const rawLabels = { ...props.labels } as { [key: string]: string };
  const intl = useIntl();
  const [visible, setVisible] = useState<boolean>(props.visible);
  const [dataSource, setDataSource] = useState<DataSourceType[]>([]);
  useEffect(() => {
    const { labels } = props;
    setDataSource(
      Object.entries(labels).map(([k, v]) => ({ id: k, key: k, value: v })),
    );
  }, [props.labels]);
  const onFinish = async () => {

    const patchs = {} as { [key: string]: string };
    for (const item of dataSource) {
      if (item.key && item.key !== '') {
        patchs[item.key] = item.value || '';
      }
    }
    if (rawLabels && rawLabels['efucloud.com/workspace']) {
      patchs['efucloud.com/workspace'] = rawLabels['efucloud.com/workspace']
    } else {
      delete patchs['efucloud.com/workspace']
    }
    if (Object.keys(patchs).length !== 0) {
      const patchData = {} as PatchSubsetValue;
      patchData.path = `/metadata/${props.patchType || 'labels'}`;
      patchData.value = patchs;
      patchData.op = 'replace';
      const params = {

        cluster: props.cluster,
        address: props.address,
      };

      await clusterPatchProxy(params, [patchData] as PatchSubsetValue[]);
      message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
    }
    props.setVisible(false);
  };
  const columns: ProColumns<DataSourceType>[] = [
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
      width: '50%',
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
    <Modal
      okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
      cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
      key={props.key}
      title={props.title}
      width="50vw"
      open={visible}
      onCancel={() => {
        setVisible(false);
        props.setVisible(false);
      }}
      onOk={() => {
        onFinish();
        setVisible(false);
      }}
    >
      <Alert
        title={
          <>
            {<FormattedMessage id="resource.cluster.owner" />}&nbsp;:&nbsp;
            {props.cluster}&nbsp;&nbsp;&nbsp;&nbsp;
            <FormattedMessage id="cluster.resource.kind" />
            &nbsp;:&nbsp;{getClusterResource(props.kind)}
            &nbsp;&nbsp;&nbsp;&nbsp;
            {<FormattedMessage id="cluster.resource.name" />}&nbsp;:&nbsp;
            {props.name}&nbsp;&nbsp;&nbsp;&nbsp;
          </>
        }
        type="warning"
      />
      <EditableProTable<DataSourceType>
        locale={{
          emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
        }}
        columns={columns}
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
    </Modal>
  );
};
export default PatchLabels;
