import { DeleteOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { EditableProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import React, { useEffect, useState } from 'react';

type DataSourceType = {
  key: string;
  value?: string;
};
type LabelsProps = {
  labels: { [key: string]: string };
  setLabels: (labels: { [key: string]: string }) => void;
};

const FormLabel: React.FC<LabelsProps> = (props) => {
  const intl = useIntl();
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [dataSource, setDataSource] = useState<DataSourceType[]>();
  useEffect(() => {
    const labels = Object.keys(props?.labels).map((key) => {
      return { key: key, value: props.labels[key] };
    });
    setDataSource(labels);
  }, [props.labels]);
  const checkExist = (rule: any, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const names = dataSource?.map(item => item.key) || [];
      if (names.filter(item => item === value).length > 1) {
        reject(intl.formatMessage({ id: 'cluster.resource.label.exist' }));
      } else {
        resolve();
      }
    });
  };
  const columns: ProColumns<DataSourceType>[] = [
    {
      title: <FormattedMessage id="cluster.resource.key" />,
      dataIndex: 'key',
      formItemProps: {
        rules: [
          {
            required: true,
            whitespace: true,
            message: <FormattedMessage id="cluster.resource.data.must" />,
          },
          { validator: checkExist }
        ],
      },
    },
    {
      title: <FormattedMessage id="cluster.resource.value" />,
      dataIndex: 'value',
      formItemProps: {
        rules: [
          {
            message: (
              <FormattedMessage id="cluster.resource.data.format.invalid" />
            ),
            pattern: /(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?/,
          },
        ],
      },
    },
    {
      title: <FormattedMessage id="pages.operation" />,
      valueType: 'option',
      width: 200,
      render: (text, record, _, action) => {
        if (record.key === 'app') {
          return null;
        } else {
          return [
            <a
              key="editable"
              onClick={() => {
                action?.startEditable?.(record.key);
              }}
            >
              <FormattedMessage id="cluster.resource.operation.edit" />
            </a>
          ]
        }
      },
    },
  ];

  return (
    <>
      <EditableProTable<DataSourceType>
        locale={{
          emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
        }}
        rowKey="key"
        scroll={{
          y: 400,
        }}
        recordCreatorProps={{
          newRecordType: 'dataSource',
          record: () => ({
            key: `label-${Date.now()}`,
          }),
        }}
        loading={false}
        columns={columns}
        value={dataSource}
        onChange={setDataSource}
        editable={{
          type: 'single',
          editableKeys,
          onSave: async (rowKey, data, row) => {
            const labels = props.labels;
            if (data.key) {
              labels[data.key] = data.value || '';
            }
            setDataSource(
              Object.keys(labels).map((key) => {
                return { key: key, value: labels[key] } as DataSourceType;
              }),
            );
            props.setLabels(labels);
          },
          onChange: setEditableRowKeys,
        }}
      />
    </>
  );
};
export default FormLabel;
