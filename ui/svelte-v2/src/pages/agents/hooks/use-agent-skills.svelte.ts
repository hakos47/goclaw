import { useHttp } from "../../../lib/state/ws.svelte";

export type SkillVisibility = "public" | "internal" | "private";

export interface SkillWithGrant {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: SkillVisibility;
  is_system: boolean;
  granted: boolean;
}

export function useAgentSkills(getAgentId: () => string) {
  const http = useHttp();
  
  let skills = $state<SkillWithGrant[]>([]);
  let loading = $state(true);
  
  async function load() {
    const agentId = getAgentId();
    if (!agentId) return;
    loading = true;
    try {
      const res = await http.get<{ skills: SkillWithGrant[] }>(`/v1/agents/${agentId}/skills`);
      skills = res.skills ?? [];
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (getAgentId()) load();
  });

  async function grantSkill(skillId: string) {
    const agentId = getAgentId();
    const idx = skills.findIndex(s => s.id === skillId);
    if (idx !== -1) skills[idx].granted = true; // Optimistic
    try {
      await http.post(`/v1/skills/${skillId}/grants/agent`, { agent_id: agentId });
      // Reload maybe?
    } catch (e) {
      if (idx !== -1) skills[idx].granted = false; // Rollback
      throw e;
    }
  }

  async function revokeSkill(skillId: string) {
    const agentId = getAgentId();
    const idx = skills.findIndex(s => s.id === skillId);
    if (idx !== -1) skills[idx].granted = false; // Optimistic
    try {
      await http.delete(`/v1/skills/${skillId}/grants/agent/${agentId}`);
    } catch (e) {
      if (idx !== -1) skills[idx].granted = true; // Rollback
      throw e;
    }
  }

  return {
    get skills() { return skills; },
    get loading() { return loading; },
    grantSkill,
    revokeSkill,
    refresh: load
  };
}
