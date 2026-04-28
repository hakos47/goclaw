import { useWs } from "../../../lib/state/ws.svelte";


export interface ConfigPermission {
  id: string;
  agentId: string;
  scope: string;
  configType: string;
  userId: string;
  permission: string; // "allow" | "deny"
  grantedBy?: string;
  metadata?: Record<string, string>; // {displayName, username}
  createdAt: string;
  updatedAt: string;
}

export function useConfigPermissions(agentId: string | undefined) {
  const ws = useWs();
  
  let permissions = $state<ConfigPermission[]>([]);
  let loading = $state(false);

  async function load() {
    if (!agentId) return;
    loading = true;
    try {
      const res = await ws.call<{ permissions: ConfigPermission[] }>(
        "config.permissions.list", 
        { agentId }
      );
      permissions = res.permissions ?? [];
    } catch {
      // silent — permissions may not be available for all users
    } finally {
      loading = false;
    }
  }

  async function grant(scope: string, configType: string, userId: string, permission: string, metadata?: Record<string, string>) {
    if (!agentId) return;
    try {
      await ws.call("config.permissions.grant", {
        agentId, scope, configType, userId, permission, metadata,
      });
      // alert("Permission granted");
      await load();
    } catch (err: any) {
      console.error(err);
    }
  }

  async function revoke(scope: string, configType: string, userId: string) {
    if (!agentId) return;
    try {
      await ws.call("config.permissions.revoke", {
        agentId, scope, configType, userId,
      });
      // alert("Permission revoked");
      await load();
    } catch (err: any) {
      console.error(err);
    }
  }

  return {
    get permissions() { return permissions; },
    get loading() { return loading; },
    load,
    grant,
    revoke
  };
}
