import { useWs } from "./ws.svelte";
import type { AgentLinkData, CreateLinkParams, UpdateLinkParams } from "../types/team";

export const linksState = $state({
    links: [] as AgentLinkData[],
    loading: false,
    error: null as string | null
});

export async function loadLinks(agentId?: string, direction: string = "all") {
    linksState.loading = true;
    try {
        const ws = useWs();
        const res = await ws.call<{ links: AgentLinkData[] }>("agents.links.list", { agentId, direction });
        linksState.links = res.links || [];
        linksState.error = null;
    } catch (e: any) {
        console.error("Failed to load links", e);
        linksState.error = e.message;
    } finally {
        linksState.loading = false;
    }
}

export async function createLink(params: CreateLinkParams) {
    try {
        const ws = useWs();
        await ws.call("agents.links.create", params);
        await loadLinks();
    } catch (e: any) {
        console.error("Failed to create link", e);
        throw e;
    }
}

export async function updateLink(params: UpdateLinkParams) {
    try {
        const ws = useWs();
        await ws.call("agents.links.update", params);
        await loadLinks();
    } catch (e: any) {
        console.error("Failed to update link", e);
        throw e;
    }
}

export async function deleteLink(linkId: string) {
    try {
        const ws = useWs();
        await ws.call("agents.links.delete", { linkId });
        linksState.links = linksState.links.filter(l => l.id !== linkId);
    } catch (e: any) {
        console.error("Failed to delete link", e);
        throw e;
    }
}
