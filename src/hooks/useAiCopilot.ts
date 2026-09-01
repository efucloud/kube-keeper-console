import type {
  ChatRequest,
  ChatStopMeta,
  StreamEvent,
} from "@/services/ai_copilot.d";
import { buildAiChatWebSocketUrl } from "@/services/ai_chat.api";
import { getI18nLanguage, getToken } from "@/utils/global";
import { getLocale, useIntl } from "@umijs/max";
import { message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAiCopilotOptions {
  cluster: string;
  namespace?: string;
}

export type CopilotStepStatus =
  | "pending"
  | "running"
  | "success"
  | "error"
  | "halted";

export type CopilotToolStatus = "executing" | "success" | "error";

export interface CopilotMessagePartRecord {
  id: string;
  type: string;
  status?: string;
  format?: string;
  text?: string;
  data?: Record<string, unknown>;
  raw: Record<string, unknown>;
}

export interface CopilotMessageRecord {
  id: string;
  sourceMessageId: string;
  segmentIndex: number;
  role: string;
  status: string;
  parts: CopilotMessagePartRecord[];
  text: string;
}

export interface CopilotCommentaryRecord {
  id: string;
  type: string;
  phase?: string;
  text: string;
}

export interface CopilotToolRecord {
  id: string;
  stepId?: string;
  toolName: string;
  title?: string;
  status: CopilotToolStatus;
  reason?: string;
  summary?: string;
  argumentsText?: string;
  resultText?: string;
  result?: unknown;
  error?: string;
  hasResult?: boolean;
}

export interface CopilotStepRecord {
  id: string;
  title: string;
  status: CopilotStepStatus;
  reason?: string;
  summary?: string;
  toolName?: string;
  result?: unknown;
  error?: string;
}

export type PlanStepState = {
  id?: string;
  title?: string;
  tool?: string;
  reason?: string;
  detail?: string;
  status: "pending" | "executing" | "success" | "error";
};

export type PlanRunState = {
  goal?: string;
  steps: PlanStepState[];
};

export interface CopilotErrorRecord {
  id: string;
  title?: string;
  message: string;
  status?: string;
}

export type CopilotStreamItem =
  | { id: string; kind: "question"; question: string }
  | { id: string; kind: "commentary"; commentaryId: string }
  | { id: string; kind: "message"; messageId: string }
  | { id: string; kind: "step"; stepId: string }
  | { id: string; kind: "tool"; toolId: string }
  | { id: string; kind: "error"; errorId: string };

export interface CopilotRunState {
  requestId: string;
  sessionId?: string;
  runId?: string;
  engine?: string;
  status?: string;
  question: string;
  provider?: string;
  model?: string;
  toolCount?: number;
  usage?: ChatStopMeta;
  error?: string;
  skillId?: string;
  stream: CopilotStreamItem[];
  messages: CopilotMessageRecord[];
  commentary: CopilotCommentaryRecord[];
  steps: CopilotStepRecord[];
  tools: CopilotToolRecord[];
  errors: CopilotErrorRecord[];
}

const resolveRequestLocale = () => {
  let currentLocale = getLocale();
  if (!currentLocale) {
    currentLocale = getI18nLanguage();
  }
  if (!currentLocale && typeof window !== "undefined") {
    currentLocale = localStorage.getItem("umi_locale") || "zh-CN";
  }
  return currentLocale || "zh-CN";
};

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
};

