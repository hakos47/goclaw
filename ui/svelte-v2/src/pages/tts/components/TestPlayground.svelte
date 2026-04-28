<script lang="ts">
  import { Play, Square, Loader2, Volume2 } from "lucide-svelte";
  
  let {
    synthesize,
    provider,
    voiceId,
    modelId,
    showAudioTags = false
  }: {
    synthesize: (params: any) => Promise<Blob>;
    provider: string;
    voiceId: string;
    modelId: string;
    showAudioTags?: boolean;
  } = $props();

  let text = $state("Hello. I am your AI assistant. How can I help you today?");
  let audioUrl = $state<string | null>(null);
  let audioEl = $state<HTMLAudioElement | null>(null);
  let loading = $state(false);
  let playing = $state(false);
  let error = $state<string | null>(null);

  async function handlePlay() {
    if (audioUrl && audioEl && !textHasChanged) {
      // Replay existing if text hasn't changed
      audioEl.play();
      return;
    }

    loading = true;
    error = null;
    try {
      const blob = await synthesize({
        text,
        provider,
        voice_id: voiceId,
        model_id: modelId
      });
      
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      audioUrl = URL.createObjectURL(blob);
      
      // We will rely on oncanplay to auto-start if possible
      textHasChanged = false;
    } catch (err: any) {
      error = err.message || "Synthesis failed";
    } finally {
      loading = false;
    }
  }

  function stop() {
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
  }

  let textHasChanged = $state(false);
</script>

<div class="p-6 rounded-[2rem] bg-goclaw-neon-purple/5 border border-goclaw-neon-purple/20 shadow-[0_0_30px_rgba(217,70,239,0.05)] relative overflow-hidden group">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,70,239,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
  
  <div class="flex items-center gap-2 mb-6 relative z-10">
    <Volume2 class="w-4 h-4 text-goclaw-neon-purple" />
    <h3 class="text-sm font-bold text-white/90">Test Playground</h3>
  </div>

  <div class="grid gap-4 relative z-10">
    {#if showAudioTags}
       <p class="text-[9px] text-goclaw-neon-purple/60 uppercase tracking-widest font-mono">
         * This provider supports SSML / Audio Tags inside the text.
       </p>
    {/if}

    <textarea 
      bind:value={text}
      oninput={() => textHasChanged = true}
      rows="4"
      placeholder="Enter text to synthesize..."
      class="w-full bg-[#030014]/60 border border-goclaw-neon-purple/20 rounded-2xl p-4 text-sm font-mono focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple/30 transition-all outline-none resize-none text-white shadow-inner"
    ></textarea>

    <div class="flex items-center justify-between mt-2">
      <div class="flex items-center gap-3">
        <button 
          onclick={handlePlay}
          disabled={loading || !voiceId || (!audioUrl && !text)}
          class="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-goclaw-neon-purple/20 border border-goclaw-neon-purple/50 text-white font-black uppercase tracking-widest shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] hover:bg-goclaw-neon-purple/30 transition-all disabled:opacity-50 disabled:hover:shadow-none group"
        >
          {#if loading}
            <Loader2 class="w-4 h-4 animate-spin text-goclaw-neon-purple" />
            <span class="text-[10px]">Synthesizing...</span>
          {:else if playing}
            <Volume2 class="w-4 h-4 text-goclaw-neon-purple animate-pulse" />
            <span class="text-[10px]">Playing</span>
          {:else}
            <Play class="w-4 h-4 group-hover:scale-110 transition-transform text-goclaw-neon-purple" />
            <span class="text-[10px]">{audioUrl && !textHasChanged ? 'Replay' : 'Synthesize'}</span>
          {/if}
        </button>

        {#if playing}
          <button 
            onclick={stop}
            class="p-3 rounded-xl border border-white/10 bg-black/40 hover:bg-white/10 hover:text-red-400 text-white/50 transition-all"
          >
            <Square class="w-4 h-4" />
          </button>
        {/if}
      </div>

      {#if audioUrl}
        <!-- Hidden audio element to control playback -->
        <audio 
          bind:this={audioEl}
          src={audioUrl} 
          autoplay
          onplay={() => playing = true}
          onpause={() => playing = false}
          onended={() => playing = false}
          class="hidden"
        ></audio>
        
        {#if playing}
          <div class="flex items-center gap-1 h-4">
             {#each Array(5) as _, i}
               <div class="w-1 bg-goclaw-neon-purple rounded-full animate-pulse" style="height: {Math.max(4, Math.random() * 16)}px; animation-delay: {i * 100}ms;"></div>
             {/each}
          </div>
        {/if}
      {/if}
    </div>

    {#if error}
      <div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400 mt-2">
        {error}
      </div>
    {/if}
  </div>
</div>
