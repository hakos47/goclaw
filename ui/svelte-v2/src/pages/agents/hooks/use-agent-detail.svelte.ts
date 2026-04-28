import { useHttp, useWs } from "../../../lib/state/ws.svelte";
import type { AgentData, BootstrapFile } from "../../../../lib/types/agent";

export function useAgentDetail(agentId: string) {
    let agent = $state<AgentData | null>(null);
    let files = $state<BootstrapFile[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    const http = useHttp();
    const ws = useWs();

    async function fetchDetails() {
        loading = true;
        try {
        const agentRes = await http.get<AgentData>(`/v1/agents/${agentId}`);
        agent = agentRes;
        
        try {
            // Use WS as in React to avoid access control limits on standard endpoints for files
            const filesRes = await ws.call<{ files: BootstrapFile[] }>("agents.files.list", { agentId: agentRes.agent_key });
            files = filesRes.files ?? [];
        } catch (e: any) {
            console.error("Failed to load files via WS", e);
        }
        } catch (e: any) {
            error = e.message || "Failed to load agent details";
        } finally {
            loading = false;
        }
    }

    async function updateAgent(data: Partial<AgentData>) {
        if (!agent) return;
        const res = await http.put<AgentData>(`/v1/agents/${agentId}`, data);
        agent = { ...agent, ...res };
    }

    async function getFile(name: string): Promise<BootstrapFile | null> {
        if (!agent) return null;
        try {
            const res = await ws.call<{ file: BootstrapFile }>("agents.files.get", { agentId: agent.agent_key, name });
            return res.file;
        } catch {
            return null;
        }
    }

    async function setFile(name: string, content: string): Promise<void> {
        if (!agent) return;
        await ws.call("agents.files.set", { agentId: agent.agent_key, name, content });
        // Refresh the file tree
        try {
            const filesRes = await ws.call<{ files: BootstrapFile[] }>("agents.files.list", { agentId: agent.agent_key });
            files = filesRes.files ?? [];
        } catch (e) {
            // Ignore
        }
    }

    $effect(() => {
        if (agentId) {
            fetchDetails();
        }
    });

    return {
        get agent() { return agent; },
        get files() { return files; },
        get loading() { return loading; },
        get error() { return error; },
        updateAgent,
        getFile,
        setFile,
        refresh: fetchDetails
    };
}