const stringify = (value: unknown): string => {
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

const toToolStatus = (value?: string): CopilotToolStatus => {
  switch (value) {
    case "success":
    case "error":
      return value;
    default:
      return "executing";
  }
};

const toStepStatus = (value?: string): CopilotStepStatus => {
  switch (value) {
    case "success":
    case "error":
    case "halted":
      return value;
    case "executing":
    case "running":
      return "running";
    default:
      return "pending";
  }
};

const streamKey = (kind: CopilotStreamItem["kind"], id: string): string =>
  `${kind}:${id}`;

const buildMessageSegmentId = (sourceMessageId: string, segmentIndex: number) =>
  `${sourceMessageId}::segment:${segmentIndex}`;

const createEmptyRun = (
  requestId: string,
  question: string
): CopilotRunState => ({
  requestId,
  question,
  stream: question.trim()
    ? [
        {
          id: streamKey("question", requestId),
          kind: "question",
          question,
        },
      ]
    : [],
  messages: [],
  commentary: [],
  steps: [],
  tools: [],
  errors: [],
});

const createTransientAssistantMessage = (run: CopilotRunState) => {
  if (run.messages.some((item) => item.id === "__assistant_stream__")) {
    return;
  }
  run.messages.push({
    id: "__assistant_stream__",
    sourceMessageId: "__assistant_stream__",
    segmentIndex: 0,
    role: "assistant",
    status: "streaming",
    parts: [],
    text: "",
  });
  ensureStreamItem(run, {
    id: streamKey("message", "__assistant_stream__"),
    kind: "message",
    messageId: "__assistant_stream__",
  });
};

const getEventPayload = (event: StreamEvent) => asRecord(event.payload) || {};

const getPayloadData = (payload: Record<string, unknown>) =>
  asRecord(payload.data) || {};

const getPayloadMeta = (payload: Record<string, unknown>) =>
  asRecord(payload.meta) || {};

const ensureStreamItem = (run: CopilotRunState, item: CopilotStreamItem) => {
  if (run.stream.some((entry) => entry.id === item.id)) {
    return;
  }
  run.stream.push(item);
};

const upsertStreamItem = (run: CopilotRunState, item: CopilotStreamItem) => {
  const index = run.stream.findIndex((entry) => entry.id === item.id);
  if (index >= 0) {
    run.stream[index] = item;
    return;
  }
  run.stream.push(item);
};

const upsertRecord = <T extends { id: string }>(list: T[], next: T): T => {
  const index = list.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    list[index] = {
      ...list[index],
      ...next,
    };
    return list[index];
  }
  list.push(next);
  return list[list.length - 1];
};

const listMessageSegments = (
  run: CopilotRunState,
  sourceMessageId: string
): CopilotMessageRecord[] =>
  run.messages
    .filter((item) => item.sourceMessageId === sourceMessageId)
    .sort((left, right) => left.segmentIndex - right.segmentIndex);

const getLatestMessageSegment = (
  run: CopilotRunState,
  sourceMessageId: string
): CopilotMessageRecord | undefined => {
  const segments = listMessageSegments(run, sourceMessageId);
  return segments.length > 0 ? segments[segments.length - 1] : undefined;
};

const getOrCreateMessageSegment = (
  run: CopilotRunState,
  sourceMessageId: string,
  segmentIndex: number,
  defaults: Pick<CopilotMessageRecord, "role" | "status">
) => {
  const segmentId = buildMessageSegmentId(sourceMessageId, segmentIndex);
  const existing = run.messages.find((item) => item.id === segmentId);
  if (existing) {
    existing.role = defaults.role || existing.role;
    existing.status = defaults.status || existing.status;
    return existing;
  }
  const created: CopilotMessageRecord = {
    id: segmentId,
    sourceMessageId,
    segmentIndex,
    role: defaults.role,
    status: defaults.status,
    parts: [],
    text: "",
  };
  run.messages.push(created);
  return created;
};

const sealTrailingMessageSegment = (run: CopilotRunState) => {
  const lastStreamItem = run.stream[run.stream.length - 1];
  if (!lastStreamItem || lastStreamItem.kind !== "message") {
    return;
  }
  const messageRecord = run.messages.find(
    (item) => item.id === lastStreamItem.messageId
  );
  if (!messageRecord || messageRecord.status !== "streaming") {
    return;
  }
  messageRecord.status = "done";
};

const syncMessageText = (message: CopilotMessageRecord) => {
  message.text = message.parts
    .filter((part) => part.type === "output_text")
    .map((part) => part.text || "")
    .join("");
};

