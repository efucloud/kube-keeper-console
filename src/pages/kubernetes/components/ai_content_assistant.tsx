import type { CopilotMessageRecord } from "@/hooks/useAiCopilot";
import type { CopilotStyleMap } from "@/pages/kubernetes/components/ai_content_stream";
import {
  type AiIntlLike,
  renderUsageFooter,
} from "@/pages/kubernetes/components/ai_content_utils";
import type { ChatStopMeta } from "@/services/ai_copilot.d";
import React from "react";

export const AiContentAssistant: React.FC<{
  message: CopilotMessageRecord;
  requestId: string;
  styles: CopilotStyleMap;
  intl: AiIntlLike;
  markdownRenderer: (
    content: string,
    options?: { streaming?: boolean; requestId?: string }
  ) => React.ReactNode;
  usage?: ChatStopMeta;
}> = ({ message, requestId, styles, intl, markdownRenderer, usage }) => {
  return (
    <div className={styles.answerBubble}>
      <div style={{ width: "100%" }}>
        {markdownRenderer(message.text, {
          streaming: message.status === "streaming",
          requestId,
        })}
      </div>
      {renderUsageFooter(intl, usage)}
    </div>
  );
};
