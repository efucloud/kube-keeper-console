import type { CopilotStyleMap } from "@/pages/kubernetes/components/ai_content_stream";
import { Typography } from "antd";
import React from "react";

export const AiContentError: React.FC<{
  error: string;
  styles: CopilotStyleMap;
}> = ({ error, styles }) => (
  <div className={styles.errorPanel}>
    <Typography.Text type="danger">{error}</Typography.Text>
  </div>
);
