<script lang="ts">
  import { X, FileText, Save, Clock, Brain, RefreshCw } from "lucide-svelte";
  import type { MemoryDocument, MemoryDocumentDetail, MemoryChunk } from "../types";
  import { useHttp } from "$lib/state/ws.svelte";
  import { fade, scale } from "svelte/transition";
  import { formatRelativeTime } from "$lib/format";

  let { 
    open = $bindable(false),
    document,
    agentId,
    onSave
  } = $props<{
    open: boolean;
    document: MemoryDocument | null;
    agentId: string;
    onSave: (path: string, content: string, userId?: string) => Promise<void>;
  }>();

  let activeTab = $state<"content" | "chunks">("content");
  let detail = $state<MemoryDocumentDetail | null>(null);
  let chunks = $state<MemoryChunk[]>([]);
  let content = $state("");
  let saving = $state(false);
  let loadingDetail = $state(false);
  let loadingChunks = $state(false);

  const http = useHttp();

  const loadDetail = async () => {
    if (!document || !agentId) return;
    loadingDetail = true;
    try {
      const params: Record<string, string> = {};
      if (document.user_id) params.user_id = document.user_id;
      const res = await http.get<MemoryDocumentDetail>(
        `/v1/agents/${agentId}/memory/documents/${document.path}`,
        params
      );
      detail = res;
      content = res?.content || "";
    } catch (err) {
      console.error("Failed to load document detail", err);
    } finally {
      loadingDetail = false;
    }
  };

  const loadChunks = async () => {
    if (!document || !agentId) return;
    loadingChunks = true;
    try {
      const params: Record<string, string> = { path: document.path };
      if (document.user_id) params.user_id = document.user_id;
      const res = await http.get<MemoryChunk[]>(
        `/v1/agents/${agentId}/memory/chunks`,
        params
      );
      chunks = res ?? [];
    } catch (err) {
      console.error("Failed to load chunks", err);
      chunks = [];
    } finally {
      loadingChunks = false;
    }
  };

  $effect(() => {
    if (open && document) {
      activeTab = "content";
      detail = null;
      chunks = [];
      loadDetail();
    }
  });

  $effect(() => {
    if (activeTab === "chunks" && chunks.length === 0 && !loadingChunks && document) {
      loadChunks();
    }
  });

  const handleSave = async () => {
    if (!document || !agentId) return;
    saving = true;
    try {
      await onSave(document.path, content, document.user_id);
      open = false;
    } catch (err) {
      console.error("Failed to save", err);
    } finally {
      saving = false;
    }
  };

  let hasChanges = $derived(detail != null && content !== detail.content);

  const close = () => {
    if (!saving) open = false;
  };

</script>

{#if open && document}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 z-50 bg-[#030014]/80 backdrop-blur-sm flex items-center justify-center p-4"
    in:fade={{ duration: 150 }}
    out:fade={{ duration: 150 }}
  >
    <!-- Modal -->
    <div 
      class="relative w-full max-w-4xl bg-[#050510]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col max-h-[90vh]"
      in:scale={{ duration: 200, start: 0.95 }}
      out:scale={{ duration: 150, start: 0.95 }}
    >
      <!-- Background Effects -->
      <div class="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      
      <!-- Header -->
      <div class="relative z-10 flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
        <div class="flex items-center gap-4">
          <div class="p-2.5 bg-white/5 border border-white/10 rounded-xl shadow-inner">
            <FileText class="h-6 w-6 text-white/70" />
          </div>
          <div>
            <h2 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 tracking-tight">
              {document.path}
            </h2>
            <div class="flex items-center gap-2 mt-1">
              {#if document.user_id}
                <span class="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md text-[9px] font-black uppercase tracking-widest">
                  Personal Scope
                </span>
              {:else}
                <span class="px-2 py-0.5 bg-white/10 text-white/50 border border-white/20 rounded-md text-[9px] font-black uppercase tracking-widest">
                  Global Scope
                </span>
              {/if}
              <span class="text-[10px] text-white/30 uppercase tracking-widest">
                ID: {document.agent_id.substring(0,8)}
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onclick={close}
          class="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Tab Switcher -->
      <div class="flex p-4 pb-0 bg-white/[0.01]">
        <div class="flex gap-2">
          <button 
            onclick={() => activeTab = 'content'}
            class="px-5 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all {activeTab === 'content' ? 'bg-white/10 text-white border-t border-x border-white/10 shadow-[0_-10px_20px_rgba(255,255,255,0.02)]' : 'text-white/40 hover:text-white/70 border border-transparent'}"
          >
            Raw Content
          </button>
          <button 
            onclick={() => activeTab = 'chunks'}
            class="px-5 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all {activeTab === 'chunks' ? 'bg-white/10 text-white border-t border-x border-white/10 shadow-[0_-10px_20px_rgba(255,255,255,0.02)]' : 'text-white/40 hover:text-white/70 border border-transparent'}"
          >
            Vector Chunks {detail ? `(${detail.chunk_count})` : ''}
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#030014]/50 relative z-10">
        {#if activeTab === 'content'}
          {#if loadingDetail}
            <div class="h-full flex items-center justify-center">
              <RefreshCw class="h-8 w-8 text-white/20 animate-spin" />
            </div>
          {:else}
            <div class="flex flex-col h-full gap-4">
              <textarea
                bind:value={content}
                class="w-full flex-1 min-h-[300px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 font-mono text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all custom-scrollbar resize-none"
                placeholder="Document content..."
              ></textarea>
            </div>
          {/if}
        {:else if activeTab === 'chunks'}
          {#if loadingChunks}
            <div class="h-full flex items-center justify-center">
              <RefreshCw class="h-8 w-8 text-white/20 animate-spin" />
            </div>
          {:else if chunks.length === 0}
            <div class="h-full flex flex-col items-center justify-center text-white/30 border border-white/5 border-dashed rounded-2xl">
              <Brain class="h-10 w-10 mb-3 opacity-20" />
              <p class="text-sm font-medium">No vector chunks extracted yet.</p>
            </div>
          {:else}
            <div class="flex flex-col gap-3">
              {#each chunks as chunk}
                <div class="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-white/50 uppercase tracking-widest">
                      Lines {chunk.start_line}-{chunk.end_line}
                    </span>
                    <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest {chunk.has_embedding ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
                      {chunk.has_embedding ? 'Embedded' : 'Missing Embedding'}
                    </span>
                  </div>
                  <pre class="font-mono text-xs text-white/70 whitespace-pre-wrap leading-relaxed bg-black/30 p-3 rounded-lg border border-white/5">{chunk.text_preview}</pre>
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>

      <!-- Footer -->
      <div class="relative z-10 p-5 border-t border-white/5 bg-white/[0.02] flex items-center justify-end gap-3">
        <button 
          onclick={close}
          disabled={saving}
          class="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        
        {#if activeTab === 'content'}
          <button 
            onclick={handleSave}
            disabled={saving || !hasChanges}
            class="flex items-center gap-2 px-6 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-xl text-xs font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:hover:shadow-none"
          >
            {#if saving}
              <Clock class="h-4 w-4 animate-spin" /> Saving...
            {:else}
              <Save class="h-4 w-4" /> Save Content
            {/if}
          </button>
        {/if}
      </div>
      
    </div>
  </div>
{/if}
