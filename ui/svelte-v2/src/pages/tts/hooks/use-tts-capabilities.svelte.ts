import { useHttp } from "../../../lib/state/ws.svelte";

export interface TtsVoice {
  voice_id: string;
  name: string;
  provider: string;
  preview_url?: string;
}

export interface TtsCapabilities {
  provider: string;
  models: string[];
  voices: TtsVoice[];
  params: any[]; // The schema for dynamic params (Phase C)
  custom_features: Record<string, unknown>;
}

export const ttsCapabilitiesState = $state({
  capabilities: [] as TtsCapabilities[],
  loading: false,
  error: null as string | null
});

export function useTtsCapabilities() {
  const http = useHttp();

  async function loadCapabilities() {
    if (ttsCapabilitiesState.capabilities.length > 0) return; // Cache
    
    ttsCapabilitiesState.loading = true;
    ttsCapabilitiesState.error = null;
    try {
      const res = await http.get<{ providers: TtsCapabilities[] }>("/v1/tts/capabilities");
      ttsCapabilitiesState.capabilities = res?.providers || [];
    } catch (err: any) {
      ttsCapabilitiesState.error = err.message || "Failed to load capabilities";
      console.error(err);
    } finally {
      ttsCapabilitiesState.loading = false;
    }
  }

  return {
    loadCapabilities
  };
}
