import {
  PageContainer,
  ProForm,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import Editor from '@monaco-editor/react';
import { history, useIntl, useParams } from '@umijs/max';
import { Alert, Card, Form, message, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import type { ParameterDefinitions } from '@/services/application_def';
import type { MarketApplicationCreate } from '@/services/market_application';
import {
  createMarketApplication,
  getMarketApplication,
  updateMarketApplication,
} from '@/services/market_application.api';

type FormValues = {
  name: string;
  description?: string;
  logo?: string;
  home?: string;
  category: string;
  tags?: string[];
  state?: boolean;
  yamlContent: string;
  parameters?: ParameterFormValue[];
};

type ParameterFormValue = {
  name: string;
  displayName?: string;
  required?: boolean;
  type: string;
  description?: string;
  defaultValueJson?: string;
  allowableValuesJson?: string;
};

const parameterTypes = [
  'string',
  'inputString',
  'text',
  'url',
  'password',
  'inputSecret',
  'image',
  'number',
  'inputNumber',
  'bool',
  'stringArray',
  'numberArray',
  'object',
  'float',
  'base64Encode',
  'gitRepo',
].map((value) => ({ label: value, value }));

const toJsonField = (value: unknown) =>
  value === undefined || value === null
    ? undefined
    : JSON.stringify(value, null, 2);

const ApplicationForm: React.FC = () => {
  const intl = useIntl();
  const params = useParams();
  const editing = Boolean(params.id);
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(editing);
  useEffect(() => {
    if (!params.id) return;
    getMarketApplication({ id: params.id })
      .then((data) =>
        form.setFieldsValue({
          name: data.name,
          description: data.description,
          logo: data.logo,
          home: data.home,
          category: data.category,
          tags: data.tags,
          state: data.state === 1,
          yamlContent: data.templates.join('\n---\n'),
          parameters: (data.parameters || []).map((item) => ({
            name: item.name,
            displayName: item.displayName,
            required: item.required,
            type: item.type,
            description: item.description,
            defaultValueJson: toJsonField(item.defaultValue),
            allowableValuesJson: toJsonField(item.allowableValues),
          })),
        }),
      )
      .finally(() => setLoading(false));
  }, [form, params.id]);
  const submit = async (values: FormValues) => {
    let parameters: ParameterDefinitions = [];
    try {
      const names = new Set<string>();
      parameters = (values.parameters || []).map((item) => {
        if (names.has(item.name))
          throw new Error(`duplicate name: ${item.name}`);
        names.add(item.name);
        const defaultValue = item.defaultValueJson?.trim()
          ? JSON.parse(item.defaultValueJson)
          : undefined;
        const allowableValues = item.allowableValuesJson?.trim()
          ? JSON.parse(item.allowableValuesJson)
          : undefined;
        if (allowableValues !== undefined && !Array.isArray(allowableValues)) {
          throw new Error(`allowableValues of ${item.name} must be an array`);
        }
        return {
          name: item.name,
          displayName: item.displayName,
          required: Boolean(item.required),
          type: item.type as ParameterDefinitions[number]['type'],
          description: item.description,
          defaultValue,
          allowableValues,
        };
      });
    } catch (error) {
      message.error(
        `${intl.formatMessage({ id: 'application.parameters.invalid' })}: ${(error as Error).message}`,
      );
      return false;
    }
    const data: MarketApplicationCreate = {
      name: values.name,
      description: values.description,
      logo: values.logo,
      home: values.home,
      category: values.category,
      tags: values.tags || [],
      state: values.state ? 1 : 0,
      templates: [values.yamlContent],
      parameters,
    };
    if (params.id) await updateMarketApplication({ ...data, id: params.id });
    else await createMarketApplication(data);
    message.success(intl.formatMessage({ id: 'application.saved' }));
    history.push('/admin/application');
    return true;
  };
  return (
    <PageContainer
      title={
        editing
          ? intl.formatMessage({ id: 'application.edit' })
          : intl.formatMessage({ id: 'application.create' })
      }
      onBack={() => history.back()}
      loading={loading}
    >
      <ProForm<FormValues>
        form={form}
        layout="vertical"
        onFinish={submit}
        initialValues={{
          category: 'application',
          state: false,
          yamlContent:
            'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: _{{_ .name _}}_\n  namespace: _{{_ .namespace _}}_\n',
          parameters: [],
        }}
        submitter={{
          searchConfig: {
            submitText: intl.formatMessage({ id: 'application.save' }),
          },
        }}
      >
        <Card>
          <Tabs
            items={[
              {
                key: 'basic',
                label: intl.formatMessage({ id: 'application.basic' }),
                children: (
                  <>
                    <ProFormText
                      name="name"
                      label={intl.formatMessage({ id: 'application.name' })}
                      rules={[{ required: true }]}
                    />
                    <ProFormTextArea
                      name="description"
                      label={intl.formatMessage({
                        id: 'application.description',
                      })}
                      fieldProps={{ rows: 6 }}
                    />
                    <ProFormText name="logo" label="Logo URL" />
                    <ProFormText
                      name="home"
                      label={intl.formatMessage({ id: 'application.home' })}
                      rules={[{ type: 'url' }]}
                    />
                    <ProFormText
                      name="category"
                      label={intl.formatMessage({ id: 'application.category' })}
                      rules={[{ required: true }]}
                    />
                    <ProFormSelect
                      name="tags"
                      label={intl.formatMessage({ id: 'application.tags' })}
                      fieldProps={{
                        mode: 'tags',
                        maxCount: 4,
                        tokenSeparators: [','],
                      }}
                    />
                    <ProFormSwitch
                      name="state"
                      label={intl.formatMessage({
                        id: 'application.published',
                      })}
                    />
                  </>
                ),
              },
              {
                key: 'template',
                label: intl.formatMessage({ id: 'application.template' }),
                children: (
                  <>
                    <Alert
                      type="info"
                      showIcon
                      message={intl.formatMessage({
                        id: 'application.template.help',
                      })}
                      style={{ marginBottom: 16 }}
                    />
                    <Form.Item name="yamlContent" rules={[{ required: true }]}>
                      <Editor
                        height="560px"
                        language="yaml"
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          tabSize: 2,
                        }}
                        onChange={(value) =>
                          form.setFieldValue('yamlContent', value || '')
                        }
                      />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'parameters',
                label: intl.formatMessage({ id: 'application.parameters' }),
                children: (
                  <>
                    <Alert
                      type="info"
                      showIcon
                      message={intl.formatMessage({
                        id: 'application.parameters.help',
                      })}
                      style={{ marginBottom: 16 }}
                    />
                    <ProFormList
                      name="parameters"
                      creatorRecord={{
                        type: 'string',
                        required: false,
                      }}
                      creatorButtonProps={{
                        creatorButtonText: intl.formatMessage({
                          id: 'application.parameter.add',
                        }),
                      }}
                      itemRender={({ listDom, action }, { index }) => (
                        <Card
                          size="small"
                          title={`${intl.formatMessage({ id: 'application.parameter' })} ${index + 1}`}
                          extra={action}
                          style={{ marginBottom: 12 }}
                        >
                          {listDom}
                        </Card>
                      )}
                    >
                      <ProFormGroup>
                        <ProFormText
                          name="name"
                          label={intl.formatMessage({
                            id: 'application.parameter.name',
                          })}
                          rules={[
                            { required: true },
                            { pattern: /^[A-Za-z_][A-Za-z0-9_.-]*$/ },
                          ]}
                          width="sm"
                        />
                        <ProFormText
                          name="displayName"
                          label={intl.formatMessage({
                            id: 'application.parameter.displayName',
                          })}
                          width="sm"
                        />
                        <ProFormSelect
                          name="type"
                          label={intl.formatMessage({
                            id: 'application.parameter.type',
                          })}
                          options={parameterTypes}
                          rules={[{ required: true }]}
                          width="sm"
                        />
                        <ProFormSwitch
                          name="required"
                          label={intl.formatMessage({
                            id: 'application.parameter.required',
                          })}
                        />
                      </ProFormGroup>
                      <ProFormTextArea
                        name="description"
                        label={intl.formatMessage({
                          id: 'application.description',
                        })}
                        fieldProps={{ rows: 2 }}
                      />
                      <ProFormGroup>
                        <ProFormTextArea
                          name="defaultValueJson"
                          label={intl.formatMessage({
                            id: 'application.parameter.default',
                          })}
                          tooltip={intl.formatMessage({
                            id: 'application.parameter.json.help',
                          })}
                          fieldProps={{ rows: 3 }}
                          width="md"
                        />
                        <ProFormTextArea
                          name="allowableValuesJson"
                          label={intl.formatMessage({
                            id: 'application.parameter.allowable',
                          })}
                          tooltip={intl.formatMessage({
                            id: 'application.parameter.allowable.help',
                          })}
                          fieldProps={{ rows: 3 }}
                          width="md"
                        />
                      </ProFormGroup>
                    </ProFormList>
                  </>
                ),
              },
            ]}
          />
        </Card>
      </ProForm>
    </PageContainer>
  );
};
export default ApplicationForm;
