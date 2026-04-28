<script lang="ts">
  let { text } = $props<{ text: string }>();
</script>

<div class="border-b border-white/10 bg-goclaw-neon-purple/5 px-6 py-4 shadow-[inset_0_-1px_0_rgba(217,70,239,0.1)]">
  <div class="mx-auto max-w-3xl">
    <h4 class="mb-2 text-xs font-bold uppercase tracking-widest text-goclaw-neon-purple flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      Session Summary
    </h4>
    <div class="prose prose-invert prose-sm max-w-none text-white/80 prose-p:leading-relaxed">
      {text}
    </div>
  </div>
</div>
