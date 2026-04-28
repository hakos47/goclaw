import { useHttp } from "../../../lib/state/ws.svelte";
import type { EvolutionSuggestion } from "../../../../lib/types/evolution";

export function useEvolutionSuggestions(agentId: string, status?: () => string | undefined) {
  const http = useHttp();
  
  let suggestions = $state<EvolutionSuggestion[]>([]);
  let loading = $state(true);

  async function load() {
    if (!agentId) return;
    loading = true;
    
    let params: Record<string, string> = { limit: "100" };
    const currentStatus = status ? status() : undefined;
    if (currentStatus) {
      params.status = currentStatus;
    }

    try {
      suggestions = await http.get<EvolutionSuggestion[]>(`/v1/agents/${agentId}/evolution/suggestions`, params);
    } catch (e) {
      console.error("Failed to load evolution suggestions", e);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    // Re-run if agentId or status changes
    if (agentId) {
      const _ = status ? status() : undefined;
      load();
    }
  });

  async function updateStatus(suggestionId: string, newStatus: "approved" | "rejected" | "rolled_back") {
    try {
      await http.patch(`/v1/agents/${agentId}/evolution/suggestions/${suggestionId}`, { status: newStatus });
      await load();
      // alert(`Suggestion ${newStatus}`);
    } catch (e) {
      console.error("Failed to update suggestion", e);
      // alert("Failed to update suggestion");
    }
  }

  return {
    get suggestions() { return suggestions; },
    get loading() { return loading; },
    updateStatus,
    refresh: load
  };
}
