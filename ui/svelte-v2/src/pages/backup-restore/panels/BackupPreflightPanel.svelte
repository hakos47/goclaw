<script lang="ts">
  import { CheckCircle2, XCircle, RefreshCw, AlertTriangle, Loader2 } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { useHttp } from "$lib/state/ws.svelte";
  import { onMount } from "svelte";

  export interface PreflightResult {
    pg_dump_available: boolean;
    disk_space_ok: boolean;
    db_size_bytes: number;
    db_size_human: string;
    free_disk_bytes: number;
    free_disk_human: string;
    data_dir_size_bytes: number;
    data_dir_size_human: string;
    workspace_size_bytes: number;
    workspace_size_human: string;
    warnings: string[];
  }

  interface Props {
    hasCritical?: boolean;
  }
  let { hasCritical = $bindable(true) }: Props = $props();

  const http = useHttp();
  
  let data = $state<PreflightResult | null>(null);
  let loading = $state(true);
  let refreshing = $state(false);

  $effect(() => {
    hasCritical = data ? !data.pg_dump_available || !data.disk_space_ok : true;
  });

  export async function loadPreflight() {
    refreshing = true;
    try {
      data = await http.get<PreflightResult>("/v1/system/backup/preflight");
    } catch (err) {
      console.error("Failed to load preflight", err);
    } finally {
      loading = false;
      refreshing = false;
    }
  }

  onMount(loadPreflight);
</script>

{#if loading}
  <div class="rounded-2xl border border-white/5 bg-black/20 p-5 space-y-2 flex items-center justify-center">
    <div class="flex items-center gap-3 text-[10px] font-mono text-white/50 uppercase tracking-widest">
      <Loader2 class="h-4 w-4 animate-spin text-indigo-500" />
      {$_("backup.preflight.title", { default: "Preflight Checks" })}...
    </div>
  </div>
{:else if data}
  <div class="rounded-2xl border border-white/5 bg-black/20 p-6 space-y-5 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
    
    <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h3 class="text-xs font-bold uppercase tracking-widest text-indigo-400">
        {$_("backup.preflight.title", { default: "System Diagnostics" })}
      </h3>
      <button 
        onclick={loadPreflight} 
        disabled={refreshing}
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white disabled:opacity-50"
      >
        <RefreshCw class="h-3 w-3 {refreshing ? 'animate-spin text-indigo-400' : ''}" />
        <span>{$_("backup.preflight.refresh", { default: "Refresh" })}</span>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
      <div class="space-y-3">
        <div class="flex items-center gap-3 text-xs font-mono uppercase tracking-widest">
          {#if data.pg_dump_available}
            <CheckCircle2 class="h-4 w-4 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          {:else}
            <XCircle class="h-4 w-4 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          {/if}
          <span class="text-white/80">{$_("backup.preflight.pgDump", { default: "PG Dump Available" })}</span>
        </div>
        
        <div class="flex items-center gap-3 text-xs font-mono uppercase tracking-widest">
          {#if data.disk_space_ok}
            <CheckCircle2 class="h-4 w-4 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          {:else}
            <XCircle class="h-4 w-4 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          {/if}
          <span class="text-white/80">{$_("backup.preflight.diskSpace", { default: "Disk Space Sufficient" })}</span>
        </div>
      </div>

      <div class="space-y-2 pt-1 border-l border-white/5 pl-4">
        <div class="flex justify-between text-[10px] font-mono uppercase tracking-widest">
          <span class="text-white/40">{$_("backup.preflight.dbSize", { default: "Database Size" })}</span>
          <span class="text-white/80">{data.db_size_human}</span>
        </div>
        <div class="flex justify-between text-[10px] font-mono uppercase tracking-widest">
          <span class="text-white/40">{$_("backup.preflight.dataDir", { default: "Storage Size" })}</span>
          <span class="text-white/80">{data.data_dir_size_human}</span>
        </div>
        <div class="flex justify-between text-[10px] font-mono uppercase tracking-widest">
          <span class="text-white/40">{$_("backup.preflight.workspace", { default: "Workspace Size" })}</span>
          <span class="text-white/80">{data.workspace_size_human}</span>
        </div>
        <div class="flex justify-between text-[10px] font-mono uppercase tracking-widest">
          <span class="text-white/40">{$_("backup.preflight.freeDisk", { default: "Free Disk" })}</span>
          <span class="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">{data.free_disk_human}</span>
        </div>
      </div>
    </div>

    {#if data.warnings && data.warnings.length > 0}
      <div class="space-y-2 pt-3 border-t border-white/5 relative z-10">
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
          {$_("backup.preflight.warnings", { default: "Warnings" })}
        </p>
        {#each data.warnings as w}
          <div class="flex items-start gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-500/80 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
            <AlertTriangle class="h-3 w-3 mt-0.5 shrink-0" />
            <span>{w}</span>
          </div>
        {/each}
      </div>
    {/if}

    {#if hasCritical}
      <div class="pt-3 border-t border-rose-500/20 relative z-10">
        <p class="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/30 flex items-center gap-3">
          <AlertTriangle class="h-4 w-4 shrink-0" />
          {$_("backup.preflight.critical", { default: "CRITICAL CHECKS FAILED. BACKUPS MAY CORRUPT OR FAIL." })}
        </p>
      </div>
    {/if}

    {#if !data.pg_dump_available}
      <div class="pt-2 relative z-10">
        <div class="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/30 text-[10px] font-mono uppercase tracking-widest text-indigo-300">
          <p class="font-bold mb-1 flex items-center gap-2">
            <AlertTriangle class="h-3 w-3" />
            {$_("backup.preflight.pgDumpMissing", { default: "Missing pg_dump binary" })}
          </p>
          <a href="/packages" class="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/50">
            {$_("backup.preflight.goToPackages", { default: "Install from Packages Module" })}
          </a>
        </div>
      </div>
    {/if}
  </div>
{/if}
