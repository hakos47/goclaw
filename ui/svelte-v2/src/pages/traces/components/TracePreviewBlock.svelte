<script lang="ts">
  import { Copy, Check } from "lucide-svelte";
  import { cn } from "$lib/utils";

  type Props = {
    label: string;
    content: string;
  };

  let { label, content }: Props = $props();
  let copied = $state(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }
</script>

<div class="space-y-1.5">
  <div class="flex items-center justify-between px-1">
    <span class="text-[9px] font-black uppercase tracking-widest text-white/30">{label}</span>
    <button 
      onclick={handleCopy}
      class="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors flex items-center gap-1"
    >
      {#if copied}
        <Check class="h-2.5 w-2.5 text-emerald-400" />
        <span class="text-emerald-400">Copied</span>
      {:else}
        <Copy class="h-2.5 w-2.5" />
        Copy
      {/if}
    </button>
  </div>
  <div class="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-white/60 leading-relaxed whitespace-pre-wrap break-all max-h-48 overflow-y-auto custom-scrollbar text-left">
    {content}
  </div>
</div>
