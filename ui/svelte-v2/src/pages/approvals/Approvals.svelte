<script lang="ts">
  import { ShieldCheck, Check, X, RefreshCw, AlertTriangle } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { formatRelativeTime } from "$lib/format";
  import { approvalsStore } from "$lib/state/approvals.svelte.ts";
  import ConfirmDialog from "$lib/components/shared/ConfirmDialog.svelte";
  import { onMount } from "svelte";
  import type { PendingApproval } from "$lib/state/approvals.svelte.ts";

  let spinning = $state(false);
  let approveTarget = $state<{ approval: PendingApproval; always: boolean } | null>(null);
  let denyTarget = $state<PendingApproval | null>(null);

  onMount(() => {
    approvalsStore.load();
    const cleanup = approvalsStore.bind();
    return cleanup;
  });

  async function handleRefresh() {
    spinning = true;
    await approvalsStore.load();
    setTimeout(() => (spinning = false), 500); // Visual flair
  }

  async function confirmApprove() {
    if (approveTarget) {
      await approvalsStore.approve(approveTarget.approval.id, approveTarget.always);
      approveTarget = null;
    }
  }

  async function confirmDeny() {
    if (denyTarget) {
      await approvalsStore.deny(denyTarget.id);
      denyTarget = null;
    }
  }

  let pendingCount = $derived(approvalsStore.pending.length);
</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 w-full overflow-y-auto scroller-no-scrollbar">
  
  <!-- Bento Header -->
  <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-6 shrink-0 z-20">
    <div class="absolute inset-0 bg-[#050010]/80 backdrop-blur-3xl border border-rose-500/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(244,63,94,0.05)] overflow-hidden pointer-events-none -z-10">
      <div class="absolute -top-32 -left-32 w-64 h-64 bg-rose-500/20 blur-[80px] rounded-full"></div>
      <div class="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full"></div>
    </div>

    <div class="flex items-center gap-5 relative z-10 mb-4 sm:mb-0">
      <div class="h-14 w-14 rounded-2xl bg-black/60 border border-rose-500/20 flex items-center justify-center shadow-inner relative overflow-hidden group">
        <div class="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <ShieldCheck class="h-6 w-6 text-rose-400 transition-transform group-hover:scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
      </div>
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
            {$_("approvals.title")}
          </h1>
          {#if pendingCount > 0}
            <span class="px-2 py-0.5 rounded border border-rose-500/50 bg-rose-500/20 font-mono text-[9px] text-rose-400 uppercase tracking-widest shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse">
              {$_("approvals.pending", { values: { count: pendingCount } })}
            </span>
          {/if}
        </div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
          {$_("approvals.description")}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 relative z-10">
      <button 
        onclick={handleRefresh} 
        disabled={approvalsStore.loading || spinning}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw class={`h-4 w-4 text-white/50 group-hover:text-white ${spinning || approvalsStore.loading ? 'animate-spin' : ''}`} />
        <span class="text-[10px] font-black uppercase tracking-widest text-white/70">{$_("common.refresh")}</span>
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="flex-1 mt-4">
    {#if approvalsStore.loading && pendingCount === 0}
      <!-- Loading State -->
      <div class="space-y-4">
        {#each Array(3) as _}
          <div class="h-24 w-full rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse"></div>
        {/each}
      </div>
    {:else if pendingCount === 0}
      <!-- Empty State -->
      <div class="flex flex-col items-center justify-center h-64 bg-black/20 border border-white/5 rounded-3xl backdrop-blur-md">
        <div class="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <ShieldCheck class="h-8 w-8 text-emerald-400 opacity-50" />
        </div>
        <h3 class="text-sm font-bold tracking-widest uppercase text-white/70 mb-2">{$_("approvals.emptyTitle")}</h3>
        <p class="text-[10px] text-white/40 uppercase tracking-widest max-w-sm text-center">
          {$_("approvals.emptyDescription")}
        </p>
      </div>
    {:else}
      <!-- Pending List -->
      <div class="grid grid-cols-1 gap-4">
        {#each approvalsStore.pending as approval (approval.id)}
          <div class="group relative bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-2xl p-5 overflow-hidden transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <!-- Neon Edge Accent -->
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500/50 to-emerald-500/50 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div class="flex flex-col xl:flex-row items-start justify-between gap-6 pl-4">
              <!-- Info Section -->
              <div class="flex-1 min-w-0 w-full">
                <div class="flex items-center gap-3 mb-3">
                  <span class="px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 font-mono text-[10px] text-indigo-400 uppercase tracking-widest shadow-[inset_0_1px_5px_rgba(99,102,241,0.2)] flex items-center gap-1.5">
                    <AlertTriangle class="h-3 w-3" />
                    AGENT: {approval.agentId}
                  </span>
                  <span class="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    {formatRelativeTime(new Date(approval.createdAt))}
                  </span>
                </div>
                
                <div class="relative rounded-xl border border-white/5 bg-black/60 p-4 overflow-x-auto scroller-no-scrollbar">
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent pointer-events-none"></div>
                  <pre class="font-mono text-xs text-emerald-400/90 whitespace-pre-wrap word-break-all leading-relaxed">{@html approval.command}</pre>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-row xl:flex-col items-stretch gap-2 shrink-0 w-full xl:w-auto">
                <button
                  onclick={() => approveTarget = { approval, always: false }}
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer"
                >
                  <Check class="h-3.5 w-3.5" />
                  <span>{$_("approvals.allowOnce")}</span>
                </button>
                
                <button
                  onclick={() => approveTarget = { approval, always: true }}
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer"
                >
                  <Check class="h-3.5 w-3.5" />
                  <span>{$_("approvals.allowAlways")}</span>
                </button>
                
                <button
                  onclick={() => denyTarget = approval}
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer mt-2 xl:mt-4"
                >
                  <X class="h-3.5 w-3.5" />
                  <span>{$_("approvals.deny")}</span>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <ConfirmDialog
    open={!!approveTarget}
    onOpenChange={() => approveTarget = null}
    title={approveTarget?.always ? $_("approvals.confirmAllowAlways.title") : $_("approvals.confirmAllowOnce.title")}
    description={approveTarget?.always 
      ? $_("approvals.confirmAllowAlways.description", { values: { command: approveTarget?.approval.command, agentId: approveTarget?.approval.agentId } })
      : $_("approvals.confirmAllowOnce.description", { values: { command: approveTarget?.approval.command, agentId: approveTarget?.approval.agentId } })}
    confirmLabel={approveTarget?.always ? $_("approvals.allowAlways") : $_("approvals.allowOnce")}
    onConfirm={confirmApprove}
    variant="default"
  />

  <ConfirmDialog
    open={!!denyTarget}
    onOpenChange={() => denyTarget = null}
    title={$_("approvals.confirmDeny.title")}
    description={$_("approvals.confirmDeny.description", { values: { command: denyTarget?.command, agentId: denyTarget?.agentId } })}
    confirmLabel={$_("approvals.confirmDeny.confirmLabel")}
    variant="destructive"
    onConfirm={confirmDeny}
  />
</div>
