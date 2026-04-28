import { useHttp } from "$lib/state/ws.svelte";
import type { ChannelContact } from "$lib/types/contact";

export interface ContactFilters {
  search?: string;
  channelType?: string;
  peerKind?: string;
  contactType?: string;
  limit?: number;
  offset?: number;
}

export function useContacts() {
  const http = useHttp();
  let contacts = $state<ChannelContact[]>([]);
  let total = $state(0);
  let loading = $state(false);
  let fetching = $state(false);

  const loadContacts = async (filters: ContactFilters = {}) => {
    loading = true;
    fetching = true;
    try {
      const params: Record<string, string> = {};
      if (filters.search) params.search = filters.search;
      if (filters.channelType) params.channel_type = filters.channelType;
      if (filters.peerKind) params.peer_kind = filters.peerKind;
      if (filters.contactType) params.contact_type = filters.contactType;
      if (filters.limit) params.limit = String(filters.limit);
      if (filters.offset !== undefined) params.offset = String(filters.offset);

      const res = await http.get<{ contacts: ChannelContact[]; total?: number }>("/v1/contacts", params);
      contacts = res.contacts ?? [];
      total = res.total ?? 0;
    } catch (e) {
      console.error("Failed to load contacts", e);
    } finally {
      loading = false;
      fetching = false;
    }
  };

  return {
    get contacts() { return contacts; },
    get total() { return total; },
    get loading() { return loading; },
    get fetching() { return fetching; },
    loadContacts
  };
}
