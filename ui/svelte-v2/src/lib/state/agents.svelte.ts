import { useWs, useHttp } from "./ws.svelte";
import type { Agent } from "../types/agent";

export const agentsState = $state({
    agents: [] as Agent[],
    loading: false,
    error: null as string | null
});

export function resolveAgent(id: string | undefined): string {
    if (!id) return "System";
    const agent = agentsState.agents.find(a => a.id === id || a.agent_key === id);
    return agent ? (agent.name || agent.id.split('-')[0]) : id.slice(0, 8);
}

export async function loadAgents() {
    agentsState.loading = true;
    try {
        const http = useHttp();
        try {
            console.log("[Agents] Trying HTTP GET /v1/agents");
            const res = await http.get<{ agents: Agent[] }>("/v1/agents");
            console.log("[Agents] HTTP response:", res);
            if (res.agents && res.agents.length > 0) {
                agentsState.agents = res.agents;
                console.log("[Agents] Loaded via HTTP:", agentsState.agents.length);
                return;
            }
        } catch (err) {
            console.warn("[Agents] Failed to load agents via HTTP, falling back to WS", err);
        }

        const ws = useWs();
        console.log("[Agents] Trying WS. Connected:", ws.isConnected);
        if (!ws.isConnected) {
            console.warn("[Agents] WS not connected, returning empty array");
            agentsState.agents = [];
            return;
        }

        const res = await ws.call<{ agents: any[] }>("agents.list", {});
        console.log("[Agents] WS response:", res);
        agentsState.agents = (res.agents || []).map((a): Agent => ({
            id: a.id,
            agent_key: a.id,
            owner_id: "",
            provider: "",
            model: a.model,
            context_window: 0,
            max_tool_iterations: 0,
            workspace: "",
            restrict_to_workspace: false,
            agent_type: a.agentType === "predefined" ? "predefined" : "open",
            is_default: false,
            status: a.isRunning ? "active" : "inactive"
        }));
        console.log("[Agents] Loaded via WS:", agentsState.agents.length);
    } catch (e: any) {
        console.error("Failed to load agents", e);
        agentsState.error = e.message;
    } finally {
        agentsState.loading = false;
    }
}
