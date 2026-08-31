import { ArrowLeftOutlined, CloudSyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Card, Col, Divider, message, Row, Statistic, Tag, Tooltip, } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  clusterServerGroups, getClusterInfo, getClusterResourceDashboard, } from '@/services/cluster.api';
import type { ClusterDashboard } from '@/services/dashboard';
import type { ClusterServerGroup } from '@/services/kubernetes';
import type { ClusterDetail } from '@/services/cluster';
import { syncClusterNamespace } from '@/services/cluster.api';
import { getClusterResource } from '@/utils/cluster';
import {
  getColorPrimary, getCurrentViewInfo, saveClusterApiVersions, saveClusterFeatures, normalizeKubernetesPath } from '@/utils/global';
import AICopilot from '../../components/ai';

const IndexDashboard: React.FC = () => {
  const colorPrimary = getColorPrimary();
  const { cluster } = getCurrentViewInfo();
  const [dashboard, setDashboard] = useState<ClusterDashboard>({});
  const [info, setInfo] = useState<ClusterDetail>({} as ClusterDetail);
  const getDashboard = async () => {
    const data = (await getClusterResourceDashboard({

      cluster,
    })) as ClusterDashboard;
    setDashboard(data);
  };
  const intl = useIntl();
  const getInfo = async () => {
    if (cluster) {
      const data = (await getClusterInfo({

        cluster,
      })) as ClusterDetail;
      setInfo(data);
      if (data?.features && data?.features.length > 0) {
        saveClusterFeatures(cluster, data?.features || []);
      }
      //获取集群资源
      clusterServerGroups({ cluster: cluster }).then((res) => {
        const groups = res as string;
        saveClusterApiVersions(cluster, groups);
      });
    }

  };
  useEffect(() => {
    getInfo();
    getDashboard();
  }, []);
  const syncNamespace = async () => {
    await syncClusterNamespace({ cluster });
    message.success(intl.formatMessage({ id: 'cluster.namespace.sync.success' }));
  };
  return (
    <PageContainer
      breadcrumb={false}
      title={false}
      content={
        <>
          <>
            {info.code && (
              <>
                <span>
                  <FormattedMessage id="model.cluster.name" />
                  :&nbsp;&nbsp;
                  <Tag style={{ border: 0, color: colorPrimary }}>
                    {info.name}
                  </Tag>
                </span>
                <span>
                  <FormattedMessage id="model.cluster.code" />
                  :&nbsp;&nbsp;
                  <Tag style={{ border: 0, color: colorPrimary }}>
                    {info.code}
                  </Tag>
                </span>
              </>
            )}
          </>
          <>
            {info.version && (
              <>
                <span>
                  <FormattedMessage id="model.cluster.version" />
                  :&nbsp;&nbsp;
                  <Tag style={{ border: 0, color: colorPrimary }}>
                    {info.version.major}.{info.version.minor}
                  </Tag>
                </span>
                <span>
                  <FormattedMessage id="cluster.platform" />
                  :&nbsp;&nbsp;
                  <Tag style={{ border: 0, color: colorPrimary }}>
                    {info.version.platform}
                  </Tag>
                </span>
                <span>
                  <FormattedMessage id="cluster.buildDate" />
                  :&nbsp;&nbsp;
                  <Tag style={{ border: 0, color: colorPrimary }}>
                    {info.version.buildDate}
                  </Tag>
                </span>
              </>
            )}
          </>
          <span>
            <a>
              <Tooltip
                color={colorPrimary}
                title={<FormattedMessage id="cluster.namespace.sync" />}
              >
                <CloudSyncOutlined
                  onClick={syncNamespace}
                  style={{
                    color: colorPrimary,
                    fontSize: 25,
                    verticalAlign: 'middle',
                  }}
                />

              </Tooltip>
            </a>
            &nbsp;&nbsp;
          </span>
        </>
      }
    >
      <Divider style={{ margin: 0 }} />
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(normalizeKubernetesPath(`/kubernetes/cluster/node`));
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                valueStyle={{ color: colorPrimary }}
                title={getClusterResource('Node', false)}
                value={dashboard.nodes}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/namespace`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                valueStyle={{ color: colorPrimary }}
                title={getClusterResource('Namespace', false)}
                value={dashboard.namespaces}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/workload/pods`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                valueStyle={{ color: colorPrimary }}
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
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/workload/deployments`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>

              <Statistic
                valueStyle={{ color: colorPrimary }}
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
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/workload/statefulsets`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>

              <Statistic
                valueStyle={{ color: colorPrimary }}
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
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/workload/daemonsets`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>

              <Statistic
                valueStyle={{ color: colorPrimary }}
                title={getClusterResource('DaemonSet', false)}
                value={dashboard.daemonSets}
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
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/workload/jobs`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>

              <Statistic
                valueStyle={{ color: colorPrimary }}
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
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/workload/cronjobs`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                valueStyle={{ color: colorPrimary }}
                title={getClusterResource('CronJob', false)}
                value={dashboard.cronJob}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/config/configmaps`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>

              <Statistic
                valueStyle={{ color: colorPrimary }}
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
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/config/secrets`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>

              <Statistic
                valueStyle={{ color: colorPrimary }}
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
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/networks/services`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>

              <Statistic
                valueStyle={{ color: colorPrimary }}
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
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/networks/ingresses`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>
              <Statistic
                valueStyle={{ color: colorPrimary }}
                title={getClusterResource('Ingress', false)}
                value={dashboard.ingress}
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
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/storage/storageclass`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>

              <Statistic
                valueStyle={{ color: colorPrimary }}
                title={getClusterResource('StorageClass', false)}
                value={dashboard.storageClass}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/storage/persistentvolume`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>

              <Statistic
                valueStyle={{ color: colorPrimary }}
                title={getClusterResource('PersistentVolume', false)}
                value={dashboard.pv}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/storage/persistentvolumeclaim`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>

              <Statistic
                valueStyle={{ color: colorPrimary }}
                title={getClusterResource('PersistentVolumeClaim', false)}
                value={dashboard.pvc}
              />
            </span>
          </Card>
        </Col>
        <Col span={4}>
          <Card
            variant={'borderless'}
            onClick={() => {
              window.open(
                normalizeKubernetesPath(`/kubernetes/cluster/customresourcedefinitions`),
              );
            }}
          >
            <span style={{ textAlign: 'center' }}>

              <Statistic
                valueStyle={{ color: colorPrimary }}
                title={getClusterResource('CustomResourceDefinition', false)}
                value={dashboard.crd}
              />
            </span>
          </Card>
        </Col>
      </Row>
      {info && <AICopilot
        view={undefined}
        cluster={cluster}
        questions={[{ mode: 'plan', skill: 'k8s-cluster-inspect', question: intl.formatMessage({ id: 'copilot.cluster.inspection' }) }]}
        status='success'
      />}
    </PageContainer>
  );
};

export default IndexDashboard;
