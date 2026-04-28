<script lang="ts">
  let { 
    open = false, 
    title, 
    description, 
    confirmLabel = "Confirm", 
    variant = "default", 
    onConfirm, 
    onOpenChange 
  } = $props<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
  }>();

  let isDestructive = $derived(variant === "destructive");
</script>

{#if open}
  <div class="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
      class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      onclick={() => onOpenChange(false)}
    ></div>

    <!-- Dialog -->
    <div class="relative w-full max-w-md flex flex-col bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl glass-panel animate-in fade-in zoom-in-95 duration-200">
      <div class="p-6">
        <h2 class="text-xl font-semibold tracking-tight text-white mb-2">{title}</h2>
        <p class="text-sm text-white/60 mb-6">{description}</p>
        
        <div class="flex justify-end gap-3">
          <button 
            class="px-4 py-2 font-semibold text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 relative group overflow-hidden"
            onclick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button 
            class="px-4 py-2 font-semibold transition-colors 
                   {isDestructive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border-red-500/50' : 'bg-goclaw-neon-purple/20 text-goclaw-neon-purple hover:bg-goclaw-neon-purple/30 border-goclaw-neon-purple/50'} 
                   rounded-lg border relative group overflow-hidden"
            onclick={() => { onConfirm(); onOpenChange(false); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
