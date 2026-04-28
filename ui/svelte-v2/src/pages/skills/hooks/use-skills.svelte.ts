import { useWs, useHttp } from "../../../lib/state/ws.svelte";
import { authState } from "../../../lib/state/auth.svelte";
import type { SkillInfo, SkillFile, SkillVersions } from "../../../../../web/src/types/skill";

export type { SkillInfo, SkillFile, SkillVersions };

export type SkillUploadResponse = {
  id?: string;
  slug: string;
  version: number;
  name: string;
  status?: string;
  is_new?: boolean;
  deps_warning?: string;
  deps_errors?: string[];
  missing_deps?: string[];
  deps_installed?: boolean;
};

export function useSkills() {
  const ws = useWs();
  const http = useHttp();
  
  let skills = $state<SkillInfo[]>([]);
  let loading = $state(true);

  async function load() {
    if (!authState.connected) return;
    loading = true;
    try {
      const res = await ws.call<{ skills: SkillInfo[] }>("skills.list");
      skills = res.skills ?? [];
    } catch (e) {
      console.error("Failed to load skills", e);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (authState.connected) {
      load();
    }
  });

  async function getSkill(name: string) {
    if (!authState.connected) return null;
    return ws.call<SkillInfo & { content: string }>("skills.get", { name });
  }

  async function uploadSkill(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await http.upload<SkillUploadResponse>(
      "/v1/skills/upload",
      formData,
    );
    await load();
    return res;
  }

  async function updateSkill(id: string, updates: Record<string, unknown>) {
    const res = await http.put<{ ok: string }>(`/v1/skills/${id}`, updates);
    await load();
    return res;
  }

  async function deleteSkill(id: string) {
    const res = await http.delete<{ ok: string }>(`/v1/skills/${id}`);
    await load();
    return res;
  }

  async function getSkillVersions(id: string) {
    return http.get<SkillVersions>(`/v1/skills/${id}/versions`);
  }

  async function getSkillFiles(id: string, version?: number) {
    const q = version != null ? `?version=${version}` : "";
    const res = await http.get<{ files: SkillFile[] }>(`/v1/skills/${id}/files${q}`);
    return res.files ?? [];
  }

  async function getSkillFileContent(id: string, path: string, version?: number) {
    const q = version != null ? `?version=${version}` : "";
    return http.get<{ content: string; path: string; size: number }>(
      `/v1/skills/${id}/files/${encodeURIComponent(path)}${q}`,
    );
  }

  async function rescanDeps() {
    const res = await http.post<{ updated: number; results: Array<{ slug: string; status: string; missing?: string[] }> }>(
      "/v1/skills/rescan-deps",
      {},
    );
    await load();
    return res;
  }

  async function installDeps() {
    const res = await http.post<{
      system?: string[];
      pip?: string[];
      npm?: string[];
      errors?: string[];
    }>("/v1/skills/install-deps", {});
    await load();
    return res;
  }

  async function installSingleDep(dep: string) {
    const res = await http.post<{ ok: boolean; error?: string }>("/v1/skills/install-dep", { dep });
    if (!res.ok) throw new Error(res.error ?? "install failed");
    await load();
    return res;
  }

  async function toggleSkill(id: string, enabled: boolean) {
    const res = await http.post<{ ok: boolean; enabled: boolean; status: string }>(
      `/v1/skills/${id}/toggle`,
      { enabled },
    );
    await load();
    return res;
  }

  async function setTenantConfig(id: string, enabled: boolean) {
    await http.put(`/v1/skills/${id}/tenant-config`, { enabled });
    await load();
  }

  async function deleteTenantConfig(id: string) {
    await http.delete(`/v1/skills/${id}/tenant-config`);
    await load();
  }

  return {
    get skills() { return skills; },
    get loading() { return loading; },
    refresh: load,
    getSkill,
    uploadSkill,
    updateSkill,
    deleteSkill,
    getSkillVersions,
    getSkillFiles,
    getSkillFileContent,
    rescanDeps,
    installDeps,
    installSingleDep,
    toggleSkill,
    setTenantConfig,
    deleteTenantConfig,
  };
}