const syncTransientAssistantMessage = (run: CopilotRunState) => {
  const transient = run.messages.find(
    (item) => item.id === "__assistant_stream__"
  );
  if (!transient) {
    return;
  }
  const finalMessage = run.messages.find(
    (item) =>
      item.id !== "__assistant_stream__" &&
      item.role !== "user" &&
      item.sourceMessageId !== "__assistant_stream__"
  );
  if (finalMessage) {
    transient.status = finalMessage.status;
    transient.parts = finalMessage.parts.map((part) => ({
      ...part,
      raw: { ...part.raw },
    }));
    transient.text = finalMessage.text;
    return;
  }

  const text = run.commentary
    .map((item) => item.text.trim())
    .filter(Boolean)
    .join("\n");
  transient.parts = text
    ? [
        {
          id: "__assistant_stream___output",
          type: "output_text",
          status: run.status === "done" ? "done" : "streaming",
          format: "markdown",
          text,
          data: undefined,
          raw: {
            id: "__assistant_stream___output",
            type: "output_text",
            status: run.status === "done" ? "done" : "streaming",
            format: "markdown",
            text,
          },
        },
      ]
    : [];
  transient.text = text;
};

const normalizeMessagePart = (
  part: Record<string, unknown>
): CopilotMessagePartRecord => ({
  id:
    asString(part.id) ||
    `${asString(part.type) || "part"}-${Math.random().toString(36).slice(2)}`,
  type: asString(part.type) || "output_text",
  status: asString(part.status),
  format: asString(part.format),
  text: typeof part.text === "string" ? part.text : undefined,
  data: asRecord(part.data),
  raw: part,
});

const applyMessageParts = (
  message: CopilotMessageRecord,
  parts: Record<string, unknown>[],
  operation: string
) => {
  if (operation === "replace" || operation === "create") {
    const nextParts = parts.map(normalizeMessagePart);
    if (
      operation === "replace" &&
      nextParts.length === 1 &&
      nextParts[0]?.type === "output_text" &&
      (nextParts[0]?.text || "") === "" &&
      message.parts.some(
        (part) => part.type === "output_text" && (part.text || "").length > 0
      )
    ) {
      syncMessageText(message);
      return;
    }
    message.parts = nextParts;
    syncMessageText(message);
    return;
  }

  for (const rawPart of parts) {
    const nextPart = normalizeMessagePart(rawPart);
    const index = message.parts.findIndex((part) => part.id === nextPart.id);
    if (index >= 0) {
      const previous = message.parts[index];
      message.parts[index] = {
        ...previous,
        ...nextPart,
        text:
          nextPart.type === "output_text"
            ? `${previous.text || ""}${nextPart.text || ""}`
            : nextPart.text ?? previous.text,
      };
      continue;
    }
    message.parts.push(nextPart);
  }
  syncMessageText(message);
};

const extractOutputTextFromParts = (parts: Record<string, unknown>[]) =>
  parts
    .map(normalizeMessagePart)
    .filter((part) => part.type === "output_text")
    .map((part) => part.text || "")
    .join("");

