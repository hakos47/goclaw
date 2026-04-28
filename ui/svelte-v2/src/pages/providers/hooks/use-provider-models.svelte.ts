import { useHttp } from "../../../lib/state/ws.svelte";
import type { ModelItem } from "../../../../../web/src/types/models";
import type { ReasoningDefaults } from "../../../../../web/src/types/provider";

export function useProviderModels(providerId: string | null) {
  const http = useHttp();

  let models = $state<ModelItem[]>([]);
  let reasoningDefaults = $state<ReasoningDefaults | null>(null);
  let loadingModels = $state(false);
  let errorModels = $state<string | null>(null);

  async function fetchModels() {
    if (!providerId) return;
    loadingModels = true;
    errorModels = null;
    try {
      const res = await http.get<{ models: ModelItem[], reasoning_defaults?: ReasoningDefaults }>(`/v1/providers/${providerId}/models`);
      models = res?.models ?? [];
      reasoningDefaults = res?.reasoning_defaults ?? null;
    } catch (e: any) {
      console.error("Failed to load provider models", e);
      errorModels = e.message;
    } finally {
      loadingModels = false;
    }
  }

  // Effect to automatically fetch when providerId changes
  $effect(() => {
    if (providerId) {
      fetchModels();
    } else {
      models = [];
      reasoningDefaults = null;
    }
  });

  return {
    get models() { return models; },
    get reasoningDefaults() { return reasoningDefaults; },
    get loading() { return loadingModels; },
    get error() { return errorModels; },
    fetchModels
  };
}
