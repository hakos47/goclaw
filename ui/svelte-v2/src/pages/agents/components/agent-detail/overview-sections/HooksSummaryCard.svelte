<script lang="ts">
  import { Webhook, ChevronDown, ChevronUp, Plus, Settings2 } from "lucide-svelte";
  import { useHooksList } from "../../../hooks/use-hooks.svelte.ts";
  import { _ } from "svelte-i18n";

  type Props = {
    agentId: string;
    onViewAll: () => void;
    onAddHook: () => void;
  };

  let { agentId, onViewAll, onAddHook }: Props = $props();

  let expanded = $state(false);
  let hooksManager = useHooksList({ agentId, scope: "agent" });

  let groupedByEvent = $derived.by(() => {
    const groups: Record<string, number> = {};
    for (const h of hooksManager.hooks) {
      groups[h.event] = (groups[h.event] || 0) + 1;
    }
    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  });

  const totalCount = $derived(hooksManager.hooks.length);

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

<div class="relative group p-6 rounded-3xl bg-[#050505]/80 backdrop-blur-3xl border border-white/10 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_40px_rgba(168,85,247,0.15)] hover:border-white/20 overflow-hidden mt-6">
  <!-- Animated cyber background grid -->
  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

  <div class="relative z-10">
  {#if hooksManager.loading}
    <div class="flex items-center gap-2">
      <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-transparent"></div>
      <span class="text-[10px] text-white/50 uppercase tracking-widest font-bold">Scanning Webhooks...</span>
    </div>
  {:else if totalCount === 0}
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-2">
        <Webhook class="h-4 w-4 text-white/40" />
        <div>
          <h3 class="text-xs font-bold text-white/50 uppercase tracking-[0.2em] leading-tight">Lifecycle Hooks</h3>
          <p class="text-[9px] text-white/30 max-w-[200px] mt-1">Bind custom command or HTTP triggers to this agent's lifecycle events.</p>
        </div>
      </div>
      <button 
        onclick={onAddHook}
        class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all outline-none"
      >
        <Plus class="h-3 w-3 text-white/60" />
        <span class="text-[10px] font-bold text-white/60 uppercase tracking-widest">Connect</span>
      </button>
    </div>
  {:else}
    <div class="space-y-4">
      <button
        type="button"
        onclick={() => expanded = !expanded}
        class="flex w-full items-center justify-between outline-none"
      >
        <div class="flex items-center gap-2">
          <Webhook class="h-4 w-4 text-white" />
          <h3 class="text-xs font-bold text-white uppercase tracking-[0.2em]">Lifecycle Hooks</h3>
        </div>
        <div class="flex items-center gap-2">
          <span class="rounded-full px-2 py-0.5 bg-white/10 text-[10px] font-bold text-white border border-white/5">
            {totalCount} Active
          </span>
          {#if expanded}
            <ChevronUp class="h-4 w-4 text-white/40" />
          {:else}
            <ChevronDown class="h-4 w-4 text-white/40" />
          {/if}
        </div>
      </button>

      {#if expanded}
        <div class="space-y-2 pt-2 border-t border-white/10">
          {#each groupedByEvent as [event, count] (event)}
            <div class="flex items-center justify-between">
              <span class={`rounded text-[9px] font-bold px-1.5 py-0.5 border uppercase tracking-widest ${getEventColor(event)}`}>
                {event}
              </span>
              <span class="text-[10px] text-white/40 font-mono font-bold">
                {count} bindings
              </span>
            </div>
          {/each}
        </div>

        <div class="pt-2 flex items-center gap-2">
          <button
            onclick={onViewAll}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors group outline-none"
          >
            <Settings2 class="h-3 w-3 group-hover:text-white transition-colors" />
            <span class="text-[10px] font-bold uppercase tracking-widest">Manage All Configs</span>
          </button>
        </div>
      {/if}
    </div>
  {/if}
  </div>
</div>
