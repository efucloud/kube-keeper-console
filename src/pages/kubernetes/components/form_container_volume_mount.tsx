import { DeleteOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { EditableProTable, nanoid } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Popconfirm, Space } from 'antd';
import { createStyles } from 'antd-style';
import { SelectProps } from 'antd/lib';
import { IIoK8sApiCoreV1Volume, IVolumeMount } from 'kubernetes-models/v1';

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

type ContainerIVolumeMountListProps = {
  volumeMounts: ContainerIVolumeMountProps[];
  volumes: IIoK8sApiCoreV1Volume[];
  setVolumeMounts: (volumeMounts: ContainerIVolumeMountProps[]) => void;
  timezoneSync?: boolean;
};
export type ContainerIVolumeMountProps = IVolumeMount & {
  key: string | number;
};

const FormContainerVolumeMounts: React.FC<ContainerIVolumeMountListProps> = (props) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [timezoneSync, _] = useState<boolean>(props.timezoneSync === true)
  const [dataSource, setDataSource] = useState<ContainerIVolumeMountProps[]>(props.volumeMounts);
  const checkVolumeExist = (rule: any, value: any, callback: any) => {
    const fields = rule?.fullField.split('.')
    let existVolume = dataSource.filter((item) => item.name === value);
    if (fields && fields.length === 2) {
      existVolume = dataSource.filter((item) => item.name === value && item.key !== fields[0]);
      if (existVolume.length > 0) {
        callback(
          intl.formatMessage({ id: 'cluster.resource.container.volumeMount.exist' }),
        );
      }
    } else {
      if (existVolume.length > 1) {
        callback(
          intl.formatMessage({ id: 'cluster.resource.container.volumeMount.exist' }),
        );
      }
    }
    callback();
  };
  let mountOptions = [] as SelectProps['options'];
  if (mountOptions) {
    for (let i = 0; i < props.volumes.length; i++) {
      const item = props.volumes[i];
      if (item.emptyDir) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.emptyDir' />)</>,
          value: item.name,
        })
      } else if (item.configMap) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.configMap' />)</>,
          value: item.name,
        })
      } else if (item.secret) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.secret' />)</>,
          value: item.name,
        })
      } else if (item.persistentVolumeClaim) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.persistentVolumeClaim' />)</>,
          value: item.name,
        })
      } else if (item.hostPath) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.hostPath' />)</>,
          value: item.name,
        })
      } else if (item.nfs) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.nfs' />)</>,
          value: item.name,
        })
      } else if (item.ephemeral) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.ephemeral' />)</>,
          value: item.name,
        })
      } else if (item.csi) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.csi' />)</>,
          value: item.name,
        })
      } else if (item.downwardAPI) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.downwardAPI' />)</>,
          value: item.name,
        })
      } else if (item.fc) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.fc' />)</>,
          value: item.name,
        })
      } else if (item.image) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.image' />)</>,
          value: item.name,
        })
      } else if (item.iscsi) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.iscsi' />)</>,
          value: item.name,
        })
      } else if (item.projected) {
        mountOptions.push({
          label: <>{item.name}(<FormattedMessage id='cluster.resource.volume.provider.projected' />)</>,
          value: item.name,
        })
      }
    }
  }
  const columns: ProColumns<ContainerIVolumeMountProps>[] = [

    {
      title: <FormattedMessage id="cluster.resource.container.volumeMount.name" />,
      dataIndex: 'name',
      key: 'name',
      valueType: 'select',
      width: 300,
      fieldProps: () => {
        return {
          options: mountOptions
        }
      },
      formItemProps: {
        rules: [
          {
            required: true,
            message: <FormattedMessage id="cluster.resource.data.must" />,
          },
          { validator: checkVolumeExist },
        ],
      },
    },
    {
      title: <FormattedMessage id="cluster.resource.container.volumeMount.mountPath" />,
      dataIndex: 'mountPath',
      key: 'mountPath',
      formItemProps: { 
        rules: [
          {
            required: true,
            message: <FormattedMessage id="cluster.resource.data.must" />,
          },
          {
            message: (
              <FormattedMessage id="cluster.resource.data.format.invalid" />
            ),
            pattern: new RegExp('^\/(?:[^\/\0]+\/)*[^\/\0]*$'),
          },
        ],
      },
    },
    {
      title: <FormattedMessage id="cluster.resource.container.volumeMount.subPath" />,
      dataIndex: 'subPath',
      key: 'subPath',

    },
    {
      title: <FormattedMessage id="cluster.resource.container.volumeMount.readOnly" />,
      dataIndex: 'readOnly',
      key: 'readOnly',
      valueType: 'select',
      valueEnum: {
        true: { text: intl.formatMessage({ id: 'cluster.boolean.true' }), status: 'Success' },
        false: { text: intl.formatMessage({ id: 'cluster.boolean.false' }), status: 'Error' },
      },
    },
    {
      title: <FormattedMessage id="pages.operation" />,
      valueType: 'option',
      key: 'option',
      align: 'center',
      render: (text, record, _, action) => {
        if (!timezoneSync && (record.mountPath === '/etc/localtime' || record.mountPath === '/etc/timezone')) {
          return <Space>
            <a
              key="editable"
              onClick={() => {
                action?.startEditable?.(record.key);
              }}
            >
              <FormattedMessage id="cluster.resource.operation.edit" />
            </a>
            <Popconfirm title={intl.formatMessage({ id: 'cluster.resource.container.volumeMount.delete.title' })}
              okText={intl.formatMessage({ id: 'pages.operation.confirm' })}
              cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
              onConfirm={() => {
                const volumeMounts = dataSource?.filter(
                  (item) => item.key !== record.key,
                );
                setDataSource(volumeMounts);
                props.setVolumeMounts(volumeMounts || []);
              }}
            >
              <DeleteOutlined style={{ color: 'red' }} />
            </Popconfirm>
          </Space>
        } else {
          return null;
        }
      },
    },
  ];

  return (
    <EditableProTable<ContainerIVolumeMountProps>
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
          key: `${nanoid()}`,
        }),
      }}
      loading={false}
      onChange={(values: Record<string, any>) => {
        if (values['readOnly'] === 'true') {
          values['readOnly'] = true
        } {
          values['readOnly'] = false
        }
        setDataSource(values);
      }}
      editable={{
        type: 'single',
        editableKeys,
        onSave: async (rowKey, data, row) => {
          if (data['readOnly'] === 'true') {
            data['readOnly'] = true
          } else {
            data['readOnly'] = false
          }
          const volumeMounts = dataSource;
          for (let i = 0; i < volumeMounts.length; i++) {
            if (volumeMounts[i].key === rowKey) {
              volumeMounts[i] = data;
            }
          }
          setDataSource(volumeMounts);
          props.setVolumeMounts(volumeMounts);
        },
        onChange: setEditableRowKeys,
      }}
    />

  );
};
export default FormContainerVolumeMounts;
