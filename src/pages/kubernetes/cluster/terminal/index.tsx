import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Alert, Button, Card, Result, Space, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PodContainerTerminal from '@/pages/kubernetes/components/container_terminal';
import { createTerminalPod } from '@/services/cluster_terminal.api';
import type { ClusterTerminalPodInfo } from '@/services/kubernetes';
import { getCurrentViewInfo } from '@/utils/global';

type TerminalStatus = 'loading' | 'waiting' | 'ready' | 'error';

const RUNNING_PHASE = 'Running';
const WAITING_PHASES = ['Pending', 'Unknown'];
const EXPIRE_WARNING_MS = 5 * 60 * 1000;
const TIMESTAMP_MS_THRESHOLD = 1_000_000_000_000;

const normalizeTimestampToMs = (value: number) => {
  if (!Number.isFinite(value)) {
    return Number.NaN;
  }
  return Math.abs(value) < TIMESTAMP_MS_THRESHOLD ? value * 1000 : value;
};

const parseExpireAtToMs = (expireAt?: string | number) => {
  if (expireAt === undefined || expireAt === null) {
    return Number.NaN;
  }
  if (typeof expireAt === 'number') {
    return normalizeTimestampToMs(expireAt);
  }

  const trimmed = `${expireAt}`.trim();
  if (!trimmed) {
    return Number.NaN;
  }

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return normalizeTimestampToMs(Number(trimmed));
  }

  return new Date(trimmed).getTime();
};

