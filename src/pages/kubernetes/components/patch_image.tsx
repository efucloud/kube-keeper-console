import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { EditableProTable } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { Alert, Button, Drawer, Typography, Space, message, Select, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { clusterPatchProxy } from '@/services/cluster_proxy.api';
import type { PatchSubsetValue } from '@/services/common';
import { getClusterResource } from '@/utils/cluster';
import { IContainer } from 'kubernetes-models/v1';
import { getColorPrimary } from '@/utils/global';
import { namespaceImageSearch } from '@/services/namespace.api';

const { Title } = Typography;

export type PatchImagesProps = {
  title: React.ReactNode | string;
  key: string;
  cluster: string;
  namespace: string;
  address: string;
  visible: boolean;
  kind: string;
  name: string;
  setVisible: (visible: boolean) => void;
  containers: IContainer[];
  initContainers?: IContainer[];
};

type DataSourceType = {
  position: 'initContainers' | 'containers';
  name: string;
  path: string;
  value: string;
};

const PatchImages: React.FC<PatchImagesProps> = (props) => {
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const colorPrimary = getColorPrimary();
  const [searchImage, setSearchImage] = useState<DataSourceType | undefined>();
  const [searchVisible, setSearchVisible] = useState<boolean>(false);
  const [imagePrefix, setImagePrefix] = useState<string>('');
  const intl = useIntl();
  const [dataSource, setDataSource] = useState<DataSourceType[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const actionRef = useRef<ActionType>(null);
  const [drawerSize, setDrawerSize] = useState<number>(800);

  // 初始化 dataSource
  useEffect(() => {
    if (!props.visible) return;

    const pathPrefix =
      props.kind === 'CronJob'
        ? '/spec/jobTemplate/spec/template/spec'
        : '/spec/template/spec';

    const imagesData: DataSourceType[] = [];

    props.containers.forEach((container, i) => {
      const path = `${pathPrefix}/containers/${i}/image`;
      imagesData.push({
        position: 'containers',
        name: container.name,
        path,
        value: container.image || '',
      });
    });

    if (props.initContainers && props.initContainers.length > 0) {
      props.initContainers.forEach((container, i) => {
        const path = `${pathPrefix}/initContainers/${i}/image`;
        imagesData.push({
          position: 'initContainers',
          name: container.name,
          path,
          value: container.image || '',
        });
      });
    }

    setDataSource(imagesData);
    // 初始不进入编辑态，由用户点击“编辑”触发
    setEditableRowKeys([]);
  }, [props.visible, props.kind, props.containers, props.initContainers]);

  const searchFromServer = async (image: string) => {
    try {
      const res = await namespaceImageSearch({

        cluster: props.cluster,
        namespace: props.namespace,
        image: image,
      });
      setImages(res || []);
    } catch (err) {
      message.error(intl.formatMessage({ id: 'cluster.operation.failed' }));
    }
  };

  const onFinish = async () => {
    const patchs: PatchSubsetValue[] = dataSource.map((data) => ({
      op: 'replace',
      path: data.path,
      value: data.value.trim(),
    }));

    try {
      await clusterPatchProxy({ cluster: props.cluster, address: props.address }, patchs);
      message.success(intl.formatMessage({ id: 'cluster.pages.operation.success' }));
      props.setVisible(false);
    } catch (err) {
      message.error(intl.formatMessage({ id: 'cluster.operation.failed' }));
    }
  };

  // 点击“编辑”按钮：仅开启当前行编辑
  const handleEdit = (record: DataSourceType) => {
    setImagePrefix('');
    setSearchImage(undefined);
    setSearchVisible(false);
    setImages([]);
    setEditableRowKeys([record.path]);
  };

  // 点击“搜索”按钮
  const handleSearch = (record: DataSourceType) => {
    setEditableRowKeys([]);
    let prefix = record.value;
    if (record.value.includes(':')) {
      prefix = record.value.split(':')[0];
    }
    setImagePrefix(prefix);
    setSearchImage(record);
    setSearchVisible(true);
    setImages([]);
    searchFromServer(record.value);
  };

  const columns: ProColumns<DataSourceType>[] = [
    {
      title: <FormattedMessage id="cluster.resource.containers" />,
      dataIndex: 'name',
      width: '20%',
      editable: false,
      render: (_, record) => {
        return record.position === 'initContainers' ? (
          <Space>
            <Tag color="blue">
              <FormattedMessage id="cluster.workload.initContainers" />
            </Tag>
            {record.name}
          </Space>
        ) : (
          <Space>
            <Tag color="green">
              <FormattedMessage id="cluster.workload.containers" />
            </Tag>
            {record.name}
          </Space>
        );
      },
    },
    {
      title: <FormattedMessage id="cluster.workload.container.image" />,
      dataIndex: 'value',
      editable: true,
      width: '65%',
    },
    {
      title: <FormattedMessage id="pages.operation" />,
      search: false,
      editable: false,
      align: 'center',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          {/* 编辑按钮 */}
          <Button
            type="link"
            onClick={() => handleEdit(record)}
            size="small"
          >
            {intl.formatMessage({ id: 'pages.operation.edit' })}
          </Button>

          {/* 搜索按钮 */}
          <Button
            type="link"
            onClick={() => handleSearch(record)}
            size="small"
          >
            {intl.formatMessage({ id: 'pages.search' })}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Drawer
        title={
          <Space>
            {intl.formatMessage({ id: 'cluster.resource.images.change' })}
          </Space>
        }
        extra={
          <Button type="primary" onClick={onFinish}>
            {intl.formatMessage({ id: 'pages.operation.commit' })}
          </Button>
        }
        destroyOnHidden={true}
        size={drawerSize}
        resizable={{
          onResize: (newSize) => setDrawerSize(newSize),
        }}
        open={props.visible}
        onClose={() => props.setVisible(false)}
        closable={true}
      >
        <Alert
          message={
            <>
              <FormattedMessage id="resource.cluster.owner" />: {props.cluster}{' '}
              &nbsp;&nbsp;
              <FormattedMessage id="cluster.resource.kind" />:{' '}
              {getClusterResource(props.kind)} &nbsp;&nbsp;
              <FormattedMessage id="cluster.resource.name" />: {props.name}
            </>
          }
          type="warning"
          style={{ marginBottom: 16 }}
        />

        <EditableProTable<DataSourceType>
          locale={{
            emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
          }}
          actionRef={actionRef}
          rowKey="path"
          columns={columns}
          value={dataSource}
          onChange={setDataSource}
          recordCreatorProps={false}
          editable={{
            type: 'single', // 支持单行编辑
            editableKeys,
            onChange: setEditableRowKeys,
            onValuesChange: (record, recordList) => {
              setDataSource(recordList);
            },
          }}
        />

        {/* 搜索面板 */}
        {searchVisible && searchImage && (
          <div style={{ marginTop: 24 }}>
            <Alert
              message={intl.formatMessage({
                id: 'cluster.resource.container.image.search.description',
              })}
              type="info"
              style={{ marginBottom: 12 }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Title level={5}>
                {intl.formatMessage({
                  id: 'cluster.resource.container.image.wait.changed',
                })}{' '}
                {searchImage.name}
              </Title>

            </div>
            <div style={{ marginBottom: 12, fontSize: 14, color: '#666' }}>
              {intl.formatMessage({ id: 'cluster.select.image.prefix' })}: <code>{imagePrefix}</code>
            </div>
            <Select
              showSearch
              placeholder={intl.formatMessage({
                id: 'cluster.select.image.tag',
              })}
              style={{ width: '100%' }}
              options={images.map((img) => ({
                label: img,
                value: img,
              }))}
              onChange={(fullImage: string) => {
                // fullImage 是完整地址，如 "docker.io/nginx:1.25"
                setEditableRowKeys([]);
                setDataSource((prev) =>
                  prev.map((item) =>
                    item.path === searchImage.path
                      ? { ...item, value: imagePrefix + ':' + fullImage }
                      : item
                  )
                );

                setSearchVisible(false);
                message.success(
                  intl.formatMessage(
                    { id: 'cluster.resource.container.image.updated' },
                    { name: searchImage.name }
                  )
                );
              }}
              notFoundContent={intl.formatMessage({ id: 'pages.no.data' })}
            />
          </div>
        )}
      </Drawer>
    </>
  );
};

export default PatchImages;