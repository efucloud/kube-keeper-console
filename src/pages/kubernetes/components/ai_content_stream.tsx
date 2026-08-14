import type {
  CopilotMessageRecord,
  CopilotRunState,
} from "@/hooks/useAiCopilot";
import { AiContentAssistant } from "@/pages/kubernetes/components/ai_content_assistant";
import { AiContentCommentary } from "@/pages/kubernetes/components/ai_content_commentary";
import { AiContentError } from "@/pages/kubernetes/components/ai_content_error";
import { AiContentQuestion } from "@/pages/kubernetes/components/ai_content_question";
import { AiContentStep } from "@/pages/kubernetes/components/ai_content_step";
import { AiContentToolTrace } from "@/pages/kubernetes/components/ai_content_tool";
import {
  type AiIntlLike,
  renderUsageFooter,
} from "@/pages/kubernetes/components/ai_content_utils";
import React from "react";

export type CopilotStyleMap = Record<string, string>;

export interface AiContentStreamProps {
  run: CopilotRunState;
  styles: CopilotStyleMap;
  intl: AiIntlLike;
  markdownRenderer: (
    content: string,
    options?: { streaming?: boolean; requestId?: string }
  ) => React.ReactNode;
}

const isVisibleMessage = (message: CopilotMessageRecord) =>
  message.role !== "user" &&
  (message.text.trim().length > 0 || message.parts.length > 0);

const isTransientAssistantMessage = (message: CopilotMessageRecord) =>
  message.id === "__assistant_stream__";

const resolveStepTools = (run: CopilotRunState, stepId: string) =>
  run.tools.filter((tool) => tool.stepId === stepId);

export const AiContentStream: React.FC<AiContentStreamProps> = ({
  run,
  styles,
  intl,
  markdownRenderer,
}) => {
  return (
    <div className={styles.runSection}>
      <div className={styles.timelineStack}>
        {run.stream.map((item) => {
          if (item.kind === "question") {
            return (
              <AiContentQuestion
                key={item.id}
                question={item.question}
                fallbackText={intl.formatMessage({
                  id: "copilot.chat.followup",
                })}
                styles={styles}
                markdownRenderer={markdownRenderer}
              />
            );
          }

          if (item.kind === "commentary") {
            const commentary = run.commentary.find(
              (entry) => entry.id === item.commentaryId
            );
            if (!commentary) {
              return null;
            }
            return (
              <AiContentCommentary
                key={item.id}
                text={commentary.text}
                styles={styles}
              />
            );
          }

          if (item.kind === "message") {
            const messageRecord = run.messages.find(
              (entry) => entry.id === item.messageId
            );
            if (!messageRecord || !isVisibleMessage(messageRecord)) {
              return null;
            }
            if (
              isTransientAssistantMessage(messageRecord) &&
              run.messages.some(
                (entry) =>
                  !isTransientAssistantMessage(entry) && isVisibleMessage(entry)
              )
            ) {
              return null;
            }
            return (
              <AiContentAssistant
                key={item.id}
                message={messageRecord}
                requestId={run.requestId}
                styles={styles}
                intl={intl}
                markdownRenderer={markdownRenderer}
                usage={messageRecord.status === "done" ? run.usage : undefined}
              />
            );
          }

          if (item.kind === "step") {
            const step = run.steps.find((entry) => entry.id === item.stepId);
            if (!step) {
              return null;
            }
            return (
              <AiContentStep
                key={item.id}
                step={step}
                tools={resolveStepTools(run, step.id)}
                styles={styles}
                intl={intl}
              />
            );
          }

          if (item.kind === "tool") {
            const tool = run.tools.find((entry) => entry.id === item.toolId);
            if (!tool || tool.stepId) {
              return null;
            }
            return (
              <AiContentToolTrace
                key={item.id}
                title={tool.title || tool.toolName}
                status={tool.status}
                argumentsText={tool.argumentsText}
                resultText={tool.resultText}
                error={tool.error}
                styles={styles}
                intl={intl}
              />
            );
          }

          if (item.kind === "error") {
            const errorRecord = run.errors.find(
              (entry) => entry.id === item.errorId
            );
            if (!errorRecord) {
              return null;
            }
            return (
              <AiContentError
                key={item.id}
                error={errorRecord.message}
                styles={styles}
              />
            );
          }

          return null;
        })}
      </div>
      {renderUsageFooter(intl, run.usage)}
    </div>
  );
};
