import { useHttp } from "$lib/state/ws.svelte";
import type { PendingMessageGroup, PendingMessage } from "$lib/types/pending-messages";

export function usePendingMessages() {
  const http = useHttp();
  let groups = $state<PendingMessageGroup[]>([]);
  let messages = $state<PendingMessage[]>([]);
  let loading = $state(false);
  let messagesLoading = $state(false);

  const loadGroups = async () => {
    loading = true;
    try {
      const res = await http.get<{ groups: PendingMessageGroup[] }>("/v1/pending-messages");
      groups = res?.groups ?? [];
    } catch (e) {
      console.error("Failed to load pending message groups", e);
    } finally {
      loading = false;
    }
  };

  const loadMessages = async (channel: string, key: string) => {
    messagesLoading = true;
    try {
      const res = await http.get<{ messages: PendingMessage[] }>("/v1/pending-messages/messages", {
        channel,
        key,
      });
      messages = res?.messages ?? [];
    } catch (e) {
      console.error("Failed to load messages for group", e);
    } finally {
      messagesLoading = false;
    }
  };

  const compactGroup = async (channel: string, key: string) => {
    try {
      await http.post<{ status: string; method?: string; remaining?: number }>(
        "/v1/pending-messages/compact",
        { channel_name: channel, history_key: key },
      );
      return true;
    } catch (err) {
      console.error("Failed to compact group", err);
      return false;
    }
  };

  const clearGroup = async (channel: string, key: string) => {
    try {
      await http.delete(`/v1/pending-messages?channel=${encodeURIComponent(channel)}&key=${encodeURIComponent(key)}`);
      return true;
    } catch (err) {
      console.error("Failed to clear group", err);
      return false;
    }
  };

  return {
    get groups() { return groups; },
    get messages() { return messages; },
    get loading() { return loading; },
    get messagesLoading() { return messagesLoading; },
    loadGroups,
    loadMessages,
    compactGroup,
    clearGroup,
  };
}
