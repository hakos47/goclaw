/** Session data types matching Go internal/store/session_store.go */

export interface SessionInfo {
  key: string;
  messageCount: number;
  created: string;
  updated: string;
  label?: string;
  sourceChannelID?: string;
  channelType?: string;
  category?: string; // "inbound", "support", "personal", "system", "evolution"
  model?: string;
  provider?: string;
  channel?: string;
  inputTokens?: number;
  outputTokens?: number;
  userID?: string;
  metadata?: Record<string, string>;
  agentName?: string;
  estimatedTokens?: number;
  contextWindow?: number;
  compactionCount?: number;
}

/** Message format from Go providers.Message */
export interface Message {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  thinking?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  is_error?: boolean;
  media_refs?: { id: string; mime_type: string; kind: string; path?: string }[];
  created_at?: string; 
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}
