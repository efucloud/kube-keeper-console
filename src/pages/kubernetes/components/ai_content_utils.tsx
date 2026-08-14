import type { ChatStopMeta, StreamEvent } from "@/services/ai_copilot.d";
import { Space, Tag } from "antd";

export interface AiIntlLike {
  formatMessage: (...args: any[]) => string;
}

export const createFallbackIntl = (): AiIntlLike => ({
  formatMessage: ({ defaultMessage }: any) => defaultMessage || "",
});

export const formatIntlMessage = (
  intl: AiIntlLike | undefined,
  descriptor: { id: string; defaultMessage: string },
  values?: Record<string, unknown>
) => (intl || createFallbackIntl()).formatMessage(descriptor, values);

export const stringify = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const normalizeText = (value: string) =>
  value.replace(/\s+/g, " ").trim();

export const getEventRecord = (
  value: unknown
): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
};

export const getEventString = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
};

export const getEventPayload = (event: StreamEvent) =>
  getEventRecord(event.payload) || {};

export const getPayloadMeta = (payload: Record<string, unknown>) =>
  getEventRecord(payload.meta) || {};

export const getPayloadData = (payload: Record<string, unknown>) =>
  getEventRecord(payload.data) || {};

export const tryParseStructured = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return undefined;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
};

const isPrimitiveValue = (value: unknown) =>
  ["string", "number", "boolean"].includes(typeof value) || value === null;

const extractStructuredPreview = (
  value: unknown,
  intl?: AiIntlLike
): string | undefined => {
  const parsed = tryParseStructured(value);
  if (!parsed || typeof parsed !== "object") {
    return undefined;
  }
  if (Array.isArray(parsed)) {
    return formatIntlMessage(
      intl,
      {
        id: "copilot.trace.items",
        defaultMessage: "{count} item(s)",
      },
      { count: parsed.length }
    );
  }
  const record = parsed as Record<string, unknown>;
  for (const key of ["summary", "message", "reason", "description"]) {
    if (typeof record[key] === "string" && record[key]?.trim()) {
      return normalizeText(String(record[key]));
    }
  }
  const output = record.output;
  if (isPrimitiveValue(output) && String(output ?? "").trim()) {
    return normalizeText(String(output));
  }
  if (Array.isArray(output)) {
    return formatIntlMessage(
      intl,
      {
        id: "copilot.trace.items",
        defaultMessage: "{count} item(s)",
      },
      { count: output.length }
    );
  }
  if (output && typeof output === "object") {
    const nested = output as Record<string, unknown>;
    for (const key of ["message", "summary", "result"]) {
      if (typeof nested[key] === "string" && nested[key]?.trim()) {
        return normalizeText(String(nested[key]));
      }
    }
  }
  return undefined;
};

export const isRawStructuredPayload = (value?: string) => {
  if (!value) {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return (
    trimmed.startsWith("{") ||
    trimmed.startsWith("[") ||
    Boolean(tryParseStructured(trimmed))
  );
};

export const summarizeNarrative = (
  value: unknown,
  intl: AiIntlLike,
  max = 180
) => {
  const text = stringify(value).trim();
  if (!text) {
    return "";
  }
  const preview = extractStructuredPreview(value, intl);
  if (preview) {
    return preview.length <= max ? preview : `${preview.slice(0, max)}...`;
  }
  if (isRawStructuredPayload(text)) {
    return intl.formatMessage({ id: "copilot.trace.structured" });
  }
  const normalized = normalizeText(text);
  return normalized.length <= max
    ? normalized
    : `${normalized.slice(0, max)}...`;
};

export const sanitizeStructuredPayload = (value: unknown): unknown => {
  const parsed = tryParseStructured(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return value;
  }
  const record = { ...(parsed as Record<string, unknown>) };
  delete record.schema;
  if (
    record.output &&
    typeof record.output === "object" &&
    !Array.isArray(record.output)
  ) {
    const output = { ...(record.output as Record<string, unknown>) };
    delete output.schema;
    record.output = output;
  }
  return Object.keys(record).length > 0 ? record : undefined;
};

export const formatDisplayPayload = (value: unknown) => {
  const sanitized = sanitizeStructuredPayload(value);
  if (sanitized === undefined || sanitized === null) {
    return "";
  }
  if (typeof value === "string" && typeof sanitized === "string") {
    return sanitized.trim();
  }
  return stringify(sanitized).trim();
};

export const summarizeValue = (value: unknown, max = 160) => {
  const text = stringify(value).trim();
  if (!text) {
    return "";
  }
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}...`;
};

export const renderUsageFooter = (intl: AiIntlLike, usage?: ChatStopMeta) => {
  if (!usage?.usage) {
    return null;
  }
  return (
    <Space size="middle" style={{ flexWrap: "wrap" }}>
      <Tag color="blue">
        {intl.formatMessage({ id: "copilot.chat.token.cost.prompt" })}:{" "}
        {usage.usage.prompt_tokens}
      </Tag>
      <Tag color="geekblue">
        {intl.formatMessage({ id: "copilot.chat.token.cost.completion" })}:{" "}
        {usage.usage.completion_tokens}
      </Tag>
      <Tag color="purple">
        {intl.formatMessage({ id: "copilot.chat.token.cost.total" })}:{" "}
        {usage.usage.total_tokens}
      </Tag>
    </Space>
  );
};
