<script lang="ts">
  import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { cn } from "$lib/utils";
  import type { ChannelRuntimeStatus } from "$lib/types/channel";
  import type { ChannelStatusMeta, ChannelRemediationMeta } from "../status-utils";

  type Props = {
    status: ChannelRuntimeStatus;
    statusMeta: ChannelStatusMeta;
    remediation: ChannelRemediationMeta | null;
    checkedLabel: string | null;
    diagnosticsHint: string;
    timelineItems: Array<{ label: string; value: string }>;
    onRemediationAction: () => void;
  };

  let {
    status,
    statusMeta,
    remediation,
    checkedLabel,
    diagnosticsHint,
    timelineItems,
    onRemediationAction,
  }: Props = $props();

  let detailsOpen = $state(false);
</script>

<div
  class={cn(
    "rounded-[2rem] border p-6 shadow-2xl relative overflow-hidden transition-all duration-500",
    statusMeta.surfaceClass,
  )}
>
  <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none"></div>

  <div class="grid gap-8 lg:grid-cols-[1fr_260px] relative z-10">
    <div class="space-y-6">
      <div class="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] opacity-50">
        <AlertTriangle class="h-4 w-4" />
        <span>{$_('channels.detail.whatHappened', { default: "What happened" })}</span>
      </div>
      
      <div>
        <h3 class="text-xl font-bold text-white tracking-tight">
          {status.summary || statusMeta.label}
        </h3>
        <p class="mt-2 text-sm text-white/50 leading-relaxed max-w-xl">
          {status.remediation?.headline || diagnosticsHint}
        </p>
      </div>

      <div class="pt-4 border-t border-white/5">
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">
          {$_('channels.detail.recommendedAction', { default: "Recommended action" })}
        </p>
        
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex-1">
            <p class="text-sm font-bold text-white">
              {remediation?.label || $_('channels.actions.inspect', { default: "Inspect issue" })}
            </p>
            <p class="mt-1 text-xs text-white/40 font-mono">
              {diagnosticsHint}
            </p>
          </div>
          
          {#if remediation && remediation.target !== "details"}
            <button
              onclick={onRemediationAction}
              class="px-6 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              {remediation.label}
            </button>
          {/if}
        </div>
      </div>

      {#if status.detail}
        <div class="pt-2">
          <button 
            onclick={() => detailsOpen = !detailsOpen}
            class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
          >
            {#if detailsOpen}
              <ChevronUp class="w-3.5 h-3.5" />
            {:else}
              <ChevronDown class="w-3.5 h-3.5" />
            {/if}
            {$_('channels.detail.technicalDetail', { default: "Technical detail" })}
          </button>
          
          {#if detailsOpen}
            <div class="mt-3 p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-white/40 break-all leading-relaxed animate-in slide-in-from-top-2 duration-300">
              {status.detail}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="lg:border-l lg:border-white/5 lg:pl-8 space-y-6">
      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
        {$_('channels.detail.timeline.title', { default: "Timeline" })}
      </p>
      
      <div class="space-y-3">
        {#if timelineItems.length > 0}
          {#each timelineItems as item}
            <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
              <span class="text-[9px] font-black uppercase tracking-widest text-white/20">
                {item.label}
              </span>
              <span class="text-xs font-bold text-white/80 tabular-nums">
                {item.value}
              </span>
            </div>
          {/each}
        {:else}
          <div class="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-white/20 uppercase tracking-widest leading-loose">
            {checkedLabel || $_('channels.detail.timeline.noData', { default: "No recent channel checks recorded yet." })}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
