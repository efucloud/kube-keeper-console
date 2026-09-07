import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import {
  Avatar,
  Button,
  message,
  Popconfirm,
  Space,
  Switch,
  Tag,
  Upload,
} from 'antd';
import { saveAs } from 'file-saver';
import * as yaml from 'js-yaml';
import { useEffect, useRef, useState } from 'react';
import type { DictionaryLine } from '@/services/data_dictionary';
import { getDataDictionary } from '@/services/data_dictionary.api';
import {
  MARKET_APPLICATION_CATEGORY_DICTIONARY,
  MARKET_APPLICATION_TAG_DICTIONARY,
} from '@/services/data_dictionary.constants';
import type { MarketApplicationDetail } from '@/services/market_application';
import {
  deleteMarketApplication,
  exportMarketApplication,
  importMarketApplication,
  listMarketApplication,
  updateMarketApplicationState,
} from '@/services/market_application.api';

const ApplicationManagement: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [categories, setCategories] = useState<DictionaryLine[]>([]);
  const [tags, setTags] = useState<DictionaryLine[]>([]);
  useEffect(() => {
    Promise.all([
      getDataDictionary({ code: MARKET_APPLICATION_CATEGORY_DICTIONARY }),
      getDataDictionary({ code: MARKET_APPLICATION_TAG_DICTIONARY }),
    ]).then(([categoryDictionary, tagDictionary]) => {
      setCategories(categoryDictionary.lines || []);
      setTags(tagDictionary.lines || []);
    });
  }, []);
  const dictionaryLabel = (lines: DictionaryLine[], value: string) =>
    lines.find((line) => line.value === value)?.label || value;
  const exportApplication = async (record: MarketApplicationDetail) => {
    const data = await exportMarketApplication({ id: record.id });
    saveAs(
      new Blob([yaml.dump(data, { noRefs: true, lineWidth: 120 })], {
        type: 'application/yaml;charset=utf-8',
      }),
      `${record.name}.yaml`,
    );
  };
  const columns: ProColumns<MarketApplicationDetail>[] = [
    {
      title: intl.formatMessage({ id: 'application.name' }),
      dataIndex: 'name',
      render: (_, record) => (
        <Space>
          {record.logo && <Avatar shape="square" src={record.logo} />}
          <a
            onClick={() => history.push(`/admin/application/${record.id}/edit`)}
          >
            {record.name}
          </a>
        </Space>
      ),
    },
    {
      title: intl.formatMessage({ id: 'application.category' }),
      dataIndex: 'category',
      width: 140,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        categories.map((item) => [item.value, { text: item.label }]),
      ),
      render: (_, record) => dictionaryLabel(categories, record.category),
    },
    {
      title: intl.formatMessage({ id: 'application.tags' }),
      dataIndex: 'tags',
      search: false,
      render: (_, record) => (
        <Space size={[2, 2]} wrap>
          {record.tags?.map((tag) => (
            <Tag key={tag}>{dictionaryLabel(tags, tag)}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: intl.formatMessage({ id: 'application.resources' }),
      search: false,
      width: 100,
      render: (_, record) => record.templates?.length || 0,
    },
    {
      title: intl.formatMessage({ id: 'application.published' }),
      dataIndex: 'state',
      valueType: 'select',
      valueEnum: {
        0: { text: intl.formatMessage({ id: 'application.draft' }) },
        1: { text: intl.formatMessage({ id: 'application.published' }) },
      },
      width: 110,
      render: (_, record) => (
        <Switch
          checked={record.state === 1}
          onChange={async (checked) => {
            await updateMarketApplicationState({
              id: record.id,
              state: checked ? 1 : 0,
            });
            message.success(intl.formatMessage({ id: 'application.saved' }));
            actionRef.current?.reload();
          }}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'application.updatedAt' }),
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      search: false,
      width: 180,
    },
    {
      title: intl.formatMessage({ id: 'application.actions' }),
      valueType: 'option',
      width: 170,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => history.push(`/admin/application/${record.id}/edit`)}
          />
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => exportApplication(record)}
          />
          <Popconfirm
            title={intl.formatMessage({ id: 'application.delete.confirm' })}
            onConfirm={async () => {
              await deleteMarketApplication({ ids: [record.id] });
              message.success(
                intl.formatMessage({ id: 'application.deleted' }),
              );
              actionRef.current?.reload();
            }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  return (
    <PageContainer
      title={intl.formatMessage({ id: 'application.management' })}
      subTitle={intl.formatMessage({
        id: 'application.management.description',
      })}
    >
      <ProTable<MarketApplicationDetail>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={(params, sort) =>
          listMarketApplication({
            current: params.current,
            pageSize: params.pageSize,
            search: params.name as string,
            category: params.category as string,
            state: params.state as number,
            order: Object.keys(sort).length ? undefined : 'updated_at DESC',
          })
        }
        toolBarRender={() => [
          <Upload
            key="import"
            accept=".yaml,.yml,.json"
            showUploadList={false}
            beforeUpload={async (file) => {
              await importMarketApplication(await file.text());
              message.success(
                intl.formatMessage({ id: 'application.imported' }),
              );
              actionRef.current?.reload();
              return Upload.LIST_IGNORE;
            }}
          >
            <Button icon={<UploadOutlined />}>
              {intl.formatMessage({ id: 'application.import' })}
            </Button>
          </Upload>,
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/admin/application/create')}
          >
            {intl.formatMessage({ id: 'application.create' })}
          </Button>,
        ]}
      />
    </PageContainer>
  );
};
export default ApplicationManagement;
