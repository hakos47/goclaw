<script lang="ts">
  import { fade } from "svelte/transition";
  import { _ } from "svelte-i18n";
  import { X, Loader2, Sparkles } from "lucide-svelte";
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import { useHttp } from "../../../../lib/state/ws.svelte";

  type PromptMode = "full" | "task" | "minimal" | "none";

  interface PreviewResponse {
    mode: string;
    prompt: string;
    token_count: number;
    sections: { name: string; start: number; end: number }[];
  }

  type Props = {
    agentKey: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };

  let { agentKey, open, onOpenChange }: Props = $props();

  const MODES: PromptMode[] = ["full", "task", "minimal", "none"];
  let mode = $state<PromptMode>("full");
  let data = $state<PreviewResponse | null>(null);
  let loading = $state(false);
  let error = $state("");

  const http = useHttp();

  /** Cache boundary marker — highlighted in the preview output. */
  const CACHE_BOUNDARY = "<!-- GOCLAW_CACHE_BOUNDARY -->";

  function insertCacheBoundary(prompt: string): string {
    return prompt.replace(
      CACHE_BOUNDARY,
      "\n\n---\n\n> **── cache boundary ──** stable above · dynamic below\n\n",
    );
  }

  async function fetchPreview(m: PromptMode) {
    loading = true;
    error = "";
    try {
      const res = await http.get<PreviewResponse>(
        `/v1/agents/${agentKey}/system-prompt-preview?mode=${m}`,
      );
      data = res;
    } catch (err: any) {
      error = err.message || "Failed to load preview";
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (open) {
      fetchPreview(mode);
    }
  });

  let parsedContent = $derived.by(() => {
    if (!data?.prompt) return "";
    try {
      const promptWithBoundary = insertCacheBoundary(data.prompt);
      const rawHtml = marked.parse(promptWithBoundary) as string;
      return DOMPurify.sanitize(rawHtml);
    } catch (e) {
      console.error("Error parsing markdown:", e);
      return data?.prompt || "";
    }
  });
</script>

{#if open}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
    transition:fade={{ duration: 200 }}
    onclick={() => onOpenChange(false)}
  >
    <!-- Modal -->
    <div 
      class="bg-gradient-to-br from-[#030014]/95 to-[#1a0033]/90 border border-white/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8),inset_0_2px_20px_rgba(0,0,0,0.5)] flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Cyber Grid Background -->
      <div class="absolute inset-0 pointer-events-none mix-blend-screen overflow-hidden rounded-3xl">
        <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-80"></div>
      </div>

      <!-- Header -->
      <div class="px-8 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Sparkles class="h-5 w-5 animate-[pulse_3s_ease-in-out_infinite]" />
          </div>
          <div>
            <h2 class="text-xs font-black text-white/90 tracking-[0.3em] uppercase">
              {$_('agents.detail.tabs.systemPromptPreview', {default: "System Prompt Preview"})}
            </h2>
            {#if data}
              <div class="mt-1 flex items-center gap-2">
                <span class="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest font-black text-white shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]">
                  {data.token_count.toLocaleString()} {$_('agents.files.tokens', {default: "tokens"})}
                </span>
              </div>
            {/if}
          </div>
        </div>
        
        <button 
          onclick={() => onOpenChange(false)}
          class="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors border border-white/5"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Mode selector -->
      <div class="px-8 py-4 border-b border-white/5 flex gap-3 bg-black/40 relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        {#each MODES as m}
          <button
            onclick={() => mode = m}
            class={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-[10px] font-black tracking-[0.2em] uppercase transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${
              mode === m
                ? "bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400"
                : "text-white/50 bg-white/[0.02] hover:bg-white/[0.05] hover:text-white border border-transparent hover:border-white/10"
            }`}
          >
            {m}
          </button>
        {/each}
      </div>

      <!-- Content -->
      <div class="relative flex-1 overflow-y-auto p-8 scroller-no-scrollbar bg-black/20 z-10">
        {#if loading}
          <div class="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm">
            <Loader2 class="h-8 w-8 animate-spin text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
          </div>
        {/if}

        {#if error}
          <div class="flex items-center justify-center h-full">
            <p class="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 p-5 rounded-2xl border border-red-500/30 shadow-[inset_0_2px_10px_rgba(239,68,68,0.2)]">
              {error}
            </p>
          </div>
        {:else if data}
          <div class="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10 prose-pre:shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] prose-pre:rounded-2xl max-w-none prose-sm selection:bg-purple-500/30">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html parsedContent}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
