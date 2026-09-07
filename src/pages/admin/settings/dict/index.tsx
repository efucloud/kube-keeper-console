import { HolderOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProForm,
  ProFormList,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Alert, Card, Col, Form, message, Row, Skeleton, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import type {
  DataDictionaryDetail,
  DataDictionaryUpdate,
} from '@/services/data_dictionary';
import {
  getDataDictionary,
  updateDataDictionary,
} from '@/services/data_dictionary.api';
import {
  MARKET_APPLICATION_CATEGORY_DICTIONARY,
  MARKET_APPLICATION_TAG_DICTIONARY,
} from '@/services/data_dictionary.constants';

const DictionaryEditor: React.FC<{ code: string }> = ({ code }) => {
  const intl = useIntl();
  const [form] = Form.useForm<DataDictionaryUpdate>();
  const [dictionary, setDictionary] = useState<DataDictionaryDetail>();

  useEffect(() => {
    getDataDictionary({ code }).then((data) => {
      setDictionary(data);
      form.setFieldsValue({
        name: data.name,
        description: data.description,
        lines: data.lines || [],
      });
    });
  }, [code, form]);

  if (!dictionary) {
    return (
      <Card variant="borderless">
        <Skeleton active paragraph={{ rows: 7 }} />
      </Card>
    );
  }

  return (
    <ProForm<DataDictionaryUpdate>
      form={form}
      layout="vertical"
      onFinish={async (values) => {
        const updated = await updateDataDictionary({ code }, values);
        setDictionary(updated);
        form.setFieldsValue(updated);
        message.success(
          intl.formatMessage({ id: 'model.dict.update.success' }),
        );
        return true;
      }}
      submitter={{
        searchConfig: {
          submitText: intl.formatMessage({ id: 'pages.operation.save' }),
        },
        resetButtonProps: { style: { display: 'none' } },
      }}
    >
      <Card variant="borderless">
        <Row gutter={32}>
          <Col xs={24} lg={12}>
            <ProFormText
              name="name"
              label={intl.formatMessage({ id: 'model.dict.name' })}
              rules={[{ required: true }]}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item label={intl.formatMessage({ id: 'model.dict.code' })}>
              <Alert
                type="info"
                showIcon
                message={dictionary.code}
                description={intl.formatMessage({
                  id: 'model.dict.code.cannot.modify',
                })}
              />
            </Form.Item>
          </Col>
        </Row>
        <ProFormTextArea
          name="description"
          label={intl.formatMessage({ id: 'model.dict.description' })}
          fieldProps={{ rows: 2 }}
        />
      </Card>

      <Card
        variant="borderless"
        title={intl.formatMessage({ id: 'model.dict.line' })}
        style={{ marginTop: 16 }}
      >
        <Alert
          type="warning"
          showIcon
          message={intl.formatMessage({ id: 'model.dict.line.help' })}
          style={{ marginBottom: 16 }}
        />
        <ProFormList
          name="lines"
          creatorButtonProps={{
            creatorButtonText: intl.formatMessage({
              id: 'model.dict.line.add',
            }),
          }}
          itemRender={({ listDom, action }, { index }) => (
            <Card
              size="small"
              title={
                <span>
                  <HolderOutlined style={{ marginRight: 8 }} />
                  {intl.formatMessage({ id: 'model.dict.line' })} {index + 1}
                </span>
              }
              extra={action}
              style={{ marginBottom: 12 }}
            >
              {listDom}
            </Card>
          )}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <ProFormText
                name="label"
                label={intl.formatMessage({ id: 'model.dict.label' })}
                rules={[{ required: true }]}
              />
            </Col>
            <Col xs={24} md={12}>
              <ProFormText
                name="value"
                label={intl.formatMessage({ id: 'model.dict.value' })}
                rules={[{ required: true }]}
              />
            </Col>
          </Row>
        </ProFormList>
      </Card>
    </ProForm>
  );
};

const DataDictionaryPage: React.FC = () => {
  const intl = useIntl();
  return (
    <PageContainer
      title={intl.formatMessage({ id: 'menu.settings.dict' })}
      subTitle={intl.formatMessage({ id: 'model.dict.page.description' })}
    >
      <Tabs
        destroyOnHidden
        items={[
          {
            key: MARKET_APPLICATION_CATEGORY_DICTIONARY,
            label: intl.formatMessage({
              id: 'model.dict.application.category',
            }),
            children: (
              <DictionaryEditor code={MARKET_APPLICATION_CATEGORY_DICTIONARY} />
            ),
          },
          {
            key: MARKET_APPLICATION_TAG_DICTIONARY,
            label: intl.formatMessage({ id: 'model.dict.application.tag' }),
            children: (
              <DictionaryEditor code={MARKET_APPLICATION_TAG_DICTIONARY} />
            ),
          },
        ]}
      />
    </PageContainer>
  );
};

export default DataDictionaryPage;
