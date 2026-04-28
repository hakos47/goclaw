import { useHttp } from "../../../lib/state/ws.svelte";
import { authState } from "../../../lib/state/auth.svelte";

export interface TtsProviderConfig {
  api_key?: string;
  api_base?: string;
  base_url?: string;
  model?: string;
  voice?: string;
  voice_id?: string;
  model_id?: string;
  enabled?: boolean;
  rate?: string;
  group_id?: string;
  params?: Record<string, unknown>;
}

export interface TtsConfig {
  provider: string;
  auto: string;
  mode: string;
  max_length: number;
  timeout_ms: number;
  openai: TtsProviderConfig;
  elevenlabs: TtsProviderConfig;
  edge: TtsProviderConfig;
  minimax: TtsProviderConfig;
  gemini: TtsProviderConfig;
}

export const DEFAULT_TTS: TtsConfig = {
  provider: "",
  auto: "off",
  mode: "final",
  max_length: 1500,
  timeout_ms: 30000,
  openai: {},
  elevenlabs: {},
  edge: {},
  minimax: {},
  gemini: {},
};

export interface SynthesizeParams {
  text: string;
  provider?: string;
  voice_id?: string;
  model_id?: string;
}

export interface TestConnectionParams {
  provider: string;
  api_key?: string;
  api_base?: string;
  voice_id?: string;
  model_id?: string;
  group_id?: string;
}

export interface TestConnectionResult {
  success: boolean;
  provider?: string;
  latency_ms?: number;
  error?: string;
}

export const ttsState = $state({
  config: structuredClone(DEFAULT_TTS) as TtsConfig,
  loading: false,
  saving: false,
  error: null as string | null
});

export function useTTS() {
  const http = useHttp();

  async function loadConfig() {
    if (!authState.token) return;
    ttsState.loading = true;
    ttsState.error = null;
    try {
      const res = await fetch("/v1/tts/config", {
        headers: http.getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error(`Failed to load TTS config (${res.status})`);
      }
      const data = await res.json();
      ttsState.config = { ...structuredClone(DEFAULT_TTS), ...data };
    } catch (err: any) {
      ttsState.error = err.message || "Failed to load config";
      console.error(err);
    } finally {
      ttsState.loading = false;
    }
  }

  async function saveConfig(updates: Partial<TtsConfig>) {
    ttsState.saving = true;
    ttsState.error = null;
    try {
      const res = await fetch("/v1/tts/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...http.getAuthHeaders() },
        body: JSON.stringify(updates),
      });
      
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to save TTS config (${res.status})`);
      }
      
      // Update local state without full reload
      ttsState.config = { ...ttsState.config, ...updates };
      return true;
    } catch (err: any) {
      ttsState.error = err.message || "Failed to save TTS config";
      console.error(err);
      throw err;
    } finally {
      ttsState.saving = false;
    }
  }

  async function synthesize(params: SynthesizeParams): Promise<Blob> {
    const res = await fetch("/v1/tts/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...http.getAuthHeaders() },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Synthesis failed (${res.status})`);
    }
    return res.blob();
  }

  async function testConnection(params: TestConnectionParams): Promise<TestConnectionResult> {
    const res = await fetch("/v1/tts/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...http.getAuthHeaders() },
      body: JSON.stringify(params),
    });
    const data = await res.json() as TestConnectionResult;
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Test failed (${res.status})`);
    }
    return data;
  }

  return {
    loadConfig,
    saveConfig,
    synthesize,
    testConnection
  };
}
