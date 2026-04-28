<script lang="ts">
  import { X, Code, Fingerprint, Clock, MapPin } from "lucide-svelte";
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte";
  import { fade, scale } from "svelte/transition";

  export let entry: TeamEventEntry | null = null;
  export let onClose: () => void;

  function formatTime(timestamp: any) {
    try {
      const ts = typeof timestamp === 'string' && /^\d+$/.test(timestamp) ? parseInt(timestamp, 10) : timestamp;
      const date = new Date(ts);
      if (isNaN(date.getTime())) return String(timestamp);
      
      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'medium',
        fractionalSecondDigits: 3
      });
    } catch {
      return String(timestamp);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if entry}
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    in:fade={{ duration: 300 }} 
    out:fade={{ duration: 200 }}
  >
    <!-- Backdrop overlay -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div 
      class="absolute inset-0 bg-[#020106]/80 backdrop-blur-md"
      onclick={onClose}
    ></div>

    <!-- Modal Content -->
    <div 
      class="relative w-full max-w-4xl max-h-full flex flex-col bg-[#0a0a16] border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden"
      in:scale={{ start: 0.95, duration: 300 }} 
      out:scale={{ start: 0.95, duration: 200 }}
    >
      <!-- Glowing Orbs inside modal -->
      <div class="absolute -top-32 -left-32 w-64 h-64 bg-goclaw-neon-purple/20 blur-[100px] pointer-events-none rounded-full"></div>
      <div class="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full"></div>

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-5 border-b border-white/5 relative z-10 shrink-0">
        <div class="flex items-center gap-4">
          <div class="p-2 rounded-xl bg-white/5 border border-white/10 shadow-inner text-white">
            <Code class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-lg font-black uppercase tracking-widest text-white drop-shadow-md">
              Event Details
            </h2>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
              Raw Telemetry Inspection
            </p>
          </div>
        </div>

        <button 
          onclick={onClose}
          class="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-transparent hover:border-white/10"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Scrollable Body -->
      <div class="p-6 overflow-y-auto custom-scrollbar flex-1 min-h-0 relative z-10 space-y-6">
        
        <!-- Metadata Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
            <div class="flex items-center gap-2 mb-2">
              <Fingerprint class="h-3.5 w-3.5 text-goclaw-neon-purple drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]" />
              <span class="text-[10px] font-black uppercase tracking-widest text-white/30">Event Type</span>
            </div>
            <p class="text-xs font-mono font-bold text-white/80 uppercase break-all">{entry.event}</p>
          </div>

          <div class="p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
            <div class="flex items-center gap-2 mb-2">
              <Clock class="h-3.5 w-3.5 text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" />
              <span class="text-[10px] font-black uppercase tracking-widest text-white/30">Timestamp</span>
            </div>
            <p class="text-xs font-mono text-white/80">{formatTime(entry.timestamp)}</p>
          </div>

          <div class="p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
            <div class="flex items-center gap-2 mb-2">
              <MapPin class="h-3.5 w-3.5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
              <span class="text-[10px] font-black uppercase tracking-widest text-white/30">Team ID</span>
            </div>
            <p class="text-xs font-mono text-white/80 break-all">{entry.teamId || "N/A"}</p>
          </div>

          <div class="p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
            <div class="flex items-center gap-2 mb-2">
              <MapPin class="h-3.5 w-3.5 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
              <span class="text-[10px] font-black uppercase tracking-widest text-white/30">User ID</span>
            </div>
            <p class="text-xs font-mono text-white/80 break-all">{entry.userId || "N/A"}</p>
          </div>
        </div>

        <!-- Raw Payload -->
        <div>
          <h3 class="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3 ml-1">Payload object</h3>
          <div class="rounded-xl border border-white/5 bg-[#020106]/90 p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-x-auto">
            <pre class="text-[11px] font-mono leading-relaxed text-white/70">{JSON.stringify(entry.payload, null, 2)}</pre>
          </div>
        </div>

      </div>
    </div>
  </div>
{/if}
