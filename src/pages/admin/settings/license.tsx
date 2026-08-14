import { ProDescriptions } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from '@umijs/max';
import { Button, Card, Col, Form, Input, message, Row, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import type { LicenseData } from '@/services/external';
import { getLicenseInfo, updateLicenseInfo } from '@/services/system_info.api';

type LicenseFormValues = {
  license: string;
};

type LicenseInfo = Partial<LicenseData> & {
  maxNodes?: number;
  currentNodes?: number;
};

const toDisplayValue = (value?: string | number) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  return '-';
};

const renderQuota = (current?: number, max?: number) => {
  const currentText = typeof current === 'number' ? current : '-';
  const maxText = typeof max === 'number' ? max : '-';
  return `${currentText} / ${maxText}`;
};

const LicenseIndex: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm<LicenseFormValues>();
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getLicense = async () => {
    setLoading(true);
    try {
      const res = (await getLicenseInfo()) as LicenseInfo;
      setLicenseInfo(res || {});
    } catch {
      message.error(intl.formatMessage({ id: 'pages.operation.error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLicense = async (values: LicenseFormValues) => {
    const license = values.license?.trim();
    if (!license) {
      message.warning(intl.formatMessage({ id: 'pages.operation.save.empty' }));
      return;
    }

    const hide = message.loading(
      intl.formatMessage({ id: 'pages.operation.updating' }),
    );
    setSubmitting(true);

    try {
      await updateLicenseInfo({
        data: {
          data: license,
        },
      });
      hide();
      message.success(
        intl.formatMessage({ id: 'pages.operation.update.success' }),
      );
      form.resetFields();
      await getLicense();
    } catch {
      hide();
      message.error(
        intl.formatMessage({ id: 'pages.operation.update.failed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    getLicense();
  }, []);

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'app.settings.license' })}
    >
      <Card
        loading={loading}
        title={intl.formatMessage({ id: 'app.settings.license.info' })}
      >
        <ProDescriptions column={{ xs: 1, sm: 1, md: 2 }}>
          <ProDescriptions.Item
            label={intl.formatMessage({ id: 'app.settings.license.product' })}
          >
            {toDisplayValue(licenseInfo?.product)}
          </ProDescriptions.Item>
         
          <ProDescriptions.Item
            copyable
            label={intl.formatMessage({
              id: 'app.settings.license.serialNumber',
            })}
          >
            {toDisplayValue(licenseInfo?.serialNumber)}
          </ProDescriptions.Item>

          <ProDescriptions.Item
            label={intl.formatMessage({ id: 'app.settings.license.issuer' })}
          >
            {toDisplayValue(licenseInfo?.issuer)}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({
              id: 'app.settings.license.issuerEmail',
            })}
          >
            {toDisplayValue(licenseInfo?.issuerEmail)}
          </ProDescriptions.Item>
           <ProDescriptions.Item
            label={intl.formatMessage({
              id: 'app.settings.license.issuerPhone',
            })}
          >
            {toDisplayValue(licenseInfo?.issuerPhone)}
          </ProDescriptions.Item>
         
          <ProDescriptions.Item
            label={intl.formatMessage({ id: 'app.settings.license.website' })}
          >
            {licenseInfo?.website ? (
              <a href={licenseInfo.website} target="_blank" rel="noreferrer">
                {licenseInfo.website}
              </a>
            ) : (
              '-'
            )}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({ id: 'app.settings.license.type' })}
          >
            {licenseInfo?.type ? (
              <Tag color="blue">{licenseInfo.type}</Tag>
            ) : (
              '-'
            )}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({ id: 'app.settings.license.github' })}
          >
            {licenseInfo?.github ? (
              <a href={licenseInfo.github} target="_blank" rel="noreferrer">
                {licenseInfo.github}
              </a>
            ) : (
              '-'
            )}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({
              id: 'app.settings.license.issueDate',
            })}
          >
            {toDisplayValue(licenseInfo?.issuedAt)}
          </ProDescriptions.Item>
           <ProDescriptions.Item
            label={intl.formatMessage({ id: 'app.settings.license.company' })}
          >
            {toDisplayValue(licenseInfo?.company)}
          </ProDescriptions.Item>
           <ProDescriptions.Item
            label={intl.formatMessage({ id: 'app.settings.license.email' })}
          >
            {toDisplayValue(licenseInfo?.email)}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({
              id: 'app.settings.license.expireDate',
            })}
          >
            {toDisplayValue(licenseInfo?.expiresAt)}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({
              id: 'app.settings.license.message',
            })}
            span={2}
          >
            {toDisplayValue(licenseInfo?.message)}
          </ProDescriptions.Item>
          
        </ProDescriptions>
      </Card>
      <Card
        style={{ marginTop: 16 }}
        loading={loading}
        title={intl.formatMessage({ id: 'app.settings.license.quota' })}
      >
        <ProDescriptions column={{ xs: 1, sm: 1, md: 2 }}>
          <ProDescriptions.Item
            label={intl.formatMessage({ id: 'app.settings.license.maxUsers' })}
          >
            {toDisplayValue(licenseInfo?.maxUsers)}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({
              id: 'app.settings.license.currentUsers',
            })}
          >
            {toDisplayValue(licenseInfo?.currentUsers)}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({ id: 'app.settings.license.userQuota' })}
          >
            {renderQuota(licenseInfo?.currentUsers, licenseInfo?.maxUsers)}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({
              id: 'app.settings.license.maxClusters',
            })}
          >
            {toDisplayValue(licenseInfo?.maxClusters)}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({
              id: 'app.settings.license.currentClusters',
            })}
          >
            {toDisplayValue(licenseInfo?.currentClusters)}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({
              id: 'app.settings.license.clusterQuota',
            })}
          >
            {renderQuota(
              licenseInfo?.currentClusters,
              licenseInfo?.maxClusters,
            )}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({ id: 'app.settings.license.maxNodes' })}
          >
            {toDisplayValue(licenseInfo?.maxNodes)}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({
              id: 'app.settings.license.currentNodes',
            })}
          >
            {toDisplayValue(licenseInfo?.currentNodes)}
          </ProDescriptions.Item>
          <ProDescriptions.Item
            label={intl.formatMessage({
              id: 'app.settings.license.nodeQuota',
            })}
          >
            {renderQuota(licenseInfo?.currentNodes, licenseInfo?.maxNodes)}
          </ProDescriptions.Item>
        </ProDescriptions>
      </Card>
      <Card
        style={{ marginTop: 16 }}
        title={intl.formatMessage({ id: 'pages.operation.update' })}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateLicense}>
          <Row gutter={16}>
            <Col xs={24} md={18} lg={16}>
              <Form.Item
                label={intl.formatMessage({ id: 'app.settings.license' })}
                name="license"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message:
                      intl.formatMessage({ id: 'pages.input.text.tips' }) +
                      intl.formatMessage({ id: 'app.settings.license' }),
                  },
                ]}
              >
                <Input.TextArea
                  placeholder="请输入新的授权密钥"
                  autoSize={{ minRows: 4, maxRows: 6 }}
                  showCount
                  maxLength={5000}
                />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {intl.formatMessage({ id: 'pages.operation.confirm' })}
            </Button>
            <Button disabled={submitting} onClick={() => form.resetFields()}>
              {intl.formatMessage({ id: 'pages.operation.cancel' })}
            </Button>
          </Space>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default LicenseIndex;
