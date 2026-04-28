<script lang="ts">
  import { toast } from "./toast.svelte.ts";
  import { fade, fly, slide } from "svelte/transition";
  import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-svelte";
  import { cn } from "$lib/utils";

  const ICONS = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const COLORS = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
    error: "border-red-500/20 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]",
    info: "border-blue-500/20 bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]",
  };
</script>

<div class="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
  {#each toast.items as item (item.id)}
    {@const Icon = ICONS[item.type]}
    <div 
      in:fly={{ x: 20, duration: 300 }}
      out:fade={{ duration: 200 }}
      class={cn(
        "pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-3xl px-5 py-4 flex items-start gap-4 transition-all",
        COLORS[item.type]
      )}
    >
      <Icon class="h-5 w-5 shrink-0 mt-0.5" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-bold leading-relaxed">{item.message}</p>
      </div>
      <button 
        onclick={() => toast.remove(item.id)}
        class="shrink-0 p-1 rounded-lg hover:bg-white/5 opacity-40 hover:opacity-100 transition-all"
      >
        <X class="h-4 w-4" />
      </button>
      
      <!-- Progress Bar -->
      {#if item.duration && item.duration > 0}
        <div class="absolute bottom-0 left-0 h-1 bg-current opacity-20 animate-[toast-progress_linear_forwards]" style="animation-duration: {item.duration}ms"></div>
      {/if}
    </div>
  {/each}
</div>

<style>
  @keyframes toast-progress {
    from { width: 100%; }
    to { width: 0%; }
  }
</style>
