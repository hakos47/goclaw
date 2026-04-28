<script lang="ts">
  import { Users } from "lucide-svelte";
  import { Radio } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { formatRelativeTime } from "$lib/format";

  type Props = {
    clients: any[];
    currentId?: string;
  };

  let { clients = [], currentId }: Props = $props();
</script>

<div class="relative overflow-hidden bg-[#030014]/40 backdrop-blur-3xl border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-3xl group flex flex-col h-full">
  
  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-20"></div>

  <div class="relative z-10 flex items-center justify-between p-5 md:p-6 border-b border-white/5">
    <div class="flex items-center gap-3">
      <div class="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Users class="h-5 w-5 text-blue-400" />
      </div>
      <div>
        <h3 class="text-sm font-bold uppercase tracking-[0.2em] text-white">{$_('overview.connectedClients.title', { default: "Uplink Radar" })}</h3>
        <p class="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">Active Connections</p>
      </div>
    </div>
    <div class="px-3 py-1 bg-black/50 border border-white/10 rounded-lg shadow-inner flex items-center gap-2">
      <div class="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>
      <span class="text-xs font-mono font-bold text-blue-400">{clients.length}</span>
    </div>
  </div>

  <div class="relative z-10 flex-1 p-5 md:p-6 overflow-y-auto">
    {#if clients.length === 0}
      <div class="flex flex-col items-center justify-center h-full py-8 opacity-50">
        <Radio class="h-8 w-8 text-white/20 mb-3" />
        <span class="text-xs font-mono uppercase tracking-widest text-white/40">{$_('overview.connectedClients.noClients', { default: "No signals detected" })}</span>
      </div>
    {:else}
      <div class="space-y-3">
        {#each clients as c}
          {@const isYou = c.id === currentId}
          <div class={`relative flex items-center justify-between p-4 rounded-xl border backdrop-blur-md transition-all duration-300 ${isYou ? 'bg-goclaw-neon-cyan/5 border-goclaw-neon-cyan/30 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/15'}`}>
            
            {#if isYou}
              <div class="absolute left-0 top-0 bottom-0 w-1 bg-goclaw-neon-cyan rounded-l-xl shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
            {/if}

            <div class="flex items-center gap-4 pl-2">
              <div class="flex flex-col">
                <div class="flex items-center gap-2 mb-1">
                  <span class={`text-[13px] font-mono font-bold ${isYou ? 'text-goclaw-neon-cyan drop-shadow-[0_0_5px_currentColor]' : 'text-white/80'}`}>{c.remoteAddr}</span>
                  {#if isYou}
                    <span class="text-[9px] font-black uppercase tracking-wider text-[#030014] bg-goclaw-neon-cyan px-1.5 py-0.5 rounded-sm">{$_('overview.connectedClients.you', { default: "YOU" })}</span>
                  {/if}
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-[10px] font-mono uppercase tracking-widest text-white/40">{c.userId ? (c.userId === 'system' ? 'System' : c.userId) : "ANONYMOUS"}</span>
                  <div class="w-1 h-1 rounded-full bg-white/10"></div>
                  <span class={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${c.role === 'owner' ? 'bg-goclaw-neon-purple/20 text-goclaw-neon-purple border-goclaw-neon-purple/30' : 'bg-white/5 text-white/50 border-white/10'}`}>
                    {c.role || "user"}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-col items-end gap-1">
              <span class="text-[9px] font-bold uppercase tracking-widest text-white/30">Connected</span>
              <span class="text-[10px] font-mono text-white/60">{formatRelativeTime(c.connectedAt)}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>