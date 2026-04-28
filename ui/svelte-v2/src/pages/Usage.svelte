<script lang="ts">
  import { onMount } from "svelte";
  import { usageState, refreshUsage, setPeriod, setFilter, toggleFilter, loadRecords } from "../lib/state/usage.svelte";
  import { formatTokens, formatCost, formatDate } from "../lib/format";
  import { _ } from "svelte-i18n";
  import { Activity, Hash, DollarSign, Bot, Radio, AlertCircle, TrendingUp, TrendingDown, Clock, BarChart3, FilterX, FileDown, ChevronLeft, ChevronRight, Cpu, Wrench, AlertTriangle, Layers, ChevronDown, X, RefreshCw, Database } from "lucide-svelte";
  import Sparkline from "../lib/components/shared/Sparkline.svelte";
  import DonutChart from "../lib/components/shared/DonutChart.svelte";
  import TimelineChart from "../lib/components/shared/TimelineChart.svelte";
  import NexusCard from "../lib/components/shared/NexusCard.svelte";
  import { useWsCall } from "../lib/state/ws.svelte";
  import { agentsState, loadAgents } from "./agents/hooks/use-agents.svelte";
  import { providersState, loadProviders } from "../lib/state/providers.svelte";

  let page = $state(1);
  let pageSize = $state(20);
  let totalPages = $derived(Math.max(1, Math.ceil(usageState.totalRecords / pageSize)));

  onMount(() => {
    refreshUsage();
    loadAgents();
    loadProviders();
  });

  function computeTrend(current: number, previous: number) {
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  let summary = $derived(usageState.summary);
  let current = $derived(summary?.current || {});
  let previous = $derived(summary?.previous || {});

  let reqTrend = $derived(computeTrend(current.requests, previous.requests));
  let tokenTrend = $derived(computeTrend((current.input_tokens || 0) + (current.output_tokens || 0), (previous.input_tokens || 0) + (previous.output_tokens || 0)));
  let costTrend = $derived(computeTrend(current.cost, previous.cost));
  let errorTrend = $derived(computeTrend(current.errors, previous.errors));
  let llmTrend = $derived(computeTrend(current.llm_calls, previous.llm_calls));
  let toolTrend = $derived(computeTrend(current.tool_calls, previous.tool_calls));
  
  let timeseries = $derived(usageState.timeseries);
  let reqSpark = $derived(timeseries.map((p: any) => p.request_count));
  let tokenSpark = $derived(timeseries.map((p: any) => (p.input_tokens || 0) + (p.output_tokens || 0)));
  let costSpark = $derived(timeseries.map((p: any) => p.total_cost));
  let errorSpark = $derived(timeseries.map((p: any) => p.error_count));

  // Enhanced Distribution Data
  let providerDist = $derived(usageState.providerBreakdown.map(p => ({ label: p.key, value: p.request_count })));
  let modelDist = $derived(usageState.modelBreakdown.map(m => ({ label: m.key, value: m.llm_call_count })));
  let channelDist = $derived(usageState.channelBreakdown.map(c => ({ label: c.key, value: c.request_count })));

  function handlePageChange(p: number) {
      page = p;
      loadRecords({ limit: pageSize, offset: (page - 1) * pageSize });
  }

  let agents = $derived(agentsState.agents || []);
  let allProviders = $derived(providersState.providers || []);

  const handleExportCsv = () => {
    const rows = [
      ["Date", "Input Tokens", "Output Tokens", "Requests", "LLM Calls", "Tool Calls", "Errors", "Cost"],
      ...timeseries.map((d) => [
        d.bucket_time,
        d.input_tokens,
        d.output_tokens,
        d.request_count,
        d.llm_call_count,
        d.tool_call_count,
        d.error_count,
        d.total_cost.toFixed(6),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage-${usageState.filters.period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

</script>

{#snippet statCard(label, value, sub, trend, spark, icon: any, colorClass = "text-white/50")}
  <div class="relative p-6 group transition-all duration-700 hover:-translate-y-1.5 isolate overflow-hidden bg-black/40 backdrop-blur-3xl border border-[#d946ef]/20 shadow-[0_0_30px_rgba(217,70,239,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-2xl h-full flex flex-col justify-between min-h-[160px]">
    
    <!-- Cybernetic Corner Accents -->
    <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/20 rounded-tl-xl opacity-50 group-hover:border-goclaw-neon-purple group-hover:opacity-100 transition-colors duration-500"></div>
    <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/20 rounded-tr-xl opacity-50 group-hover:border-goclaw-neon-purple group-hover:opacity-100 transition-colors duration-500"></div>
    <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/20 rounded-bl-xl opacity-50 group-hover:border-goclaw-neon-purple group-hover:opacity-100 transition-colors duration-500"></div>
    <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/20 rounded-br-xl opacity-50 group-hover:border-goclaw-neon-purple group-hover:opacity-100 transition-colors duration-500"></div>

    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-20"></div>
    <div class="absolute -right-8 -top-8 w-32 h-32 bg-goclaw-neon-purple/20 rounded-full blur-[40px] group-hover:bg-goclaw-neon-purple/40 group-hover:scale-150 transition-all duration-1000 ease-out"></div>
    <div class="absolute -left-8 -bottom-8 w-32 h-32 bg-goclaw-neon-cyan/10 rounded-full blur-[40px] group-hover:bg-goclaw-neon-cyan/30 group-hover:scale-150 transition-all duration-1000 ease-out"></div>

    <div class="relative z-10 flex flex-col h-full justify-between">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="relative flex items-center justify-center w-10 h-10 rounded-xl bg-black/50 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:border-white/20 transition-colors duration-500">
            <svelte:component this={icon} class={`h-4 w-4 ${colorClass}`} />
          </div>
          <div class="flex flex-col">
            <p class="text-xs font-bold text-white/60 tracking-wider group-hover:text-white transition-colors duration-300 uppercase">{label}</p>
          </div>
        </div>
        {#if trend !== 0}
          <span class={`flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shadow-inner ${trend > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        {/if}
      </div>

      <div class="relative z-10 mt-auto">
        <h2 class="text-4xl font-mono font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{value}</h2>
        {#if sub}
          <div class="flex items-center gap-2 mt-1">
            <div class="w-1 h-1 rounded-full bg-white/40"></div>
            <p class="text-[10px] text-white/40 font-mono tracking-widest uppercase truncate">{sub}</p>
          </div>
        {/if}
      </div>
    </div>
    {#if spark && spark.length > 1}
      <div class="absolute bottom-0 left-0 right-0 h-20 opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <Sparkline data={spark} color={trend >= 0 ? "var(--color-goclaw-neon-cyan)" : "var(--color-goclaw-neon-magenta)"} height="100%" />
        <div class="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-[#030014]/80 via-[#030014]/20 to-transparent"></div>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet tacticalDropdown(defaultLabel, value, options, onChange)}
  <div class="relative group z-50">
    <div class="appearance-none h-9 pl-4 pr-10 flex items-center justify-between rounded-xl bg-black/60 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-white/70 hover:border-goclaw-neon-purple hover:bg-white/5 transition-all cursor-pointer shadow-inner min-w-[160px]">
       <span class="truncate">{options.find(o => o.value === value)?.label || defaultLabel}</span>
       <ChevronDown class="absolute right-3 top-2.5 h-4 w-4 text-white/30" />
    </div>
    
    <div class="absolute top-full left-0 right-0 mt-2 bg-black/80 backdrop-blur-3xl border border-[#d946ef]/30 rounded-xl shadow-[0_10px_40px_rgba(217,70,239,0.2)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 flex flex-col p-1.5 max-h-[300px] overflow-y-auto">
      <button 
        onclick={() => onChange(undefined)}
        class="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
      >
        {defaultLabel}
      </button>
      <div class="h-px bg-white/5 my-1 mx-2"></div>
      {#each options as opt}
         <button 
           onclick={() => onChange(opt.value)}
           class={`text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors truncate ${value === opt.value ? 'bg-goclaw-neon-purple/20 text-goclaw-neon-purple' : 'text-white/70 hover:text-white'}`}
         >
           {opt.label}
         </button>
      {/each}
    </div>
  </div>
{/snippet}

<div class="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-700">
  
  <!-- Filters Bar (Cyber-Tactical) -->
  <div class="relative rounded-2xl border border-[#d946ef]/20 bg-black/40 backdrop-blur-3xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_30px_rgba(217,70,239,0.1)] z-40">
    <div class="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.02)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.02)_75%,transparent_75%,transparent)] bg-[length:20px_20px] opacity-20 pointer-events-none rounded-2xl"></div>
    <div class="relative z-10 flex items-center gap-6">
       <div class="flex items-center gap-1 pl-2">
         <span class="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] mr-3">Time Range</span>
         <div class="inline-flex p-1 rounded-2xl bg-[#030014]/60 backdrop-blur-xl border border-white/5 shadow-inner">
            {#each ['24h', '7d', '30d'] as p}
                <button 
                    onclick={() => setPeriod(p as any)}
                    class={`relative flex items-center justify-center px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 outline-none ${usageState.filters.period === p ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                    {#if usageState.filters.period === p}
                      <div class="absolute inset-0 bg-goclaw-neon-cyan/20 border border-goclaw-neon-cyan/30 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"></div>
                      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-goclaw-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                    {/if}
                    <span class="relative z-10">{p}</span>
                </button>
            {/each}
         </div>
       </div>
    </div>

    <div class="relative z-10 ml-auto flex items-center gap-3 pr-1">
        <!-- Tactical Selectors -->
        {@render tacticalDropdown(
            "All Agents", 
            usageState.filters.agentId, 
            agents.map(a => ({ value: a.id, label: a.display_name || a.agent_key })), 
            (val) => setFilter('agentId', val)
        )}

        {@render tacticalDropdown(
            "All Providers", 
            usageState.filters.provider, 
            allProviders.map(p => ({ value: p.name, label: p.name })), 
            (val) => setFilter('provider', val)
        )}

        {@render tacticalDropdown(
            "All Channels", 
            usageState.filters.channel, 
            usageState.channelBreakdown.map(b => ({ value: b.key, label: b.key })), 
            (val) => setFilter('channel', val)
        )}

        <button 
          onclick={handleExportCsv}
          class="flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
        >
          <FileDown class="w-3 h-3" />
          Export
        </button>
    </div>
  </div>

  <!-- Active Chips -->
  {#if usageState.filters.agentId || usageState.filters.provider || usageState.filters.channel || usageState.filters.model}
    <div class="flex flex-wrap items-center gap-3 animate-in fade-in zoom-in-95 px-2">
      <span class="text-[9px] font-bold text-goclaw-neon-purple uppercase tracking-widest flex items-center gap-1.5">
        <div class="w-1.5 h-1.5 rounded-full bg-goclaw-neon-purple animate-pulse"></div> Active Filters:
      </span>
      {#if usageState.filters.agentId}
        <div class="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-white/10 text-[9px] font-mono text-white/70 uppercase">
          <span class="text-white/30">AGENT:</span> {agents.find(a => a.id === usageState.filters.agentId)?.display_name || usageState.filters.agentId}
          <button onclick={() => setFilter('agentId', undefined)} class="hover:text-goclaw-neon-purple ml-1"><X class="h-3 w-3" /></button>
        </div>
      {/if}
      {#if usageState.filters.provider}
        <div class="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-white/10 text-[9px] font-mono text-white/70 uppercase">
          <span class="text-white/30">PROVIDER:</span> {usageState.filters.provider}
          <button onclick={() => setFilter('provider', undefined)} class="hover:text-goclaw-neon-purple ml-1"><X class="h-3 w-3" /></button>
        </div>
      {/if}
      {#if usageState.filters.channel}
        <div class="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 border border-white/10 text-[9px] font-mono text-white/70 uppercase">
          <span class="text-white/30">CHANNEL:</span> {usageState.filters.channel}
          <button onclick={() => setFilter('channel', undefined)} class="hover:text-goclaw-neon-purple ml-1"><X class="h-3 w-3" /></button>
        </div>
      {/if}
      <button 
        onclick={() => { setFilter('agentId', undefined); setFilter('provider', undefined); setFilter('channel', undefined); setFilter('model', undefined); }}
        class="text-[9px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest ml-2 flex items-center gap-1"
      >
        <FilterX class="w-3 h-3" /> Clear All
      </button>
    </div>
  {/if}

  <!-- Summary Grid -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
    {@render statCard("Requests", current.requests || 0, `${previous.requests || 0} prev`, reqTrend, reqSpark, Activity)}
    {@render statCard("Tokens", formatTokens((current.input_tokens || 0) + (current.output_tokens || 0)), `${formatTokens((previous.input_tokens || 0) + (previous.output_tokens || 0))} prev`, tokenTrend, tokenSpark, Hash)}
    {@render statCard("LLM Calls", current.llm_calls || 0, `${previous.llm_calls || 0} prev`, llmTrend, null, Cpu, "text-goclaw-neon-cyan")}
    {@render statCard("Tool Calls", current.tool_calls || 0, `${previous.tool_calls || 0} prev`, toolTrend, null, Wrench, "text-amber-400")}
    {@render statCard("Errors", current.errors || 0, `${previous.errors || 0} prev`, errorTrend, errorSpark, AlertTriangle, "text-red-500")}
    {@render statCard("Users", current.unique_users || 0, "Active pool", 0, null, Bot)}
    {@render statCard("Cost", formatCost(current.cost), `${formatCost(previous.cost)} prev`, costTrend, costSpark, DollarSign, "text-emerald-400")}
  </div>

  <!-- MAIN ANALYTICS SECTION -->
  <div class="grid gap-6 lg:grid-cols-1">
    
    <!-- Token Usage Over Time -->
    <NexusCard
      title="Token Usage Trajectory"
      subtitle="Time Series Analysis"
      icon={Layers}
      iconColorClass="text-goclaw-neon-cyan"
      iconBgClass="bg-goclaw-neon-cyan/10 border-goclaw-neon-cyan/20"
    >
      <TimelineChart 
          data={timeseries} 
          series={[
              { label: "Cache Read Tokens", key: "cache_read_tokens", color: "var(--color-amber-500)", type: "line" },
              { label: "Input Tokens", key: "input_tokens", color: "var(--color-goclaw-neon-magenta)", type: "area" },
              { label: "Output Tokens", key: "output_tokens", color: "var(--color-goclaw-neon-cyan)", type: "line" }
          ]}
          height="250px"
      />
    </NexusCard>

    <!-- Request Volume & Errors -->
    <NexusCard
      title="Request Volume & Errors"
      subtitle="Time Series Analysis"
      icon={Activity}
      iconColorClass="text-goclaw-neon-magenta"
      iconBgClass="bg-goclaw-neon-magenta/10 border-goclaw-neon-magenta/20"
    >
      <TimelineChart 
          data={timeseries} 
          series={[
              { label: "Requests", key: "request_count", color: "var(--color-goclaw-neon-magenta)", type: "bar" },
              { label: "Errors", key: "error_count", color: "var(--color-red-500)", type: "line", yAxis: "right" }
          ]}
          height="200px"
      />
    </NexusCard>

  </div>

  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Distribution Donut Charts -->
    <NexusCard
      title="Provider Matrix"
      subtitle="Call Distribution"
      icon={Layers}
      iconColorClass="text-emerald-400"
      iconBgClass="bg-emerald-500/10 border-emerald-500/20"
    >
      <div class="flex items-center justify-center h-full">
        <DonutChart data={providerDist} title="Calls" />
      </div>
    </NexusCard>

    <NexusCard
      title="Model Distribution"
      subtitle="LLM Analysis"
      icon={Bot}
      iconColorClass="text-goclaw-neon-purple"
      iconBgClass="bg-goclaw-neon-purple/10 border-goclaw-neon-purple/20"
    >
      <div class="flex items-center justify-center h-full">
        <DonutChart data={modelDist} title="Calls" />
      </div>
    </NexusCard>

    <NexusCard
      title="Channel Sources"
      subtitle="Ingress Vectors"
      icon={Radio}
      iconColorClass="text-goclaw-neon-cyan"
      iconBgClass="bg-goclaw-neon-cyan/10 border-goclaw-neon-cyan/20"
    >
      <div class="flex items-center justify-center h-full">
        <DonutChart data={channelDist} title="Calls" />
      </div>
    </NexusCard>
  </div>

  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Performance Chart -->
    <NexusCard
      title="Duration & Performance"
      subtitle="Latency Analysis"
      icon={Clock}
      iconColorClass="text-orange-400"
      iconBgClass="bg-orange-500/10 border-orange-500/20"
    >
      <TimelineChart 
          data={timeseries} 
          series={[
              { label: "Avg Duration", key: "avg_duration_ms", color: "#E87820", type: "bar" },
              { label: "Error Rate %", key: "error_count", color: "#ef4444", type: "line", yAxis: "right" }
          ]}
          height="180px"
      />
    </NexusCard>

    <!-- Memory & Knowledge Growth -->
    <NexusCard
      title="Memory Node Graph Growth"
      subtitle="Storage Analysis"
      icon={Database}
      iconColorClass="text-amber-400"
      iconBgClass="bg-amber-400/10 border-amber-400/20"
    >
      <TimelineChart 
          data={timeseries} 
          series={[
              { label: "Docs", key: "memory_docs", color: "var(--color-amber-400)", type: "line" },
              { label: "Chunks", key: "memory_chunks", color: "var(--color-goclaw-neon-magenta)", type: "line" }
          ]}
          height="180px"
      />
    </NexusCard>
  </div>

  <div class="grid gap-6">
    <!-- Top Models Matrix (Enhanced) -->
    <NexusCard
      title="Top Operational Models"
      subtitle="Leaderboard Node Matrix"
      icon={Bot}
      iconColorClass="text-goclaw-neon-cyan"
      iconBgClass="bg-goclaw-neon-cyan/10 border-goclaw-neon-cyan/20"
      noPadding={true}
    >
      <div class="overflow-x-auto p-5">
        <div class="flex flex-col gap-2 min-w-[800px]">
          <!-- Tactical Header -->
          <div class="grid grid-cols-12 gap-4 px-4 py-2 border-b border-white/5 text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
            <div class="col-span-3">Model Identity</div>
            <div class="col-span-2">Provider</div>
            <div class="col-span-1 text-right">Calls</div>
            <div class="col-span-2 text-right">In Tokens</div>
            <div class="col-span-2 text-right">Out Tokens</div>
            <div class="col-span-1 text-right">Latency</div>
            <div class="col-span-1 text-right">Cost</div>
          </div>

          <!-- Rows -->
          {#each usageState.modelBreakdown.slice(0, 10) as row, i}
            <div class="grid grid-cols-12 gap-4 px-4 py-3 items-center rounded-xl bg-black/40 border border-white/5 hover:border-goclaw-neon-cyan/30 hover:bg-goclaw-neon-cyan/5 transition-all group">
              <div class="col-span-3 flex items-center gap-3">
                <span class="text-[10px] font-mono text-white/20 font-bold w-4">{i + 1}.</span>
                <span class="text-xs text-white/90 font-bold tracking-tight truncate">{row.key}</span>
              </div>
              
              <div class="col-span-2 text-[9px] font-mono text-white/40 uppercase">
                <span class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">—</span>
              </div>
              
              <div class="col-span-1 text-right text-[11px] font-mono text-white/60 font-bold">
                {row.llm_call_count}
              </div>
              
              <div class="col-span-2 text-right text-[11px] font-mono text-emerald-500 font-bold">
                {formatTokens(row.input_tokens)}
              </div>
              
              <div class="col-span-2 text-right text-[11px] font-mono text-goclaw-neon-cyan font-bold">
                {formatTokens(row.output_tokens)}
              </div>
              
              <div class="col-span-1 text-right text-[10px] font-mono text-white/30">
                {row.avg_duration_ms}ms
              </div>
              
              <div class="col-span-1 text-right text-[11px] font-mono text-amber-400 font-bold">
                {formatCost(row.total_cost)}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </NexusCard>

    <!-- Forensic Usage Stream -->
    <NexusCard
      title="Forensic Usage Stream"
      subtitle="Raw Telemetry Data"
      icon={Activity}
      iconColorClass="text-goclaw-neon-purple"
      iconBgClass="bg-goclaw-neon-purple/10 border-goclaw-neon-purple/20"
      noPadding={true}
    >
      {#snippet headerActions()}
        <div class="flex items-center gap-4 bg-black/50 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
          <span class="text-[10px] font-bold text-white/40 uppercase tracking-widest">Records Index: <span class="font-mono text-white/80">{usageState.totalRecords}</span></span>
        </div>
      {/snippet}

      <div class="overflow-x-auto p-5">
            <div class="flex flex-col gap-2 min-w-[800px]">
              
              <!-- Tactical Header -->
              <div class="grid grid-cols-12 gap-4 px-4 py-2 border-b border-white/5 text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
                <div class="col-span-4">Agent Identity / Hash</div>
                <div class="col-span-3">LLM Core</div>
                <div class="col-span-2 text-right">In Tokens</div>
                <div class="col-span-2 text-right">Out Tokens</div>
                <div class="col-span-1 text-right">Time</div>
              </div>

              <!-- Stream Rows -->
              {#if usageState.records.length === 0}
                <div class="flex flex-col items-center justify-center py-20 opacity-50">
                   <FilterX class="h-8 w-8 text-white/20 mb-3" />
                   <span class="text-[10px] font-mono uppercase tracking-widest text-white/40">No telemetry streams detected</span>
                </div>
              {:else}
                {#each usageState.records as r}
                  <div class="grid grid-cols-12 gap-4 px-4 py-3 items-center rounded-xl bg-black/40 border border-white/5 hover:border-goclaw-neon-purple/30 hover:bg-goclaw-neon-purple/5 transition-all group/row">
                    
                    <div class="col-span-4 flex flex-col justify-center truncate">
                      <span class="text-[11px] font-bold text-white/90 group-hover/row:text-goclaw-neon-purple transition-colors truncate">{r.agentId}</span>
                      <span class="text-[9px] font-mono text-white/30 group-hover/row:text-white/60 transition-colors truncate mt-0.5">{r.sessionKey}</span>
                    </div>
                    
                    <div class="col-span-3 flex items-center">
                      <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-white/50 uppercase font-bold tracking-wider truncate max-w-full">
                         {r.model}
                      </span>
                    </div>
                    
                    <div class="col-span-2 text-right text-[11px] font-mono text-emerald-500 font-bold">
                       {formatTokens(r.inputTokens)}
                    </div>
                    
                    <div class="col-span-2 text-right text-[11px] font-mono text-goclaw-neon-cyan font-bold">
                       {formatTokens(r.outputTokens)}
                    </div>
                    
                    <div class="col-span-1 text-right flex flex-col items-end">
                       <span class="text-[10px] font-mono text-white/60 font-bold">{formatDate(r.timestamp, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                       <span class="text-[8px] font-mono text-white/30 uppercase mt-0.5">{formatDate(r.timestamp, { month: 'short', day: 'numeric' })}</span>
                    </div>

                  </div>
                {/each}
              {/if}
            </div>
        </div>
        
        <!-- Tactical Pagination -->
        <div class="relative z-10 px-6 py-4 bg-black/60 border-t border-white/5 flex items-center justify-between">
           <div class="flex items-center gap-3">
              <span class="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Telemetry Pager</span>
              <div class="px-2 py-1 bg-black rounded border border-white/10 shadow-inner flex items-center gap-1">
                <div class="w-1.5 h-1.5 rounded-full bg-goclaw-neon-purple shadow-[0_0_8px_rgba(139,92,246,0.8)] animate-pulse"></div>
                <span class="text-[10px] font-mono font-bold text-goclaw-neon-purple ml-1">{page}</span>
                <span class="text-[10px] font-mono text-white/30">/ {totalPages}</span>
              </div>
           </div>
           <div class="flex items-center gap-2">
              <button 
                onclick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                class="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-goclaw-neon-purple/20 hover:border-goclaw-neon-purple/30 hover:text-goclaw-neon-purple disabled:opacity-20 transition-all text-white/60"
              >
                <ChevronLeft class="h-4 w-4" />
              </button>
              <button 
                onclick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                class="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-goclaw-neon-purple/20 hover:border-goclaw-neon-purple/30 hover:text-goclaw-neon-purple disabled:opacity-20 transition-all text-white/60"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
           </div>
        </div>
    </NexusCard>
  </div>

</div>
