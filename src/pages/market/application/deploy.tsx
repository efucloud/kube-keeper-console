import {
  CodeOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { history, useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { ApplicationDeployRequest } from '@/services/application';
import type { ParameterDefinition } from '@/services/application_def';
import type {
  ClusterNamespaceDetail,
  ClusterNamespaceDetailList,
} from '@/services/cluster_namespace';
import type {
  ApplicationKubernetesResource,
  ApplicationRenderResult,
  UserAccessCluster,
  UserAccessClusterList,
} from '@/services/kubernetes';
import type { MarketApplicationDetail } from '@/services/market_application';
import {
  deployMarketApplication,
  renderMarketApplication,
  validateMarketApplication,
} from '@/services/market_application.api';
import {
  canAccessClusterNamespaces,
  canAccessClusters,
} from '@/services/personal.api';

type Props = {
  application?: MarketApplicationDetail;
  open: boolean;
  onClose: () => void;
};

const getAllowableOptions = (parameter: ParameterDefinition) => {
  if (!Array.isArray(parameter.allowableValues)) return [];
  return parameter.allowableValues.flatMap((item) => {
    if (typeof item === 'object' && item !== null && 'value' in item) {
      const option = item as Record<string, unknown>;
      const value = option.value;
      if (typeof value !== 'string' && typeof value !== 'number') return [];
      return [{ label: String(option.name ?? value), value }];
    }
    if (typeof item !== 'string' && typeof item !== 'number') return [];
    return [{ label: String(item), value: item }];
  });
};

const ParameterInput = ({ parameter }: { parameter: ParameterDefinition }) => {
  const options = getAllowableOptions(parameter);
  if (parameter.type === 'stringArray' || parameter.type === 'numberArray')
    return (
      <Select
        mode={options.length ? 'multiple' : 'tags'}
        options={options.length ? options : undefined}
        tokenSeparators={options.length ? undefined : [',']}
      />
    );
  if (options.length) return <Select options={options} />;
  if (parameter.type === 'bool') return <Switch />;
  if (['number', 'inputNumber', 'float'].includes(parameter.type))
    return <InputNumber style={{ width: '100%' }} />;
  if (parameter.type === 'password' || parameter.type === 'inputSecret')
    return <Input.Password autoComplete="new-password" />;
  if (parameter.type === 'text' || parameter.type === 'object')
    return <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />;
  return <Input />;
};

const DeployApplicationModal: React.FC<Props> = ({
  application,
  open,
  onClose,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm<
    ApplicationDeployRequest & { cluster: string; namespace: string }
  >();
  const [clusters, setClusters] = useState<UserAccessCluster[]>([]);
  const [namespaces, setNamespaces] = useState<ClusterNamespaceDetail[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [preview, setPreview] = useState<ApplicationRenderResult>();
  const [previewMode, setPreviewMode] = useState<'render' | 'validate'>(
    'render',
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const selectedCluster = Form.useWatch('cluster', form);
  const selectedNamespace = Form.useWatch('namespace', form);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setPreview(undefined);
    setPreviewOpen(false);
    const params = Object.fromEntries(
      (application?.parameters || [])
        .filter(
          (item) => item.defaultValue !== undefined || item.type === 'bool',
        )
        .map((item) => {
          let value =
            item.defaultValue !== undefined ? item.defaultValue : false;
          if (
            (item.type === 'stringArray' || item.type === 'numberArray') &&
            !Array.isArray(value)
          ) {
            value = [value];
          }
          if (item.type === 'object' && typeof value !== 'string') {
            value = JSON.stringify(value, null, 2);
          }
          return [item.name, value];
        }),
    );
    const releaseName = application?.parameters?.find(
      (item) => item.name === 'name',
    )?.defaultValue;
    form.setFieldValue('params', params);
    form.setFieldValue(
      'releaseName',
      typeof releaseName === 'string' ? releaseName : undefined,
    );
    canAccessClusters({ current: 1, pageSize: 200 }).then((data) =>
      setClusters((data as UserAccessClusterList).data || []),
    );
  }, [application, form, open]);

  useEffect(() => {
    setNamespaces([]);
    form.setFieldValue('namespace', undefined);
    if (!selectedCluster) return;
    canAccessClusterNamespaces({
      cluster: selectedCluster,
      current: 1,
      pageSize: 200,
    }).then((data) =>
      setNamespaces((data as ClusterNamespaceDetailList).data || []),
    );
  }, [form, selectedCluster]);

  const target = useMemo(
    () => ({
      cluster: form.getFieldValue('cluster') || '',
      namespace: form.getFieldValue('namespace') || '',
      id: application?.id || '',
    }),
    [application?.id, selectedCluster, selectedNamespace],
  );

  const values = async () => {
    const data = await form.validateFields();
    const { cluster: _cluster, namespace: _namespace, ...request } = data;
    const normalizedParams = { ...(request.params || {}) };
    for (const parameter of application?.parameters || []) {
      const value = normalizedParams[parameter.name];
      if (value === undefined || value === null) continue;
      if (parameter.type === 'numberArray' && Array.isArray(value)) {
        const numbers = value.map(Number);
        if (numbers.some((item) => !Number.isFinite(item))) {
          form.setFields([
            {
              name: ['params', parameter.name],
              errors: [
                intl.formatMessage({ id: 'application.number.invalid' }),
              ],
            },
          ]);
          throw new Error('invalid number array parameter');
        }
        normalizedParams[parameter.name] = numbers;
      }
      if (parameter.type === 'stringArray' && !Array.isArray(value)) {
        normalizedParams[parameter.name] = [String(value)];
      }
      if (parameter.type === 'object' && typeof value === 'string') {
        if (!value.trim()) {
          delete normalizedParams[parameter.name];
          continue;
        }
        try {
          normalizedParams[parameter.name] = JSON.parse(value);
        } catch {
          form.setFields([
            {
              name: ['params', parameter.name],
              errors: [intl.formatMessage({ id: 'application.json.invalid' })],
            },
          ]);
          throw new Error('invalid object parameter');
        }
      }
    }
    request.params = normalizedParams;
    return request as ApplicationDeployRequest;
  };

  const handlePreview = async () => {
    if (!application) return;
    setPreviewing(true);
    try {
      setPreviewMode('render');
      setPreview(await renderMarketApplication(target, await values()));
      setPreviewOpen(true);
    } finally {
      setPreviewing(false);
    }
  };

  const handleValidate = async () => {
    if (!application) return;
    setValidating(true);
    try {
      setPreviewMode('validate');
      setPreview(await validateMarketApplication(target, await values()));
      setPreviewOpen(true);
    } finally {
      setValidating(false);
    }
  };

  const handleDeploy = async () => {
    if (!application) return;
    setSubmitting(true);
    try {
      await deployMarketApplication(target, await values());
      message.success(intl.formatMessage({ id: 'application.deploy.success' }));
      onClose();
      history.push(
        `/kubernetes/namespace/applications?cluster=${encodeURIComponent(target.cluster)}&namespace=${encodeURIComponent(target.namespace)}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderResources = (
    title: string,
    resources?: ApplicationKubernetesResource[],
  ) =>
    resources?.length ? (
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={5}>
          {title} · {resources.length}
        </Typography.Title>
        {resources.map((resource) => (
          <div key={resource.key} style={{ marginBottom: 12 }}>
            <Typography.Text strong>
              {resource.apiResource?.kind} / {resource.resourceName || '-'}
            </Typography.Text>
            <Typography.Text
              type={
                (previewMode === 'validate'
                  ? resource.tryStatus
                  : resource.renderStatus) === 'success'
                  ? 'success'
                  : 'danger'
              }
              style={{ marginLeft: 10 }}
            >
              {intl.formatMessage({
                id:
                  (previewMode === 'validate'
                    ? resource.tryStatus
                    : resource.renderStatus) === 'success'
                    ? 'application.resource.passed'
                    : 'application.resource.failed',
              })}
            </Typography.Text>
            {resource.message && (
              <Alert
                type="error"
                showIcon
                message={resource.message}
                style={{ margin: '8px 0' }}
              />
            )}
            <pre
              style={{
                maxHeight: 320,
                overflow: 'auto',
                padding: 16,
                borderRadius: 8,
                background: '#0f172a',
                color: '#dbeafe',
                fontSize: 12,
              }}
            >
              {resource.content}
            </pre>
          </div>
        ))}
      </div>
    ) : null;

  return (
    <>
      <Modal
        title={`${intl.formatMessage({ id: 'application.deploy' })} · ${application?.name || ''}`}
        open={open}
        width={680}
        onCancel={onClose}
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={onClose}>
              {intl.formatMessage({ id: 'application.cancel' })}
            </Button>
            <Button
              icon={<CodeOutlined />}
              loading={previewing}
              onClick={handlePreview}
            >
              {intl.formatMessage({ id: 'application.preview' })}
            </Button>
            <Button
              icon={<SafetyCertificateOutlined />}
              loading={validating}
              onClick={handleValidate}
            >
              {intl.formatMessage({ id: 'application.validate' })}
            </Button>
            <Button
              type="primary"
              icon={<RocketOutlined />}
              loading={submitting}
              onClick={handleDeploy}
            >
              {intl.formatMessage({ id: 'application.deploy' })}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Space.Compact block>
            <Form.Item
              label={intl.formatMessage({ id: 'application.cluster' })}
              name="cluster"
              rules={[{ required: true }]}
              style={{ width: '50%' }}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={clusters.map((item) => ({
                  label: `${item.name} (${item.code})`,
                  value: item.code,
                }))}
              />
            </Form.Item>
            <Form.Item
              label={intl.formatMessage({ id: 'application.namespace' })}
              name="namespace"
              rules={[{ required: true }]}
              style={{ width: '50%' }}
            >
              <Select
                showSearch
                optionFilterProp="label"
                disabled={!selectedCluster}
                options={namespaces.map((item) => ({
                  label: item.namespace,
                  value: item.namespace,
                }))}
              />
            </Form.Item>
          </Space.Compact>
          <Form.Item
            label={intl.formatMessage({ id: 'application.releaseName' })}
            name="releaseName"
            rules={[
              { required: true },
              {
                pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                message: intl.formatMessage({
                  id: 'application.releaseName.rule',
                }),
              },
            ]}
          >
            <Input maxLength={63} placeholder="my-application" />
          </Form.Item>
          {(application?.parameters || [])
            .filter(
              (parameter) =>
                parameter.name !== 'name' && parameter.name !== 'namespace',
            )
            .map((parameter) => (
              <Form.Item
                key={parameter.name}
                name={['params', parameter.name]}
                label={parameter.displayName || parameter.name}
                tooltip={parameter.description}
                valuePropName={parameter.type === 'bool' ? 'checked' : 'value'}
                rules={
                  parameter.type === 'bool'
                    ? []
                    : [
                        { required: parameter.required },
                        ...(parameter.type === 'url'
                          ? [{ type: 'url' as const }]
                          : []),
                      ]
                }
              >
                <ParameterInput parameter={parameter} />
              </Form.Item>
            ))}
          <Form.Item
            label={intl.formatMessage({ id: 'application.deploy.description' })}
            name="description"
          >
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
      <Drawer
        title={intl.formatMessage({
          id:
            previewMode === 'validate'
              ? 'application.validate.result'
              : 'application.preview',
        })}
        width={760}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      >
        {preview && (
          <Alert
            type={preview.failures?.length ? 'error' : 'success'}
            showIcon
            message={intl.formatMessage(
              {
                id:
                  previewMode === 'validate'
                    ? preview.failures?.length
                      ? 'application.validate.failed.summary'
                      : 'application.validate.success.summary'
                    : preview.failures?.length
                      ? 'application.preview.failed.summary'
                      : 'application.preview.success.summary',
              },
              {
                success: preview.successes?.length || 0,
                failed: preview.failures?.length || 0,
              },
            )}
            style={{ marginBottom: 20 }}
          />
        )}
        {renderResources(
          intl.formatMessage({
            id:
              previewMode === 'validate'
                ? 'application.validate.success'
                : 'application.render.success',
          }),
          preview?.successes,
        )}
        {renderResources(
          intl.formatMessage({
            id:
              previewMode === 'validate'
                ? 'application.validate.failed'
                : 'application.render.failed',
          }),
          preview?.failures,
        )}
      </Drawer>
    </>
  );
};

export default DeployApplicationModal;
