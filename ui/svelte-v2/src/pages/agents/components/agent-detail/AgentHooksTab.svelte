<script lang="ts">
  import { Webhook, Plus } from "lucide-svelte";
  import { useHooksList, deleteHook } from "../../hooks/use-hooks.svelte.ts";
  import type { AgentData } from "../../../../lib/types/agent";
  import { useWs } from "../../../../lib/state/ws.svelte.ts";
  import AgentHookFormDialog from "./AgentHookFormDialog.svelte";

  type Props = {
    agentId: string;
  };

  let { agentId }: Props = $props();
  
  let hooksManager = useHooksList({ agentId, scope: "agent" });

  let totalCount = $derived(hooksManager.hooks.length);
  let isCreating = $state(false);

  function getEventColor(evt: string) {
    switch (evt) {
      case "session_start": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "user_prompt_submit": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "pre_tool_use": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "post_tool_use": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "stop": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "subagent_start": return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      case "subagent_stop": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default: return "bg-white/10 text-white/60 border-white/20";
    }
  }
</script>

<div class="relative z-20 group h-full flex flex-col p-6 rounded-3xl bg-gradient-to-br from-[#030014]/80 to-[#1a0033]/40 backdrop-blur-3xl border border-white/5 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_30px_rgba(168,85,247,0.1),0_0_40px_rgba(168,85,247,0.2)] hover:border-purple-500/30 mt-6">
  <!-- Ambient Neon Corner Glows -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

  <!-- Animated cyber background grid mask -->
  <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none mix-blend-screen">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] opacity-80"></div>
  </div>

  <div class="relative z-10 flex items-center justify-between gap-3 border-b border-white/10 pb-6">
    <div class="flex items-center gap-3">
      <div class="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
        <Webhook class="h-4 w-4 text-purple-400 animate-[pulse_3s_ease-in-out_infinite]" />
      </div>
      <div>
        <h2 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm">Lifecycle Hooks</h2>
        <p class="text-[10px] text-white/40 mt-1 max-w-[400px]">Intercept events during the execution lifecycle of this agent to trigger synchronous actions.</p>
      </div>
    </div>
    <button onclick={() => isCreating = true} class="shrink-0 flex items-center gap-2 h-9 px-5 rounded-xl bg-purple-500 hover:bg-purple-400 text-black font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] border border-purple-400 relative overflow-hidden group">
      <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
      <Plus class="h-3.5 w-3.5 relative z-10" strokeWidth={3} />
      <span class="relative z-10">Connect Native Bindings</span>
    </button>
  </div>

  <div class="relative z-10 flex-1">
    {#if hooksManager.loading}
      <div class="h-32 flex items-center justify-center border border-white/5 rounded-2xl bg-white/[0.02] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        <span class="text-[10px] uppercase font-bold tracking-widest text-purple-400/50 animate-pulse">Scanning Registry...</span>
      </div>
    {:else if totalCount === 0}
      <div class="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
        <Webhook class="h-8 w-8 text-white/20 mb-3" />
        <h3 class="text-xs font-bold text-white/50 uppercase tracking-[0.2em] mb-1">No Active Hooks</h3>
        <p class="text-[9px] text-white/30 text-center max-w-[250px]">To automate workflows or script logic internally, tap Add Binding above.</p>
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        <p class="text-[10px] font-bold text-white/40 uppercase tracking-widest bg-black/40 p-2 rounded-xl border border-white/5 mb-2 inline-block shadow-inner w-fit">Global Migration Note: Individual configurations operate temporarily in read-only visual mode while Hook Editor components are ported.</p>
        {#each hooksManager.hooks as hook (hook.id)}
          <div class="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors border border-white/5 hover:border-white/10 flex items-center justify-between group overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
            <div class="flex items-center gap-4 w-full overflow-hidden">
              <span class={`shrink-0 rounded text-[10px] font-bold px-2 py-1 border uppercase tracking-widest ${getEventColor(hook.event)}`}>
                {hook.event}
              </span>
              <div class="min-w-0 flex-1">
                 <h4 class="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">{hook.name || "Unnamed Binding"}</h4>
                 <p class="text-[10px] text-white/40 truncate font-mono mt-0.5">ID: {hook.id} // Handler: <span class="text-white/60">{hook.handler_type}</span></p>
              </div>
              <div class="shrink-0 flex items-center gap-3">
                <span class="text-[9px] font-bold text-white/30 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-md border border-white/5">
                  Source: {hook.source}
                </span>
                <button class={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${hook.enabled ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]'}`}>
                  <span class={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${hook.enabled ? 'translate-x-5' : 'translate-x-1'}`}></span>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <AgentHookFormDialog
    agentId={agentId}
    open={isCreating}
    onOpenChange={v => isCreating = v}
    onSaveSuccess={() => hooksManager.refresh()}
  />
</div>
