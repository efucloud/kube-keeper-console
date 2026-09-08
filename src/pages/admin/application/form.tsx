import {
  DeleteOutlined,
  EditOutlined,
  MenuOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import {
  DragSortTable,
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProForm,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProFormUploadDragger,
} from '@ant-design/pro-components';
import Editor from '@monaco-editor/react';
import { history, useIntl, useParams } from '@umijs/max';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Space,
  Tabs,
  Tag,
  Tooltip,
  theme,
} from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload';
import { useEffect, useState } from 'react';
import type {
  ParameterDefinition,
  ParameterDefinitions,
} from '@/services/application_def';
import type { DictionaryLine } from '@/services/data_dictionary';
import { getDataDictionary } from '@/services/data_dictionary.api';
import {
  MARKET_APPLICATION_CATEGORY_DICTIONARY,
  MARKET_APPLICATION_TAG_DICTIONARY,
} from '@/services/data_dictionary.constants';
import type { MarketApplicationCreate } from '@/services/market_application';
import {
  createMarketApplication,
  getMarketApplication,
  updateMarketApplication,
} from '@/services/market_application.api';
import { getResourceInfo, type TemplateProps } from '@/utils/cluster';
import {
  extractGoTemplateVariables,
  getHeight,
  splitYamlFiles,
} from '@/utils/global';

type FormValues = {
  name: string;
  logo?: string;
  home?: string;
  category: string;
  tags?: string[];
  state?: boolean;
};

type ParameterFormValue = ParameterDefinition;

type ImportFormValues = {
  templates?: UploadFile[];
};

let templateSequence = 0;

