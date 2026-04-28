<script lang="ts">
  import { Pencil, X, FileText, Link2, FileQuestion, Plus, ExternalLink, Save, Trash2, Clock, ChevronRight } from "lucide-svelte";
  import { useVaultFileContent, useVaultLinks, useUpdateDocument, useDeleteDocument } from "../hooks/use-vault.svelte";
  import type { VaultDocument } from "../../types/vault";
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import { formatRelativeTime } from "$lib/format";
  import { useHttp } from "$lib/state/ws.svelte";
  import VaultLinkDialog from "../dialogs/VaultLinkDialog.svelte";

  let {
    doc,
    onClose,
  } = $props<{
    doc: VaultDocument;
    onClose: () => void;
  }>();

  let linkDialogOpen = $state(false);

  let isImage = $derived.by(() => {
    const mime = doc?.metadata?.mime_type as string | undefined;
    if (mime?.startsWith("image/")) return true;
    const ext = doc?.path.split(".").pop()?.toLowerCase() ?? "";
    return ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(ext);
  });

  let isMedia = $derived(doc?.doc_type === "media");
  let isBinary = $derived(isMedia || doc?.doc_type === "document");

  // State hooks
  const fileContentStore = useVaultFileContent(() => (doc && !isBinary ? doc.path : null));
  const linksStore = useVaultLinks(() => (doc ? doc.id : null));

  let fileContent = $derived(fileContentStore.content);
  let contentLoading = $derived(fileContentStore.loading);
  let contentError = $derived(fileContentStore.error);

  let outlinks = $derived(linksStore.outlinks);
  let backlinks = $derived(linksStore.backlinks);
  let linkCount = $derived(outlinks.length + backlinks.length);
  let linksLoading = $derived(linksStore.loading);

  let editMode = $state(false);
  let editTitle = $state("");
  let editDocType = $state("");
  let editScope = $state("");
  let confirmDelete = $state(false);

  const updateMutation = useUpdateDocument();
  const deleteMutation = useDeleteDocument();

  $effect(() => {
    if (editMode && doc) {
      editTitle = doc.title || "";
      editDocType = doc.doc_type || "";
      editScope = doc.scope || "";
    }
  });

  const handleSave = async () => {
    if (!doc) return;
    try {
      await updateMutation.update(doc.id, {
        title: editTitle,
        doc_type: editDocType,
        scope: editScope,
      });
      // Update local doc state so it reflects immediately
      doc.title = editTitle;
      doc.doc_type = editDocType;
      doc.scope = editScope;
      editMode = false;
    } catch (e) {
      // Error handled in hook
    }
  };

  const handleDelete = async () => {
    if (!doc) return;
    try {
      await deleteMutation.remove(doc.id);
      onClose(); // Delete successful, close the view
    } catch (e) {
      // Error handled in hook
    }
  };

  // Image specific handling
  let imageUrl = $state<string | null>(null);
  let imageError = $state(false);

  $effect(() => {
    let revokeUrl: string | null = null;

    if (isMedia && isImage && doc) {
      imageError = false;
      const loadImg = async () => {
        try {
          const http = useHttp();
          const blob = await http.downloadBlob(`/v1/storage/files/${encodeURIComponent(doc.path)}?raw=true`);
          revokeUrl = URL.createObjectURL(blob);
          imageUrl = revokeUrl;
          imageError = false;
        } catch (e) {
          console.error("Failed to load vault image:", e);
          imageError = true;
          imageUrl = null;
        }
      };
      loadImg();
    } else {
      imageUrl = null;
      imageError = false;
    }

    return () => {
      if (revokeUrl) {
        URL.revokeObjectURL(revokeUrl);
      }
    };
  });

  const getHtml = (content: string) => {
    try {
      const rawHtml = marked.parse(content);
      return DOMPurify.sanitize(rawHtml as string);
    } catch {
      return "";
    }
  };

</script>

