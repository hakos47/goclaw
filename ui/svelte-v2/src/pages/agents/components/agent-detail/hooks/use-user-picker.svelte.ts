import { useHttp } from "../../../../../lib/state/ws.svelte";

export interface UserPickerItem {
  id: string;
  uuid?: string;
  display_name?: string;
  username?: string;
  source: "contact" | "tenant_user";
  channel_type?: string;
  peer_kind?: string;
  merged_tenant_user_id?: string;
  role?: string;
}

export type ComboboxOption = {
  value: string;
  label: string;
};

export function useUserPicker(
  initialSearch = "",
  peerKind?: "direct" | "group",
  source?: "contact" | "tenant_user",
  valueMode: "user_id" | "uuid" = "user_id"
) {
  const http = useHttp();
  
  let search = $state(initialSearch);
  let debouncedSearch = $state(initialSearch);
  let results = $state<UserPickerItem[]>([]);
  let loading = $state(false);

  // Debounce search input
  $effect(() => {
    const term = search;
    const timer = setTimeout(() => {
      debouncedSearch = term;
    }, 150);
    return () => clearTimeout(timer);
  });

  // Fetch results when debounced search or constraints change
  $effect(() => {
    // Explicitly track dependencies
    const q = debouncedSearch;
    const pk = peerKind;
    const s = source;
    
    let isMounted = true;

    async function fetchResults() {
      loading = true;
      try {
        const params: Record<string, string> = { limit: "30" };
        if (q) params.q = q;
        if (pk) params.peer_kind = pk;
        if (s) params.source = s;
        
        const queryStrings = new URLSearchParams(params).toString();
        const res = await http.get<{ results: UserPickerItem[] }>(`/v1/users/search?${queryStrings}`);
        
        if (isMounted) {
          results = res.results ?? [];
        }
      } catch (err) {
        console.error("Failed to load user picker results", err);
        if (isMounted) {
          results = [];
        }
      } finally {
        if (isMounted) {
          loading = false;
        }
      }
    }
    
    fetchResults();
    return () => { isMounted = false; };
  });

  let options = $derived.by(() => {
    return results.map((r) => {
      const parts: string[] = [];
      if (r.display_name) parts.push(r.display_name);
      if (r.username) parts.push(`@${r.username}`);
      parts.push(`(${r.id})`);
      if (r.source === "contact" && r.channel_type) parts.push(`[${r.channel_type}]`);
      if (r.source === "tenant_user") parts.push("[tenant]");
      if (r.merged_tenant_user_id) parts.push(`→ ${r.merged_tenant_user_id}`);
      
      const value = valueMode === "uuid" && r.uuid ? r.uuid : r.id;
      return { value, label: parts.join(" ") } as ComboboxOption;
    });
  });

  return {
    get search() { return search; },
    set search(v) { search = v; },
    get results() { return results; },
    get options() { return options; },
    get loading() { return loading; }
  };
}
