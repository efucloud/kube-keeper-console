import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Divider, Row, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { INamespace, type Namespace } from 'kubernetes-models/v1';
import { clusterGetProxy } from '@/services/cluster_proxy.api';
import type { ClusterDashboard } from '@/services/dashboard';
import { getClusterNamespaceDashboard } from '@/services/namespace.api';
import { getClusterResource, getWorkloadStatus } from '@/utils/cluster';
import { appendKubernetesViewQuery, getColorPrimary, getCurrentViewInfo } from '@/utils/global';
import { RenderNamespaceWorkloadMetrics } from '@/pages/kubernetes/components/namespace_workload_metrics';
import AICopilot from '../../components/ai';
import { useIntl } from '@umijs/max';

const DetailView: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster, namespace } = getCurrentViewInfo();
  const [dashboard, setDashboard] = useState<ClusterDashboard>({});
  const [info, setInfo] = useState<INamespace>();
  const intl = useIntl();
  const [description, setDescription] = useState<string>('');
  const getDashboard = async () => {
    const data = (await getClusterNamespaceDashboard({ cluster, namespace })) as ClusterDashboard;
    setDashboard(data);
  };
  const getInfo = async () => {
    const params = { cluster, address: `api/v1/namespaces/${namespace}` } as Record<string, any>;
    const result = (await clusterGetProxy(params)) as Namespace;
    if (result.metadata?.annotations?.['efucloud.com/description']) {
      setDescription(result.metadata.annotations['efucloud.com/description']);
    }
    setInfo(result);
  };
  useEffect(() => {
    getDashboard();
    getInfo();
  }, [namespace]);
  return (
    <PageContainer title={false} header={{ breadcrumb: {}, onBack: () => window.history.back() }}
      content={<>{description}</>}
    >
      <Divider style={{ margin: 0 }} />
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/workload/pods`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('Pod', false)}
                value={dashboard.pods}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/workload/deployments`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('Deployment', false)}
                value={dashboard.deployments}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/workload/statefulsets`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('StatefulSet', false)}
                value={dashboard.statefulSets}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/workload/daemonsets`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('DaemonSet', false)}
                value={dashboard.daemonSets}
              />
            </span>
          </Card>
        </Col>

        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/workload/jobs`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('Job', false)}
                value={dashboard.job}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/workload/cronjobs`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('CronJob', false)}
                value={dashboard.cronJob}
              />
            </span>
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/config/configmaps`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('ConfigMap', false)}
                value={dashboard.configMap}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/config/secrets`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('Secret', false)}
                value={dashboard.secret}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/networks/services`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('Service', false)}
                value={dashboard.service}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/networks/ingress`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('Ingress', false)}
                value={dashboard.ingress}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/market/helm/histories`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('HelmInstance', false)}
                value={dashboard.helmInstance}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(appendKubernetesViewQuery(`/kubernetes/namespace/storage/persistentvolumeclaim`, { cluster: cluster, namespace: namespace }));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                styles={{ content: { color: colorPrimary } }}
                title={getClusterResource('PersistentVolumeClaim', false)}
                value={dashboard.pvc}
              />
            </span>
          </Card>
        </Col>
      </Row>
      <br />
      <Card styles={{ body: { padding: 0 } }}>
        <RenderNamespaceWorkloadMetrics

          cluster={cluster}
          namespace={namespace}
          legend="top"
        />
      </Card>
      {info && info.apiVersion &&
        <AICopilot
          view='detail'
          cluster={cluster}
          namespace={namespace || ''}
          name={info.metadata?.name || ''}
          questions={[{ mode:'plan',skill: 'k8s-namespace-inspect', question: intl.formatMessage({ id: 'copilot.namespace.inspection' }) }]}
          kind="Namespace"
          status='success'
        />}
    </PageContainer>
  );
};

export default DetailView;
