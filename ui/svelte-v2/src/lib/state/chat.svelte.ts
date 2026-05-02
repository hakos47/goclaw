import { useWs, getHttpClient } from "./ws.svelte";
import type { ChatMessage, AgentEventPayload, ToolStreamEntry, RunActivity, ActiveTeamTask, MediaItem } from "../types/chat";

interface SessionState {
    messages: ChatMessage[];
    streamText: string | null;
    thinkingText: string | null;
    isRunning: boolean;
}

export const chatState = $state({
    sessions: {} as Record<string, SessionState>,
    activeSessionKey: "" as string | null,
    loading: false,
    error: null as string | null,
    activity: null as RunActivity | null,
    toolStream: [] as ToolStreamEntry[],
    teamTasks: [] as ActiveTeamTask[],
    blockReplies: [] as ChatMessage[],
    
    // Pure getter: no mutations allowed here
    get activeSession() {
        if (!this.activeSessionKey) return null;
        return this.sessions[this.activeSessionKey] || null;
    }
});

/** Pure helper to ensure a session exists in state (Must be called outside getters) */
function ensureSession(key: string): SessionState {
    if (!chatState.sessions[key]) {
        chatState.sessions[key] = {
            messages: [],
            streamText: null,
            thinkingText: null,
            isRunning: false
        };
    }
    return chatState.sessions[key];
}

