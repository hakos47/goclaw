import { useWs, useHttp } from "./ws.svelte";

export interface SecureCLIBinary {
  id: string;
  binary_name: string;
  binary_path?: string;
  description: string;
  deny_args: string[];
  deny_verbose: string[];
  timeout_seconds: number;
  tips: string;
  is_global: boolean;
  enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  env_keys?: string[];
}

export interface CLIPresetEnvVar {
  name: string;
  desc: string;
  is_file?: boolean;
  optional?: boolean;
}

export interface CLIPreset {
  binary_name: string;
  description: string;
  env_vars: CLIPresetEnvVar[];
  deny_args: string[];
  deny_verbose: string[];
  timeout: number;
  tips: string;
}

export interface CLICredentialInput {
  preset?: string;
  binary_name: string;
  binary_path?: string;
  description?: string;
  deny_args?: string[];
  deny_verbose?: string[];
  timeout_seconds?: number;
  tips?: string;
  is_global?: boolean;
  enabled?: boolean;
  env?: Record<string, string>;
}

export interface CLIAgentGrant {
  id: string;
  binary_id: string;
  agent_id: string;
  deny_args: string[] | null;
  deny_verbose: string[] | null;
  timeout_seconds: number | null;
  tips: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CLIAgentGrantInput {
  agent_id: string;
  deny_args?: string[] | null;
  deny_verbose?: string[] | null;
  timeout_seconds?: number | null;
  tips?: string | null;
  enabled?: boolean;
}

// REST endpoints are used for CLI credentials since it's an admin CRUD
export const cliCredentialsStore = $state({
  items: [] as SecureCLIBinary[],
  presets: {} as Record<string, CLIPreset>,
  loading: false,
  error: null as string | null,
});

export async function fetchCliCredentials() {
  cliCredentialsStore.loading = true;
  cliCredentialsStore.error = null;
  const http = useHttp();
  try {
    const res = await http.get<{ items: SecureCLIBinary[] }>("/v1/cli-credentials");
    cliCredentialsStore.items = res.items || [];
  } catch (err: any) {
    cliCredentialsStore.error = err.message;
  } finally {
    cliCredentialsStore.loading = false;
  }
}

export async function fetchCliPresets() {
  const http = useHttp();
  try {
    const res = await http.get<{ presets: Record<string, CLIPreset> }>("/v1/cli-credentials/presets");
    cliCredentialsStore.presets = res.presets || {};
  } catch (err) {
    console.error("Failed to load CLI presets", err);
  }
}

export async function createCliCredential(input: CLICredentialInput) {
  const http = useHttp();
  const res = await http.post<SecureCLIBinary>("/v1/cli-credentials", input);
  await fetchCliCredentials();
  return res;
}

export async function updateCliCredential(id: string, input: Partial<CLICredentialInput>) {
  const http = useHttp();
  await http.put(`/v1/cli-credentials/${id}`, input);
  await fetchCliCredentials();
}

export async function deleteCliCredential(id: string) {
  const http = useHttp();
  await http.delete(`/v1/cli-credentials/${id}`);
  await fetchCliCredentials();
}

export async function fetchCliGrants(binaryId: string): Promise<CLIAgentGrant[]> {
  const http = useHttp();
  const res = await http.get<{ grants: CLIAgentGrant[] }>(`/v1/cli-credentials/${binaryId}/agent-grants`);
  return res.grants || [];
}

export async function createCliGrant(binaryId: string, input: CLIAgentGrantInput) {
  const http = useHttp();
  await http.post(`/v1/cli-credentials/${binaryId}/agent-grants`, input);
}

export async function deleteCliGrant(binaryId: string, grantId: string) {
  const http = useHttp();
  await http.delete(`/v1/cli-credentials/${binaryId}/agent-grants/${grantId}`);
}
