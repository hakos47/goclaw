<script lang="ts">
  import { onMount } from "svelte";
  import { ShieldAlert, Trash2, Plus, Pencil, Loader2, KeyRound, Lock, Unlock } from "lucide-svelte";
  import { agentsState, loadAgents } from "../../../agents/hooks/use-agents.svelte";
  import { useMCP, type MCPServerData, type MCPAgentGrant, type MCPToolInfo } from "../../hooks/use-mcp.svelte";

  let {
    open,
    onOpenChange,
    server
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    server: MCPServerData;
  } = $props();


  const { listAgentGrants, listServerTools, grantAgent, revokeAgent } = useMCP();

  let grants = $state<MCPAgentGrant[]>([]);
  let serverTools = $state<MCPToolInfo[]>([]);
  let loading = $state(false);
  let error = $state("");

  // Form State
  let agentId = $state("");
  let toolAllow = $state<string[]>([]);
  let toolDeny = $state<string[]>([]);
  let editingGrantId = $state<string | null>(null);

  // Multi-select state
  let allowDropdownOpen = $state(false);
  let denyDropdownOpen = $state(false);

  let agentNameMap = $derived(() => {
    const map = new Map<string, string>();
    for (const a of agentsState.agents) map.set(a.id, a.display_name || a.agent_key);
    return map;
  });

  onMount(async () => {
    if (open) {
      loading = true;
      try {
        loadAgents(); // Fire and forget
        const [existingGrants, tools] = await Promise.all([
          listAgentGrants(server.id).catch(() => []),
          listServerTools(server.id).catch(() => []),
        ]);
        grants = existingGrants;
        serverTools = tools;
      } finally {
        loading = false;
      }
    }
  });

  function clearForm() {
    agentId = "";
    toolAllow = [];
    toolDeny = [];
    editingGrantId = null;
    error = "";
  }

  function selectGrant(grant: MCPAgentGrant) {
    agentId = grant.agent_id;
    toolAllow = Array.isArray(grant.tool_allow) ? [...grant.tool_allow] : [];
    toolDeny = Array.isArray(grant.tool_deny) ? [...grant.tool_deny] : [];
    editingGrantId = grant.id;
    error = "";
  }

  async function handleGrant() {
    if (!agentId) { error = "An agent must be selected."; return; }
    loading = true;
    error = "";
    try {
      const allow = toolAllow.length > 0 ? toolAllow : undefined;
      const deny = toolDeny.length > 0 ? toolDeny : undefined;
      await grantAgent(server.id, agentId, allow, deny);
      
      const existing = grants.find((g) => g.agent_id === agentId);
      if (existing) {
        grants = grants.map((g) => g.agent_id === agentId ? { ...g, tool_allow: allow ?? null, tool_deny: deny ?? null } : g);
      } else {
        grants = [...grants, {
          id: crypto.randomUUID(),
          server_id: server.id,
          agent_id: agentId,
          enabled: true,
          tool_allow: allow ?? null,
          tool_deny: deny ?? null,
          granted_by: "",
          created_at: new Date().toISOString(),
        }];
      }
      clearForm();
    } catch (err: any) {
      error = err.message || "Failed to save grant";
    } finally {
      loading = false;
    }
  }

  async function handleRevoke(grant: MCPAgentGrant) {
    loading = true;
    try {
      await revokeAgent(server.id, grant.agent_id);
      grants = grants.filter((g) => g.agent_id !== grant.agent_id);
    } catch (err: any) {
      error = err.message || "Failed to revoke grant";
    } finally {
      loading = false;
    }
  }

  function toggleToolSelection(tool: string, list: string[], setList: (v: string[]) => void) {
    if (list.includes(tool)) {
      setList(list.filter(t => t !== tool));
    } else {
      setList([...list, tool]);
    }
  }

  let isEditing = $derived(editingGrantId !== null);
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick={() => !loading && onOpenChange(false)}></div>
  
  <div class="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#030014] border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 p-6 border-b border-white/5 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-goclaw-neon-purple/5 rounded-full blur-[60px] pointer-events-none"></div>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-white/5 rounded-xl border border-white/10">
          <KeyRound class="h-5 w-5 text-goclaw-neon-purple" />
        </div>
        <div>
          <h2 class="text-xl font-black uppercase tracking-[0.2em] text-white">Agent Grants</h2>
          <p class="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">
            {server.display_name || server.name}
          </p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 relative">
      {#if error}
        <div class="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-inner">
          <ShieldAlert class="h-4 w-4" />
          {error}
        </div>
      {/if}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <!-- Left Column: Current Grants -->
        <div class="space-y-4">
          <h3 class="text-[10px] font-black text-goclaw-neon-purple uppercase tracking-[0.3em] flex items-center gap-2">
            <ShieldAlert class="h-3 w-3" /> Configured Agents
          </h3>
          
          {#if grants.length === 0}
            <div class="p-6 border border-dashed border-white/10 rounded-2xl bg-black/20 text-center">
              <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest">No agents granted access yet.</p>
            </div>
          {:else}
            <div class="space-y-2">
              {#each grants as grant}
                {@const hasAllow = grant.tool_allow && grant.tool_allow.length > 0}
                {@const hasDeny = grant.tool_deny && grant.tool_deny.length > 0}
                {@const isActive = editingGrantId === grant.id}
                
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div 
                  onclick={() => selectGrant(grant)}
                  class="p-4 rounded-2xl border transition-all cursor-pointer group {isActive ? 'bg-goclaw-neon-purple/10 border-goclaw-neon-purple/50 shadow-[0_0_20px_rgba(217,70,239,0.15)]' : 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/20'}"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-black uppercase tracking-widest text-white">{agentNameMap().get(grant.agent_id) || grant.agent_id}</span>
                        {#if isActive}
                          <Pencil class="h-3 w-3 text-goclaw-neon-purple" />
                        {/if}
                      </div>

                      <div class="mt-2 space-y-1">
                        {#if !hasAllow && !hasDeny}
                          <p class="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                            <Unlock class="h-3 w-3" /> All Tools Allowed
                          </p>
                        {:else}
                          {#if hasAllow}
                            <div class="flex flex-wrap gap-1">
                              <span class="text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-1.5 rounded border border-emerald-500/30">Allow</span>
                              {#each grant.tool_allow! as t}
                                <span class="text-[8px] font-mono text-white/50 bg-white/5 px-1.5 rounded">{t}</span>
                              {/each}
                            </div>
                          {/if}
                          {#if hasDeny}
                            <div class="flex flex-wrap gap-1">
                              <span class="text-[8px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 px-1.5 rounded border border-red-500/30">Deny</span>
                              {#each grant.tool_deny! as t}
                                <span class="text-[8px] font-mono text-white/50 bg-white/5 px-1.5 rounded">{t}</span>
                              {/each}
                            </div>
                          {/if}
                        {/if}
                      </div>
                    </div>
                    <button 
                      onclick={(e) => { e.stopPropagation(); handleRevoke(grant); }}
                      disabled={loading}
                      class="h-7 w-7 flex items-center justify-center shrink-0 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Right Column: Edit/Add Grant -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">
              {isEditing ? "Edit Access Rules" : "Grant Access"}
            </h3>
            {#if isEditing}
              <button 
                onclick={clearForm}
                class="text-[9px] font-bold text-white/40 hover:text-white uppercase tracking-widest"
              >
                Cancel Edit
              </button>
            {/if}
          </div>

          <div class="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative">
            
            <div class="space-y-2">
              <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Select Agent</label>
              <select 
                bind:value={agentId} 
                disabled={isEditing}
                class="w-full h-10 bg-black/60 border border-white/10 rounded-xl px-4 text-xs font-bold text-white uppercase tracking-widest outline-none transition-all disabled:opacity-50 appearance-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple"
              >
                <option value="" disabled>Choose an agent...</option>
                {#each agentsState.agents as a}
                  <option value={a.id}>{a.display_name || a.agent_key} ({a.agent_key})</option>
                {/each}
              </select>
            </div>

            <!-- Allow List Multi-Select -->
            <div class="space-y-2 relative">
              <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Allowed Tools (Whitelist)</label>
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div 
                onclick={() => { allowDropdownOpen = !allowDropdownOpen; denyDropdownOpen = false; }}
                class="w-full min-h-10 bg-black/60 border border-white/10 rounded-xl px-3 py-2 flex flex-wrap gap-1 items-center cursor-pointer hover:border-white/30 transition-colors {allowDropdownOpen ? 'border-goclaw-neon-purple' : ''}"
              >
                {#if toolAllow.length === 0}
                  <span class="text-xs font-mono text-white/20">All tools allowed (or use deny list)</span>
                {:else}
                  {#each toolAllow as t}
                    <span class="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                      {t}
                      <button onclick={(e) => { e.stopPropagation(); toggleToolSelection(t, toolAllow, v => toolAllow = v); }} class="hover:text-emerald-300">×</button>
                    </span>
                  {/each}
                {/if}
              </div>
              
              {#if allowDropdownOpen}
                <div class="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto custom-scrollbar bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl p-1">
                  {#if serverTools.length === 0}
                    <div class="p-3 text-xs text-center text-white/40">No tools fetched from server.</div>
                  {:else}
                    {#each serverTools as t}
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <!-- svelte-ignore a11y_no_static_element_interactions -->
                      <div 
                        onclick={() => toggleToolSelection(t.name, toolAllow, v => toolAllow = v)}
                        class="px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer flex items-center justify-between group"
                      >
                        <span class="text-xs font-mono text-white/70 group-hover:text-white transition-colors">{t.name}</span>
                        {#if toolAllow.includes(t.name)}
                          <CheckCircle2 class="h-3 w-3 text-emerald-400" />
                        {/if}
                      </div>
                    {/each}
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Deny List Multi-Select -->
            <div class="space-y-2 relative">
              <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Denied Tools (Blacklist)</label>
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div 
                onclick={() => { denyDropdownOpen = !denyDropdownOpen; allowDropdownOpen = false; }}
                class="w-full min-h-10 bg-black/60 border border-white/10 rounded-xl px-3 py-2 flex flex-wrap gap-1 items-center cursor-pointer hover:border-white/30 transition-colors {denyDropdownOpen ? 'border-goclaw-neon-purple' : ''}"
              >
                {#if toolDeny.length === 0}
                  <span class="text-xs font-mono text-white/20">No tools explicitly denied</span>
                {:else}
                  {#each toolDeny as t}
                    <span class="text-[9px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                      {t}
                      <button onclick={(e) => { e.stopPropagation(); toggleToolSelection(t, toolDeny, v => toolDeny = v); }} class="hover:text-red-300">×</button>
                    </span>
                  {/each}
                {/if}
              </div>
              
              {#if denyDropdownOpen}
                <div class="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto custom-scrollbar bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl p-1">
                  {#if serverTools.length === 0}
                    <div class="p-3 text-xs text-center text-white/40">No tools fetched from server.</div>
                  {:else}
                    {#each serverTools as t}
                      <!-- svelte-ignore a11y_click_events_have_key_events -->
                      <!-- svelte-ignore a11y_no_static_element_interactions -->
                      <div 
                        onclick={() => toggleToolSelection(t.name, toolDeny, v => toolDeny = v)}
                        class="px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer flex items-center justify-between group"
                      >
                        <span class="text-xs font-mono text-white/70 group-hover:text-white transition-colors">{t.name}</span>
                        {#if toolDeny.includes(t.name)}
                          <CheckCircle2 class="h-3 w-3 text-red-400" />
                        {/if}
                      </div>
                    {/each}
                  {/if}
                </div>
              {/if}
            </div>

            <button 
              type="button"
              onclick={handleGrant}
              disabled={loading || !agentId}
              class="w-full mt-2 py-2.5 rounded-xl border border-white/10 bg-goclaw-neon-purple/20 hover:bg-goclaw-neon-purple/30 text-white font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {#if loading}
                <Loader2 class="h-3.5 w-3.5 animate-spin" />
              {:else}
                {#if isEditing}
                  <Pencil class="h-3.5 w-3.5" /> Update Grant
                {:else}
                  <Plus class="h-3.5 w-3.5" /> Add Grant
                {/if}
              {/if}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Footer -->
    <div class="shrink-0 p-6 border-t border-white/5 bg-black/40 flex justify-end">
      <button 
        type="button"
        onclick={() => onOpenChange(false)}
        class="px-6 py-2.5 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/5 transition-all"
      >
        Close
      </button>
    </div>
  </div>
</div>

{#if allowDropdownOpen || denyDropdownOpen}
  <div class="fixed inset-0 z-40" onclick={() => { allowDropdownOpen = false; denyDropdownOpen = false; }}></div>
{/if}
