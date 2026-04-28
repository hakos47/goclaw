<script lang="ts">
  let { content } = $props<{ content: string }>();
</script>

<div class="mb-4 w-full">
  <div class="mx-auto max-w-[85%] overflow-hidden rounded-md border border-white/10 bg-black/50 shadow-sm backdrop-blur-md">
    <div class="flex items-center gap-2 border-b border-white/5 bg-white/5 px-3 py-1.5 opacity-80">
      <div class="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
      <span class="text-[10px] font-bold uppercase tracking-widest text-cyan-400">System Log</span>
    </div>
    <div class="p-3">
      <pre class="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-white/70">{content.replace(/^\[System( Message)?\]\s*/i, "")}</pre>
    </div>
  </div>
</div>
