<script lang="ts">
  import { Radio, Trash2, QrCode, ExternalLink, Bot } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import type { ChannelInstanceData, ChannelRuntimeStatus } from "$lib/types/channel";
  import { 
    getChannelStatusMeta, 
    getRenderableChannelStatus,
    getChannelFailureKindLabel,
    getChannelCheckedLabel,
    getChannelRemediationMeta
  } from "../status-utils";

  type Props = {
    instance: ChannelInstanceData;
    status?: ChannelRuntimeStatus | null;
    agentName: string;
    onClick: () => void;
    onDelete?: () => void;
    onAuth?: () => void;
  };

  let { instance, status, agentName, onClick, onDelete, onAuth }: Props = $props();

  let displayName = $derived(instance.display_name || instance.name);
  
  let renderableStatus = $derived(getRenderableChannelStatus(status, instance));
  let statusMeta = $derived(getChannelStatusMeta(renderableStatus, instance.enabled));
  let checkedLabel = $derived(getChannelCheckedLabel(renderableStatus));
  let remediation = $derived(getChannelRemediationMeta(renderableStatus, true));
  let failureKindLabel = $derived(renderableStatus?.failure_kind ? getChannelFailureKindLabel(renderableStatus.failure_kind) : null);
</script>

<div class="group relative bg-[#030014]/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-goclaw-neon-purple/30 hover:shadow-[0_0_30px_rgba(217,70,239,0.1)]">
  <!-- Shimmer effect on hover -->
  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none"></div>

  <div class="flex items-stretch p-4 sm:p-5">
    <button 
      type="button" 
      class="flex-1 text-left flex items-center gap-4 focus:outline-none min-w-0"
      onclick={onClick}
    >
      <!-- Channel Icon -->
      <div class="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[#030014] border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-500 shrink-0">
        <Radio class="w-6 h-6 text-white/40 group-hover:text-goclaw-neon-purple transition-colors" />
        <div class="absolute -right-1 -top-1 w-3 h-3 rounded-full {statusMeta.dotClass} border-2 border-[#030014] shadow-[0_0_8px_rgba(255,255,255,0.1)]"></div>
      </div>

      <div class="flex-1 min-w-0 grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(180px,0.7fr)] items-center">
        
        <!-- Col 1: Basic Info -->
        <div class="min-w-0 flex flex-col justify-center">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            <h3 class="text-sm font-bold text-white tracking-tight truncate group-hover:text-goclaw-neon-purple transition-colors">
              {displayName}
            </h3>
            <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 group-hover:text-white/60 transition-colors">
              {instance.channel_type}
            </span>
            {#if instance.is_default}
              <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-goclaw-neon-cyan/10 border border-goclaw-neon-cyan/30 text-goclaw-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                Default
              </span>
            {/if}
          </div>

          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-white/30 uppercase tracking-wider">
            <span class="font-mono truncate max-w-[100px]">{instance.name}</span>
            <span class="text-white/10">•</span>
            <span class="truncate max-w-[100px]">{agentName}</span>
            {#if instance.channel_type === "whatsapp" && (instance.config as any)?.owner_jid}
              <span class="text-white/10">•</span>
              <span class="flex items-center gap-1">
                <span class="font-black opacity-70">Owner:</span>
                <span class="font-mono lowercase text-white/50">{String((instance.config as any).owner_jid).includes("***") ? String((instance.config as any).owner_jid) : "********"}</span>
              </span>
            {/if}
          </div>
        </div>

        <!-- Col 2: Status Summary -->
        <div class="min-w-0 flex-col justify-center gap-1 hidden md:flex">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border {statusMeta.surfaceClass} {statusMeta.dotClass.replace('bg-', 'text-')} transition-all">
              {statusMeta.label}
            </span>
            {#if failureKindLabel && instance.enabled}
              <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-400">
                {failureKindLabel}
              </span>
            {/if}
          </div>
          
          {#if renderableStatus?.summary}
             <p class="text-xs font-medium text-white/80 truncate mt-0.5">{renderableStatus.summary}</p>
          {/if}
          
          {#if checkedLabel}
             <p class="text-[9px] font-mono text-white/30 uppercase tracking-widest truncate">{checkedLabel}</p>
          {/if}
        </div>

        <!-- Col 3: Next Step -->
        <div class="min-w-0 flex-col justify-center gap-1 hidden lg:flex">
           <p class="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">Next Step</p>
           <p class="text-xs font-bold text-white/80 truncate mt-0.5">{remediation?.label || 'Inspect Issue'}</p>
           <p class="text-[9px] font-mono text-white/40 uppercase tracking-widest truncate">{remediation?.headline || 'Open channel detail for the latest diagnosis'}</p>
        </div>
        
      </div>
    </button>

    <div class="flex items-center gap-2 ml-4">
      {#if onAuth}
        <button 
          onclick={(e) => { e.stopPropagation(); onAuth(); }}
          class="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-goclaw-neon-cyan hover:bg-goclaw-neon-cyan/10 hover:border-goclaw-neon-cyan/30 transition-all duration-300"
          title="Authenticate"
        >
          <QrCode class="w-4 h-4" />
        </button>
      {/if}

      {#if onDelete && !instance.is_default}
        <button 
          onclick={(e) => { e.stopPropagation(); onDelete(); }}
          class="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300"
          title="Delete"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      {/if}

      <button 
        onclick={(e) => { e.stopPropagation(); onClick(); }}
        class="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-goclaw-neon-purple hover:bg-goclaw-neon-purple/10 hover:border-goclaw-neon-purple/30 transition-all duration-300"
      >
        <ExternalLink class="w-4 h-4" />
      </button>
    </div>
  </div>
</div>