const createTemplate = (content: string): TemplateProps => ({
  ...getResourceInfo(content),
  key: `template-${Date.now()}-${templateSequence++}`,
});

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Cannot read ${file.name}`));
    reader.readAsText(file);
  });

const ApplicationForm: React.FC = () => {
  const intl = useIntl();
  const params = useParams();
  const editing = Boolean(params.id);
  const { token } = theme.useToken();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(editing);
  const [categoryOptions, setCategoryOptions] = useState<DictionaryLine[]>([]);
  const [tagOptions, setTagOptions] = useState<DictionaryLine[]>([]);
  const [description, setDescription] = useState('');
  const [parameters, setParameters] = useState<ParameterFormValue[]>([]);
  const [templates, setTemplates] = useState<TemplateProps[]>([]);
  const [parameterModalOpen, setParameterModalOpen] = useState(false);
  const [selectedParameter, setSelectedParameter] =
    useState<ParameterFormValue>();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateContent, setTemplateContent] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      getDataDictionary({ code: MARKET_APPLICATION_CATEGORY_DICTIONARY }),
      getDataDictionary({ code: MARKET_APPLICATION_TAG_DICTIONARY }),
    ]).then(([categoryDictionary, tagDictionary]) => {
      setCategoryOptions(categoryDictionary.lines || []);
      setTagOptions(tagDictionary.lines || []);
    });
  }, []);

  useEffect(() => {
    if (!params.id) return;
    getMarketApplication({ id: params.id })
      .then((data) => {
        form.setFieldsValue({
          name: data.name,
          logo: data.logo,
          home: data.home,
          category: data.category,
          tags: data.tags,
          state: data.state === 1,
        });
        setDescription(data.description || '');
        setParameters(
          (data.parameters || []).map((item) => ({
            name: item.name,
            displayName: item.displayName,
            description: item.description,
            defaultValue: item.defaultValue,
          })),
        );
        setTemplates((data.templates || []).map(createTemplate));
      })
      .finally(() => setLoading(false));
  }, [form, params.id]);

  const extractTemplateParameterNames = () => {
    const names = new Set<string>();
    templates.forEach((template) => {
      extractGoTemplateVariables(template.content).forEach((name) => {
        names.add(name);
      });
    });
    return Array.from(names);
  };

  const refreshParameters = () => {
    const names = extractTemplateParameterNames();
    const existing = new Map(parameters.map((item) => [item.name, item]));
    setParameters(
      names.map(
        (name): ParameterFormValue =>
          existing.get(name) || {
            name,
            displayName: name,
            description:
              name === 'name'
                ? intl.formatMessage({
                    id: 'application.parameter.name.description',
                  })
                : name === 'namespace'
                  ? intl.formatMessage({
                      id: 'application.parameter.namespace.description',
                    })
                  : intl.formatMessage(
                      { id: 'application.parameter.input.description' },
                      { name },
                    ),
          },
      ),
    );
    message.success(
      intl.formatMessage({ id: 'application.parameter.refreshed' }),
    );
  };

  const parseParameters = (): ParameterDefinitions => {
    const names = new Set<string>();
    return parameters.map((item) => {
      if (names.has(item.name)) {
        throw new Error(`duplicate name: ${item.name}`);
      }
      names.add(item.name);
      return {
        name: item.name,
        displayName: item.displayName,
        description: item.description,
        defaultValue: item.defaultValue,
      };
    });
  };

  const submit = async (values: FormValues) => {
    const invalidTemplate = templates.find(
      (item) => !item.apiVersion || !item.kind || !item.name,
    );
    if (invalidTemplate) {
      message.error(
        intl.formatMessage({ id: 'application.template.metadata.invalid' }),
      );
      return false;
    }

    let parameterDefinitions: ParameterDefinitions;
    try {
      parameterDefinitions = parseParameters();
    } catch (error) {
      message.error(
        `${intl.formatMessage({ id: 'application.parameters.invalid' })}: ${(error as Error).message}`,
      );
      return false;
    }

    const data: MarketApplicationCreate = {
      name: values.name,
      description,
      logo: values.logo,
      home: values.home,
      category: values.category,
      tags: values.tags || [],
      state: values.state ? 1 : 0,
      templates: templates.map((item) => item.content),
      parameters: parameterDefinitions,
    };
    if (params.id) await updateMarketApplication({ ...data, id: params.id });
    else await createMarketApplication(data);
    message.success(intl.formatMessage({ id: 'application.saved' }));
    history.push('/admin/application');
    return true;
  };

  const parameterColumns: ProColumns<ParameterFormValue>[] = [
    {
      title: intl.formatMessage({ id: 'application.order' }),
      dataIndex: 'sort',
      width: 64,
      className: 'drag-visible',
    },
    {
      title: intl.formatMessage({ id: 'application.parameter.name' }),
      dataIndex: 'name',
      width: 180,
    },
    {
      title: intl.formatMessage({ id: 'application.parameter.displayName' }),
      dataIndex: 'displayName',
      width: 180,
    },
    {
      title: intl.formatMessage({ id: 'application.parameter.default' }),
      dataIndex: 'defaultValue',
      width: 180,
      ellipsis: true,
      render: (_, record) => record.defaultValue || '-',
    },
    {
      title: intl.formatMessage({ id: 'application.parameter.description' }),
      dataIndex: 'description',
      ellipsis: true,
      render: (_, record) => record.description || '-',
    },
    {
      title: intl.formatMessage({ id: 'application.actions' }),
      valueType: 'option',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title={intl.formatMessage({ id: 'pages.operation.edit' })}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedParameter({ ...record });
                setParameterModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title={intl.formatMessage({
              id: 'application.parameter.delete.confirm',
            })}
            onConfirm={() => {
              if (extractTemplateParameterNames().includes(record.name)) {
                message.error(
                  intl.formatMessage({
                    id: 'application.parameter.delete.used',
                  }),
                );
                return;
              }
              setParameters((items) =>
                items.filter((item) => item.name !== record.name),
              );
            }}
          >
            <Button danger type="text" size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const templateColumns: ProColumns<TemplateProps>[] = [
    {
      title: intl.formatMessage({ id: 'application.order' }),
      dataIndex: 'sort',
      width: 64,
      className: 'drag-visible',
    },
    {
      title: intl.formatMessage({ id: 'application.resource.name' }),
      dataIndex: 'name',
    },
    {
      title: intl.formatMessage({ id: 'application.resource.kind' }),
      dataIndex: 'kind',
      width: 220,
      render: (_, record) => <Tag color="geekblue">{record.kind || '-'}</Tag>,
    },
    {
      title: intl.formatMessage({ id: 'application.resource.apiVersion' }),
      dataIndex: 'apiVersion',
      width: 220,
    },
    {
      title: intl.formatMessage({ id: 'application.actions' }),
      valueType: 'option',
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title={intl.formatMessage({
            id: 'application.template.delete.confirm',
          })}
          description={
            <Space wrap>
              <Tag>{record.kind || '-'}</Tag>
              <Tag>{record.apiVersion || '-'}</Tag>
              <Tag>{record.name || '-'}</Tag>
            </Space>
          }
          onConfirm={() =>
            setTemplates((items) =>
              items.filter((item) => item.key !== record.key),
            )
          }
        >
          <Button danger type="text" size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'description',
      label: intl.formatMessage({ id: 'application.description' }),
      children: (
        <Input.TextArea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={20}
          placeholder={intl.formatMessage({ id: 'application.description' })}
        />
      ),
    },
    {
      key: 'parameters',
      label: (
        <Space size={6}>
          {intl.formatMessage({ id: 'application.parameters' })}
          <Badge count={parameters.length} showZero color="#52c41a" />
        </Space>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={refreshParameters}>
                {intl.formatMessage({
                  id: 'application.parameter.refresh',
                })}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedParameter(undefined);
                  setParameterModalOpen(true);
                }}
              >
                {intl.formatMessage({ id: 'application.parameter.add' })}
              </Button>
            </Space>
          </div>
          <DragSortTable<ParameterFormValue>
            columns={parameterColumns}
            rowKey="name"
            search={false}
            dataSource={parameters}
            dragSortKey="sort"
            onDragSortEnd={(_, __, newDataSource) =>
              setParameters(newDataSource)
            }
            dragSortHandlerRender={() => (
              <MenuOutlined
                style={{ cursor: 'grab', color: token.colorPrimary }}
              />
            )}
            toolBarRender={false}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{
              emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
            }}
          />
        </div>
      ),
    },
    {
      key: 'templates',
      label: (
        <Space size={6}>
          {intl.formatMessage({ id: 'application.template' })}
          <Badge count={templates.length} showZero color="#52c41a" />
        </Space>
      ),
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Alert
            type="info"
            showIcon
            title={intl.formatMessage({ id: 'application.template.help' })}
          />
          <DragSortTable<TemplateProps>
            columns={templateColumns}
            rowKey="key"
            search={false}
            dataSource={templates}
            dragSortKey="sort"
            onDragSortEnd={(_, __, newDataSource) =>
              setTemplates(newDataSource)
            }
            dragSortHandlerRender={() => (
              <MenuOutlined
                style={{ cursor: 'grab', color: token.colorPrimary }}
              />
            )}
            toolBarRender={() => [
              <Space key="template-actions">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setTemplateContent('');
                    setTemplateModalOpen(true);
                  }}
                >
                  {intl.formatMessage({ id: 'application.template.add' })}
                </Button>
                <Button
                  icon={<UploadOutlined />}
                  onClick={() => setImportModalOpen(true)}
                >
                  {intl.formatMessage({ id: 'application.template.import' })}
                </Button>
              </Space>,
            ]}
            expandable={{
              expandedRowRender: (record) => (
                <Editor
                  key={record.key}
                  language="yaml"
                  height={getHeight(record.content || '')}
                  theme="vs-dark"
                  defaultValue={record.content}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    tabSize: 2,
                    insertSpaces: true,
                  }}
                  onChange={(value) => {
                    const next = getResourceInfo(value || '');
                    setTemplates((items) =>
                      items.map((item) =>
                        item.key === record.key
                          ? { ...next, key: record.key }
                          : item,
                      ),
                    );
                  }}
                />
              ),
            }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{
              emptyText: intl.formatMessage({ id: 'pages.not.found.data' }),
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title={
        editing
          ? intl.formatMessage({ id: 'application.edit' })
          : intl.formatMessage({ id: 'application.create' })
      }
      header={{ breadcrumb: {}, onBack: () => history.back() }}
      loading={loading}
    >
      <ProForm<FormValues>
        form={form}
        layout="vertical"
        onFinish={submit}
        initialValues={{ category: 'application', state: false }}
        submitter={{
          searchConfig: {
            submitText: intl.formatMessage({ id: 'application.save' }),
          },
          render: (_, dom) => <FooterToolbar>{dom}</FooterToolbar>,
        }}
      >
        <Card
          title={intl.formatMessage({ id: 'application.basic' })}
          variant="borderless"
        >
          <Row gutter={64}>
            <Col xs={24} md={12} lg={8}>
              <ProFormText
                name="name"
                label={intl.formatMessage({ id: 'application.name' })}
                rules={[{ required: true }, { max: 255 }]}
              />
            </Col>
            <Col xs={24} md={12} lg={8}>
              <ProFormSelect
                name="category"
                label={intl.formatMessage({ id: 'application.category' })}
                rules={[{ required: true }]}
                options={categoryOptions}
                fieldProps={{ optionFilterProp: 'label', showSearch: true }}
              />
            </Col>
            <Col xs={24} md={12} lg={8}>
              <ProFormSwitch
                name="state"
                label={intl.formatMessage({ id: 'application.published' })}
              />
            </Col>
          </Row>
          <Row gutter={64}>
            <Col xs={24} md={12} lg={8}>
              <ProFormText name="logo" label="Logo URL" />
            </Col>
            <Col xs={24} md={12} lg={8}>
              <ProFormText
                name="home"
                label={intl.formatMessage({ id: 'application.home' })}
                rules={[{ type: 'url' }]}
              />
            </Col>
            <Col xs={24} md={24} lg={8}>
              <ProFormSelect
                name="tags"
                label={intl.formatMessage({ id: 'application.tags' })}
                options={tagOptions}
                fieldProps={{
                  mode: 'multiple',
                  maxCount: 4,
                  optionFilterProp: 'label',
                  showSearch: true,
                }}
              />
            </Col>
          </Row>
        </Card>
        <Card style={{ marginTop: 16 }}>
          <Tabs items={tabItems} />
        </Card>
      </ProForm>

      <ModalForm<ParameterFormValue>
        key={selectedParameter?.name || 'new-parameter'}
        title={intl.formatMessage({
          id: selectedParameter
            ? 'application.parameter.edit'
            : 'application.parameter.add',
        })}
        width="60vw"
        open={parameterModalOpen}
        onOpenChange={setParameterModalOpen}
        clearOnDestroy
        initialValues={selectedParameter}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          const record: ParameterFormValue = {
            ...values,
            name: values.name.trim(),
            displayName: values.displayName?.trim(),
            description: values.description?.trim(),
          };
          const duplicate = parameters.some(
            (item) =>
              item.name === record.name &&
              item.name !== selectedParameter?.name,
          );
          if (duplicate) {
            message.error(
              intl.formatMessage({ id: 'application.parameter.duplicate' }),
            );
            return false;
          }
          setParameters((items) =>
            selectedParameter
              ? items.map((item) =>
                  item.name === selectedParameter.name ? record : item,
                )
              : [...items, record],
          );
          setParameterModalOpen(false);
          return true;
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <ProFormText
              name="name"
              disabled={Boolean(selectedParameter)}
              label={intl.formatMessage({ id: 'application.parameter.name' })}
              rules={[
                { required: true },
                { pattern: /^[A-Za-z_][A-Za-z0-9_.-]*$/ },
              ]}
            />
          </Col>
          <Col xs={24} md={12}>
            <ProFormText
              name="displayName"
              label={intl.formatMessage({
                id: 'application.parameter.displayName',
              })}
              rules={[{ required: true }, { max: 255 }]}
            />
          </Col>
          <Col xs={24} md={12}>
            <ProFormText
              name="defaultValue"
              label={intl.formatMessage({
                id: 'application.parameter.default',
              })}
            />
          </Col>
          <Col span={24}>
            <ProFormTextArea
              name="description"
              label={intl.formatMessage({
                id: 'application.parameter.description',
              })}
              fieldProps={{ rows: 3 }}
            />
          </Col>
        </Row>
      </ModalForm>

      <ModalForm
        title={intl.formatMessage({ id: 'application.template.add' })}
        width="70vw"
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        clearOnDestroy
        modalProps={{ destroyOnHidden: true }}
        onFinish={async () => {
          const resources = splitYamlFiles(templateContent).map(createTemplate);
          if (resources.length === 0) {
            message.error(
              intl.formatMessage({ id: 'application.template.content.empty' }),
            );
            return false;
          }
          setTemplates((items) => [...items, ...resources]);
          setTemplateContent('');
          setTemplateModalOpen(false);
          return true;
        }}
      >
        <Editor
          language="yaml"
          height="60vh"
          theme="vs-dark"
          value={templateContent}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            insertSpaces: true,
          }}
          onChange={(value) => setTemplateContent(value || '')}
        />
      </ModalForm>

      <ModalForm<ImportFormValues>
        title={intl.formatMessage({ id: 'application.template.import' })}
        width="40vw"
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        clearOnDestroy
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          const files = (values.templates || [])
            .map((file) => file.originFileObj)
            .filter((file): file is RcFile => Boolean(file));
          if (files.length === 0) {
            message.error(
              intl.formatMessage({ id: 'application.template.file.required' }),
            );
            return false;
          }
          try {
            const contents = await Promise.all(files.map(readFileAsText));
            const resources = contents
              .flatMap(splitYamlFiles)
              .map(createTemplate);
            if (resources.length === 0) {
              throw new Error('No YAML resources found');
            }
            setTemplates((items) => [...items, ...resources]);
            setImportModalOpen(false);
            return true;
          } catch {
            message.error(
              intl.formatMessage({ id: 'application.template.file.invalid' }),
            );
            return false;
          }
        }}
      >
        <ProFormUploadDragger
          name="templates"
          label={intl.formatMessage({ id: 'application.template.file' })}
          max={10}
          fieldProps={{
            accept: '.yaml,.yml',
            multiple: true,
            beforeUpload: () => false,
          }}
          title={intl.formatMessage({
            id: 'application.template.file.drag',
          })}
          description={intl.formatMessage({
            id: 'application.template.file.description',
          })}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default ApplicationForm;
