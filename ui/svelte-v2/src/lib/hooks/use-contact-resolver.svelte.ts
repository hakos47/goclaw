import { useHttp } from "../state/ws.svelte";
import type { ChannelContact } from "../../../../web/src/types/contact";

export function useContactResolver(senderIDs: () => string[]) {
  const http = useHttp();

  let loading = $state(false);
  let contactMap = $state<Record<string, ChannelContact>>({});

  async function resolveContacts(ids: string[]) {
    const uniqueIDs = [...new Set(ids.filter(Boolean))];
    if (uniqueIDs.length === 0) return;

    // Filter out IDs we already resolved successfully
    const missingIDs = uniqueIDs.filter(id => !contactMap[id]);
    if (missingIDs.length === 0) return;

    loading = true;
    try {
      const res = await http.get<{ contacts: Record<string, ChannelContact> }>(
        "/v1/contacts/resolve",
        { ids: missingIDs.join(",") },
      );
      
      if (res?.contacts) {
        // Merge into existing map
        contactMap = { ...contactMap, ...res.contacts };
      }
    } catch (e) {
      console.error("Failed to resolve contacts", e);
    } finally {
      loading = false;
    }
  }

  // Reactive effect to fetch when senderIDs list changes
  $effect(() => {
    const currentIds = senderIDs();
    resolveContacts(currentIds);
  });

  function resolve(id: string): ChannelContact | null {
    return contactMap[id] ?? null;
  }

  return {
    get loading() { return loading; },
    get contactMap() { return contactMap; },
    resolve
  };
}
