import { useWs } from "./ws.svelte";
import { Methods } from "../api/protocol";

export interface TenantData {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMembership {
  id: string;
  name: string;
  slug: string;
  status: string;
  role: string;
}

export interface TenantUser {
  tenant_id: string;
  user_id: string;
  role: string;
  created_at: string;
  display_name?: string;
}

export const tenantsStore = $state({
  tenants: [] as TenantData[],
  isOwner: false,
  loading: false,
  error: null as string | null,
});

export async function fetchTenants() {
  const ws = useWs();
  if (!ws.isConnected) return;
  
  tenantsStore.loading = true;
  tenantsStore.error = null;
  
  try {
    // Try owner route first
    const res = await ws.call<{ tenants: TenantData[] }>(Methods.TENANTS_LIST);
    tenantsStore.tenants = res?.tenants || [];
    tenantsStore.isOwner = true;
  } catch (err) {
    console.warn("[Tenants] Not an owner, falling back to personal list", err);
    try {
      // Fallback
      const res2 = await ws.call<{ tenants: TenantMembership[] }>(Methods.TENANTS_MINE);
      tenantsStore.tenants = (res2?.tenants || []).map(m => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        status: m.status,
        created_at: "",
        updated_at: "",
      }));
      tenantsStore.isOwner = false;
    } catch (fallbackErr: any) {
      tenantsStore.error = fallbackErr.message || "Failed to load tenants";
    }
  } finally {
    tenantsStore.loading = false;
  }
}

export async function createTenant(name: string, slug: string) {
  const ws = useWs();
  try {
    const res = await ws.call<TenantData>(Methods.TENANTS_CREATE, { name, slug });
    await fetchTenants(); // Refresh
    return res;
  } catch (e) {
    throw e;
  }
}

// Single Tenant Management Functions
export async function fetchTenantDetail(id: string): Promise<TenantData | null> {
  const ws = useWs();
  try {
    const res = await ws.call<TenantData>(Methods.TENANTS_GET, { id: id });
    return res;
  } catch (e) {
    console.error("[Tenants] Failed to fetch tenant details", e);
    return null;
  }
}

export async function fetchTenantUsers(id: string): Promise<TenantUser[]> {
  const ws = useWs();
  try {
    const res = await ws.call<{ users: TenantUser[] }>(Methods.TENANTS_USERS_LIST, { tenant_id: id });
    return res.users || [];
  } catch (e) {
    console.error("[Tenants] Failed to fetch tenant users", e);
    return [];
  }
}

export async function addTenantUser(tenantId: string, userId: string, role: string) {
  const ws = useWs();
  try {
    await ws.call(Methods.TENANTS_USERS_ADD, { tenant_id: tenantId, user_id: userId, role });
  } catch (e) {
    throw e;
  }
}

export async function removeTenantUser(tenantId: string, userId: string) {
  const ws = useWs();
  try {
    await ws.call(Methods.TENANTS_USERS_REMOVE, { tenant_id: tenantId, user_id: userId });
  } catch (e) {
    throw e;
  }
}
