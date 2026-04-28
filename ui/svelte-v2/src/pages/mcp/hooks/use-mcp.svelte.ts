import { useHttp } from "../../../lib/state/ws.svelte";

export interface MCPServerData {
  id: string;
  name: string;
  display_name: string;
  transport: "stdio" | "sse" | "streamable-http";
  command: string;
  args: string[] | null;
  url: string;
  headers: Record<string, string> | null;
  env: Record<string, string> | null;
  tool_prefix: string;
  timeout_sec: number;
  settings?: { require_user_credentials?: boolean };
  enabled: boolean;
  created_by: string;
  agent_count?: number;
  created_at: string;
  updated_at: string;
}

export interface MCPServerInput {
  name: string;
  display_name?: string;
  transport: string;
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
  tool_prefix?: string;
  timeout_sec?: number;
  settings?: { require_user_credentials?: boolean };
  enabled?: boolean;
}

export interface MCPToolInfo {
  name: string;
  description?: string;
}

export interface MCPAgentGrant {
  id: string;
  server_id: string;
  agent_id: string;
  enabled: boolean;
  tool_allow: string[] | null;
  tool_deny: string[] | null;
  granted_by: string;
  created_at: string;
}

export interface MCPUserCredentialStatus {
  has_credentials: boolean;
  has_api_key: boolean;
  has_headers: boolean;
  has_env: boolean;
}

export interface MCPUserCredentialInput {
  api_key?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
}

export const mcpState = $state({
  servers: [] as MCPServerData[],
  loading: false,
  error: null as string | null,
  initialized: false
});

export function useMCP(enabled = true) {
  const http = useHttp();

  async function loadServers(force = false) {
    if (!enabled) return;
    if (mcpState.loading) return;
    if (mcpState.initialized && !force) return;

    mcpState.loading = true;
    mcpState.error = null;
    try {
      const res = await http.get<{ servers: MCPServerData[] }>("/v1/mcp/servers");
      mcpState.servers = res?.servers ?? [];
      mcpState.initialized = true;
    } catch (e: any) {
      console.error("Failed to load MCP servers", e);
      mcpState.error = e.message || "Failed to load MCP servers";
    } finally {
      mcpState.loading = false;
    }
  }

  async function createServer(data: MCPServerInput) {
    try {
      const res = await http.post<MCPServerData>("/v1/mcp/servers", data);
      await loadServers(true);
      return res;
    } catch (e: any) {
      console.error("Failed to create MCP server", e);
      throw e;
    }
  }

  async function updateServer(id: string, data: Partial<MCPServerInput>) {
    try {
      // Optimistic update for enabled toggle
      if (data.enabled !== undefined) {
        mcpState.servers = mcpState.servers.map(s => s.id === id ? { ...s, enabled: data.enabled! } : s);
      }
      const res = await http.put(`/v1/mcp/servers/${id}`, data);
      await loadServers(true);
      return res;
    } catch (e: any) {
      console.error("Failed to update MCP server", e);
      // Revert optimism by reloading
      await loadServers(true);
      throw e;
    }
  }

  async function deleteServer(id: string) {
    try {
      await http.delete(`/v1/mcp/servers/${id}`);
      await loadServers(true);
    } catch (e: any) {
      console.error("Failed to delete MCP server", e);
      throw e;
    }
  }

  async function listAgentGrants(serverId: string) {
    const res = await http.get<{ grants: MCPAgentGrant[] }>(`/v1/mcp/servers/${serverId}/grants`);
    return res.grants ?? [];
  }

  async function grantAgent(serverId: string, agentId: string, toolAllow?: string[], toolDeny?: string[]) {
    await http.post(`/v1/mcp/servers/${serverId}/grants/agent`, {
      agent_id: agentId,
      tool_allow: toolAllow,
      tool_deny: toolDeny,
    });
  }

  async function revokeAgent(serverId: string, agentId: string) {
    await http.delete(`/v1/mcp/servers/${serverId}/grants/agent/${agentId}`);
  }

  async function listGrantsByAgent(agentId: string) {
    const res = await http.get<{ grants: MCPAgentGrant[] }>(`/v1/mcp/grants/agent/${agentId}`);
    return res.grants ?? [];
  }

  async function testConnection(data: { transport: string; command?: string; args?: string[]; url?: string; headers?: Record<string, string>; env?: Record<string, string> }) {
    return http.post<{ success: boolean; tool_count?: number; error?: string }>("/v1/mcp/servers/test", data);
  }

  async function reconnectServer(id: string) {
    await http.post(`/v1/mcp/servers/${id}/reconnect`, {});
  }

  async function listServerTools(serverId: string) {
    const res = await http.get<{ tools: MCPToolInfo[] }>(`/v1/mcp/servers/${serverId}/tools`);
    return res.tools ?? [];
  }

  async function getUserCredentials(serverId: string, userId?: string) {
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    return http.get<MCPUserCredentialStatus>(`/v1/mcp/servers/${serverId}/user-credentials${qs}`);
  }

  async function setUserCredentials(serverId: string, creds: MCPUserCredentialInput, userId?: string) {
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    await http.put(`/v1/mcp/servers/${serverId}/user-credentials${qs}`, creds);
  }

  async function deleteUserCredentials(serverId: string, userId?: string) {
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
    await http.delete(`/v1/mcp/servers/${serverId}/user-credentials${qs}`);
  }

  return {
    loadServers,
    createServer,
    updateServer,
    deleteServer,
    listAgentGrants,
    grantAgent,
    revokeAgent,
    listGrantsByAgent,
    testConnection,
    reconnectServer,
    listServerTools,
    getUserCredentials,
    setUserCredentials,
    deleteUserCredentials,
  };
}
