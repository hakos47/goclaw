<script lang="ts">
  import { Shield, X, Plus, Trash2, Server } from "lucide-svelte";
  import { fetchCliGrants, createCliGrant, deleteCliGrant, type SecureCLIBinary, type CLIAgentGrant } from "$lib/state/cli-credentials.svelte";
  import { agentsState } from "$lib/state/agents.svelte";
  import { fade, scale } from "svelte/transition";

  type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    binary: SecureCLIBinary;
  };

  let { open, onOpenChange, binary }: Props = $props();

  let grants = $state<CLIAgentGrant[]>([]);
  let loading = $state(true);
  let errorMsg = $state("");
  let adding = $state(false);

  // New grant inputs
  let selectedAgent = $state("");
  let newDenyArgs = $state("");

  async function loadData() {
    loading = true;
    try {
      grants = await fetchCliGrants(binary.id);
    } catch (e: any) {
      errorMsg = e.message;
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (open && binary) {
      loadData();
    }
  });

  async function handleAdd() {
    if (!selectedAgent) return;
    adding = true;
    errorMsg = "";
    try {
      await createCliGrant(binary.id, {
        agent_id: selectedAgent,
        deny_args: newDenyArgs ? newDenyArgs.split(",").map(s => s.trim()) : null,
      });
      selectedAgent = "";
      newDenyArgs = "";
      await loadData();
    } catch (e: any) {
      errorMsg = e.message;
    } finally {
      adding = false;
    }
  }

  async function handleDelete(grantId: string) {
    try {
      await deleteCliGrant(binary.id, grantId);
      await loadData();
    } catch (e: any) {
      errorMsg = e.message;
    }
  }

  function getAgentName(id: string) {
    return agentsState.agents.find(a => a.id === id)?.name || id;
  }
</script>

{#if open}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-xl" onclick={() => onOpenChange(false)}></div>

    <div class="relative bg-gradient-to-br from-[#030014]/95 to-[#1a0033]/90 border border-white/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8),inset_0_2px_20px_rgba(0,0,0,0.5)] flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden" in:scale={{start: 0.95}} out:scale={{start: 0.95}}>
      
      <div class="absolute -top-32 -right-32 w-64 h-64 bg-magenta-500/20 blur-[100px] pointer-events-none"></div>

      <div class="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-magenta-500/10 text-magenta-400 border border-magenta-500/30">
            <Shield class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-xs font-black text-white/90 tracking-[0.3em] uppercase">Agent Grants</h2>
            <div class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">{binary.binary_name}</div>
          </div>
        </div>
        <button onclick={() => onOpenChange(false)} class="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors border border-white/5">
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
        {#if binary.is_global}
          <div class="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400 font-mono">
            This binary is marked as GLOBAL. All agents have access to it. Grants here are ignored unless you restrict the binary.
          </div>
        {/if}

        {#if errorMsg}
          <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-black uppercase tracking-widest text-red-400">
            {errorMsg}
          </div>
        {/if}

        <div class="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
          <h3 class="text-[10px] font-black uppercase tracking-widest text-white/80">Grant Access to Agent</h3>
          <div class="flex flex-col md:flex-row gap-3 items-end">
            <div class="flex-1 w-full space-y-2">
              <label class="text-[9px] font-mono text-white/50">Agent</label>
              <select bind:value={selectedAgent} class="w-full h-10 px-3 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-xs outline-none focus:border-magenta-500/50 appearance-none">
                <option value="" disabled>Select agent...</option>
                {#each agentsState.agents as agent}
                  <option value={agent.id}>{agent.name}</option>
                {/each}
              </select>
            </div>
            <div class="flex-1 w-full space-y-2">
              <label class="text-[9px] font-mono text-white/50">Extra Deny Args (Optional)</label>
              <input type="text" bind:value={newDenyArgs} placeholder="e.g. destroy" class="w-full h-10 px-3 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-xs outline-none focus:border-magenta-500/50" />
            </div>
            <button onclick={handleAdd} disabled={adding || !selectedAgent} class="h-10 px-4 rounded-xl bg-magenta-500/10 border border-magenta-500/30 text-magenta-400 hover:bg-magenta-500/20 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Plus class="h-4 w-4" /> Add
            </button>
          </div>
        </div>

        {#if loading}
          <div class="flex justify-center p-8"><Server class="h-6 w-6 animate-spin text-white/30" /></div>
        {:else if grants.length === 0}
          <div class="text-center p-8 border border-white/5 border-dashed rounded-xl text-[10px] font-mono text-white/30 uppercase">No agents explicitly granted.</div>
        {:else}
          <div class="space-y-2">
            {#each grants as grant (grant.id)}
              <div class="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
                <div>
                  <div class="font-bold text-sm text-magenta-400">{getAgentName(grant.agent_id)}</div>
                  {#if grant.deny_args && grant.deny_args.length > 0}
                    <div class="text-[10px] font-mono text-white/40 mt-1">Blocked: {grant.deny_args.join(", ")}</div>
                  {/if}
                </div>
                <button onclick={() => handleDelete(grant.id)} class="p-2 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    </div>
  </div>
{/if}
