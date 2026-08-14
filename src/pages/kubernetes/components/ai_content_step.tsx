import { theme, Tooltip, Typography } from 'antd';
import React from 'react';
import type {
  CopilotStepRecord,
  CopilotToolRecord,
} from '@/hooks/useAiCopilot';
import {
  renderStatusTag,
  renderStepStatus,
} from '@/pages/kubernetes/components/ai_content_status';
import type { CopilotStyleMap } from '@/pages/kubernetes/components/ai_content_stream';
import { AiContentToolTrace } from '@/pages/kubernetes/components/ai_content_tool';
import {
  type AiIntlLike,
  sanitizeStructuredPayload,
  summarizeNarrative,
  summarizeValue,
} from '@/pages/kubernetes/components/ai_content_utils';

export const AiContentStep: React.FC<{
  step: CopilotStepRecord;
  tools?: CopilotToolRecord[];
  styles: CopilotStyleMap;
  intl: AiIntlLike;
}> = ({ step, tools = [], styles, intl }) => {
  const normalizedReason = (step.reason || '').replace(/\s+/g, ' ').trim();
  const contentText =
    normalizedReason ||
    summarizeNarrative(
      sanitizeStructuredPayload(step.summary || step.result),
      intl,
    ) ||
    summarizeValue(sanitizeStructuredPayload(step.result));
  const { token } = theme.useToken();
  const shouldShowDetail =
    tools.length === 0 &&
    contentText &&
    contentText !== '-' &&
    contentText !== step.title &&
    !tools.some((tool) => {
      const preview =
        sanitizeStructuredPayload(tool.resultText) ??
        tool.resultText ??
        tool.error ??
        '';
      return summarizeNarrative(preview, intl) === contentText;
    });
  return (
    <details className={styles.stepCard}>
      <summary className={styles.stepSummary}>
        <div className={styles.stepRow}>
          <div className={styles.stepRail}>{renderStepStatus(step.status)}</div>
          <div className={styles.stepContent}>
            <div className={styles.stepMeta}>
              <Tooltip
                title={normalizedReason || step.title}
                placement="topLeft"
                color={token.colorPrimary}
              >
                <Typography.Text strong className={styles.stepTitle}>
                  {step.title}
                </Typography.Text>
              </Tooltip>
            </div>
          </div>
          <div>{renderStatusTag(step.status, intl)}</div>
        </div>
      </summary>
      <div className={styles.stepPanel}>
        {normalizedReason && (
          <div className={styles.stepReasonBlock}>
            <div className={styles.traceLabel}>
              {intl.formatMessage({ id: 'copilot.step.reason' })}
            </div>
            <Typography.Text className={styles.stepReasonText}>
              {normalizedReason}
            </Typography.Text>
          </div>
        )}
        {shouldShowDetail && (
          <div className={styles.stepText}>
            <Typography.Text>{contentText}</Typography.Text>
          </div>
        )}
        {step.error && (
          <div className={styles.stepText}>
            <Typography.Text type="danger">
              {intl.formatMessage({ id: 'copilot.step.error' })}: {step.error}
            </Typography.Text>
          </div>
        )}
        {tools.map((tool) => (
          <AiContentToolTrace
            key={tool.id}
            title={tool.title || tool.toolName}
            status={tool.status}
            reason={tool.reason}
            summary={tool.summary}
            argumentsText={tool.argumentsText}
            resultText={tool.resultText}
            error={tool.error}
            styles={styles}
            intl={intl}
            plain
          />
        ))}
      </div>
    </details>
  );
};