const applyEventToRun = (
  source: CopilotRunState,
  event: StreamEvent
): CopilotRunState => {
  const run: CopilotRunState = {
    ...source,
    stream: [...source.stream],
    messages: source.messages.map((item) => ({
      ...item,
      parts: item.parts.map((part) => ({ ...part, raw: { ...part.raw } })),
    })),
    commentary: source.commentary.map((item) => ({ ...item })),
    steps: source.steps.map((item) => ({ ...item })),
    tools: source.tools.map((item) => ({ ...item })),
    errors: source.errors.map((item) => ({ ...item })),
  };
  const payload = getEventPayload(event);
  const data = getPayloadData(payload);
  const meta = getPayloadMeta(payload);

  if (event.sessionId) {
    run.sessionId = event.sessionId;
  }
  if (asString(payload.sessionId)) {
    run.sessionId = asString(payload.sessionId);
  }
  if (asString(payload.runId)) {
    run.runId = asString(payload.runId);
  }

  switch (event.type) {
    case "session_meta":
      run.sessionId =
        asString(payload.sessionId) || asString(payload.id) || run.sessionId;
      break;
    case "event_msg": {
      const eventKind = asString(payload.type);
      if (eventKind === "task_started") {
        run.status = asString(payload.status) || "running";
        run.runId = asString(payload.runId) || run.runId;
        run.engine = asString(payload.engine) || run.engine;
      }
      if (eventKind === "task_status") {
        run.status = asString(payload.status) || run.status;
        run.engine = asString(data.engine) || run.engine;
        run.provider = asString(data.provider) || run.provider;
        run.model = asString(data.model) || run.model;
        run.skillId = asString(data.skillId) || run.skillId;
        if (typeof data.toolCount === "number") {
          run.toolCount = data.toolCount;
        }
      }
      if (
        eventKind === "agent_message" ||
        eventKind === "warning" ||
        eventKind === "next_step"
      ) {
        const commentaryId =
          asString(payload.id) ||
          `${eventKind || "commentary"}-${run.commentary.length + 1}`;
        const text = asString(payload.message);
        if (text) {
          sealTrailingMessageSegment(run);
          createTransientAssistantMessage(run);
          upsertRecord(run.commentary, {
            id: commentaryId,
            type: eventKind || "agent_message",
            phase: asString(payload.phase),
            text,
          });
          ensureStreamItem(run, {
            id: streamKey("commentary", commentaryId),
            kind: "commentary",
            commentaryId,
          });
          syncTransientAssistantMessage(run);
        }
      }
      break;
    }
    case "response_item": {
      const itemType = asString(payload.type);
      switch (itemType) {
        case "message": {
          const sourceMessageId =
            asString(payload.id) || `assistant-${run.messages.length + 1}`;
          const operation = asString(meta.operation) || "append";
          const content = Array.isArray(payload.content)
            ? (payload.content
                .map((part) => asRecord(part))
                .filter(Boolean) as Record<string, unknown>[])
            : [];
          const messageDefaults = {
            role: asString(payload.role) || "assistant",
            status: asString(payload.status) || "streaming",
          };

          let messageRecord: CopilotMessageRecord;
          if (operation === "create") {
            messageRecord = getOrCreateMessageSegment(
              run,
              sourceMessageId,
              0,
              messageDefaults
            );
            applyMessageParts(messageRecord, content, operation);
          } else if (operation === "append") {
            const latestSegment = getLatestMessageSegment(run, sourceMessageId);
            const lastStreamItem = run.stream[run.stream.length - 1];
            const shouldStartNewSegment =
              latestSegment &&
              (!lastStreamItem ||
                lastStreamItem.kind !== "message" ||
                lastStreamItem.messageId !== latestSegment.id);
            const segmentIndex = shouldStartNewSegment
              ? latestSegment.segmentIndex + 1
              : latestSegment?.segmentIndex || 0;
            messageRecord = getOrCreateMessageSegment(
              run,
              sourceMessageId,
              segmentIndex,
              messageDefaults
            );
            applyMessageParts(messageRecord, content, "append");
          } else {
            const segments = listMessageSegments(run, sourceMessageId);
            const finalText = extractOutputTextFromParts(content);
            const existingText = segments.map((segment) => segment.text).join("");
            if (segments.length === 0) {
              messageRecord = getOrCreateMessageSegment(
                run,
                sourceMessageId,
                0,
                messageDefaults
              );
              applyMessageParts(messageRecord, content, operation);
            } else {
              segments.forEach((segment) => {
                segment.status = "done";
              });
              messageRecord = segments[segments.length - 1];
              if (
                finalText &&
                existingText &&
                finalText !== existingText &&
                finalText.startsWith(existingText)
              ) {
                applyMessageParts(
                  messageRecord,
                  [
                    {
                      type: "output_text",
                      id:
                        asString(content[0]?.id) ||
                        `${messageRecord.id}::tail`,
                      format: "markdown",
                      text: finalText.slice(existingText.length),
                      status: "done",
                    },
                  ],
                  "append"
                );
              } else if (!existingText && finalText) {
                applyMessageParts(messageRecord, content, "replace");
              }
            }
          }

          messageRecord.role = asString(payload.role) || messageRecord.role;
          messageRecord.status =
            asString(payload.status) || messageRecord.status;
          upsertStreamItem(run, {
            id: streamKey("message", messageRecord.id),
            kind: "message",
            messageId: messageRecord.id,
          });
          if (messageRecord.status === "done" && run.status !== "error") {
            run.status = "done";
          }
          syncTransientAssistantMessage(run);
          break;
        }
        case "step": {
          sealTrailingMessageSegment(run);
          const stepId = asString(payload.id) || `step-${run.steps.length + 1}`;
          upsertRecord(run.steps, {
            id: stepId,
            title: asString(payload.title) || stepId,
            status: toStepStatus(asString(payload.status)),
            reason: asString(data.reason),
            summary: asString(data.summary) || asString(payload.summary),
            toolName: asString(data.toolName),
            result: data.result,
            error: asString(data.error),
          });
          ensureStreamItem(run, {
            id: streamKey("step", stepId),
            kind: "step",
            stepId,
          });
          break;
        }
        case "tool_call":
        case "tool_result": {
          sealTrailingMessageSegment(run);
          const toolId =
            asString(payload.id) ||
            asString(data.callId) ||
            asString(data.eventId) ||
            `tool-${run.tools.length + 1}`;
          upsertRecord(run.tools, {
            id: toolId,
            stepId: asString(data.stepId),
            toolName: asString(data.toolName) || toolId,
            title: asString(payload.title),
            status: toToolStatus(
              asString(payload.status) || asString(data.status)
            ),
            reason: asString(data.reason),
            summary: asString(payload.summary) || asString(data.summary),
            argumentsText:
              typeof data.arguments === "string"
                ? data.arguments
                : stringify(data.arguments),
            resultText:
              typeof data.result === "string"
                ? data.result
                : stringify(data.result),
            result: data.result,
            error: asString(data.error),
            hasResult: itemType === "tool_result",
          });
          if (
            !run.stream.some(
              (entry) => entry.kind === "tool" && entry.toolId === toolId
            )
          ) {
            ensureStreamItem(run, {
              id: streamKey("tool", toolId),
              kind: "tool",
              toolId,
            });
          }
          break;
        }
        case "error": {
          sealTrailingMessageSegment(run);
          const errorId =
            asString(payload.id) || `error-${run.errors.length + 1}`;
          const errorMessage =
            asString(data.message) ||
            asString(data.error) ||
            asString(payload.title);
          if (errorMessage) {
            upsertRecord(run.errors, {
              id: errorId,
              title: asString(payload.title),
              message: errorMessage,
              status: asString(payload.status),
            });
            ensureStreamItem(run, {
              id: streamKey("error", errorId),
              kind: "error",
              errorId,
            });
            run.status = "error";
            run.error = errorMessage;
          }
          break;
        }
        default:
          break;
      }
      break;
    }
    case "run_complete":
      run.status = asString(payload.status) || "done";
      if (!run.usage) {
        const usageData = getPayloadData(payload);
        if (Object.keys(usageData).length > 0) {
          run.usage = {
            requestId: event.requestId,
            ...(usageData as ChatStopMeta),
          };
        }
      }
      if (asString(payload.status) === "error") {
        run.error = asString(data.error) || run.error;
      }
      break;
    default:
      break;
  }

  syncTransientAssistantMessage(run);

  return run;
};

