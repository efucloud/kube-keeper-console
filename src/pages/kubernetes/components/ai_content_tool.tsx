import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import { Tooltip, Typography } from 'antd';
import React from 'react';
import type { CopilotStyleMap } from '@/pages/kubernetes/components/ai_content_stream';
import {
  type AiIntlLike,
  formatDisplayPayload,
  sanitizeStructuredPayload,
  summarizeNarrative,
} from '@/pages/kubernetes/components/ai_content_utils';

export interface AiContentToolTraceProps {
  title: string;
  status?: string;
  reason?: string;
  summary?: string;
  argumentsText?: string;
  resultText?: string;
  error?: string;
  styles: CopilotStyleMap;
  intl: AiIntlLike;
  plain?: boolean;
}

export const AiContentToolTrace: React.FC<AiContentToolTraceProps> = ({
  title,
  status,
  reason,
  summary,
  argumentsText,
  resultText,
  error,
  styles,
  intl,
  plain = false,
}) => {
  const hasArguments = Boolean(argumentsText?.trim());
  const resultDisplayText = formatDisplayPayload(resultText);
  const hasResult = Boolean(resultDisplayText);
  const normalizedReason = (reason || '').replace(/\s+/g, ' ').trim();
  const preview =
    error ||
    summary ||
    summarizeNarrative(sanitizeStructuredPayload(resultText), intl) ||
    intl.formatMessage({ id: 'copilot.trace.structured' });
  const statusNode =
    status === 'success' ? (
      <CheckCircleFilled style={{ color: '#16a34a' }} />
    ) : status === 'error' ? (
      <CloseCircleFilled style={{ color: '#dc2626' }} />
    ) : (
      <ClockCircleFilled style={{ color: '#2563eb' }} />
    );
  if (plain) {
    return (
      <div className={styles.tracePanelPlain}>
        {hasArguments && (
          <div>
            <div className={styles.traceLabel}>
              {intl.formatMessage({ id: 'copilot.trace.arguments' })}
            </div>
            <pre className={styles.monoBox}>{argumentsText}</pre>
          </div>
        )}
        {hasResult && (
          <div>
            <div className={styles.traceLabel}>
              {intl.formatMessage({ id: 'copilot.trace.result' })}
            </div>
            <pre className={styles.monoBox}>{resultDisplayText}</pre>
          </div>
        )}
        {error && (
          <div>
            <div className={styles.traceLabel}>
              {intl.formatMessage({ id: 'copilot.trace.error' })}
            </div>
            <Typography.Text type="danger">{error}</Typography.Text>
          </div>
        )}
      </div>
    );
  }
  return (
    <details className={styles.traceDetails}>
      <summary className={styles.traceSummary}>
        <div className={styles.traceSummaryRow}>
          <div className={styles.traceSummaryMain}>
            {statusNode}
            <Tooltip title={normalizedReason || title} placement="topLeft">
              <span className={styles.traceTitle}>{title}</span>
            </Tooltip>
          </div>
          <Tooltip title={normalizedReason || preview} placement="topRight">
            <span className={styles.tracePreviewInline}>
              {normalizedReason || preview}
            </span>
          </Tooltip>
        </div>
      </summary>
      <div className={styles.tracePanel}>
        {normalizedReason && (
          <div>
            <div className={styles.traceLabel}>
              {intl.formatMessage({ id: 'copilot.step.reason' })}
            </div>
            <Typography.Text className={styles.traceReasonText}>
              {normalizedReason}
            </Typography.Text>
          </div>
        )}
        {(hasResult || preview) && preview !== normalizedReason && (
          <div className={styles.tracePreview}>{preview}</div>
        )}
        {hasArguments && (
          <div>
            <div className={styles.traceLabel}>
              {intl.formatMessage({ id: 'copilot.trace.arguments' })}
            </div>
            <pre className={styles.monoBox}>{argumentsText}</pre>
          </div>
        )}
        {hasResult && (
          <div>
            <div className={styles.traceLabel}>
              {intl.formatMessage({ id: 'copilot.trace.result' })}
            </div>
            <pre className={styles.monoBox}>{resultDisplayText}</pre>
          </div>
        )}
        {error && (
          <div>
            <div className={styles.traceLabel}>
              {intl.formatMessage({ id: 'copilot.trace.error' })}
            </div>
            <Typography.Text type="danger">{error}</Typography.Text>
          </div>
        )}
      </div>
    </details>
  );
};