const TerminalIndex: React.FC = () => {
  const intl = useIntl();
  const { cluster } = getCurrentViewInfo();
  const [terminalInfo, setTerminalInfo] = useState<ClusterTerminalPodInfo>();
  const [terminalStatus, setTerminalStatus] =
    useState<TerminalStatus>('loading');
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string>('');
  const [nowTick, setNowTick] = useState(Date.now());

  const getPhase = useCallback((phase?: string) => {
    return (phase || '').trim();
  }, []);

  const normalizePhase = useCallback(
    (phase?: string) => getPhase(phase).toLowerCase(),
    [getPhase],
  );

  const toCanonicalPhase = useCallback(
    (phase?: string) => {
      const normalized = normalizePhase(phase);
      if (normalized === 'running') return 'Running';
      if (normalized === 'pending') return 'Pending';
      if (normalized === 'succeeded') return 'Succeeded';
      if (normalized === 'failed') return 'Failed';
      if (normalized === 'unknown' || normalized === '') return 'Unknown';
      return getPhase(phase) || 'Unknown';
    },
    [getPhase, normalizePhase],
  );

  const getPhaseText = useCallback(
    (phase?: string) => {
      const currentPhase = toCanonicalPhase(phase);
      if (
        ['Pending', 'Running', 'Succeeded', 'Failed', 'Unknown'].includes(
          currentPhase,
        )
      ) {
        return intl.formatMessage({ id: `cluster.pod.status.${currentPhase}` });
      }
      return currentPhase;
    },
    [intl, toCanonicalPhase],
  );

  const resolveStatus = useCallback(
    (data?: ClusterTerminalPodInfo): TerminalStatus => {
      const phase = toCanonicalPhase(data?.phase);
      const hasTerminalInfo =
        !!data?.namespace && !!data?.pod && !!data?.container;

      if (phase === RUNNING_PHASE && hasTerminalInfo) {
        return 'ready';
      }
      if (WAITING_PHASES.includes(phase)) {
        return 'waiting';
      }
      return 'error';
    },
    [toCanonicalPhase],
  );

  const parseErrorMessage = useCallback(
    (error: unknown) => {
      if (error && typeof error === 'object') {
        const err = error as { message?: string; data?: { message?: string } };
        if (err?.data?.message) {
          return err.data.message;
        }
        if (err?.message) {
          return err.message;
        }
      }
      return intl.formatMessage({ id: 'pages.operation.error' });
    },
    [intl],
  );

  const requestTerminalPod = useCallback(async () => {
    if (!cluster) {
      setTerminalStatus('error');
      setRequestError(intl.formatMessage({ id: 'pages.operation.error' }));
      return;
    }
    setRequesting(true);
    try {
      const data = (await createTerminalPod({ cluster })) as ClusterTerminalPodInfo;
      setTerminalInfo(data || {});
      setRequestError('');
      setTerminalStatus(resolveStatus(data));
    } catch (error) {
      setTerminalStatus('error');
      setRequestError(parseErrorMessage(error));
    } finally {
      setRequesting(false);
    }
  }, [cluster, intl, parseErrorMessage, resolveStatus]);

  useEffect(() => {
    requestTerminalPod();
  }, [requestTerminalPod]);

  useEffect(() => {
    if (terminalStatus !== 'waiting') {
      return;
    }
    const timer = window.setTimeout(() => {
      requestTerminalPod();
    }, 3000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [requestTerminalPod, terminalStatus]);

  const canConnectTerminal = useMemo(() => {
    return (
      terminalStatus === 'ready' &&
      !!terminalInfo?.namespace &&
      !!terminalInfo?.pod &&
      !!terminalInfo?.container
    );
  }, [
    terminalInfo?.container,
    terminalInfo?.namespace,
    terminalInfo?.pod,
    terminalStatus,
  ]);

  useEffect(() => {
    if (!canConnectTerminal) {
      return;
    }
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [canConnectTerminal]);

  const expireAlert = useMemo(() => {
    const expireAt = terminalInfo?.expireAt;
    if (expireAt === undefined || expireAt === null || `${expireAt}`.trim() === '') {
      return {
        type: 'info' as const,
        message: '-',
      };
    }

    const expireAtMs = parseExpireAtToMs(expireAt);
    if (Number.isNaN(expireAtMs)) {
      return {
        type: 'warning' as const,
        message: intl.formatMessage(
          { id: 'cluster.terminal.expire.message.invalid' },
          { value: `${expireAt}` },
        ),
      };
    }

    const displayExpireAt = dayjs(expireAtMs).format('YYYY-MM-DD HH:mm:ss');
    const remainingMs = expireAtMs - nowTick;
    if (remainingMs <= 0) {
      return {
        type: 'error' as const,
        message: intl.formatMessage(
          { id: 'cluster.terminal.expire.message.expired' },
          { value: displayExpireAt },
        ),
      };
    }

    if (remainingMs <= EXPIRE_WARNING_MS) {
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      return {
        type: 'warning' as const,
        message: intl.formatMessage(
          { id: 'cluster.terminal.expire.message.warning' },
          { minutes, seconds, value: displayExpireAt },
        ),
      };
    }

    return {
      type: 'info' as const,
      message: displayExpireAt,
    };
  }, [intl, nowTick, terminalInfo?.expireAt]);

  const expireTagColor = useMemo(() => {
    if (expireAlert.type === 'error') {
      return 'error';
    }
    if (expireAlert.type === 'warning') {
      return 'warning';
    }
    return 'default';
  }, [expireAlert.type]);

  const targetCluster = useMemo(() => {
    return terminalInfo?.targetCluster || cluster || '-';
  }, [cluster, terminalInfo?.targetCluster]);

  return (
    <PageContainer
      header={{ breadcrumb: {} }}
      title={intl.formatMessage({ id: 'cluster.resource.container.terminal' })}
      subTitle={
        <Space size="middle" wrap>
          <span>
            {intl.formatMessage({ id: 'cluster.terminal.targetCluster' })}
            :&nbsp;
            <Tag color="blue">{targetCluster}</Tag>
          </span>
          <span>
            {intl.formatMessage({ id: 'cluster.terminal.expireAt' })}:&nbsp;
            <Tag color={expireTagColor}>{expireAlert.message}</Tag>
          </span>
        </Space>
      }
      extra={[
        <Button key="refresh" loading={requesting} onClick={requestTerminalPod}>
          {intl.formatMessage({ id: 'pages.operation.refresh' })}
        </Button>,
      ]}
    >
      <Card>
        {terminalStatus === 'loading' && (
          <Result
            icon={<Spin size="large" />}
            title={intl.formatMessage({ id: 'pages.loading' })}
          />
        )}

        {terminalStatus === 'waiting' && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              showIcon
              type="info"
              message={getPhaseText(terminalInfo?.phase || 'Pending')}
              description={
                terminalInfo?.message ||
                intl.formatMessage({ id: 'pages.loading' })
              }
            />
            <Result
              icon={<Spin size="large" />}
              title={intl.formatMessage({ id: 'pages.loading' })}
              subTitle={intl.formatMessage({ id: 'pages.operation.refresh' })}
            />
          </Space>
        )}

        {terminalStatus === 'error' && (
          <Result
            status="error"
            title={getPhaseText(terminalInfo?.phase || 'Failed')}
            subTitle={
              terminalInfo?.message ||
              requestError ||
              intl.formatMessage({ id: 'pages.operation.error' })
            }
            extra={[
              <Button key="retry" type="primary" onClick={requestTerminalPod}>
                {intl.formatMessage({ id: 'pages.operation.refresh' })}
              </Button>,
            ]}
          />
        )}

        {canConnectTerminal && terminalInfo && (
          <PodContainerTerminal
            key={`${terminalInfo.namespace}-${terminalInfo.pod}-${terminalInfo.container}`}
            cluster={terminalInfo.cluster!}
            namespace={terminalInfo.namespace || ''}
            disableWelcomeMessage={true}
            pod={terminalInfo.pod || ''}
            containers={[terminalInfo.container || '']}
          />
        )}
      </Card>
    </PageContainer>
  );
};

export default TerminalIndex;
