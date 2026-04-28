<script lang="ts">
  import { onMount } from "svelte";
  import { 
    Activity, GitFork, RefreshCw, Square, Bot, User, 
    Users, Clock, Network, Globe, CheckCircle2, 
    XCircle, Loader2, CircleDot, Search, LayoutGrid, Share2
  } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { cn } from "$lib/utils";
  import { wsState, useWs } from "$lib/state/ws.svelte";
  import { agentsState, loadAgents } from "../agents/hooks/use-agents.svelte";
  import { useChannels } from "../channels/hooks/use-channels.svelte";
  import { useTraces } from "./hooks/use-traces.svelte";
  import type { TraceData } from "$lib/types/trace";
  import { formatDate, formatDuration, formatTokens, computeDurationMs } from "$lib/format";
  import PageHeader from "$lib/components/shared/PageHeader.svelte";
  import EmptyState from "$lib/components/shared/EmptyState.svelte";
  import Pagination from "$lib/components/shared/Pagination.svelte";
  import TableSkeleton from "$lib/components/shared/TableSkeleton.svelte";
  import FilterSelect from "$lib/components/ui/FilterSelect.svelte";
  import TraceDetailDialog from "./components/TraceDetailDialog.svelte";
  import { Badge } from "$lib/components/ui/badge";
  import { Methods, Events } from "$lib/api/protocol";

  const ws = useWs();
  const tracesHook = useTraces();
  const channelsHook = useChannels();

  let agentFilter = $state<string | undefined>(undefined);
  let channelFilter = $state<string | undefined>(undefined);
  let page = $state(1);
  let pageSize = $state(20);
  let selectedTraceId = $state<string | null>(null);
  let abortingRunId = $state<string | null>(null);

  onMount(() => {
    loadAgents();
    channelsHook.loadInstances();
    load();
  });

  async function load() {
    await tracesHook.loadTraces({
      agentId: agentFilter,
      channel: channelFilter,
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  }

  $effect(() => {
    // Reload on filter change
    load();
  });

  // Listen for trace status updates via WS
  onMount(() => {
    const unsub = ws.on(Events.TRACE_STATUS, () => {
      load();
    });
    return () => unsub();
  });

  const totalPages = $derived(Math.max(1, Math.ceil(tracesHook.total / pageSize)));

  function getAgentName(aid?: string) {
    if (!aid) return undefined;
    const a = agentsState.agents.find(x => x.id === aid);
    return a?.display_name || a?.agent_key || aid;
  }

  function parseSourceType(sessionKey: string): { type: string; topic?: string } {
    if (!sessionKey) return { type: "unknown" };
    if (sessionKey.includes(":cron:")) return { type: "cron" };
    if (sessionKey.includes(":team:")) return { type: "team" };
    const topicMatch = sessionKey.match(/:topic:(\d+)/);
    if (topicMatch) return { type: "group", topic: topicMatch[1] };
    if (sessionKey.includes(":group:")) return { type: "group" };
    if (sessionKey.includes(":ws:")) return { type: "ws" };
    if (sessionKey.includes(":direct:")) return { type: "direct" };
    return { type: "unknown" };
  }

  const SOURCE_ICONS: Record<string, any> = {
    cron: Clock,
    team: Network,
    group: Users,
    direct: User,
    ws: Globe,
  };

  async function handleAbortRun(trace: TraceData) {
    if (!ws.isConnected || abortingRunId) return;
    abortingRunId = trace.run_id;
    try {
      const res = await ws.call(Methods.CHAT_ABORT, {
        sessionKey: trace.session_key,
        runId: trace.run_id,
      }) as any;
      
      if (res?.stopped) console.log("Execution stopped");
      else if (res?.forced) console.warn("Execution force-killed");
      else console.error("Failed to abort execution");
      
      load();
    } catch (e) {
      console.error("Abort command failed");
    } finally {
      setTimeout(() => abortingRunId = null, 3000);
    }
  }

  function getStatusIcon(status: string) {
    if (status === "ok" || status === "success" || status === "completed") return CheckCircle2;
    if (status === "error" || status === "failed") return XCircle;
    if (status === "running") return Loader2;
    return CircleDot;
  }

  function getStatusColor(status: string) {
    if (status === "ok" || status === "success" || status === "completed") return "text-emerald-400";
    if (status === "error" || status === "failed") return "text-red-400";
    if (status === "running") return "text-blue-400";
    return "text-white/20";
  }

  function cleanPreview(text: string): string {
    if (!text) return text;
    return text.replace(/<media:\w+>/g, "[media]");
  }
</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 w-full">
  
  <!-- Bento Header -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] relative overflow-hidden shrink-0">
    <div class="absolute -top-24 -left-24 w-64 h-64 bg-goclaw-neon-purple/20 blur-[80px] pointer-events-none rounded-full"></div>
    <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[80px] pointer-events-none rounded-full"></div>

    <div class="flex items-center gap-5 relative z-10 mb-4 sm:mb-0">
      <div class="h-14 w-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden group">
        <div class="absolute inset-0 bg-goclaw-neon-purple/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <Activity class="h-6 w-6 text-white group-hover:text-goclaw-neon-purple transition-colors drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
      </div>
      <div>
        <h1 class="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
          Logic Traces
        </h1>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
          Forensic execution logs and engine telemetry
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 relative z-10">
      <button 
        onclick={load}
        disabled={tracesHook.loading}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] disabled:opacity-50"
      >
        <RefreshCw class={`h-4 w-4 text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] ${tracesHook.loading ? 'animate-spin' : ''}`} />
        <span class="text-[10px] font-black uppercase tracking-widest text-white">Refresh</span>
      </button>
    </div>
  </div>

  <!-- Filters Bar -->
  <div class="flex flex-wrap items-center gap-3 mb-6 shrink-0">
    <FilterSelect 
      value={agentFilter ?? "undefined"} 
      onChange={(v) => agentFilter = v === "undefined" ? undefined : v}
      theme="purple"
      options={[
        { value: "undefined", label: "All Agents" },
        ...agentsState.agents.map(a => ({ value: a.id, label: a.display_name || a.agent_key }))
      ]}
    />

    <FilterSelect 
      value={channelFilter ?? "undefined"} 
      onChange={(v) => channelFilter = v === "undefined" ? undefined : v}
      theme="purple"
      options={[
        { value: "undefined", label: "All Channels" },
        ...channelsHook.instances.map(c => ({ value: c.name, label: c.display_name || c.name }))
      ]}
    />
  </div>

  <div class="flex-1 min-h-0 relative z-10 flex flex-col">
    {#if tracesHook.loading && tracesHook.traces.length === 0}
      <TableSkeleton rows={10} />
    {:else if tracesHook.traces.length === 0}
      <div class="py-12 relative">
        <EmptyState
          icon={Activity}
          title="No Traces Recorded"
          description="Interaction history will appear here once the engine processes events."
        />
      </div>
    {:else}
      <div class="rounded-2xl border border-white/5 overflow-hidden bg-[#030014]/60 backdrop-blur-3xl shadow-2xl shadow-black/50 flex-1 flex flex-col min-h-0">
        <div class="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table class="w-full text-sm text-left border-collapse">
            <thead>
              <tr class="border-b border-white/5 bg-white/[0.02] sticky top-0 z-20 backdrop-blur-md">
                <th class="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40">Intent & Source</th>
                <th class="px-4 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40 text-center w-16">Status</th>
                <th class="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40">Resource Load</th>
                <th class="px-4 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40 text-center w-20">Units</th>
                <th class="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              {#each tracesHook.traces as trace (trace.id)}
                {@const source = parseSourceType(trace.session_key)}
                {@const SourceIcon = SOURCE_ICONS[source.type] || Bot}
                <tr 
                  onclick={() => selectedTraceId = trace.id}
                  class="group hover:bg-white/[0.02] transition-all cursor-pointer"
                >
                  <td class="px-6 py-4 max-w-md">
                    <div class="flex items-center gap-2">
                       {#if trace.parent_trace_id}
                         <GitFork class="w-3 h-3 text-white/20 rotate-90" />
                       {/if}
                       <span class="font-bold text-white/90 truncate">{getAgentName(trace.agent_id) || trace.name || 'unnamed_agent'}</span>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                       <div class="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-white/40">
                          <SourceIcon class="w-2.5 h-2.5" />
                          <span>{source.type}</span>
                          {#if source.topic}
                            <span class="text-white/20">#{source.topic}</span>
                          {/if}
                       </div>
                       {#if trace.channel}
                         <span class="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-purple-500/20 text-purple-400/60 bg-purple-500/5">
                           {trace.channel}
                         </span>
                       {/if}
                       {#if trace.input_preview}
                         <span class="text-[10px] text-white/20 truncate italic">
                           {cleanPreview(trace.input_preview)}
                         </span>
                       {/if}
                    </div>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                       {#if true}
                         {@const Icon = getStatusIcon(trace.status)}
                         <Icon class="w-4 h-4 {getStatusColor(trace.status)} {trace.status === 'running' ? 'animate-spin' : ''}" />
                       {/if}
                       {#if trace.status === "running"}
                         <button 
                           onclick={(e) => { e.stopPropagation(); handleAbortRun(trace); }}
                           disabled={abortingRunId === trace.run_id}
                           class="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                         >
                            <Square class="w-3 h-3 fill-current" />
                         </button>
                       {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-2 text-[10px] font-mono">
                       <span class="text-white/60">{formatTokens(trace.total_input_tokens)}</span>
                       <span class="text-white/10">/</span>
                       <span class="text-white/80">{formatTokens(trace.total_output_tokens)}</span>
                       {#if (trace.metadata?.total_cache_read_tokens ?? 0) > 0}
                         <span class="text-emerald-400/60">+{formatTokens(trace.metadata!.total_cache_read_tokens!)}</span>
                       {/if}
                    </div>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <span class="text-[10px] font-mono text-white/40">{trace.span_count}</span>
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <div class="text-[11px] font-mono text-white/60">{formatDate(trace.start_time)}</div>
                    <div class="text-[9px] font-black uppercase tracking-widest text-white/20 mt-0.5">
                       {formatDuration(trace.duration_ms || computeDurationMs(trace.start_time, trace.end_time))}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        
        <div class="p-3 border-t border-white/5 bg-black/20 relative z-10">
          <Pagination
            {page}
            {pageSize}
            total={tracesHook.total}
            {totalPages}
            onPageChange={(p) => page = p}
            onPageSizeChange={(s) => { pageSize = s; page = 1; }}
          />
        </div>
      </div>
    {/if}
  </div>

  {#if selectedTraceId}
    <TraceDetailDialog
      traceId={selectedTraceId}
      open={!!selectedTraceId}
      onClose={() => selectedTraceId = null}
      getTrace={tracesHook.getTrace}
      onAbortRun={handleAbortRun}
    />
  {/if}
</div>
