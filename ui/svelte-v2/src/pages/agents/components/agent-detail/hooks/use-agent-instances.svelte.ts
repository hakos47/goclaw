import { useHttp } from "../../../../../lib/state/ws.svelte";

export interface UserInstance {
  user_id: string;
  first_seen_at?: string;
  last_seen_at?: string;
  file_count: number;
  metadata?: Record<string, string>;
}

export interface UserContextFile {
  agent_id: string;
  user_id: string;
  file_name: string;
  content: string;
}

export function useAgentInstances(agentId: string) {
  const http = useHttp();
  
  let instances = $state<UserInstance[]>([]);
  let loading = $state(true);
  let saving = $state(false);

  async function load() {
    if (!agentId) return;
    loading = true;
    try {
      const res = await http.get<{ instances: UserInstance[] }>(`/v1/agents/${agentId}/instances`);
      instances = res.instances ?? [];
    } catch (err) {
      console.error("Failed to load instances", err);
    } finally {
      loading = false;
    }
  }

  // Load initially
  $effect(() => {
    if (agentId) {
      load();
    }
  });

  async function getFiles(userID: string): Promise<UserContextFile[]> {
    if (!agentId) return [];
    try {
      const res = await http.get<{ files: UserContextFile[] }>(
        `/v1/agents/${agentId}/instances/${encodeURIComponent(userID)}/files`
      );
      return res.files ?? [];
    } catch (err) {
      console.error("Failed to load instance files", err);
      return [];
    }
  }

  async function setFile(userID: string, fileName: string, content: string) {
    if (!agentId) return;
    saving = true;
    try {
      await http.put(
        `/v1/agents/${agentId}/instances/${encodeURIComponent(userID)}/files/${encodeURIComponent(fileName)}`,
        { content }
      );
      // alert("Instance updated successfully"); 
      await load(); // refresh instances locally
    } catch (err) {
      console.error("Failed to update instance file", err);
      // alert("Failed to update instance");
      throw err;
    } finally {
      saving = false;
    }
  }

  return {
    get instances() { return instances; },
    get loading() { return loading; },
    get saving() { return saving; },
    getFiles,
    setFile,
    refresh: load
  };
}
