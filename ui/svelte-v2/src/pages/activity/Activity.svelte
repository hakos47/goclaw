<script lang="ts">
  import { onMount } from "svelte";
  import { ClipboardList, RefreshCw } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { useActivity } from "./hooks/use-activity.svelte";
  import { formatDate } from "$lib/format";
  import Pagination from "$lib/components/shared/Pagination.svelte";
  import TableSkeleton from "$lib/components/shared/TableSkeleton.svelte";
  import EmptyState from "$lib/components/shared/EmptyState.svelte";
  import { Badge } from "$lib/components/ui/badge";
  import FilterSelect from "$lib/components/ui/FilterSelect.svelte";
  import ActivityDetailModal from "./components/ActivityDetailModal.svelte";
  import type { ActivityLog } from "./hooks/use-activity.svelte";

  const ACTION_COLORS: Record<string, string> = {
    "agent.created": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "agent.updated": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "agent.deleted": "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const hook = useActivity();
  
  let actionFilter = $state("all");
  let entityFilter = $state("all");
  let page = $state(1);
  let pageSize = $state(50);
  let selectedLog = $state<ActivityLog | null>(null);
  
  let totalPages = $derived(Math.max(1, Math.ceil(hook.total / pageSize)));

  function loadData() {
    hook.load({
      action: actionFilter !== "all" ? actionFilter : undefined,
      entity_type: entityFilter !== "all" ? entityFilter : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  }

  $effect(() => {
    loadData();
  });

  function handlePageChange(p: number) {
    page = p;
  }

  function handlePageSizeChange(s: number) {
    pageSize = s;
    page = 1;
  }

  function handleFilterChange() {
    page = 1;
    loadData();
  }
</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 w-full">
  
  <!-- Bento Header -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] relative overflow-hidden shrink-0">
    <div class="absolute -top-24 -left-24 w-64 h-64 bg-yellow-500/20 blur-[80px] pointer-events-none rounded-full"></div>
    <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[80px] pointer-events-none rounded-full"></div>

    <div class="flex items-center gap-5 relative z-10 mb-4 sm:mb-0">
      <div class="h-14 w-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden group">
        <div class="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <ClipboardList class="h-6 w-6 text-white group-hover:text-yellow-400 transition-colors drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
      </div>
      <div>
        <h1 class="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
          {$_('activity.title', { default: 'Activity Logs' })}
        </h1>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
          {$_('activity.description', { default: 'Audit trail of platform changes' })}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 relative z-10">
      <button 
        onclick={loadData}
        disabled={hook.loading}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] disabled:opacity-50"
      >
        <RefreshCw class={`h-4 w-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)] ${hook.loading ? 'animate-spin' : ''}`} />
        <span class="text-[10px] font-black uppercase tracking-widest text-white">Refresh</span>
      </button>
    </div>
  </div>

  <!-- Filters Bar -->
  <div class="flex flex-wrap items-center gap-3 mb-6 shrink-0">
    <FilterSelect 
      value={actionFilter} 
      onChange={(v) => { actionFilter = v; handleFilterChange(); }}
      theme="yellow"
      options={[
        { value: "all", label: $_('activity.filters.allActions', { default: 'All Actions' }) },
        { value: "agent.created", label: $_('activity.filters.agentCreated', { default: 'Agent Created' }) },
        { value: "agent.updated", label: $_('activity.filters.agentUpdated', { default: 'Agent Updated' }) },
        { value: "agent.deleted", label: $_('activity.filters.agentDeleted', { default: 'Agent Deleted' }) }
      ]}
    />

    <FilterSelect 
      value={entityFilter} 
      onChange={(v) => { entityFilter = v; handleFilterChange(); }}
      theme="yellow"
      options={[
        { value: "all", label: $_('activity.filters.allEntities', { default: 'All Entities' }) },
        { value: "agent", label: $_('activity.filters.agent', { default: 'Agent' }) }
      ]}
    />
  </div>

  <div class="flex-1 min-h-0 relative z-10 flex flex-col">
    {#if hook.loading && hook.logs.length === 0}
      <TableSkeleton rows={8} />
    {:else if hook.logs.length === 0}
      <div class="py-12 relative flex-1 flex flex-col justify-center">
        <EmptyState
          icon={ClipboardList}
          title={$_('activity.empty.title', { default: 'No Activity Found' })}
          description={$_('activity.empty.description', { default: 'No changes match your current filters.' })}
        />
      </div>
    {:else}
      <div class="rounded-2xl border border-white/5 bg-[#030014]/60 backdrop-blur-3xl shadow-2xl shadow-black/50 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div class="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table class="w-full text-sm text-left border-collapse">
            <thead>
              <tr class="border-b border-white/5 bg-white/[0.02] sticky top-0 z-20 backdrop-blur-md">
                <th class="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40">Action</th>
                <th class="px-4 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40">Actor</th>
                <th class="px-4 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40">Entity</th>
                <th class="px-4 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40">Entity ID</th>
                <th class="px-4 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40">IP Address</th>
                <th class="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              {#each hook.logs as log (log.id)}
                <tr 
                  onclick={() => selectedLog = log}
                  class="group hover:bg-white/[0.02] transition-all cursor-pointer"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${ACTION_COLORS[log.action] || 'bg-white/5 text-white/60 border-white/10'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap font-mono text-xs text-white/80">
                    <span class="text-white/40">{log.actor_type}:</span>{log.actor_id}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-white/80">
                    {log.entity_type || "—"}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap font-mono text-[10px] text-white/60 max-w-[200px] truncate">
                    {log.entity_id || "—"}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap font-mono text-[10px] text-white/40">
                    {log.ip_address || "—"}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="text-[11px] font-mono text-white/60">{formatDate(log.created_at)}</div>
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
            total={hook.total}
            {totalPages}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>
    {/if}
  </div>
</div>

{#if selectedLog}
  <ActivityDetailModal log={selectedLog} onClose={() => selectedLog = null} />
{/if}
