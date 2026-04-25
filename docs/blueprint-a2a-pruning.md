# NIX-0 Strategic Blueprint: High-Efficiency Backend Architecture

## 1. Agent-to-Agent (A2A) Orchestration Redesign

### Current State Analysis
- **Centralized Bottleneck**: `internal/bus/bus.go` utilizes generic Go channels (`inbound` / `outbound`) for all messaging, including A2A.
- **Overhead**: Agents communicate by passing `InboundMessage` structs containing potentially large strings and metadata through the main event loop, causing unnecessary memory allocation and serialization delays.
- **Trace & Run Coupling**: `internal/agent/loop_run.go` shows heavy coupling with traces and run context, but A2A negotiations shouldn't need a full standard pipeline run if they are just sharing internal state.

### Proposed Architecture (Direct Memory Channels)
1. **Shared Memory Context (Zero-Copy A2A)**:
   - Introduce a `*SharedAgentContext` struct passed between sub-agents during delegation (`internal/agent/types.go`).
   - Instead of routing messages back to the bus, agents negotiating in a team pass pointers to the shared context, completely eliminating memory allocation overhead.
2. **Dedicated P2P Event Bus**:
   - Create `internal/bus/agent_bus.go`.
   - Implement lock-free circular buffers (e.g., ring buffer) for high-frequency A2A signaling (e.g., consensus, voting).
3. **Delegation Short-circuit**:
   - In `loop_run.go`, if `RunKind` is `AgentToAgent`, bypass standard gateway tracing and persistence layers unless explicitly flagged for audit.

## 2. Predictive Context Pruning (Green AI)

### Current State Analysis
- **Static Pruning**: `internal/agent/pruning.go` relies on a two-pass threshold system (Soft Trim and Hard Clear) based on token counts and hardcoded ratios (`defaultSoftTrimRatio = 0.3`).
- **Blind Truncation**: Truncates the "middle" of tool results blindly, only checking for important content in the tail via a regex (`hasImportantTail`).

### Proposed Architecture (Predictive Relevance Pruning)
1. **Semantic Relevance Scoring**:
   - Introduce an embedding-based or lightweight heuristic scorer in `internal/agent/loop_compact.go`.
   - Before evaluating thresholds, score each `tool` result against the current user intent. If relevance is low (< 0.2), discard entirely instead of Soft Trimming.
2. **Intent-Driven Pruning**:
   - Integrate with `intent_classify.go`. If the user shifts topic (e.g., from "analyze database" to "write a poem"), immediately trigger a "Hard Clear" on all previous technical tool results, bypassing the `keepLastAssistants` protection limit.
3. **Adaptive Summarization**:
   - Instead of replacing with `[Old tool result content cleared]`, use a sub-agent to generate a 10-token semantic summary of what was dropped, keeping the LLM contextually aware without the token cost.

## Next Steps & Worker Delegation
- **A2A Networking**: Needs a Go-expert Worker to implement lock-free ring buffers in `internal/bus`.
- **Predictive Pruner**: Needs an AI/Backend Worker to implement the relevance scorer in `internal/agent/pruning.go`.
