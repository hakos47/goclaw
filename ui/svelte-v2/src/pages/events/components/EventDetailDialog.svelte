<script lang="ts">
  import { X, Copy, CheckCircle2 } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import type { TeamEventEntry } from "$lib/state/team-event-store.svelte.ts";
  import { formatRelativeTime } from "$lib/format";

  type Props = {
    open: boolean;
    entry: TeamEventEntry | null;
    onClose: () => void;
  };

  let { open, entry, onClose }: Props = $props();

  let copied = $state(false);

  async function handleCopy() {
    if (!entry) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(entry.payload, null, 2));
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  }

  // Prevent background scrolling
  $effect(() => {
    if (open && typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    } else if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    return () => {
      if (typeof document !== "undefined") document.body.style.overflow = "";
    };
  });
</script>

{#if open && entry}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-[#020008]/80 backdrop-blur-md" onclick={onClose}></div>
    
    <!-- Modal -->
    <div class="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#050510]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
      
      <!-- Decorative Header Blur -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-goclaw-neon-purple/10 blur-[60px] pointer-events-none"></div>

      <!-- Header -->
      <div class="px-6 py-5 sm:px-8 sm:py-6 border-b border-white/5 relative z-10 flex items-center justify-between shrink-0">
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-black text-white uppercase tracking-widest drop-shadow-md">
              {entry.event}
            </h2>
            <span class="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/50 uppercase">
              ID: {entry.id}
            </span>
          </div>
          <p class="text-[10px] uppercase tracking-widest text-white/40 mt-1">
            {formatRelativeTime(new Date(entry.timestamp))}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            onclick={handleCopy}
            class="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white/50 hover:text-white"
          >
            {#if copied}
              <CheckCircle2 class="h-4 w-4 text-emerald-400" />
              <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400">Copied</span>
            {:else}
              <Copy class="h-4 w-4" />
              <span class="text-[10px] font-black uppercase tracking-widest">Copy Payload</span>
            {/if}
          </button>

          <button 
            onclick={onClose}
            class="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors border border-white/10 hover:border-red-500/30"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-6 sm:p-8 relative z-10 custom-scrollbar">
        <div class="bg-[#020008]/80 border border-white/5 rounded-xl p-4 shadow-inner">
          <pre class="text-xs font-mono text-emerald-400/90 whitespace-pre-wrap word-break-all leading-relaxed">{JSON.stringify(entry.payload, null, 2)}</pre>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
