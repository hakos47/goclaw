export interface ToolAggregate {
  tool_name: string;
  call_count: number;
  success_rate: number;
  avg_duration_ms: number;
}

export interface RetrievalAggregate {
  source: string;
  query_count: number;
  usage_rate: number;
  avg_score: number;
}

export interface EvolutionSuggestion {
  id: string;
  agent_id: string;
  suggestion_type: "threshold" | "tool_order" | "skill_add";
  suggestion: string;
  rationale: string;
  parameters: Record<string, unknown> | null;
  status: "pending" | "approved" | "rejected" | "applied" | "rolled_back";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface AggregatedMetrics {
  tool_aggregates: ToolAggregate[];
  retrieval_aggregates: RetrievalAggregate[];
}

export interface AdaptationGuardrails {
  max_delta_per_cycle: number;
  min_data_points: number;
  rollback_on_drop_pct: number;
  locked_params: string[];
}
