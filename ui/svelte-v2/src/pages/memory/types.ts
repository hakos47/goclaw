export interface MemoryDocument {
  id: string;
  agent_id: string;
  user_id: string;
  path: string;
  token_count: number;
  chunk_count: number;
  status: "pending" | "indexing" | "completed" | "error";
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryChunk {
  id: string;
  document_id: string;
  index: number;
  text: string;
  token_count: number;
}

export interface MemoryDocumentDetail extends MemoryDocument {
  content: string;
  chunks: MemoryChunk[];
}

export interface MemorySearchResult {
  chunk_id: string;
  document_id: string;
  document_path: string;
  text: string;
  score: number;
}

export interface EpisodicSummary {
  id: string;
  agent_id: string;
  session_id: string;
  source_type: "session" | "v2_daily" | "manual";
  l0_abstract: string;
  summary: string;
  key_topics: string[];
  turn_count: number;
  token_count: number;
  created_at: string;
}

export interface EpisodicSearchResult {
  episodic_id: string;
  session_key: string;
  l0_abstract: string;
  score: number;
  created_at: string;
}
