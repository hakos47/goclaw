import { useWs } from "./ws.svelte";
import type { SessionInfo } from "../types/session";

export type SessionCategory = "personal" | "inbound" | "support" | "system" | "evolution";

export const sessionsState = $state({
    sessions: [] as SessionInfo[],
    categorized: {
        personal: [],
        inbound: [],
        support: [],
        system: [],
        evolution: []
    } as Record<SessionCategory, SessionInfo[]>,
    loading: false,
    error: null as string | null
});

export async function loadSessions(agentId?: string) {
    sessionsState.loading = true;
    try {
        const ws = useWs();
        const res = await ws.call<{ sessions: SessionInfo[] }>("sessions.list", { agentId });
        sessionsState.sessions = (res.sessions || []).sort(
            (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
        );
        
        // Categorize sessions based on channelType and key (Matching React logic)
        const groups: Record<SessionCategory, SessionInfo[]> = {
            personal: [],
            inbound: [],
            support: [],
            system: [],
            evolution: [],
        };

        sessionsState.sessions.forEach((s) => {
            const type = s.channelType || "";
            const isSystem = s.key.includes("system");

            if (["whatsapp", "facebook"].includes(type)) {
                groups.inbound.push(s);
            } else if (["telegram", "discord"].includes(type)) {
                groups.support.push(s);
            } else if (["internal", "evolution"].includes(type)) {
                groups.evolution.push(s);
            } else if (isSystem) {
                groups.system.push(s);
            } else {
                groups.personal.push(s);
            }
        });

        sessionsState.categorized = groups;
    } catch (e: any) {
        console.error("Failed to load sessions", e);
        sessionsState.error = e.message;
    } finally {
        sessionsState.loading = false;
    }
}

export function getSessionLabel(session: SessionInfo): string {
    // 1. Explicit label (manual or generated)
    if (session.label) return session.label;

    // 2. Metadata: Chat Title (Groups)
    if (session.metadata?.chat_title) return session.metadata.chat_title;
    
    // 3. Metadata: User Identity
    if (session.metadata?.display_name) return session.metadata.display_name;
    if (session.metadata?.user_name) return session.metadata.user_name;

    const parts = session.key.split(":");
    
    // 4. WhatsApp specific logic
    if (session.channelType === "whatsapp" || session.key.includes("whatsapp")) {
        const jid = parts[parts.length - 1];
        if (jid) {
            const namePart = jid.split("@")[0] ?? jid;
            if (jid.endsWith("@s.whatsapp.net")) return `WA: ${namePart}`;
            if (jid.endsWith("@lid")) return `ID: ${namePart.slice(-8)}`;
            if (jid.endsWith("@g.us")) return `Group: ${namePart.slice(0, 12)}…`;
        }
    }

    // 5. Generic Fallback
    const scope = parts.length >= 3 ? parts.slice(2).join(":") : session.key;
    if (scope.startsWith("ws:direct:")) return `Chat ${scope.replace("ws:direct:", "").slice(0, 8)}`;
    if (scope.startsWith("team:")) return `Team ${scope.replace("team:", "").slice(0, 12)}`;

    return scope.length > 24 ? scope.slice(0, 21) + "…" : scope;
}

export async function deleteSession(sessionKey: string) {
    try {
        const ws = useWs();
        await ws.call("sessions.delete", { sessionKey });
        sessionsState.sessions = sessionsState.sessions.filter(s => s.key !== sessionKey);
        // Refresh categorized
        loadSessions();
    } catch (e: any) {
        console.error("Failed to delete session", e);
    }
}
