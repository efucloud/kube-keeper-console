import {
  CheckCircleFilled,
  CloseCircleFilled,
  DownOutlined,
  LoadingOutlined,
  UnorderedListOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { Editor } from "@monaco-editor/react";
import { Card, Space, Tag, Typography } from "antd";
import type React from "react";
import { useMemo, useState } from "react";
import type { PlanRunState, PlanStepState } from "@/hooks/useAiCopilot";
import { FormattedMessage } from "@umijs/max";

type PlanStep = {
  id?: string;
  title?: string;
  tool?: string;
  reason?: string;
  args?: Record<string, unknown>;
};

type PlanResult = {
  mode?: string;
  goal?: string;
  cluster?: string;
  namespace?: string;
  skillId?: string;
  steps?: PlanStep[];
};

type DetailRenderMode = "text" | "editor";

type DetailEditorPayload = {
  language: "json" | "plaintext";
  value: string;
};

const planRegex = /```json\s*([\s\S]*?)```/g;

const isPlanResult = (data: unknown): data is PlanResult => {
  if (!data || typeof data !== "object") {
    return false;
  }
  const plan = data as PlanResult;
  return Array.isArray(plan.steps) && plan.steps.length > 0;
};

const parseDetailForEditor = (detail?: string): DetailEditorPayload => {
  const raw = String(detail || "");
  const trimmed = raw.trim();
  if (!trimmed) {
    return { language: "plaintext", value: "" };
  }

  const tryFormat = (candidate: string): string | undefined => {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed !== null && typeof parsed === "object") {
        return JSON.stringify(parsed, null, 2);
      }
      if (typeof parsed === "string") {
        try {
          const nested = JSON.parse(parsed);
          if (nested !== null && typeof nested === "object") {
            return JSON.stringify(nested, null, 2);
          }
        } catch {
          // not nested-json string
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  };

  const direct = tryFormat(trimmed);
  if (direct) {
    return {
      language: "json",
      value: direct,
    };
  }

  const firstObj = trimmed.indexOf("{");
  const lastObj = trimmed.lastIndexOf("}");
  if (firstObj >= 0 && lastObj > firstObj) {
    const extracted = tryFormat(trimmed.slice(firstObj, lastObj + 1));
    if (extracted) {
      return {
        language: "json",
        value: extracted,
      };
    }
  }

  const firstArr = trimmed.indexOf("[");
  const lastArr = trimmed.lastIndexOf("]");
  if (firstArr >= 0 && lastArr > firstArr) {
    const extracted = tryFormat(trimmed.slice(firstArr, lastArr + 1));
    if (extracted) {
      return {
        language: "json",
        value: extracted,
      };
    }
  }

  return {
    language: "plaintext",
    value: raw,
  };
};

const calcEditorHeight = (value: string): number => {
  const lineCount = Math.max(1, value.split(/\r?\n/).length);
  return Math.max(140, Math.min(320, lineCount * 20 + 20));
};

export const extractPlanFromContent = (content?: string): PlanResult | null => {
  if (!content) {
    return null;
  }

  const blocks = Array.from(content.matchAll(planRegex));
  for (const block of blocks) {
    const body = block[1]?.trim();
    if (!body) {
      continue;
    }
    try {
      const parsed = JSON.parse(body);
      if (isPlanResult(parsed)) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  try {
    const parsed = JSON.parse(content);
    if (isPlanResult(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
};

export const stripPlanFromContent = (content?: string): string => {
  if (!content) {
    return "";
  }
  if (!extractPlanFromContent(content)) {
    return content;
  }
  return content.replace(planRegex, "").trim();
};

const buildFallbackPlan = (content?: string): PlanRunState | null => {
  const parsed = extractPlanFromContent(content);
  if (!parsed?.steps?.length) {
    return null;
  }
  return {
    goal: parsed.goal || "",
    steps: parsed.steps.map((step) => ({
      id: step.id,
      title: step.title,
      tool: step.tool,
      reason: step.reason,
      status: "pending" as const,
    })),
  };
};

const statusNode = (step: PlanStepState) => {
  switch (step.status) {
    case "success":
      return <CheckCircleFilled style={{ color: "#52c41a" }} />;
    case "error":
      return <CloseCircleFilled style={{ color: "#ff4d4f" }} />;
    case "executing":
      return <LoadingOutlined style={{ color: "#1677ff" }} />;
    default:
      return <span style={{ color: "#8c8c8c" }}>○</span>;
  }
};

export type PlanTodoListProps = {
  plan?: PlanRunState;
  content?: string;
  embedded?: boolean;
  detailRenderMode?: DetailRenderMode;
};

export const PlanTodoList: React.FC<PlanTodoListProps> = ({
  plan,
  content,
  embedded = false,
  detailRenderMode = "text",
}) => {
  const displayPlan = useMemo(
    () => (plan && plan.steps.length > 0 ? plan : buildFallbackPlan(content)),
    [plan, content],
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!displayPlan || displayPlan.steps.length === 0) {
    return null;
  }

  const getStepKey = (step: PlanStepState, index: number) =>
    step.id || `${index}-${step.title || ""}`;

  const hasAnyDetail = displayPlan.steps.some(
    (step) => step.reason || step.detail,
  );
  const allExpanded = hasAnyDetail
    ? displayPlan.steps.every(
      (step, index) => expanded[getStepKey(step, index)],
    )
    : false;

  const toggleAll = () => {
    if (!hasAnyDetail) {
      return;
    }
    if (allExpanded) {
      setExpanded({});
      return;
    }
    const next: Record<string, boolean> = {};
    displayPlan.steps.forEach((step, index) => {
      if (step.reason || step.detail) {
        next[getStepKey(step, index)] = true;
      }
    });
    setExpanded(next);
  };

  const toggleOne = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const total = displayPlan.steps.length;
  const successCount = displayPlan.steps.filter(
    (step) => step.status === "success",
  ).length;
  const errorCount = displayPlan.steps.filter(
    (step) => step.status === "error",
  ).length;

  const body = (
    <>
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space size={8} style={{ color: "#595959" }}>
          <UnorderedListOutlined />
          <Typography.Text style={{ color: "#595959" }}>
            <FormattedMessage id='copilot.chat.agent.task.format' values={{ total: total, successCount: successCount }} />
          </Typography.Text>
          {errorCount > 0 && <Tag color="error"><FormattedMessage id='copilot.chat.agent.task.failed.number' values={{ errorCount: errorCount }} />  </Tag>}
        </Space>
        {hasAnyDetail && (
          <Typography.Link onClick={toggleAll}>
            {allExpanded ? <UpOutlined /> : <DownOutlined />}
          </Typography.Link>
        )}
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {displayPlan.steps.map((step, index) => {
          const stepKey = getStepKey(step, index);
          const canExpand = Boolean(step.reason || step.detail);
          const isExpanded = Boolean(expanded[stepKey]);
          const editorDetail =
            detailRenderMode === "editor" && isExpanded && step.detail
              ? parseDetailForEditor(step.detail)
              : null;
          return (
            <div
              key={stepKey}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span style={{ marginTop: 3, flex: "0 0 auto" }}>{statusNode(step)}</span>
              <div style={{ flex: "1 1 0%", minWidth: 0 }}>
                <div>
                  <Typography.Text strong>
                    {index + 1}. {step.title || `步骤 ${index + 1}`}
                  </Typography.Text>
                  {step.tool && (
                    <Tag color="blue" style={{ marginInlineStart: 8 }}>
                      {step.tool}
                    </Tag>
                  )}
                  {canExpand && (
                    <Typography.Link
                      onClick={() => toggleOne(stepKey)}
                      style={{ marginInlineStart: 8 }}
                    >
                      {isExpanded ? <DownOutlined /> : <UpOutlined />}
                    </Typography.Link>
                  )}
                </div>
                {isExpanded && step.reason && (
                  <Typography.Paragraph
                    style={{ marginBottom: 0, marginTop: 2, color: "#8c8c8c" }}
                  >
                    {step.reason}
                  </Typography.Paragraph>
                )}
                {isExpanded &&
                  step.detail &&
                  detailRenderMode === "editor" &&
                  editorDetail && (
                    <div
                      style={{
                        width: "100%",
                        marginTop: 6,
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <Editor
                        width="100%"
                        height={calcEditorHeight(editorDetail.value)}
                        defaultLanguage={editorDetail.language}
                        value={editorDetail.value}
                        theme="vs-dark"
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          lineNumbers: "on",
                          wordWrap: "off",
                          scrollBeyondLastLine: false,
                          fontSize: 12,
                          padding: { top: 8, bottom: 8 },
                          automaticLayout: true,
                          overviewRulerLanes: 0,
                          renderLineHighlight: "none",
                          scrollbar: {
                            vertical: "auto",
                            horizontal: "auto",
                            useShadows: false,
                          },
                          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                          folding: false,
                        }}
                      />
                    </div>
                  )}
                {isExpanded && step.detail && detailRenderMode === "text" && (
                  <Typography.Paragraph
                    style={{
                      marginBottom: 0,
                      marginTop: 2,
                      color: step.status === "error" ? "#ff4d4f" : "#8c8c8c",
                    }}
                  >
                    {step.detail}
                  </Typography.Paragraph>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (embedded) {
    return <div style={{ marginBottom: 8 }}>{body}</div>;
  }

  return (
    <Card size="small" style={{ marginBottom: 8 }} bodyStyle={{ padding: 12 }}>
      {body}
    </Card>
  );
};

export default PlanTodoList;
