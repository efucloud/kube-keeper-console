import { LoadingOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import React from "react";
import type { CopilotStyleMap } from "@/pages/kubernetes/components/ai_content_stream";

export const AiContentCommentary: React.FC<{
  text: string;
  styles: CopilotStyleMap;
}> = ({ text, styles }) => (
  <div className={styles.commentaryPanel}>
    <Typography.Text style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <LoadingOutlined style={{ fontSize: 12, color: "#667085" }} />
      <span>{text}</span>
    </Typography.Text>
  </div>
);
