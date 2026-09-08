import {
  CloudServerOutlined,
  ReloadOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  message,
  Select,
  Space,
  Spin,
} from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { installHelmStoreChart } from '@/services/cluster_helm.api';
import type {
  ClusterNamespaceDetail,
  ClusterNamespaceDetailList,
} from '@/services/cluster_namespace';
import type {
  HelmStoreInstallRequest,
  HelmStoreInstallResult,
  HelmStoreValues,
} from '@/services/helm_store';
import { getHelmStoreChartValues } from '@/services/helm_store.api';
import type {
  UserAccessCluster,
  UserAccessClusterList,
} from '@/services/kubernetes';
import {
  canAccessClusterNamespaces,
  canAccessClusters,
} from '@/services/personal.api';
import type { HelmChartVersion } from './types';

type DeployForm = {
  cluster: string;
  namespace: string;
  releaseName: string;
  values?: string;
};

type Props = {
  chart?: HelmChartVersion;
  open: boolean;
  onClose: () => void;
};

const releaseNameFor = (chartName?: string) => {
  const normalized = (chartName || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 53)
    .replace(/-+$/g, '');
  return normalized || 'helm-release';
};

const DeployHelmChartModal: React.FC<Props> = ({ chart, open, onClose }) => {
  const intl = useIntl();
  const [form] = Form.useForm<DeployForm>();
  const [clusters, setClusters] = useState<UserAccessCluster[]>([]);
  const [namespaces, setNamespaces] = useState<ClusterNamespaceDetail[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [valuesLoading, setValuesLoading] = useState(false);
  const [valuesLoaded, setValuesLoaded] = useState(false);
  const [valuesLoadFailed, setValuesLoadFailed] = useState(false);
  const valuesRequest = useRef(0);
  const selectedCluster = Form.useWatch('cluster', form);
  const query = new URLSearchParams(window.location.search);
  const initialCluster = query.get('cluster') || '';
  const initialNamespace = query.get('namespace') || '';

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      cluster: initialCluster || undefined,
      namespace: initialNamespace || undefined,
      releaseName: releaseNameFor(chart?.name),
      values: '',
    });
    canAccessClusters({ current: 1, pageSize: 200 }).then((data) => {
      setClusters((data as UserAccessClusterList).data || []);
    });
  }, [chart?.name, form, initialCluster, initialNamespace, open]);

  const loadChartValues = useCallback(async () => {
    if (!open || !chart) return;
    const requestId = ++valuesRequest.current;
    setValuesLoading(true);
    setValuesLoaded(false);
    setValuesLoadFailed(false);
    form.setFieldValue('values', '');
    try {
      const result = await getHelmStoreChartValues<HelmStoreValues>({
        repository: chart.repositoryId,
        chart: chart.name,
        version: chart.version,
      });
      if (valuesRequest.current !== requestId) return;
      form.setFieldValue('values', result.content || '');
      setValuesLoaded(true);
    } catch {
      if (valuesRequest.current === requestId) {
        setValuesLoadFailed(true);
      }
    } finally {
      if (valuesRequest.current === requestId) {
        setValuesLoading(false);
      }
    }
  }, [chart, form, open]);

  useEffect(() => {
    if (!open || !chart) {
      valuesRequest.current += 1;
      setValuesLoading(false);
      setValuesLoaded(false);
      setValuesLoadFailed(false);
      return;
    }
    void loadChartValues();
    return () => {
      valuesRequest.current += 1;
    };
  }, [chart, loadChartValues, open]);

  useEffect(() => {
    setNamespaces([]);
    if (!selectedCluster) {
      form.setFieldValue('namespace', undefined);
      return;
    }
    canAccessClusterNamespaces({
      cluster: selectedCluster,
      current: 1,
      pageSize: 200,
    }).then((data) => {
      const available = (data as ClusterNamespaceDetailList).data || [];
      setNamespaces(available);
      const selectedNamespace = form.getFieldValue('namespace');
      if (
        selectedNamespace &&
        !available.some((item) => item.namespace === selectedNamespace)
      ) {
        form.setFieldValue('namespace', undefined);
      }
    });
  }, [form, selectedCluster]);

  const deploy = async () => {
    if (!chart || !valuesLoaded) return;
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const request: HelmStoreInstallRequest = {
        repositoryId: chart.repositoryId,
        chart: chart.name,
        version: chart.version,
        releaseName: values.releaseName,
        values: values.values || '',
      };
      const result = await installHelmStoreChart<HelmStoreInstallResult>(
        { cluster: values.cluster, namespace: values.namespace },
        request,
      );
      message.success(
        intl.formatMessage(
          { id: 'helm.deploy.success' },
          { release: result.name || values.releaseName },
        ),
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      width={720}
      destroyOnHidden
      onCancel={onClose}
      onOk={deploy}
      confirmLoading={submitting}
      okText={intl.formatMessage({ id: 'helm.deploy' })}
      cancelText={intl.formatMessage({ id: 'pages.operation.cancel' })}
      okButtonProps={{
        disabled: valuesLoading || !valuesLoaded,
        icon: <RocketOutlined />,
      }}
      title={`${intl.formatMessage({ id: 'helm.deploy' })} · ${
        chart?.name || ''
      }`}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          showIcon
          icon={<CloudServerOutlined />}
          type={initialCluster ? 'info' : 'warning'}
          message={intl.formatMessage({
            id: initialCluster
              ? 'helm.deploy.targetInherited'
              : 'helm.deploy.targetRequired',
          })}
        />
        <Form form={form} layout="vertical" preserve={false}>
          <Space.Compact block>
            <Form.Item
              name="cluster"
              label={intl.formatMessage({ id: 'helm.deploy.cluster' })}
              rules={[{ required: true }]}
              style={{ width: '50%' }}
            >
              <Select
                showSearch
                optionFilterProp="label"
                onChange={() => form.setFieldValue('namespace', undefined)}
                placeholder={intl.formatMessage({
                  id: 'helm.deploy.cluster.placeholder',
                })}
                options={clusters.map((item) => ({
                  label: `${item.name} (${item.code})`,
                  value: item.code,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="namespace"
              label={intl.formatMessage({ id: 'helm.deploy.namespace' })}
              rules={[{ required: true }]}
              style={{ width: '50%' }}
            >
              <Select
                showSearch
                optionFilterProp="label"
                disabled={!selectedCluster}
                placeholder={intl.formatMessage({
                  id: 'helm.deploy.namespace.placeholder',
                })}
                options={namespaces.map((item) => ({
                  label: item.namespace,
                  value: item.namespace,
                }))}
              />
            </Form.Item>
          </Space.Compact>
          <Form.Item
            name="releaseName"
            label={intl.formatMessage({ id: 'helm.deploy.releaseName' })}
            rules={[
              { required: true },
              {
                pattern: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                message: intl.formatMessage({
                  id: 'helm.deploy.releaseName.rule',
                }),
              },
            ]}
          >
            <Input maxLength={63} />
          </Form.Item>
          <Form.Item label={intl.formatMessage({ id: 'helm.chartVersion' })}>
            <Input value={chart?.version} disabled />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({ id: 'helm.deploy.values' })}
            tooltip={intl.formatMessage({ id: 'helm.deploy.values.tooltip' })}
          >
            <Spin spinning={valuesLoading}>
              {valuesLoadFailed && (
                <Alert
                  showIcon
                  type="error"
                  style={{ marginBottom: 12 }}
                  message={intl.formatMessage({
                    id: 'helm.deploy.values.loadFailed',
                  })}
                  action={
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={() => void loadChartValues()}
                    >
                      {intl.formatMessage({
                        id: 'helm.deploy.values.reload',
                      })}
                    </Button>
                  }
                />
              )}
              <Form.Item name="values" noStyle>
                <Editor
                  language="yaml"
                  height="360px"
                  theme="vs-dark"
                  options={{
                    automaticLayout: true,
                    fontSize: 13,
                    insertSpaces: true,
                    minimap: { enabled: false },
                    readOnly: valuesLoading || valuesLoadFailed,
                    scrollBeyondLastLine: false,
                    tabSize: 2,
                    wordWrap: 'on',
                  }}
                />
              </Form.Item>
            </Spin>
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};

export default DeployHelmChartModal;
