<script lang="ts">
  import { Timer, Monitor, Database, Wrench, Radio, Users, CheckCircle2, XCircle, Minus, Tag } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import NexusCard from "../shared/NexusCard.svelte";

  type Props = {
    health: any;
    liveUptime: string;
    enabledProviderCount: number;
    sessions: number;
    clientCount: number;
    channelEntries: any[];
    runtimeEntries?: any[];
  };

  let { health, liveUptime, enabledProviderCount, sessions, clientCount, channelEntries = [], runtimeEntries = [] }: Props = $props();

  let degradedCount = $derived(channelEntries.filter(([, ch]) => ch.state === "degraded").length);
  let failedCount = $derived(channelEntries.filter(([, ch]) => ch.state === "failed").length);

  function getStatusColor(ok?: boolean) {
    if (ok === undefined) return "text-white/40";
    return ok ? "text-emerald-500" : "text-red-500";
  }
</script>

<NexusCard
  title={$_('overview.systemHealth.title', { default: "System Health Matrix" })}
  subtitle="Core Diagnostics"
  icon={Monitor}
  iconColorClass="text-goclaw-neon-cyan"
  iconBgClass="bg-goclaw-neon-cyan/10 border-goclaw-neon-cyan/20"
  pattern="diagonal"
  noPadding={true}
>
  {#snippet headerActions()}
    {#if health?.version}
      <div class="flex items-center gap-3 px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg shadow-inner">
        <div class="flex items-center gap-1.5 text-xs text-white/50 font-mono">
          <Tag class="h-3 w-3" />
          <span class="text-white/80">{health.version}</span>
        </div>
        {#if health.updateAvailable === false}
          <div class="w-[1px] h-3 bg-white/10"></div>
          <span class="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            <CheckCircle2 class="h-3 w-3" /> Up to date
          </span>
        {:else if health.updateAvailable && health.latestVersion}
          <div class="w-[1px] h-3 bg-white/10"></div>
          <span class="flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
            {health.latestVersion} Available
          </span>
        {/if}
      </div>
    {/if}
  {/snippet}

  <div class="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y divide-white/5 border-b border-white/5">
    
    <!-- Cell: Uptime -->
    <div class="p-4 hover:bg-white/[0.02] transition-colors flex flex-col justify-between">
      <div class="flex items-center gap-2 mb-3 opacity-50">
        <Timer class="h-3.5 w-3.5" />
        <span class="text-[9px] font-bold uppercase tracking-widest">Uptime</span>
      </div>
      <div class="text-lg font-mono font-bold text-white drop-shadow-md">{liveUptime}</div>
    </div>

    <!-- Cell: Database -->
    <div class="p-4 hover:bg-white/[0.02] transition-colors flex flex-col justify-between">
      <div class="flex items-center gap-2 mb-3 opacity-50">
        <Database class="h-3.5 w-3.5" />
        <span class="text-[9px] font-bold uppercase tracking-widest">Database</span>
      </div>
      <div class="flex items-center gap-2">
        <div class={`w-1.5 h-1.5 rounded-full ${health?.database === "ok" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"}`}></div>
        <span class={`text-sm font-bold uppercase tracking-widest ${health?.database === "ok" ? "text-emerald-400" : "text-red-400"}`}>
          {health?.database === "ok" ? "Online" : health?.database || "Offline"}
        </span>
      </div>
    </div>

    <!-- Cell: Providers -->
    <div class="p-4 hover:bg-white/[0.02] transition-colors flex flex-col justify-between">
      <div class="flex items-center gap-2 mb-3 opacity-50">
        <Radio class="h-3.5 w-3.5" />
        <span class="text-[9px] font-bold uppercase tracking-widest">Providers</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-lg font-mono font-bold text-white">{enabledProviderCount}</span>
        <span class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Active</span>
      </div>
    </div>

    <!-- Cell: Tools -->
    <div class="p-4 hover:bg-white/[0.02] transition-colors flex flex-col justify-between">
      <div class="flex items-center gap-2 mb-3 opacity-50">
        <Wrench class="h-3.5 w-3.5" />
        <span class="text-[9px] font-bold uppercase tracking-widest">Tools</span>
      </div>
      <div class="text-lg font-mono font-bold text-white">{health?.tools ?? 0}</div>
    </div>

    <!-- Cell: Sessions -->
    <div class="p-4 hover:bg-white/[0.02] transition-colors flex flex-col justify-between">
      <div class="flex items-center gap-2 mb-3 opacity-50">
        <Monitor class="h-3.5 w-3.5" />
        <span class="text-[9px] font-bold uppercase tracking-widest">Sessions</span>
      </div>
      <div class="text-lg font-mono font-bold text-white">{sessions}</div>
    </div>

    <!-- Cell: Clients -->
    <div class="p-4 hover:bg-white/[0.02] transition-colors flex flex-col justify-between">
      <div class="flex items-center gap-2 mb-3 opacity-50">
        <Users class="h-3.5 w-3.5" />
        <span class="text-[9px] font-bold uppercase tracking-widest">Clients</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-1.5 h-1.5 rounded-full bg-goclaw-neon-purple shadow-[0_0_8px_rgba(217,70,239,0.8)] animate-pulse"></div>
        <span class="text-lg font-mono font-bold text-goclaw-neon-purple">{clientCount}</span>
      </div>
    </div>

  </div>

  <!-- Terminal Output Section for Runtimes & Channels -->
  <div class="relative z-10 bg-black/60 p-5 md:p-6 font-mono text-xs">
    <div class="flex flex-col md:flex-row md:divide-x divide-white/10 gap-6 md:gap-0">
      
      {#if runtimeEntries && runtimeEntries.length > 0}
        <div class="flex-1 md:pr-6">
          <p class="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] mb-4">Runtime Environments</p>
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4">
            {#each runtimeEntries as rt}
              <div class="flex items-center gap-2 group/rt">
                <span class={`w-1 h-3 rounded-full ${rt.available ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.6)]" : "bg-red-500/50"}`}></span>
                <span class={`font-bold transition-colors ${rt.available ? "text-white" : "text-white/30 line-through"}`}>{rt.name}</span>
                {#if rt.version}
                  <span class="text-white/40 text-[10px] ml-auto group-hover/rt:text-white/80 transition-colors">{rt.version}</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if channelEntries.length > 0}
        <div class="flex-1 md:pl-6">
          <p class="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] mb-4">Channel Uplinks</p>
          <div class="flex flex-wrap gap-2">
            {#each channelEntries as [name, ch]}
              <div class="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                <div class={`w-1.5 h-1.5 rounded-full ${ch.enabled && ch.running ? "bg-goclaw-neon-cyan shadow-[0_0_5px_rgba(6,182,212,0.8)] animate-pulse" : "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"}`}></div>
                <span class="text-[10px] font-bold tracking-wider text-white/70">{name}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
    </div>
  </div>
</NexusCard>