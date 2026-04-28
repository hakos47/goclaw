<script lang="ts">
  import { X, ClipboardList, User, Box, Clock, Globe, Fingerprint, Code } from "lucide-svelte";
  import type { ActivityLog } from "../hooks/use-activity.svelte";
  import { formatDate } from "$lib/format";

  type Props = {
    log: ActivityLog;
    onClose: () => void;
  };

  let { log, onClose }: Props = $props();

  const ACTION_COLORS: Record<string, string> = {
    "agent.created": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "agent.updated": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "agent.deleted": "bg-red-500/10 text-red-400 border-red-500/20",
  };

  function getActionColor(action: string) {
    return ACTION_COLORS[action] || 'bg-white/5 text-white/60 border-white/10';
  }

  // Helper to format JSON nicely
  const detailsJson = $derived(
    log.details ? JSON.stringify(log.details, null, 2) : "No additional details provided."
  );
</script>

<div class="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/60 animate-in fade-in duration-200" onclick={onClose}>
  <!-- Modal Content -->
  <div 
    class="w-full max-w-2xl bg-[#070514]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden animate-in zoom-in-95 duration-300"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="relative p-6 border-b border-white/5 overflow-hidden">
      <div class="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/20 blur-[60px] pointer-events-none rounded-full"></div>
      
      <div class="flex items-start justify-between relative z-10">
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner">
            <ClipboardList class="h-5 w-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          </div>
          <div>
            <h2 class="text-lg font-black tracking-widest text-white uppercase drop-shadow-md">
              Activity Details
            </h2>
            <div class="flex items-center gap-2 mt-1.5">
               <span class={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getActionColor(log.action)}`}>
                 {log.action}
               </span>
               <span class="text-[10px] font-mono text-white/40">
                 ID: {log.id}
               </span>
            </div>
          </div>
        </div>
        
        <button 
          onclick={onClose}
          class="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-white/50 hover:text-white"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar space-y-6">
      
      <!-- Context Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Actor Card -->
        <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
            <User class="w-3.5 h-3.5" />
            Actor
          </div>
          <div>
            <div class="text-[10px] uppercase text-white/50 mb-0.5">{log.actor_type}</div>
            <div class="text-sm font-mono text-white/90 truncate" title={log.actor_id}>{log.actor_id}</div>
          </div>
        </div>

        <!-- Entity Card -->
        <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
            <Box class="w-3.5 h-3.5" />
            Target Entity
          </div>
          <div>
            <div class="text-[10px] uppercase text-white/50 mb-0.5">{log.entity_type || "Unknown"}</div>
            <div class="text-sm font-mono text-white/90 truncate" title={log.entity_id || "—"}>{log.entity_id || "—"}</div>
          </div>
        </div>
      </div>

      <!-- Metadata Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Timestamp -->
        <div class="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
           <div class="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
             <Clock class="h-3.5 w-3.5 text-white/40" />
           </div>
           <div>
             <div class="text-[9px] font-black uppercase tracking-widest text-white/30">Timestamp</div>
             <div class="text-xs font-mono text-white/80">{formatDate(log.created_at)}</div>
           </div>
        </div>
        
        <!-- IP Address -->
        <div class="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
           <div class="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
             <Globe class="h-3.5 w-3.5 text-white/40" />
           </div>
           <div>
             <div class="text-[9px] font-black uppercase tracking-widest text-white/30">IP Address</div>
             <div class="text-xs font-mono text-white/80">{log.ip_address || "Internal"}</div>
           </div>
        </div>
      </div>

      <!-- Raw Payload -->
      <div class="space-y-3">
        <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 px-1">
          <Code class="w-3.5 h-3.5" />
          Event Payload Details
        </div>
        <div class="p-4 rounded-xl bg-[#020106] border border-white/5 shadow-inner overflow-x-auto custom-scrollbar">
          <pre class="text-[11px] font-mono text-white/70"><code>{detailsJson}</code></pre>
        </div>
      </div>
    </div>
  </div>
</div>
