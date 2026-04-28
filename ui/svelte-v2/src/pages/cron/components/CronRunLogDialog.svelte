<script lang="ts">
  import { X, TerminalSquare, AlertCircle, CheckCircle2, Clock } from "lucide-svelte";
  import { useCron, type CronRunLogEntry } from "../hooks/use-cron.svelte";
  import { scale, fade } from "svelte/transition";
  import { format } from "date-fns";

  let { jobId, open, onClose }: { jobId: string, open: boolean, onClose: () => void } = $props();

  const cron = useCron();
  
  let logs = $state<CronRunLogEntry[]>([]);
  let loading = $state(false);
  let total = $state(0);

  $effect(() => {
    if (open && jobId) {
      loadLogs();
    }
  });

  async function loadLogs() {
    loading = true;
    try {
      const res = await cron.getRunLog(jobId, 50, 0);
      logs = res.entries;
      total = res.total;
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-[#030014]/80 backdrop-blur-md z-[100] transition-all duration-300 flex items-center justify-center p-4 sm:p-6"
      transition:fade={{ duration: 200 }}
      onclick={onClose}
    >
      <!-- Modal Content -->
      <div 
        class="bg-[#030014]/90 border border-white/10 rounded-[2rem] w-full max-w-4xl max-h-[90vh] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative"
        onclick={(e) => e.stopPropagation()}
        transition:scale={{ duration: 300, start: 0.95, opacity: 0 }}
      >
        <div class="absolute top-0 right-0 w-64 h-64 bg-goclaw-neon-cyan/10 rounded-full blur-[80px] pointer-events-none"></div>

        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-white/10 relative z-10 shrink-0">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-goclaw-neon-cyan/20 text-goclaw-neon-cyan rounded-xl border border-goclaw-neon-cyan/30">
              <TerminalSquare class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-lg font-black text-white">Execution Logs</h2>
              <p class="text-[10px] text-white/40 uppercase tracking-widest mt-1">Total runs: {total}</p>
            </div>
          </div>
          <button 
            type="button"
            onclick={onClose}
            class="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Log List Body -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10">
          {#if loading && logs.length === 0}
             <div class="flex items-center justify-center h-32">
               <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-goclaw-neon-cyan"></div>
             </div>
          {:else if logs.length === 0}
             <div class="flex flex-col items-center justify-center h-48 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.02]">
               <TerminalSquare class="h-10 w-10 text-white/20 mb-3" />
               <p class="text-sm font-medium text-white/40">No execution logs found.</p>
             </div>
          {:else}
            <div class="space-y-3">
              {#each logs as log}
                <div class="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-white/10 transition-colors">
                  <div class="flex items-start gap-3">
                    <div class="mt-0.5">
                      {#if log.status === 'success'}
                        <CheckCircle2 class="w-4 h-4 text-emerald-400" />
                      {:else}
                        <AlertCircle class="w-4 h-4 text-rose-400" />
                      {/if}
                    </div>
                    <div>
                      <div class="text-xs font-mono text-white/60 mb-1">
                        {format(log.ts, "yyyy-MM-dd HH:mm:ss")}
                      </div>
                      <div class="text-sm font-medium {log.status === 'success' ? 'text-white/90' : 'text-rose-400'}">
                        {log.error ? log.error : (log.summary || 'Executed successfully')}
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-3 text-xs font-mono text-white/40 shrink-0">
                    {#if log.durationMs !== undefined}
                      <span class="flex items-center gap-1"><Clock class="w-3 h-3" /> {log.durationMs}ms</span>
                    {/if}
                    {#if log.inputTokens || log.outputTokens}
                      <span class="px-2 py-1 bg-[#030014] rounded-lg border border-white/10">
                        IN: {log.inputTokens || 0} | OUT: {log.outputTokens || 0}
                      </span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
{/if}
