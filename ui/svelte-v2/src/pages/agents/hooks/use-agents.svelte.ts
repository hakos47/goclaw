import { useHttp, useWs } from "../../../lib/state/ws.svelte";
import type { AgentData } from "../../../lib/types/agent";

interface AgentInfoWs {
  id: string;
  name?: string;
  model: string;
  isRunning: boolean;
}

export const agentsState = $state({
  agents: [] as AgentData[],
  loading: false,
  error: null as string | null
});

export async function loadAgents() {
  agentsState.loading = true;
  agentsState.error = null;
  
  const http = useHttp();
  const { ws } = useWs();
  
  try {
    const res = await http.get<{ agents: AgentData[] }>("/v1/agents");
    if (res.agents && res.agents.length > 0) {
      agentsState.agents = res.agents;
      agentsState.loading = false;
      return;
    }
  } catch (e) {
    // Fallthrough to WS
  }

  if (!ws.connected) {
      agentsState.agents = [];
      agentsState.loading = false;
      return;
  }
  
  try {
      const res = await ws.call<{ agents: AgentInfoWs[] }>("agents.list");
      agentsState.agents = (res.agents ?? []).map((a): AgentData => ({
        id: a.id,
        agent_key: a.id,
        display_name: a.name,
        owner_id: "",
        provider: "",
        model: a.model,
        context_window: 0,
        max_tool_iterations: 0,
        workspace: "",
        restrict_to_workspace: false,
        agent_type: (a as any).agentType === "predefined" ? "predefined" : "open",
        is_default: false,
        status: a.isRunning ? "active" : "inactive",
      }));
  } catch (e: any) {
      agentsState.error = e.message || "Failed to load agents";
  } finally {
      agentsState.loading = false;
  }
}

export async function createAgent(data: Partial<AgentData>) {
  const http = useHttp();
  const res = await http.post<AgentData>("/v1/agents", data);
  await loadAgents();
  return res;
}

export async function deleteAgent(id: string) {
  const http = useHttp();
  await http.delete(`/v1/agents/${id}`);
  await loadAgents();
}

export async function resummonAgent(id: string) {
  const http = useHttp();
  await http.post(`/v1/agents/${id}/resummon`);
}

export async function cancelSummonAgent(id: string) {
  const http = useHttp();
  await http.post(`/v1/agents/${id}/cancel-summon`);
}
