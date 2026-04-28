<script lang="ts">
  import { Radio, Trash2, QrCode, ExternalLink, Bot } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import type { ChannelInstanceData, ChannelRuntimeStatus } from "$lib/types/channel";
  import { getChannelStatusMeta, getRenderableChannelStatus } from "../status-utils";

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
</script>

<div class="group relative bg-[#030014]/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden transition-all duration-500 hover:border-goclaw-neon-purple/30 hover:shadow-[0_0_30px_rgba(217,70,239,0.1)]">
  <!-- Shimmer effect on hover -->
  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none"></div>

  <div class="flex items-stretch p-4 sm:p-5">
    <button 
      type="button" 
      class="flex-1 text-left flex items-start gap-4 focus:outline-none"
      onclick={onClick}
    >
      <!-- Channel Icon -->
      <div class="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[#030014] border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
        <Radio class="w-6 h-6 text-white/40 group-hover:text-goclaw-neon-purple transition-colors" />
        <div class="absolute -right-1 -top-1 w-3 h-3 rounded-full {statusMeta.dotClass} border-2 border-[#030014] shadow-[0_0_8px_rgba(255,255,255,0.1)]"></div>
      </div>

      <div class="flex-1 min-w-0">
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
          {#if renderableStatus?.state && renderableStatus.state !== 'healthy'}
             <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
               {statusMeta.label}
             </span>
          {/if}
        </div>


        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-white/30 uppercase tracking-wider">
          <div class="flex items-center gap-1.5">
            <span class="font-mono">{instance.name}</span>
          </div>
          <div class="w-1 h-1 rounded-full bg-white/10"></div>
          <div class="flex items-center gap-1.5">
            <Bot class="w-3 h-3 text-white/20" />
            <span class="truncate max-w-[120px]">{agentName}</span>
          </div>
        </div>
      </div>
    </button>

    <div class="flex items-center gap-2 ml-4">
      {#if onAuth && instance.has_credentials}
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