<div class="h-full flex flex-col bg-[#050510]/95 overflow-hidden">
  <!-- Neon Accent Top Bar -->
  <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20"></div>

  <!-- Header -->
      <div class="shrink-0 p-5 border-b border-white/5 bg-white/[0.02]">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1 space-y-2">
            {#if editMode}
              <div class="flex flex-col gap-3 max-w-lg">
                <input 
                  type="text" 
                  bind:value={editTitle} 
                  class="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50"
                  placeholder="Document Title"
                />
                <div class="flex items-center gap-2">
                  <select bind:value={editDocType} class="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-widest text-white/70 focus:outline-none">
                    <option value="context">CONTEXT</option>
                    <option value="memory">MEMORY</option>
                    <option value="note">NOTE</option>
                    <option value="skill">SKILL</option>
                    <option value="episodic">EPISODIC</option>
                    <option value="media">MEDIA</option>
                    <option value="document">DOCUMENT</option>
                  </select>
                  <select bind:value={editScope} class="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-widest text-white/70 focus:outline-none">
                    <option value="personal">PERSONAL</option>
                    <option value="team">TEAM</option>
                    <option value="shared">SHARED</option>
                  </select>
                </div>
              </div>
            {:else}
              <div class="flex items-center gap-3">
                <h2 class="text-xl font-bold text-white truncate drop-shadow-md">
                  {doc.title || doc.path}
                </h2>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-white/10 text-white border border-white/10 shadow-inner">
                    {doc.doc_type}
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-transparent text-white/50 border border-white/10">
                    {doc.scope}
                  </span>
                </div>
              </div>
            {/if}
            
            <div class="flex items-center gap-2 text-xs font-mono text-white/40 truncate">
              <span class="px-1.5 py-0.5 bg-black/50 rounded border border-white/5">{doc.path}</span>
            </div>
          </div>

          <div class="flex flex-col items-end gap-2 shrink-0">
            <div class="flex items-center gap-2">
              {#if editMode}
                {#if confirmDelete}
                  <button 
                    onclick={handleDelete}
                    disabled={deleteMutation.isPending}
                    class="h-8 px-3 flex items-center justify-center rounded-lg bg-red-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'DELETING...' : 'CONFIRM DELETE'}
                  </button>
                  <button 
                    onclick={() => confirmDelete = false}
                    class="h-8 px-3 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 transition-colors text-xs font-bold uppercase tracking-widest"
                  >
                    CANCEL
                  </button>
                {:else}
                  <button 
                    onclick={() => confirmDelete = true}
                    class="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 text-white/50 transition-colors"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                  <button 
                    onclick={handleSave}
                    disabled={updateMutation.isPending}
                    class="h-8 px-3 flex items-center justify-center rounded-lg bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'SAVING...' : 'SAVE'}
                  </button>
                  <button 
                    onclick={() => editMode = false}
                    class="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/50 transition-colors"
                  >
                    <X class="h-4 w-4" />
                  </button>
                {/if}
              {:else}
                <button 
                  onclick={() => { editMode = true; confirmDelete = false; }}
                  class="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/50 transition-colors"
                >
                  <Pencil class="h-4 w-4" />
                </button>
                <button 
                  onclick={onClose}
                  class="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-colors"
                >
                  <X class="h-4 w-4" />
                </button>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Main Body -->
      <div class="flex-1 min-h-0 flex flex-col md:flex-row relative">
        <!-- Content Area -->
        <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 lg:p-10 bg-black/40 relative">
          <!-- Subtle Hexagon / Grid Pattern Overlay -->
          <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 pointer-events-none z-0"></div>

          <div class="relative z-10">
            {#if isBinary}
              {#if isMedia && isImage}
                <div class="flex items-center justify-center h-full min-h-[400px] p-4 bg-[#050510]/80 rounded-2xl border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.05),inset_0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md">
                  {#if imageUrl}
                    <img src={imageUrl} alt={doc.title} class="max-w-full max-h-[70vh] object-contain rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/5" />
                  {:else if imageError}
                    <div class="flex flex-col items-center gap-4 text-red-400/50">
                      <FileQuestion class="h-16 w-16 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                      <span class="text-sm font-black uppercase tracking-[0.2em]">Image Failed to Load</span>
                    </div>
                  {:else}
                    <div class="flex flex-col items-center gap-4 text-indigo-400/50">
                      <div class="relative flex items-center justify-center h-16 w-16">
                        <div class="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                        <div class="h-8 w-8 rounded-full bg-indigo-500/20 animate-pulse"></div>
                      </div>
                      <span class="text-xs font-black uppercase tracking-[0.2em]">Decrypting Visual Data...</span>
                    </div>
                  {/if}
                </div>
              {:else}
                <div class="flex flex-col items-center justify-center h-full min-h-[400px] gap-6 p-10 bg-[#050510]/80 rounded-2xl border border-white/10 text-center shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                  <div class="h-24 w-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <FileQuestion class="h-12 w-12 text-white/30" />
                  </div>
                  <div class="space-y-3">
                    <p class="text-lg font-black text-white/90 uppercase tracking-[0.3em] drop-shadow-md">Encrypted Binary</p>
                    <div class="px-4 py-1.5 bg-black/60 rounded-md border border-white/5 inline-block">
                      <p class="text-xs text-indigo-300/70 font-mono">{(doc.metadata?.mime_type as string) || doc.path.split(".").pop()?.toUpperCase()}</p>
                    </div>
                  </div>
                  {#if doc.summary}
                    <div class="mt-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl max-w-lg">
                      <p class="text-sm text-white/60 leading-relaxed font-mono">{doc.summary}</p>
                    </div>
                  {/if}
                </div>
              {/if}
            {:else if contentLoading}
              <div class="space-y-6 max-w-4xl mx-auto animate-pulse">
                <div class="h-10 w-1/3 rounded-xl bg-indigo-500/10 border border-indigo-500/20"></div>
                <div class="space-y-3 mt-12">
                  <div class="h-4 w-full rounded bg-white/5"></div>
                  <div class="h-4 w-11/12 rounded bg-white/5"></div>
                  <div class="h-4 w-4/5 rounded bg-white/5"></div>
                </div>
                <div class="h-40 w-full rounded-2xl bg-white/[0.02] border border-white/5 mt-8"></div>
              </div>
            {:else if contentError}
              <div class="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-red-400/50 bg-[#050510]/80 rounded-2xl border border-red-500/10 shadow-[inset_0_0_30px_rgba(239,68,68,0.05)]">
                <FileQuestion class="h-16 w-16" />
                <span class="text-sm font-black uppercase tracking-[0.2em]">Memory Sector Corrupted</span>
              </div>
            {:else if fileContent}
              <div class="prose prose-invert prose-sm md:prose-base max-w-5xl mx-auto
                prose-headings:text-white/90 prose-headings:font-black prose-headings:tracking-tight prose-headings:drop-shadow-md
                prose-h1:text-3xl prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-4 prose-h1:mb-8
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-6
                prose-p:text-white/70 prose-p:leading-loose prose-p:font-medium
                prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300 hover:prose-a:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] prose-a:transition-all
                prose-code:text-indigo-300 prose-code:bg-indigo-500/10 prose-code:px-2 prose-code:py-1 prose-code:rounded-lg prose-code:border prose-code:border-indigo-500/20 prose-code:font-mono
                prose-pre:bg-[#030014]/80 prose-pre:border prose-pre:border-white/10 prose-pre:shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.5)] prose-pre:rounded-2xl
                prose-strong:text-white prose-strong:font-black
                prose-blockquote:border-l-4 prose-blockquote:border-l-indigo-500 prose-blockquote:bg-gradient-to-r prose-blockquote:from-indigo-500/10 prose-blockquote:to-transparent prose-blockquote:px-6 prose-blockquote:py-3 prose-blockquote:text-white/80 prose-blockquote:not-italic prose-blockquote:rounded-r-xl
                [&_img]:rounded-2xl [&_img]:shadow-[0_10px_40px_rgba(0,0,0,0.5)] [&_img]:border [&_img]:border-white/10
                [&_ul]:marker:text-indigo-500 [&_ol]:marker:text-indigo-500
                [&_hr]:border-white/10 [&_hr]:my-10"
              >
                {@html getHtml(fileContent)}
              </div>
            {:else}
              <div class="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-white/20 bg-[#050510]/80 rounded-2xl border border-white/5 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
                <FileText class="h-16 w-16" />
                <span class="text-xs font-black uppercase tracking-[0.3em]">Empty Neural Node</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Sidebar Panel (Links & Meta) -->
        <div class="w-full md:w-80 lg:w-96 shrink-0 border-t md:border-t-0 md:border-l border-white/10 bg-[#030014]/90 backdrop-blur-3xl flex flex-col relative z-20">
          <div class="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
            
            <!-- Links Section -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Link2 class="h-3 w-3" /> Neural Links ({linksStore.outlinks?.length ?? 0})
                </span>
                <button onclick={() => linkDialogOpen = true} class="h-6 px-2.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-1">
                  <Plus class="h-3 w-3" />
                  Link
                </button>
              </div>

              {#if linksLoading}
                <div class="space-y-3">
                  <div class="h-12 animate-pulse bg-white/5 rounded-lg border border-white/5"></div>
                  <div class="h-12 animate-pulse bg-white/5 rounded-lg border border-white/5"></div>
                </div>
              {:else}
                <div class="space-y-6">
                  <!-- Outlinks -->
                  <div>
                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 flex items-center gap-2">
                      <span class="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                      Outlinks ({outlinks.length})
                    </span>
                    {#if outlinks.length > 0}
                      <div class="flex flex-col gap-2">
                        {#each outlinks as l}
                          <div class="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all cursor-pointer group">
                            <div class="h-6 w-6 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                              <ExternalLink class="h-3 w-3 text-cyan-400" />
                            </div>
                            <span class="text-xs font-bold text-white/80 truncate flex-1 group-hover:text-white transition-colors">{l.title || l.to_doc_id.slice(0, 8)}</span>
                            <span class="px-2 py-1 rounded bg-black/50 text-[8px] font-black uppercase tracking-widest text-cyan-300/70 border border-cyan-500/20 shadow-inner">
                              {l.link_type}
                            </span>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <div class="p-3 rounded-xl bg-black/30 border border-white/5 border-dashed">
                        <span class="text-[10px] font-medium text-white/20 italic block text-center">No outgoing links</span>
                      </div>
                    {/if}
                  </div>

                  <!-- Backlinks -->
                  <div>
                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 flex items-center gap-2">
                      <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                      Backlinks ({backlinks.length})
                    </span>
                    {#if backlinks.length > 0}
                      <div class="flex flex-col gap-2">
                        {#each backlinks as l}
                          <div class="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer group">
                            <div class="h-6 w-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                              <Link2 class="h-3 w-3 text-emerald-400" />
                            </div>
                            <span class="text-xs font-bold text-white/80 truncate flex-1 group-hover:text-white transition-colors">{l.title || l.from_doc_id.slice(0, 8)}</span>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>

            <!-- Metadata Section -->
            <div class="space-y-4 pt-6 border-t border-white/5">
              <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                <FileText class="h-4 w-4" />
                System Metadata
              </h3>
              
              <div class="space-y-3 p-4 rounded-xl bg-black/40 border border-white/5 font-mono shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                <div class="flex justify-between items-center pb-2 border-b border-white/5">
                  <span class="text-[10px] text-white/30 uppercase tracking-widest">Created</span>
                  <span class="text-xs text-indigo-300 font-bold">{formatRelativeTime(doc.created_at)}</span>
                </div>
                <div class="flex justify-between items-center pb-2 border-b border-white/5">
                  <span class="text-[10px] text-white/30 uppercase tracking-widest">Updated</span>
                  <span class="text-xs text-indigo-300 font-bold">{formatRelativeTime(doc.updated_at)}</span>
                </div>
                <div class="flex flex-col gap-1.5 pt-1">
                  <span class="text-[10px] text-white/30 uppercase tracking-widest">SHA-256 Checksum</span>
                  <span class="text-[9px] text-white/50 truncate bg-black/50 p-1.5 rounded border border-white/5">{doc.content_hash}</span>
                </div>
              </div>

              {#if doc.metadata && Object.keys(doc.metadata).length > 0}
                <details class="text-xs group">
                  <summary class="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/50 uppercase tracking-[0.2em] cursor-pointer hover:bg-white/[0.05] hover:text-white/80 outline-none list-none flex items-center justify-between transition-colors">
                    Raw JSON Payload
                    <ChevronRight class="h-3 w-3 transition-transform group-open:rotate-90" />
                  </summary>
                  <div class="mt-2 p-4 rounded-xl bg-[#030014] border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden">
                    <pre class="text-[10px] font-mono text-indigo-300/80 max-h-48 overflow-auto custom-scrollbar">{JSON.stringify(doc.metadata, null, 2)}</pre>
                  </div>
                </details>
              {/if}
            </div>

      </div>
    </div>
  </div>
</div>

{#if doc}
  <VaultLinkDialog
    open={linkDialogOpen}
    onOpenChange={(v) => linkDialogOpen = v}
    fromDoc={doc}
    agentId={doc.agent_id}
  />
{/if}
