// AiChatUsage Represents the total token usage per request to OpenAI.
export type AiChatUsage = { 
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_tokens_details?: PromptTokensDetails;
  completion_tokens_details?: CompletionTokensDetails;
} ; 
// ChatContext 运行时上下文
export type ChatContext = { 
  cluster?: string;
  namespace?: string;
  apiServer?: string;
  language?: string;
} ; 
// ChatHTTPPayload HTTP 入参
export type ChatHTTPPayload = { 
  mode?: string;
  message?: string;
  requestId?: string;
  sessionId?: string;
  skillId?: string;
  kind?: string;
  name?: string;
  apiVersion?: string;
} ; 
// ChatRequest 对话请求
export type ChatRequest = { 
  mode?: string;
  cluster?: string;
  namespace?: string;
  message?: string;
  requestId?: string;
  sessionId?: string;
  skillId?: string;
  kind?: string;
  name?: string;
  apiVersion?: string;
} ; 
// ChatStopMeta chat响应
export type ChatStopMeta = { 
  requestId?: string;
  finish_reason?: string;
  usage?: AiChatUsage;
  mode?: string;
  auto_executed: boolean;
  executed_steps?: number;
  failed_steps?: number;
} ; 
// CompletionTokensDetails Breakdown of tokens used in a completion.
export type CompletionTokensDetails = { 
  audio_tokens?: number;
  reasoning_tokens?: number;
  accepted_prediction_tokens?: number;
  rejected_prediction_tokens?: number;
} ; 
// PromptTokensDetails Breakdown of tokens used in the prompt.
export type PromptTokensDetails = { 
  audio_tokens?: number;
  cached_tokens?: number;
} ; 
// ResourceContext 资源上下文
export type ResourceContext = { 
  kind?: string;
  name?: string;
  apiVersion?: string;
} ; 
// StreamEvent 定义向前端发送的 NDJSON envelope 结构。
export type StreamEvent = { 
  requestId?: string;
  sessionId?: string;
  type?: string;
  payload?: any;//todo 可能需要手动完善结构;
  version?: string;
  timestamp?: string;
} ; 
// ToolChain 工具调用链
export type ToolChain = { 
  title?: string;
  status?: string;
  description?: string;
  requestId?: string;
} ; 
