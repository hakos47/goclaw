<script lang="ts">
  import { Link2, RefreshCw, Check, X, Trash2, Cpu, ArrowRight } from "lucide-svelte";
  import { useNodes } from "./hooks/use-nodes.svelte";
  import { useContactResolver } from "../../lib/hooks/use-contact-resolver.svelte";
  import { formatUserLabel } from "../../lib/format-user-label";

  const nodesState = useNodes();
  
  const senderIds = $derived([
    ...nodesState.pendingPairings.map((p) => p.sender_id),
    ...nodesState.pairedDevices.map((d) => d.sender_id),
    ...nodesState.pairedDevices.map((d) => d.paired_by).filter(Boolean),
  ].filter(Boolean) as string[]);

  const contactResolver = useContactResolver(() => senderIds);

  let spinning = $state(false);
  $effect(() => {
    if (nodesState.loading) spinning = true;
    else setTimeout(() => spinning = false, 500); // keep spinning a bit for visual feedback
  });

  const isEmpty = $derived(nodesState.pendingPairings.length === 0 && nodesState.pairedDevices.length === 0);

  let approveTarget = $state<any>(null);
  let denyTarget = $state<any>(null);
  let revokeTarget = $state<any>(null);

  // Time formatters
  function formatRelativeTime(dateInput: string | number) {
     const date = new Date(dateInput);
     const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
     if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
     return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  function formatDate(dateInput: string | number) {
     const date = new Date(dateInput);
     return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  }

  async function handleApprove() {
    if (!approveTarget) return;
    await nodesState.approvePairing(approveTarget.code);
    approveTarget = null;
  }

  async function handleDeny() {
    if (!denyTarget) return;
    await nodesState.denyPairing(denyTarget.code);
    denyTarget = null;
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    await nodesState.revokePairing(revokeTarget.sender_id, revokeTarget.channel);
    revokeTarget = null;
  }

</script>

<div class="relative isolate h-full flex flex-col p-4 sm:p-6 pb-10 min-h-full">
  
  <!-- Global Background Effects -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.05)_0%,transparent_50%)] pointer-events-none"></div>
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.05)_0%,transparent_50%)] pointer-events-none"></div>

  <!-- Header: Radical Telemetry HUD -->
  <div class="relative z-10 mb-8 border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-sm backdrop-blur-xl p-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)] overflow-hidden">
    <div class="absolute top-0 right-0 w-64 h-64 bg-goclaw-neon-purple/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
    
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-50 pointer-events-none"></div>
    
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
      <div class="flex items-center gap-5">
        <div class="relative group">
          <div class="absolute inset-0 bg-goclaw-neon-purple/20 blur-xl rounded-full group-hover:bg-goclaw-neon-purple/30 transition-all duration-500"></div>
          <div class="h-14 w-14 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-goclaw-neon-purple/30 flex items-center justify-center relative overflow-hidden shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]">
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]"></div>
            <Link2 class="h-6 w-6 text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </div>
        </div>
        <div>
          <h1 class="text-2xl font-black tracking-widest uppercase text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            Linked Nodes
          </h1>
          <div class="flex items-center gap-3 mt-1.5">
            <span class="text-[10px] uppercase font-mono text-goclaw-neon-purple/80 tracking-widest bg-goclaw-neon-purple/10 px-2 py-0.5 rounded-full border border-goclaw-neon-purple/20">
              {nodesState.pairedDevices.length} ACTIVE
            </span>
            <span class="text-[10px] uppercase tracking-widest text-white/40">
              External device paring management
            </span>
          </div>
        </div>
      </div>
      
      <button 
        onclick={nodesState.refresh}
        disabled={spinning}
        class="inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none border border-white/10 bg-white/5 hover:bg-white/10 text-white h-8 px-3 disabled:opacity-50"
      >
        <RefreshCw class={`h-3 w-3 mr-1.5 ${spinning ? 'animate-spin text-goclaw-neon-purple' : ''}`} /> Sync State
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="relative z-10 flex-1 flex flex-col">
    {#if isEmpty && !nodesState.loading}
      <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.4)]">
        <div class="h-16 w-16 rounded-full bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/20 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <Link2 class="h-8 w-8 text-goclaw-neon-purple opacity-50" />
        </div>
        <h3 class="text-xs font-black uppercase tracking-widest text-white/80">No Nodes Linked</h3>
        <p class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Awaiting pairing requests from external platforms.</p>
      </div>
    {:else}
      <div class="space-y-8">
        
        <!-- Pending Pairings -->
        {#if nodesState.pendingPairings.length > 0}
          <div class="space-y-4">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-amber-400/80 flex items-center gap-2 pl-2">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              Pending Requests ({nodesState.pendingPairings.length})
            </h3>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {#each nodesState.pendingPairings as p}
                <div class="p-5 rounded-2xl bg-[#030014]/60 backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-amber-400/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-[inset_0_0_20px_rgba(234,179,8,0.05)]">
                  <div class="absolute top-0 left-0 w-1 bg-amber-400/50 h-full"></div>
                  
                  <div class="pl-2">
                    <div class="flex items-center gap-3 mb-1">
                      <span class="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-bold text-white/70 uppercase tracking-widest">
                        {p.channel}
                      </span>
                      <span class="font-mono text-sm font-bold text-amber-400 tracking-wider bg-amber-400/10 px-2 py-0.5 rounded">{p.code}</span>
                    </div>
                    <div class="text-[10px] text-white/50 uppercase tracking-widest flex items-center gap-2 mt-2">
                      <Cpu class="h-3 w-3" /> 
                      <span class="text-white/80">{formatUserLabel(p.sender_id, contactResolver.resolve)}</span>
                      {#if p.chat_id}
                        <span class="text-white/30">•</span> Chat: {p.chat_id}
                      {/if}
                      <span class="text-white/30">•</span> {formatRelativeTime(p.created_at)}
                    </div>
                  </div>
                  
                  <div class="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button 
                      onclick={() => denyTarget = p}
                      class="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 h-8 px-3"
                    >
                      <X class="h-3 w-3 mr-1.5" /> Deny
                    </button>
                    <button 
                      onclick={() => approveTarget = p}
                      class="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 h-8 px-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    >
                      <Check class="h-3 w-3 mr-1.5" /> Approve
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Paired Devices -->
        {#if nodesState.pairedDevices.length > 0}
          <div class="space-y-4">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-white/50 pl-2">
              Active Network Nodes ({nodesState.pairedDevices.length})
            </h3>
            
            <div class="rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-white/5 bg-white/[0.02]">
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Channel</th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Sender Node</th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:table-cell">Linked At</th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-white/40 hidden md:table-cell">Paired By</th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-white/40 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  {#each nodesState.pairedDevices as d}
                    <tr class="hover:bg-white/[0.02] transition-colors group">
                      <td class="p-4 align-middle">
                        <span class="px-2 py-0.5 rounded border border-goclaw-neon-purple/30 bg-goclaw-neon-purple/10 text-[9px] font-bold text-goclaw-neon-purple uppercase tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                          {d.channel}
                        </span>
                      </td>
                      <td class="p-4 align-middle font-mono text-xs text-white/80">
                        {formatUserLabel(d.sender_id, contactResolver.resolve)}
                      </td>
                      <td class="p-4 align-middle text-xs font-mono text-white/40 hidden sm:table-cell">
                        {formatDate(d.paired_at)}
                      </td>
                      <td class="p-4 align-middle text-xs font-mono text-white/40 hidden md:table-cell">
                        {d.paired_by ? formatUserLabel(d.paired_by, contactResolver.resolve) : '--'}
                      </td>
                      <td class="p-4 align-middle text-right">
                        <button 
                          onclick={() => revokeTarget = d}
                          class="inline-flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/20 h-8 px-2 text-white/30 hover:text-red-500 border border-transparent hover:border-red-500/30 text-[9px] font-bold uppercase tracking-widest ml-auto"
                        >
                          <Trash2 class="h-3.5 w-3.5 mr-1" /> <span class="hidden sm:inline">Revoke</span>
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

      </div>
    {/if}
  </div>

  <!-- Dialog Overlays (Custom Imperfuturista style) -->
  {#if approveTarget}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030014]/80 backdrop-blur-2xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
      <div class="w-full max-w-md bg-[#030014]/60 backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
        <h3 class="text-lg font-black uppercase tracking-widest text-white mb-2">Approve Connection</h3>
        <p class="text-xs text-white/50 mb-6 leading-relaxed">
          Allow <strong class="text-white">{approveTarget.channel}</strong> device 
          <code class="text-emerald-400 bg-emerald-500/10 px-1 rounded">{approveTarget.sender_id}</code> to connect with pairing code {approveTarget.code}?
        </p>
        <div class="flex justify-end gap-3">
          <button onclick={() => approveTarget = null} class="inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none border border-white/10 bg-white/5 hover:bg-white/10 text-white h-8 px-4">Cancel</button>
          <button onclick={handleApprove} class="inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none border border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500 hover:text-black text-emerald-400 h-8 px-4">
            Confirm <ArrowRight class="h-3 w-3 ml-1.5" />
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if denyTarget}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030014]/80 backdrop-blur-2xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
      <div class="w-full max-w-md bg-[#030014]/60 backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-red-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
        <h3 class="text-lg font-black uppercase tracking-widest text-white mb-2">Deny Connection</h3>
        <p class="text-xs text-white/50 mb-6 leading-relaxed">
          Reject pairing code <strong class="text-white">{denyTarget.code}</strong> from <strong class="text-white">{denyTarget.channel}</strong> device 
          <code class="text-red-400 bg-red-500/10 px-1 rounded">{denyTarget.sender_id}</code>?
        </p>
        <div class="flex justify-end gap-3">
          <button onclick={() => denyTarget = null} class="inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none border border-white/10 bg-white/5 hover:bg-white/10 text-white h-8 px-4">Cancel</button>
          <button onclick={handleDeny} class="inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none border border-red-500/50 bg-red-500/20 hover:bg-red-500 hover:text-black text-red-400 h-8 px-4">
            Reject Node
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if revokeTarget}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030014]/80 backdrop-blur-2xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
      <div class="w-full max-w-md bg-[#030014]/60 backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-red-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
        <div class="absolute top-0 right-0 p-4 opacity-10"><Trash2 class="h-24 w-24 text-red-500" /></div>
        <h3 class="text-lg font-black uppercase tracking-widest text-white mb-2 relative z-10">Revoke Access</h3>
        <p class="text-xs text-white/50 mb-6 leading-relaxed relative z-10">
          Permanently sever connection with <strong class="text-white">{revokeTarget.channel}</strong> node 
          <code class="text-red-400 bg-red-500/10 px-1 rounded">{revokeTarget.sender_id}</code>? They will need to pair again to regain access.
        </p>
        <div class="flex justify-end gap-3 relative z-10">
          <button onclick={() => revokeTarget = null} class="inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none border border-white/10 bg-white/5 hover:bg-white/10 text-white h-8 px-4">Cancel</button>
          <button onclick={handleRevoke} class="inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none border border-red-500/50 bg-red-500/20 hover:bg-red-500 hover:text-black text-red-400 h-8 px-4">
            Sever Link
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>
