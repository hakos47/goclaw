<script lang="ts">
  import { Activity, Zap, Cpu, Hash, DollarSign, Radio, Bot, AlertTriangle, RefreshCw } from "lucide-svelte";
  import { onMount } from "svelte";
  import { initClients, useWsCall, wsState, useHttp } from "../lib/state/ws.svelte";
  import { useSparklines } from "../lib/state/use-sparklines.svelte";
  import PageHeader from "../lib/components/shared/PageHeader.svelte";
  import StatCard from "../lib/components/overview/StatCard.svelte";
  import SystemHealthCard from "../lib/components/overview/SystemHealthCard.svelte";
  import ConnectedClientsCard from "../lib/components/overview/ConnectedClientsCard.svelte";
  import CronJobsCard from "../lib/components/overview/CronJobsCard.svelte";
  import RecentRequestsCard from "../lib/components/overview/RecentRequestsCard.svelte";
  import QuotaUsageCard from "../lib/components/overview/QuotaUsageCard.svelte";
  import Usage from "./Usage.svelte";
  import { _ } from "svelte-i18n";

  let sparklines = useSparklines();
  let traces = $state<any[]>([]);

  // Data fetching setup
  onMount(() => { 
    initClients(); 
    sparklines.load(); // Fetch sparklines once on mount
  });
  
  const statusCall = useWsCall<any>("status");
  const quotaCall = useWsCall<any>("quota.usage");
  const cronCall = useWsCall<any>("cron.list");
  const channelsCall = useWsCall<any>("channels.status");
  const healthCall = useWsCall<any>("health");

  async function fetchTraces() {
    try {
      const http = useHttp();
      const res = await http.get<{ traces: any[] }>("/v1/traces", { limit: "8" });
      traces = res.traces || [];
    } catch (e) {
      console.error("Failed to load traces", e);
    }
  }

  onMount(() => {
    const fetchAll = () => {
      if (wsState.connected) {
        statusCall.call();
        quotaCall.call();
        cronCall.call({ includeDisabled: true });
        channelsCall.call();
        healthCall.call();
        fetchTraces();
      }
    };
    
    // Attempt initial fetch if already connected
    fetchAll();

    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  });

  $effect(() => {
    // React when connection establishes
    if (wsState.connected) {
      statusCall.call();
      quotaCall.call();
      cronCall.call({ includeDisabled: true });
      channelsCall.call();
      healthCall.call();
      fetchTraces();
    }
  });

  let economyEnabled = $state(true);
  function toggleEconomy() { economyEnabled = !economyEnabled; }
  
  let reqCount = $derived(quotaCall.data?.requestsToday ?? 0);
  let totalTokens = $derived((quotaCall.data?.inputTokensToday || 0) + (quotaCall.data?.outputTokensToday || 0));
  let formattedTokens = $derived(totalTokens >= 1000 ? (totalTokens / 1000).toFixed(1) + "K" : totalTokens.toString());
  
  let runningAgents = $derived(statusCall.data?.agents?.filter((a: any) => a.isRunning).length || 0);
  let agentTotal = $derived(statusCall.data?.agentTotal || 0);
  
  // Health parsing
  let channelEntries = $derived(channelsCall.data?.channels ? Object.entries(channelsCall.data.channels) : []);
  let clients = $derived(healthCall.data?.clients || []);
  let jobs = $derived(cronCall.data?.jobs || []);

  let uptime = $state("0s");
  onMount(() => {
    let secs = 0;
    setInterval(() => {
      secs++;
      if (secs < 60) uptime = `${secs}s`;
      else uptime = `${Math.floor(secs / 60)}m ${secs % 60}s`;
    }, 1000);
  });

  let activeTab = $state("overview");
</script>

