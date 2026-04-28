import { useHttp } from "$lib/state/ws.svelte";

export function useVaultUpload() {
  const http = useHttp();
  let isPending = $state(false);

  const upload = async (files: File[], opts: { agentId?: string; teamId?: string }) => {
    isPending = true;
    try {
      const formData = new FormData();
      if (opts.agentId) formData.append("agent_id", opts.agentId);
      if (opts.teamId) formData.append("team_id", opts.teamId);
      for (const file of files) {
        formData.append("files", file);
      }
      
      const res = await http.upload("/v1/vault/documents/upload", formData);
      return res;
    } catch (err) {
      console.error("Failed to upload files", err);
      throw err;
    } finally {
      isPending = false;
    }
  };

  return {
    get isPending() { return isPending; },
    upload,
  };
}