export function useAiCopilot(options: UseAiCopilotOptions) {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [runs, setRuns] = useState<Record<string, CopilotRunState>>({});
  const webSocketRef = useRef<WebSocket | null>(null);
  const intentionallyClosedSocketsRef = useRef(new WeakSet<WebSocket>());
  const isMountedRef = useRef(true);
  const { cluster, namespace } = options;
  const orgToken = getToken();

  const sendMessage = useCallback(
    (request: ChatRequest) => {
      if (webSocketRef.current) {
        intentionallyClosedSocketsRef.current.add(webSocketRef.current);
        webSocketRef.current.close(1000, "replaced by a new request");
      }
      setLoading(true);
      setErrors([]);

      const requestId = request.requestId || `req_${Date.now()}`;
      const question = request.message || "";
      setRuns((prev) => ({
        ...prev,
        [requestId]: createEmptyRun(requestId, question),
      }));

      const socket = new WebSocket(
        buildAiChatWebSocketUrl({
          cluster,
          namespace,
          accessToken: orgToken?.access_token || "",
          locale: resolveRequestLocale(),
        })
      );
      webSocketRef.current = socket;
      let finished = false;

      const reportTransportError = (errorText: string) => {
        if (
          finished ||
          !isMountedRef.current ||
          webSocketRef.current !== socket
        ) {
          return;
        }
        finished = true;
        setLoading(false);
        setErrors((prev) => [...prev, errorText]);
        message.error(
          `${intl.formatMessage({ id: "copilot.stream.error" })}: ${errorText}`
        );
      };

      const timeoutId = window.setTimeout(() => {
        if (finished || webSocketRef.current !== socket) {
          return;
        }
        reportTransportError("Request timeout");
        socket.close(4000, "request timeout");
      }, 180000);

      socket.onopen = () => {
        if (webSocketRef.current !== socket) {
          return;
        }
        socket.send(JSON.stringify(request));
      };

      socket.onmessage = (messageEvent) => {
        if (
          finished ||
          !isMountedRef.current ||
          webSocketRef.current !== socket
        ) {
          return;
        }

        let rawEvent: StreamEvent;
        try {
          rawEvent = JSON.parse(String(messageEvent.data)) as StreamEvent;
        } catch (error) {
          console.error("Invalid AI Copilot WebSocket event:", error);
          reportTransportError("Invalid response from server");
          socket.close(4002, "invalid server response");
          return;
        }

        const eventRequestId = rawEvent.requestId || requestId;
        let nextRun: CopilotRunState | undefined;
        setRuns((prev) => {
          const current =
            prev[eventRequestId] || createEmptyRun(eventRequestId, question);
          const next = applyEventToRun(current, rawEvent);
          nextRun = next;
          return {
            ...prev,
            [eventRequestId]: next,
          };
        });

        if (nextRun?.sessionId) {
          setSessionId((current) =>
            current === nextRun?.sessionId ? current : nextRun?.sessionId
          );
        }
        if (
          rawEvent.type === "run_complete" &&
          asString(getEventPayload(rawEvent).status) === "error"
        ) {
          const errorText =
            asString(getPayloadData(getEventPayload(rawEvent)).error) ||
            nextRun?.error ||
            "Unknown error";
          setErrors((old) => [...old, errorText]);
        }
        if (rawEvent.type === "run_complete") {
          finished = true;
          setLoading(false);
          window.clearTimeout(timeoutId);
        }
      };

      socket.onerror = (error) => {
        console.error("AI Copilot WebSocket error:", error);
      };

      socket.onclose = (closeEvent) => {
        window.clearTimeout(timeoutId);
        if (
          !intentionallyClosedSocketsRef.current.has(socket) &&
          !finished
        ) {
          reportTransportError(
            closeEvent.reason ||
              "WebSocket connection closed before completion"
          );
        }
        if (webSocketRef.current === socket) {
          webSocketRef.current = null;
        }
      };
    },
    [cluster, intl, namespace, orgToken?.access_token]
  );

  const cancelRequest = useCallback(() => {
    if (webSocketRef.current) {
      intentionallyClosedSocketsRef.current.add(webSocketRef.current);
      webSocketRef.current.close(1000, "request cancelled");
      webSocketRef.current = null;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (webSocketRef.current) {
        intentionallyClosedSocketsRef.current.add(webSocketRef.current);
        webSocketRef.current.close(1000, "component unmounted");
        webSocketRef.current = null;
      }
    };
  }, []);

  const orderedRuns = Object.values(runs);

  return {
    loading,
    errors,
    sessionId,
    sendMessage,
    cancelRequest,
    runs,
    runList: orderedRuns,
  };
}
