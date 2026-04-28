import { useWs } from "$lib/state/ws.svelte";

export interface EnrichmentProgress {
  running: boolean;
  total: number;
  done: number;
  error_count: number;
  last_error?: string;
  agent_id?: string;
}

export function useEnrichmentProgress() {
  const ws = useWs();
  let progress = $state<EnrichmentProgress | null>(null);

  $effect(() => {
    return ws.on("EnrichProgress", (data: any) => {
      progress = {
        running: Boolean(data.running),
        total: Number(data.total) || 0,
        done: Number(data.done) || 0,
        error_count: Number(data.error_count) || 0,
        last_error: data.last_error,
        agent_id: data.agent_id,
      };
    });
  });

  return {
    get progress() { return progress; }
  };
}
