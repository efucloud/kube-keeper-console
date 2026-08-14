import type { ProColumns } from '@ant-design/pro-components';
import { EditableProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';

export type FilterSelectorProps = {
  key: string;
  title: React.ReactNode | string;
  labels: { [key: string]: string };
  visible: boolean;
  updateLabels: (labels: { [key: string]: string }) => void;
  setVisible: (visible: boolean) => void;
};
type DataSourceType = {
  id: string;
  key: string;
  value?: string;
};

const FilterSelector: React.FC<FilterSelectorProps> = (props) => {
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>(
    Object.keys(props.labels),
  );
  const [visible, setVisible] = useState<boolean>(props.visible);
  const [dataSource, setDataSource] = useState<DataSourceType[]>([]);
  const intl = useIntl();
  useEffect(() => {
    const { labels } = props;
    setDataSource(
      Object.entries(labels).map(([k, v]) => ({ id: k, key: k, value: v })),
    );
  }, [props.labels]);
  const onFinish = async () => {
    const newLabels = {} as { [key: string]: string };
    for (const item of dataSource) {
      if (item.key && item.key !== '') {
        newLabels[item.key] = item.value || '';
      }
    }
    setVisible(false);
    props.setVisible(false);
    props.updateLabels(newLabels);
  };
  const columns: ProColumns<DataSourceType>[] = [
    {
      title: <FormattedMessage id="cluster.resource.key" />,
      dataIndex: 'key',
      width: '50%',
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
      width: '40%',
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
      key={props.key || 'label_selector'}
      title={props.title || <FormattedMessage id="cluster.labelSelector" />}
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
      <EditableProTable<DataSourceType>
        columns={columns}
        locale={{
          emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
        }}
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
export default FilterSelector;
