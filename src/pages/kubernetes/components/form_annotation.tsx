import { DeleteOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { EditableProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import React, { useEffect, useState } from 'react';

type DataSourceType = {
  id: string;
  key: string;
  value?: string;
};
type AnnotationsProps = {
  annotations: { [key: string]: string };
  setAnnotations: (annotations: { [key: string]: string }) => void;
};

const FormAnnotation: React.FC<AnnotationsProps> = (props) => {
  const intl = useIntl();
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [dataSource, setDataSource] = useState<DataSourceType[]>();
  useEffect(() => {
    const annotations = Object.keys(props?.annotations).map((key) => {
      return { key: key, id: key, value: props.annotations[key] };
    });
    setDataSource(annotations);
  }, [props.annotations]);
  const checkExist = (rule: any, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const names = dataSource?.map(item => item.key) || [];
      if (names.filter(item => item === value).length > 1) {
        reject(intl.formatMessage({ id: 'cluster.resource.annotation.exist' }));
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
    },
    {
      title: <FormattedMessage id="pages.operation" />,
      valueType: 'option',
      width: 200,
      render: (text, record, _, action) => {
        if (record.key === 'efucloud.com/description') {
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
        rowKey="id"
        scroll={{
          y: 400,
        }}
        recordCreatorProps={{
          newRecordType: 'dataSource',
          record: () => ({
            id: `id-${Date.now()}`,
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
            const annotations = props.annotations;
            if (data.key) {
              annotations[data.key] = data.value || '';
            }
            setDataSource(
              Object.keys(annotations).map((key) => {
                return { key: key, value: annotations[key] } as DataSourceType;
              }),
            );
            props.setAnnotations(annotations);
          },
          onChange: setEditableRowKeys,
        }}
      />
    </>
  );
};
export default FormAnnotation;