export async function loadChatHistory(sessionKey: string, agentId: string) {
    if (!sessionKey || sessionKey === 'chat') return;
    
    // Initialize session state if missing
    ensureSession(sessionKey);
    
    chatState.loading = true;
    try {
        const ws = useWs();
        const res = await ws.call<{ messages: any[] }>("chat.history", { agentId, sessionKey });
        
        const rawMessages = res.messages || [];
        
        // Build tool result map
        const toolResultMap = new Map<string, any>();
        for (const m of rawMessages) {
            if (m.role === 'tool' && m.tool_call_id) {
                toolResultMap.set(m.tool_call_id, m);
            }
        }

        // Filter and map
        const filtered = rawMessages.filter((m: any) => 
            (m.role === 'user' || m.role === 'assistant') &&
            !(m.role === 'user' && m.content?.startsWith('[System]'))
        );

        chatState.sessions[sessionKey].messages = filtered.map((m: any) => {
            const chatMsg: any = {
                role: m.role,
                content: m.content,
                thinking: m.thinking,
                timestamp: m.timestamp || Date.now()
            };
            
            if (m.tool_calls && m.tool_calls.length > 0) {
                chatMsg.toolDetails = m.tool_calls.map((tc: any) => {
                    const toolRes = toolResultMap.get(tc.id);
                    return {
                        toolCallId: tc.id,
                        runId: "",
                        name: tc.function?.name || tc.name,
                        phase: toolRes ? (toolRes.is_error ? "error" : "completed") : "calling",
                        arguments: tc.function?.arguments || tc.input || tc.arguments,
                        result: toolRes && !toolRes.is_error ? toolRes.content : undefined,
                        errorContent: toolRes && toolRes.is_error ? toolRes.content : undefined
                    };
                });
            }
            if (m.media && m.media.length > 0) {
                chatMsg.mediaItems = m.media.map((med: any) => ({
                    path: med.path || med.url,
                    mimeType: med.content_type || 'application/octet-stream'
                }));
            }
            
            // Extract raw paths from content that the backend might have leaked
            if (chatMsg.content) {
                const pathRegex = /(?:📸\s*|📷\s*|MEDIA:\s*|FILE:\s*)?`?(\/(?:home|var|tmp|mnt|usr)[^\s"'`]+\.(?:png|jpg|jpeg|gif|webp|mp4|webm))`?/gi;
                let match;
                const leakedPaths = [];
                let newContent = chatMsg.content;
                
                while ((match = pathRegex.exec(chatMsg.content)) !== null) {
                    leakedPaths.push(match[1]);
                    // Replace the matched text with empty string to completely hide it
                    newContent = newContent.replace(match[0], '');
                }
                
                if (leakedPaths.length > 0) {
                    chatMsg.content = newContent.trim();
                    chatMsg.mediaItems = chatMsg.mediaItems || [];
                    leakedPaths.forEach(p => {
                        // Avoid duplicates by checking the filename
                        const filename = p.split('/').pop() || p;
                        if (!chatMsg.mediaItems.find((med: any) => med.path && med.path.endsWith(filename))) {
                            chatMsg.mediaItems.push({
                                path: p,
                                mimeType: p.endsWith('.png') ? 'image/png' : 'application/octet-stream'
                            });
                        }
                    });
                }
            }
            
            return chatMsg;
        });
        chatState.error = null;
    } catch (e: any) {
        console.error("Failed to load chat history", e);
        chatState.error = e.message;
    } finally {
        chatState.loading = false;
    }
}

export async function sendChatMessage(agentId: string, sessionKey: string, message: string, files: any[] = []) {
    const ws = useWs();
    const http = getHttpClient();
    
    // 1. Upload files
    let mediaItems: { path: string, filename: string }[] | undefined;
    if (files.length > 0) {
        const uploads = await Promise.all(files.map(async (f) => {
            const fd = new FormData();
            fd.append("file", f.file);
            const res = await http.upload<any>("/v1/media/upload", fd);
            return { path: res.path, filename: res.filename };
        }));
        mediaItems = uploads;
    }

    // 2. Add optimistic user message
    let displayContent = message.trim();
    if (files.length > 0) {
        const fileNames = files.map(f => f.file.name).join(", ");
        displayContent = `[${fileNames}]\n${displayContent}`;
    }
    
    const session = ensureSession(sessionKey);
    session.messages = [...session.messages, {
        role: "user",
        content: displayContent,
        timestamp: Date.now()
    }];

    // 3. Call chat.send
    try {
        await ws.call("chat.send", {
            agentId,
            sessionKey,
            message: message.trim(),
            stream: true,
            media: mediaItems
        });
    } catch (e: any) {
        console.error("Failed to send message", e);
        chatState.error = e.message;
    }
}

export async function abortRun() {
    if (!runId) return;
    const ws = useWs();
    try {
        await ws.call("run.abort", { runId });
    } catch (e) {
        console.error("Failed to abort run", e);
    }
}

let runId: string | null = null;
let streamRef = "";
let thinkingRef = "";
let toolStreamRef: ToolStreamEntry[] = [];

export function handleAgentEvent(event: AgentEventPayload) {
    if (!chatState.activeSessionKey) return;
    if (event.sessionKey && event.sessionKey !== chatState.activeSessionKey) return;

    const session = ensureSession(chatState.activeSessionKey);

    if (event.type === "run.started") {
        runId = event.runId;
        session.isRunning = true;
        session.streamText = null;
        session.thinkingText = null;
        streamRef = "";
        thinkingRef = "";
        chatState.toolStream = [];
        toolStreamRef = [];
        chatState.activity = null;
        return;
    }

    if (!runId || event.runId !== runId) return;

    switch (event.type) {
        case "thinking":
            thinkingRef += event.payload?.content || "";
            session.thinkingText = thinkingRef;
            break;
        case "chunk":
            streamRef += event.payload?.content || "";
            session.streamText = streamRef;
            break;
        case "tool.call":
            const entry: ToolStreamEntry = {
                toolCallId: event.payload?.id || "",
                runId: event.runId,
                name: event.payload?.name || "tool",
                arguments: event.payload?.arguments,
                phase: "calling",
                startedAt: Date.now(),
                updatedAt: Date.now()
            };
            toolStreamRef = [...toolStreamRef, entry];
            chatState.toolStream = toolStreamRef;
            break;
        case "tool.result":
            const isError = event.payload?.is_error;
            const resultId = event.payload?.id;
            toolStreamRef = toolStreamRef.map(t => 
                t.toolCallId === resultId 
                ? { ...t, phase: isError ? "error" : "completed", errorContent: isError ? event.payload?.content : undefined, result: event.payload?.result, updatedAt: Date.now() }
                : t
            );
            chatState.toolStream = toolStreamRef;
            break;
        case "activity":
            chatState.activity = {
                phase: event.payload?.phase as any,
                tool: event.payload?.tool,
                tools: event.payload?.tools,
                iteration: event.payload?.iteration
            };
            break;
        case "run.completed":
            session.isRunning = false;
            if (streamRef || thinkingRef || toolStreamRef.length > 0 || event.payload?.media?.length) {
                let finalContent = streamRef;
                let finalMedia: any[] = [];
                
                // Extract leaked paths from the streaming content
                const pathRegex = /(?:📸\s*|📷\s*|MEDIA:\s*|FILE:\s*)?`?(\/(?:home|var|tmp|mnt|usr)[^\s"'`]+\.(?:png|jpg|jpeg|gif|webp|mp4|webm))`?/gi;
                let match;
                while ((match = pathRegex.exec(streamRef)) !== null) {
                    finalMedia.push({
                        path: match[1],
                        mimeType: match[1].endsWith('.png') ? 'image/png' : 'application/octet-stream'
                    });
                    finalContent = finalContent.replace(match[0], '');
                }

                if (event.payload?.media && event.payload.media.length > 0) {
                    event.payload.media.forEach((med: any) => {
                        const p = med.path || med.url;
                        const filename = p.split('/').pop() || p;
                        if (!finalMedia.find(m => m.path && m.path.endsWith(filename))) {
                            finalMedia.push({
                                path: p,
                                mimeType: med.content_type || 'application/octet-stream'
                            });
                        }
                    });
                }

                const finalMsg: any = {
                    role: "assistant",
                    content: finalContent.trim(),
                    thinking: thinkingRef || undefined,
                    timestamp: Date.now()
                };

                if (toolStreamRef.length > 0) {
                    finalMsg.toolDetails = [...toolStreamRef];
                }
                
                if (finalMedia.length > 0) {
                    finalMsg.mediaItems = finalMedia;
                }
                
                session.messages = [...session.messages, finalMsg];
            }
            session.streamText = null;
            session.thinkingText = null;
            chatState.toolStream = [];
            toolStreamRef = [];
            runId = null;
            break;
        case "run.failed":
            session.isRunning = false;
            session.messages = [...session.messages, {
                role: "assistant",
                content: `Error: ${event.payload?.error || "Unknown error"}`,
                timestamp: Date.now()
            }];
            runId = null;
            break;
    }
}
