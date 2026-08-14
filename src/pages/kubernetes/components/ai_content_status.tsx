import type { CopilotStepRecord } from "@/hooks/useAiCopilot";
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  MinusCircleFilled,
} from "@ant-design/icons";
import { Tag } from "antd";
import type { AiIntlLike } from "@/pages/kubernetes/components/ai_content_utils";

export const renderStepStatus = (status: CopilotStepRecord["status"]) => {
  switch (status) {
    case "success":
      return <CheckCircleFilled style={{ color: "#389e0d" }} />;
    case "error":
      return <CloseCircleFilled style={{ color: "#cf1322" }} />;
    case "running":
      return <ClockCircleFilled style={{ color: "#1677ff" }} />;
    default:
      return <MinusCircleFilled style={{ color: "#8c8c8c" }} />;
  }
};

export const renderStatusTag = (status?: string, intl?: AiIntlLike) => {
  if (!status) {
    return null;
  }
  const map: Record<string, string> = {
    ready: "blue",
    running: "processing",
    done: "success",
    completed: "success",
    success: "success",
    error: "error",
    approved: "success",
    rejected: "error",
    selected: "blue",
    discovered: "default",
    pending: "default",
  };
  return (
    <Tag color={map[status] || "default"}>
      {intl?.formatMessage(
        {
          id: `copilot.status.${status}`,
          defaultMessage: status,
        },
        { status }
      ) || status}
    </Tag>
  );
};
