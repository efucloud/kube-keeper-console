import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  EditableProTable,
  ModalForm,
  PageContainer,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Drawer,
  Empty,
  message,
  Popconfirm,
  Space,
  Typography,
  theme,
} from 'antd';
import { useRef, useState } from 'react';
import type {
  DataDictionaryDetail,
  DataDictionaryUpdate,
  DictionaryLine,
} from '@/services/data_dictionary';
import {
  listDataDictionary,
  updateDataDictionary,
} from '@/services/data_dictionary.api';

type EditableDictionaryLine = DictionaryLine & {
  rowKey: string;
  isNew?: boolean;
};

const toEditableLines = (
  lines: DictionaryLine[] = [],
): EditableDictionaryLine[] =>
  lines.map((line, index) => ({
    ...line,
    rowKey: `${line.value}-${index}`,
  }));

const DictTableList: React.FC = () => {
  const { token } = theme.useToken();
  const intl = useIntl();
  const actionRef = useRef<ActionType>(null);
  const [info, setInfo] = useState<DataDictionaryDetail>();
  const [lines, setLines] = useState<EditableDictionaryLine[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerSize, setDrawerSize] = useState(800);
  const [modalVisible, setModalVisible] = useState(false);

  const openLines = (dictionary: DataDictionaryDetail) => {
    setInfo(dictionary);
    setLines(toEditableLines(dictionary.lines));
    setDrawerVisible(true);
  };

  const persistLines = async (nextLines: EditableDictionaryLine[]) => {
    if (!info?.code || !info.name) {
      message.error(intl.formatMessage({ id: 'model.dict.save.first' }));
      return;
    }
    const normalizedLines = nextLines.map((line, index) => ({
      label: line.label,
      value: line.value,
      index: line.index ?? index + 1,
    }));
    const updated = await updateDataDictionary(
      { code: info.code },
      {
        name: info.name,
        description: info.description,
        lines: normalizedLines,
      },
    );
    setInfo(updated);
    setLines(toEditableLines(updated.lines));
    actionRef.current?.reload();
  };

  const columns: ProColumns<DataDictionaryDetail>[] = [
    {
      title: intl.formatMessage({ id: 'model.dict.name' }),
      dataIndex: 'name',
      render: (dom, entity) => <a onClick={() => openLines(entity)}>{dom}</a>,
    },
    {
      title: intl.formatMessage({ id: 'model.dict.code' }),
      dataIndex: 'code',
      valueType: 'text',
      tooltip: {
        color: token.colorPrimary,
        title: <FormattedMessage id="model.dict.code.cannot.modify" />,
      },
    },
    {
      title: intl.formatMessage({ id: 'model.dict.description' }),
      dataIndex: 'description',
      search: false,
      valueType: 'text',
    },
    {
      title: <FormattedMessage id="pages.operation" />,
      key: 'action',
      valueType: 'option',
      render: (_, record) => (
        <a
          onClick={() => {
            setInfo(record);
            setModalVisible(true);
          }}
        >
          <EditOutlined style={{ color: token.colorPrimary }} />
        </a>
      ),
    },
  ];

  const lineColumns: ProColumns<EditableDictionaryLine>[] = [
    {
      title: intl.formatMessage({ id: 'model.dict.name' }),
      dataIndex: 'label',
      search: false,
      formItemProps: { rules: [{ required: true }] },
    },
    {
      title: intl.formatMessage({ id: 'model.dict.code' }),
      dataIndex: 'value',
      search: false,
      valueType: 'text',
      editable: (_, record) => Boolean(record.isNew),
      formItemProps: { rules: [{ required: true }] },
      tooltip: {
        color: token.colorPrimary,
        title: <FormattedMessage id="model.dict.code.cannot.modify" />,
      },
    },
    {
      title: intl.formatMessage({ id: 'model.dict.index' }),
      dataIndex: 'index',
      search: false,
      valueType: 'digit',
      width: 120,
    },
    {
      title: <FormattedMessage id="pages.operation" />,
      key: 'action',
      valueType: 'option',
      width: 100,
      render: (_, record, __, action) => (
        <Space orientation="horizontal">
          <a onClick={() => action?.startEditable(record.rowKey)}>
            <EditOutlined style={{ color: token.colorPrimary }} />
          </a>
          <Popconfirm
            title={intl.formatMessage({
              id: 'pages.operation.delete.confirm.title',
            })}
            onConfirm={async () => {
              const hide = message.loading(
                intl.formatMessage({ id: 'pages.operation.deleting' }),
              );
              try {
                await persistLines(
                  lines.filter((line) => line.rowKey !== record.rowKey),
                );
                hide();
                message.success(
                  intl.formatMessage({
                    id: 'pages.operation.delete.success',
                  }),
                );
              } catch {
                hide();
                message.error(
                  intl.formatMessage({ id: 'pages.operation.delete.failed' }),
                );
              }
            }}
          >
            <a className="danger">
              <DeleteOutlined style={{ color: token.colorError }} />
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={<FormattedMessage id="menu.settings.dict" />}
    >
      <ProTable<DataDictionaryDetail>
        key="dict-list"
        scroll={{ x: 'max-content' }}
        actionRef={actionRef}
        rowKey="id"
        search={{ showHiddenNum: true }}
        request={async (params) => {
          const response = await listDataDictionary();
          const name = String(params.name || '').toLowerCase();
          const code = String(params.code || '').toLowerCase();
          const data = (response.data || []).filter(
            (item) =>
              (!name || item.name?.toLowerCase().includes(name)) &&
              (!code || item.code?.toLowerCase().includes(code)),
          );
          return { data, total: data.length, success: true };
        }}
        columns={columns}
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
          emptyText: (
            <Empty
              description={intl.formatMessage({ id: 'pages.no.data' })}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />

      <Drawer
        destroyOnHidden
        size={drawerSize}
        resizable={{ onResize: (newSize) => setDrawerSize(newSize) }}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        closable
      >
        <Typography.Title level={4}>
          <FormattedMessage id="model.dict.line" />
        </Typography.Title>
        <EditableProTable<EditableDictionaryLine>
          locale={{
            emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
          }}
          rowKey="rowKey"
          value={lines}
          onChange={(value) => setLines([...value])}
          columns={lineColumns}
          recordCreatorProps={{
            record: () => ({
              rowKey: `new-${Date.now()}`,
              label: '',
              value: '',
              index: lines.length + 1,
              isNew: true,
            }),
          }}
          editable={{
            type: 'single',
            onSave: async (rowKey, data) => {
              const nextLines = lines.map((line) =>
                line.rowKey === rowKey
                  ? { ...data, rowKey: String(rowKey), isNew: false }
                  : line,
              );
              await persistLines(nextLines);
              message.success(
                intl.formatMessage({
                  id: data.isNew
                    ? 'pages.operation.add.success'
                    : 'pages.operation.update.success',
                }),
              );
            },
          }}
        />
      </Drawer>

      <ModalForm<DataDictionaryUpdate>
        title={info?.code}
        width="40vw"
        key={info?.id}
        open={modalVisible}
        initialValues={info}
        clearOnDestroy
        onOpenChange={setModalVisible}
        onFinish={async (values) => {
          if (!info?.code) return false;
          await updateDataDictionary(
            { code: info.code },
            { ...values, lines: info.lines || [] },
          );
          setModalVisible(false);
          actionRef.current?.reload();
          message.success(
            intl.formatMessage({ id: 'pages.operation.update.success' }),
          );
          return true;
        }}
        modalProps={{
          maskClosable: true,
          destroyOnHidden: true,
          forceRender: true,
          zIndex: 2000,
        }}
      >
        <ProFormText
          label={intl.formatMessage({ id: 'model.dict.name' })}
          name="name"
          rules={[{ required: true, max: 255 }]}
        />
        <ProFormTextArea
          label={intl.formatMessage({ id: 'model.dict.description' })}
          name="description"
          rules={[{ max: 255 }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default DictTableList;
