import { useHttp } from "$lib/state/ws.svelte";
import type { MergeContactsRequest, MergeContactsResponse } from "$lib/types/contact";

export function useContactMerge() {
  const http = useHttp();

  const merge = async (req: MergeContactsRequest) => {
    try {
      return await http.post<MergeContactsResponse>("/v1/contacts/merge", req);
    } catch (err) {
      console.error("Failed to merge contacts", err);
      throw err;
    }
  };

  const unmerge = async (contactIds: string[]) => {
    try {
      return await http.post<{ ok: boolean }>("/v1/contacts/unmerge", { contact_ids: contactIds });
    } catch (err) {
      console.error("Failed to unmerge contacts", err);
      throw err;
    }
  };

  return { merge, unmerge };
}
