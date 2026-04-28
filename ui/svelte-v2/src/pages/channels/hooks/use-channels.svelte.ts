import { useHttp, useWs } from "$lib/state/ws.svelte";
import { Methods } from "$lib/api/protocol";
import type { ChannelInstanceData, ChannelInstanceInput, ChannelInstanceFilters, ChannelRuntimeStatus } from "$lib/types/channel";

export interface GroupManagerGroupInfo {
  group_id: string;
  writer_count: number;
}

export interface GroupManagerData {
  user_id: string;
  display_name?: string;
  username?: string;
}

// Global state for channels to share across pages
export const channelsState = $state({
  instances: [] as ChannelInstanceData[],
  total: 0,
  loading: false,
  error: null as string | null,
  
  status: {} as Record<string, ChannelRuntimeStatus>,
  statusLoading: false,
  statusError: null as string | null
});

export function useChannels() {
  const http = useHttp();
  const ws = useWs();

  const loadInstances = async (filters: ChannelInstanceFilters = {}) => {
    channelsState.loading = true;
    channelsState.error = null;
    try {
      const params: Record<string, string> = {};
      if (filters.search) params.search = filters.search;
      if (filters.limit) params.limit = String(filters.limit);
      if (filters.offset !== undefined) params.offset = String(filters.offset);

      const res = await http.get<{ instances: ChannelInstanceData[]; total?: number }>("/v1/channels/instances", params);
      channelsState.instances = res.instances ?? [];
      channelsState.total = res.total ?? 0;
    } catch (e: any) {
      console.error("Failed to load channel instances", e);
      channelsState.error = e.message || "Failed to load channel instances";
    } finally {
      channelsState.loading = false;
    }
  };

  const loadStatus = async () => {
    channelsState.statusLoading = true;
    channelsState.statusError = null;
    try {
      const res = await ws.call<{ channels: Record<string, ChannelRuntimeStatus> }>(Methods.CHANNELS_STATUS);
      channelsState.status = res.channels ?? {};
    } catch (e: any) {
      console.error("Failed to load channels status", e);
      channelsState.statusError = e.message || "Failed to load status";
    } finally {
      channelsState.statusLoading = false;
    }
  };

  const createInstance = async (data: ChannelInstanceInput) => {
    const res = await http.post<{ id: string }>("/v1/channels/instances", data);
    return res;
  };

  const updateInstance = async (id: string, data: Partial<ChannelInstanceInput>) => {
    await http.put(`/v1/channels/instances/${id}`, data);
  };

  const deleteInstance = async (id: string) => {
    await http.delete(`/v1/channels/instances/${id}`);
  };

  const getInstance = async (id: string) => {
    return await http.get<ChannelInstanceData>(`/v1/channels/instances/${id}`);
  };

  const listManagerGroups = async (instanceId: string): Promise<GroupManagerGroupInfo[]> => {
    const res = await http.get<{ groups: GroupManagerGroupInfo[] }>(`/v1/channels/instances/${instanceId}/writers/groups`);
    return res.groups ?? [];
  };

  const listManagers = async (instanceId: string, groupId: string): Promise<GroupManagerData[]> => {
    const res = await http.get<{ writers: GroupManagerData[] }>(`/v1/channels/instances/${instanceId}/writers`, { group_id: groupId });
    return res.writers ?? [];
  };

  const addManager = async (instanceId: string, groupId: string, userId: string, displayName?: string, username?: string) => {
    await http.post(`/v1/channels/instances/${instanceId}/writers`, {
      group_id: groupId,
      user_id: userId,
      display_name: displayName ?? "",
      username: username ?? "",
    });
  };

  const removeManager = async (instanceId: string, groupId: string, userId: string) => {
    await http.delete(`/v1/channels/instances/${instanceId}/writers/${userId}?group_id=${encodeURIComponent(groupId)}`);
  };

  return {
    get instances() { return channelsState.instances; },
    get total() { return channelsState.total; },
    get loading() { return channelsState.loading; },
    get channelsStatus() { return channelsState.status; },
    get statusLoading() { return channelsState.statusLoading; },
    loadInstances,
    loadStatus,
    createInstance,
    updateInstance,
    deleteInstance,
    getInstance,
    listManagerGroups,
    listManagers,
    addManager,
    removeManager
  };
}
