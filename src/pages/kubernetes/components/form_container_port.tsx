import { DeleteOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { EditableProTable, nanoid } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Popconfirm, Space } from 'antd';
import { createStyles } from 'antd-style';
import { IIoK8sApiCoreV1ContainerPort } from 'kubernetes-models/v1';

import React, { useState } from 'react';

const useStyles = createStyles(({ token }) => {
  return {
    tabelCell: {
      '.ant-table-cell': {
        '& > div': {
          margin: '10px 5px',
        },
      },
      '.ant-form-item-control-input': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
  };
});
export interface ContainerPortProps extends IIoK8sApiCoreV1ContainerPort {
  key: string;
}
type PortFormProps = {
  ports: Array<ContainerPortProps>;
  setPorts: (ports: Array<ContainerPortProps>) => void;
};

const FormContainerPort: React.FC<PortFormProps> = (props) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [dataSource, setDataSource] = useState<Array<ContainerPortProps>>(props.ports);
  const checkPortExist = (rule: any, value: any, callback: any) => {
    if (value === undefined || value === null) {
      callback(
        intl.formatMessage({ id: 'cluster.resource.container.port.invalid' }),
      );
    }
    const port = Number(value);
    if (!Number.isInteger(port) || port <= 0 || port >= 65536) {
      callback(
        intl.formatMessage({ id: 'cluster.resource.container.port.invalid' }),
      );
    }
    const fields = rule?.fullField.split('.')
    let existPort = dataSource.filter((item) => item.containerPort === value);
    if (fields && fields.length === 2) {
      existPort = dataSource.filter((item) => item.containerPort === value && item.key !== fields[0]);
      if (existPort.length > 0) {
        callback(
          intl.formatMessage({ id: 'cluster.resource.container.port.exist' }),
        );
      }
    } else {
      if (existPort.length > 1) {
        callback(
          intl.formatMessage({ id: 'cluster.resource.container.port.exist' }),
        );
      }
    }
    callback();
  };
  const checkPortNameExist = (rule: any, value: any, callback: any) => {
    const fields = rule?.fullField.split('.')
    let existName = dataSource.filter((item) => item.name === value);
    if (fields && fields.length === 2) {
      existName = dataSource.filter((item) => item.name === value && item.key !== fields[0]);
      if (existName.length > 0) {
        callback(
          intl.formatMessage({ id: 'cluster.resource.container.portName.exist' }),
        );
      }
    } else {
      if (existName.length > 1) {
        callback(
          intl.formatMessage({ id: 'cluster.resource.container.portName.exist' }),
        );
      }
    }
    callback();
  };
  const columns: ProColumns<ContainerPortProps>[] = [
    {
      title: <FormattedMessage id="cluster.resource.container.port.containerPort" />,
      dataIndex: 'containerPort',
      valueType: 'digit',
      formItemProps: {
        rules: [
          {
            required: true,
            message: <FormattedMessage id="cluster.resource.data.must" />,
          },
          { validator: checkPortExist },

        ],
      },
    },
    {
      title: <FormattedMessage id="cluster.resource.container.port.name" />,
      dataIndex: 'name',
      formItemProps: {
        rules: [
          {
            required: true,
            type: 'string',
            message: <FormattedMessage id="cluster.resource.data.must" />,
          },
          { validator: checkPortNameExist },
        ],
      },
    },
    {
      title: <FormattedMessage id="cluster.resource.container.port.protocol" />,
      valueType: 'select',
      dataIndex: 'protocol',
      valueEnum: {
        TCP: {
          text: 'TCP',
        },
        UDP: {
          text: 'UDP',
        },
        SCTP: {
          text: 'SCTP',
        },
      },
      formItemProps: {
        rules: [
          {
            required: true,
            enum: ['TCP', 'UDP', 'SCTP'],
            message: <FormattedMessage id="cluster.resource.data.must" />,
          },
        ],
      },
    },
    {
      title: <FormattedMessage id="pages.operation" />,
      valueType: 'option',
      align: 'center',
      render: (text, record, _, action) => {
        return <Space>
          <a
            key="editable"
            onClick={() => {
              action?.startEditable?.(record.key);
            }}
          >
            <FormattedMessage id="cluster.resource.operation.edit" />
          </a>
          <Popconfirm title={intl.formatMessage({ id: 'cluster.resource.container.port.delete.title' })}
            okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
            cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
            onConfirm={() => {
              const ports = dataSource?.filter(
                (item) => item.key !== record.key,
              );
              setDataSource(ports);
              props.setPorts(ports);
            }}
          >
            <DeleteOutlined style={{ color: 'red' }} />
          </Popconfirm>

        </Space>
      },
    },
  ];

  return (

    <EditableProTable<ContainerPortProps>
      locale={{
        emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
      }}
      className={styles.tabelCell}
      size="small"
      rowKey="key"
      columns={columns}
      value={dataSource}
      recordCreatorProps={{
        newRecordType: 'dataSource',
        record: () => ({
          containerPort: null,
          name: null,
          key: `${nanoid()}`,
          protocol: 'TCP',
        }),
      }}
      loading={false}
      onChange={(values) => {
        setDataSource(values);
      }}
      editable={{
        type: 'single',
        editableKeys,
        onSave: async (rowKey, data, row) => {
          const ports = dataSource;
          for (let i = 0; i < ports.length; i++) {
            if (ports[i].key === rowKey) {
              ports[i] = data;
            }
          }
          setDataSource(ports);
          props.setPorts(ports);
        },
        onChange: setEditableRowKeys,
      }}
    />

  );
};
export default FormContainerPort;
