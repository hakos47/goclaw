import { useWs } from "$lib/state/ws.svelte";
import type { SessionInfo, SessionPreview, Message } from "$lib/types/session"; // Assuming session types exist somewhere, we will define them if not
import { _ } from "svelte-i18n";
import { get } from "svelte/store";

export function useSessions() {
  const ws = useWs();

  const preview = async (key: string) => {
    if (!ws.isConnected) return null;
    try {
      console.log(`[Sessions] Calling sessions.preview for: ${key}`);
      const res = await ws.call<any>("sessions.preview", { key });
      console.log(`[Sessions] Server Response RAW:`, res);
      
      if (!res) throw new Error("No data received from server");
      
      // Ensure we extract messages regardless of naming (messages vs Messages)
      const msgs = res.messages || res.Messages || [];
      const summ = res.summary || res.Summary || "";
      
      return { 
        key: res.key || res.Key || key, 
        messages: msgs, 
        summary: summ
      };
    } catch (err: any) {
      console.error(`[Sessions] Failed to preview session ${key}:`, err?.message || err);
      return null;
    }
  };

  const deleteSession = async (key: string) => {
    if (!ws.isConnected) return;
    try {
      await ws.call("sessions.delete", { key });
      // Usually we'd trigger a refetch here. With useWsCall it refetches if args change, but we assume the caller triggers re-fetch
    } catch (err: any) {
      console.error(err?.message || "Failed to delete session");
      throw err;
    }
  };

  const resetSession = async (key: string) => {
    if (!ws.isConnected) return;
    try {
      await ws.call("sessions.reset", { key });
    } catch (err: any) {
      console.error(err?.message || "Failed to reset session");
      throw err;
    }
  };

  const patchSession = async (key: string, updates: { label?: string; model?: string; metadata?: Record<string, string> }) => {
    if (!ws.isConnected) return;
    try {
      await ws.call("sessions.patch", { key, ...updates });
    } catch (err: any) {
      console.error(err?.message || "Failed to patch session");
      throw err;
    }
  };

  return { preview, deleteSession, resetSession, patchSession };
}