<div class="h-full overflow-y-auto p-4 sm:p-6 pb-10 space-y-8 relative isolate custom-scrollbar">
  
  <!-- Global Background Effects for Dashboard -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.1)_0%,transparent_60%)] pointer-events-none"></div>
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.1)_0%,transparent_60%)] pointer-events-none"></div>

  <!-- Radical Telemetry HUD Header -->
  <div class="relative bg-black/40 backdrop-blur-3xl border border-[#d946ef]/20 rounded-3xl p-6 shadow-[0_0_50px_rgba(217,70,239,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden">
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#d946ef]/20 to-[#3b82f6]/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
    <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(217,70,239,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(217,70,239,0.05)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none opacity-60"></div>
    
    <div class="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      
      <!-- Identity & Title -->
      <div class="flex items-start gap-4">
        <div class="relative hidden sm:flex items-center justify-center w-20 h-20 rounded-2xl bg-black/60 border border-[#d946ef]/30 shadow-[0_0_30px_rgba(217,70,239,0.2),inset_0_1px_2px_rgba(255,255,255,0.2)] overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-br from-[#d946ef]/10 to-transparent group-hover:from-[#d946ef]/30 transition-all duration-500"></div>
          <Activity class="w-10 h-10 text-[#d946ef] drop-shadow-[0_0_10px_rgba(217,70,239,0.8)] animate-pulse-slow" strokeWidth={1.5} />
          <div class="absolute -right-1 -top-1 w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.9)] border-2 border-black"></div>
        </div>
        <div class="flex flex-col justify-center py-1">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-[11px] font-mono text-[#d946ef] uppercase tracking-[0.3em] bg-[#d946ef]/10 border border-[#d946ef]/30 px-3 py-1 rounded-md shadow-[0_0_10px_rgba(217,70,239,0.2)]">Core Uplink</span>
            <span class="text-[11px] text-white/50 font-mono tracking-widest uppercase flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[#06b6d4] shadow-[0_0_5px_rgba(6,182,212,0.8)]"></span>
              Autonomous Agent Env
            </span>
          </div>
          <h1 class="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-[#d946ef] to-[#3b82f6] drop-shadow-[0_0_20px_rgba(217,70,239,0.3)]">
            {$_('overview.title', { default: "NEXUS COMMAND" })}
          </h1>
        </div>
      </div>

      <!-- Controls & Tabs -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <!-- Smart Economy Toggle (Radical Redesign) -->
        <button 
          onclick={toggleEconomy}
          class="group relative flex items-center gap-4 px-4 py-3 rounded-xl bg-[#0a0a0a]/80 border border-white/5 shadow-inner hover:bg-[#0a0a0a] transition-all overflow-hidden"
        >
          <div class={`absolute inset-0 bg-gradient-to-r ${economyEnabled ? 'from-goclaw-neon-cyan/10' : 'from-transparent'} to-transparent opacity-50 transition-colors duration-500`}></div>
          <div class="relative z-10 flex flex-col items-start">
            <span class={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${economyEnabled ? 'text-goclaw-neon-cyan drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]' : 'text-white/30'}`}>
              Smart Economy
            </span>
            <span class="text-[10px] text-white/50 font-mono">Cost-optimized routing</span>
          </div>
          <div class="relative z-10 w-12 h-6 rounded-full border transition-all duration-500 shadow-inner flex items-center px-1 {economyEnabled ? 'bg-goclaw-neon-cyan/20 border-goclaw-neon-cyan/50' : 'bg-black/50 border-white/10'}">
            <div class="w-4 h-4 bg-white rounded-full transition-transform duration-500 shadow-[0_0_10px_rgba(255,255,255,0.8)] {economyEnabled ? 'translate-x-6' : 'translate-x-0'}"></div>
          </div>
        </button>

        <div class="w-[1px] h-10 bg-white/10 hidden sm:block"></div>

        <!-- Refresh & Connection -->
        <div class="flex flex-col items-end gap-2">
          <div class="inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-2"></div>
            {$_('common.connected', { default: "Uplink Active" })}
          </div>
          <button 
            onclick={() => { sparklines.load(); fetchTraces(); }}
            class="flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-mono text-white/40 hover:text-white transition-colors group"
          >
            <RefreshCw class="h-3 w-3 group-hover:rotate-180 transition-transform duration-500" />
            <span>Sync Data</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Custom Telemetry Tabs -->
  <div class="flex items-center justify-center sm:justify-start">
    <div class="inline-flex p-1 rounded-2xl bg-[#030014]/60 backdrop-blur-xl border border-white/5 shadow-inner">
      <button 
        class={`relative flex items-center justify-center px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'overview' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
        onclick={() => activeTab = 'overview'}
      >
        {#if activeTab === 'overview'}
          <div class="absolute inset-0 bg-goclaw-neon-purple/20 border border-goclaw-neon-purple/30 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"></div>
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-goclaw-neon-purple shadow-[0_0_8px_rgba(217,70,239,0.8)]"></div>
        {/if}
        <span class="relative z-10">Overview</span>
      </button>
      <button 
        class={`relative flex items-center justify-center px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'usage' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
        onclick={() => activeTab = 'usage'}
      >
        {#if activeTab === 'usage'}
          <div class="absolute inset-0 bg-goclaw-neon-cyan/20 border border-goclaw-neon-cyan/30 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"></div>
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-goclaw-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
        {/if}
        <span class="relative z-10">Usage & Quotas</span>
      </button>
    </div>
  </div>
    
  {#if activeTab === 'overview'}
    <div class="space-y-6 animate-in fade-in duration-300">
      
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={Activity}
          label={$_('overview.statCards.requestsToday', { default: "Requests Today" })}
          value={reqCount}
          sub={quotaCall.data?.uniqueUsersToday ? `${quotaCall.data.uniqueUsersToday} users` : undefined}
          sparkline={sparklines.requestSparkline}
          trend={sparklines.trends.requests}
        />
        <StatCard
          icon={Hash}
          label={$_('overview.statCards.tokensToday', { default: "Tokens Today" })}
          value={formattedTokens}
          sub={`${(quotaCall.data?.inputTokensToday || 0) / 1000}K in / ${(quotaCall.data?.outputTokensToday || 0) / 1000}K out`}
          sparkline={sparklines.tokenSparkline}
          trend={sparklines.trends.tokens}
        />
        <StatCard
          icon={DollarSign}
          label={$_('overview.statCards.costToday', { default: "Cost Today" })}
          value={`$${(quotaCall.data?.costToday || 0).toFixed(2)}`}
          sparkline={sparklines.costSparkline}
          trend={sparklines.trends.cost}
        />
        <StatCard
          icon={Bot}
          label={$_('overview.statCards.agents', { default: "Agents" })}
          value={`${runningAgents} / ${agentTotal}`}
          sub={$_('overview.statCards.running', { default: "running" })}
        />
        <StatCard
          icon={Radio}
          label={$_('overview.statCards.channels', { default: "Channels" })}
          value={`${channelEntries.filter(([, c]: any) => c.running).length} / ${channelEntries.length || 1}`}
          sub={$_('overview.statCards.online', { default: "online" })}
        />
      </div>

      <!-- Existing Cards with minimal wrapper tweaks if necessary, their internal structure can be overridden independently -->
      <SystemHealthCard 
        health={healthCall.data}
        liveUptime={uptime}
        enabledProviderCount={1}
        sessions={statusCall.data?.sessions || 80}
        clientCount={clients.length}
        channelEntries={channelEntries}
        runtimeEntries={[
          {name: "python3", version: "Python 3.13.5", available: true},
          {name: "pip3", version: "pip 25.1.1", available: true},
          {name: "node", version: "v24.13.0", available: true},
          {name: "npm", version: "11.6.2", available: true},
          {name: "pkg-helper", available: false},
          {name: "github-bin", available: false}
        ]}
      />

      <div class="grid gap-6 lg:grid-cols-2">
        <ConnectedClientsCard clients={clients} currentId={healthCall.data?.currentId} />
        <CronJobsCard jobs={jobs} />
      </div>

      <RecentRequestsCard traces={traces} />
      
      {#if quotaCall.data?.enabled && quotaCall.data?.entries && quotaCall.data.entries.length > 0}
         <QuotaUsageCard quota={quotaCall.data} />
      {/if}

    </div>
  {:else}
    <div class="animate-in fade-in duration-500">
       <Usage />
    </div>
  {/if}
</div>