<script lang="ts">
  import { scale, fade, slide } from "svelte/transition";
  import { Link2, X, FileText, Loader2, ChevronDown, Check } from "lucide-svelte";
  import type { VaultDocument } from "../../types/vault";
  import { useCreateLink, useVaultDocuments } from "../hooks/use-vault.svelte";

  let {
    open,
    onOpenChange,
    fromDoc,
    agentId = null,
    onCreated
  } = $props<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fromDoc: VaultDocument;
    agentId?: string | null;
    onCreated?: () => void;
  }>();

  const createMutation = useCreateLink();
  // We use useVaultDocuments to fetch documents for linking options
  const docsStore = useVaultDocuments(() => agentId, { limit: 100 });
  let documents = $derived(docsStore.documents);

  // Form State
  let toDocId = $state("");
  let linkType = $state("reference");
  let customLinkType = $state("");
  let contextStr = $state("");

  // Dropdown UI states
  let docDropdownOpen = $state(false);
  let typeDropdownOpen = $state(false);
  let isCustomType = $derived(linkType === "custom");
  let docSearch = $state("");

  const LINK_TYPES = [
    { value: "reference", label: "Reference (General)" },
    { value: "related", label: "Related (Similar content)" },
    { value: "extends", label: "Extends (Builds upon)" },
    { value: "depends_on", label: "Depends on (Required)" },
    { value: "supersedes", label: "Supersedes (Replaces)" },
    { value: "custom", label: "Custom Type..." },
  ];

  $effect(() => {
    if (open) {
      toDocId = "";
      linkType = "reference";
      customLinkType = "";
      contextStr = "";
      docSearch = "";
      docDropdownOpen = false;
      typeDropdownOpen = false;
    }
  });

  const availableDocs = $derived(
    documents
      .filter(d => d.id !== fromDoc.id)
      .filter(d => {
        if (!docSearch) return true;
        const q = docSearch.toLowerCase();
        return d.title?.toLowerCase().includes(q) || d.path.toLowerCase().includes(q);
      })
  );

  const selectedDocTitle = $derived.by(() => {
    if (!toDocId) return "Select Target Document...";
    const doc = documents.find(d => d.id === toDocId);
    return doc ? (doc.title || doc.path) : toDocId;
  });

  const selectedTypeLabel = $derived.by(() => {
    const t = LINK_TYPES.find(x => x.value === linkType);
    return t ? t.label : linkType;
  });

  let canSubmit = $derived(
    toDocId && 
    (linkType !== "custom" || customLinkType.trim().length > 0) && 
    !createMutation.isPending
  );

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!canSubmit) return;

    const finalLinkType = linkType === "custom" ? customLinkType.trim() : linkType;

    try {
      await createMutation.create({
        from_doc_id: fromDoc.id,
        to_doc_id: toDocId,
        link_type: finalLinkType,
        context: contextStr.trim() || undefined,
      });
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      // Handled in mutation hook
    }
  };

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open && !createMutation.isPending) {
      onOpenChange(false);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 bg-[#030014]/90 backdrop-blur-xl z-[100] transition-all duration-300 flex items-center justify-center p-4 sm:p-6"
    transition:fade={{ duration: 300 }}
    onclick={() => !createMutation.isPending && onOpenChange(false)}
  >
    <!-- Modal Content -->
    <div 
      class="bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[95vh] shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col md:flex-row relative"
      onclick={(e) => e.stopPropagation()}
      transition:scale={{ duration: 400, start: 0.95, opacity: 0 }}
    >
      <!-- Atmospheric Glows -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none mix-blend-screen"></div>

      <!-- Left Sidebar (Info) -->
      <div class="w-full md:w-1/3 bg-black/40 border-r border-white/5 p-8 flex flex-col relative z-10 shrink-0">
        <div class="flex items-center gap-4 mb-8">
          <div class="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Link2 class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-2xl font-black text-white tracking-tight">Neural Link</h2>
            <p class="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1">Graph Connection</p>
          </div>
        </div>

        <p class="text-sm text-white/50 leading-relaxed mb-6">
          Establish semantic connections between documents to enrich the neural graph. Links guide agents to discover related knowledge contextually.
        </p>

        <div class="mt-auto space-y-4">
          <div class="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block mb-2">Origin Document</span>
            <div class="flex items-start gap-2">
              <FileText class="h-4 w-4 text-white/30 shrink-0 mt-0.5" />
              <span class="text-xs font-bold text-white/80 leading-relaxed break-all">{fromDoc.title || fromDoc.path}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Form Body -->
      <div class="w-full md:w-2/3 flex flex-col relative z-10 min-h-0">
        <!-- Header Actions -->
        <div class="absolute top-4 right-4 z-20">
          <button 
            type="button"
            onclick={() => !createMutation.isPending && onOpenChange(false)}
            class="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all hover:scale-105"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable Form Body -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8 pt-12 relative" onclick={() => { docDropdownOpen = false; typeDropdownOpen = false; }}>
          <form id="link-form" onsubmit={handleSubmit} class="space-y-8">
            
            <div class="space-y-6">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Connection Target
              </h3>
              
              <!-- Target Document -->
              <div class="space-y-2 relative">
                <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Target Document *</label>
                <button 
                  type="button"
                  onclick={(e) => { e.stopPropagation(); docDropdownOpen = !docDropdownOpen; typeDropdownOpen = false; }}
                  class="w-full flex items-center justify-between bg-[#030014]/80 border {docDropdownOpen ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'} rounded-2xl px-5 py-4 text-sm font-medium text-white transition-all outline-none"
                >
                  <span class="truncate">{selectedDocTitle}</span>
                  <ChevronDown class="h-4 w-4 shrink-0 text-indigo-400/50 transition-transform {docDropdownOpen ? 'rotate-180' : ''}" />
                </button>

                {#if docDropdownOpen}
                  <div 
                    transition:slide={{ duration: 200 }}
                    class="absolute z-50 mt-2 w-full bg-[#050510]/95 backdrop-blur-xl border border-indigo-500/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(99,102,241,0.1)] overflow-hidden"
                  >
                    <div class="p-2 border-b border-white/5">
                      <input 
                        type="text" 
                        bind:value={docSearch} 
                        onclick={(e) => e.stopPropagation()}
                        placeholder="Search documents..."
                        class="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div class="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      {#if docsStore.loading}
                        <div class="p-4 text-center text-xs text-white/30 flex items-center justify-center gap-2">
                          <Loader2 class="h-3 w-3 animate-spin" /> Loading documents...
                        </div>
                      {:else if availableDocs.length === 0}
                        <div class="p-4 text-center text-xs text-white/30 italic">No documents found</div>
                      {:else}
                        {#each availableDocs as d}
                          <button 
                            type="button"
                            onclick={(e) => { e.stopPropagation(); toDocId = d.id; docDropdownOpen = false; }}
                            class="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-indigo-500/20 transition-all {toDocId === d.id ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'border border-transparent'}"
                          >
                            <span class="truncate block">{d.title || d.path}</span>
                            <span class="truncate block text-[10px] font-mono text-white/30 mt-1">{d.path}</span>
                          </button>
                        {/each}
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>

              <!-- Link Type -->
              <div class="space-y-2 relative">
                <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Relationship Type *</label>
                <div class="flex gap-2">
                  <button 
                    type="button"
                    onclick={(e) => { e.stopPropagation(); typeDropdownOpen = !typeDropdownOpen; docDropdownOpen = false; }}
                    class="flex-1 flex items-center justify-between bg-[#030014]/80 border {typeDropdownOpen ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]'} rounded-2xl px-5 py-4 text-sm font-medium text-white transition-all outline-none"
                  >
                    <span>{selectedTypeLabel}</span>
                    <ChevronDown class="h-4 w-4 shrink-0 text-indigo-400/50 transition-transform {typeDropdownOpen ? 'rotate-180' : ''}" />
                  </button>

                  {#if isCustomType}
                    <input 
                      type="text" 
                      bind:value={customLinkType} 
                      placeholder="e.g. references_api"
                      class="flex-1 bg-[#030014]/80 border border-indigo-500/50 rounded-2xl px-5 py-4 text-sm font-medium text-white focus:outline-none focus:border-indigo-400 transition-all"
                    />
                  {/if}
                </div>

                {#if typeDropdownOpen}
                  <div 
                    transition:slide={{ duration: 200 }}
                    class="absolute z-50 mt-2 w-full max-w-[50%] bg-[#050510]/95 backdrop-blur-xl border border-indigo-500/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(99,102,241,0.1)] overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
                  >
                    <div class="p-2 space-y-1">
                      {#each LINK_TYPES as t}
                        <button 
                          type="button"
                          onclick={(e) => { e.stopPropagation(); linkType = t.value; typeDropdownOpen = false; }}
                          class="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-indigo-500/20 transition-all {linkType === t.value ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'border border-transparent'} flex items-center justify-between"
                        >
                          {t.label}
                          {#if linkType === t.value}
                            <Check class="h-4 w-4" />
                          {/if}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>

              <!-- Context -->
              <div class="space-y-2">
                <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Context / Description</label>
                <textarea 
                  bind:value={contextStr}
                  rows="3"
                  placeholder="Optional semantic context explaining why these documents are linked..."
                  class="w-full bg-[#030014]/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:border-indigo-400 outline-none transition-all resize-none custom-scrollbar focus:shadow-[0_0_15px_rgba(99,102,241,0.15)] text-white"
                ></textarea>
              </div>

            </div>
          </form>
        </div>

        <!-- Footer Actions -->
        <div class="shrink-0 p-6 border-t border-white/10 bg-[#030014]/80 flex justify-between gap-4 relative z-20">
          <button 
            type="button"
            onclick={() => !createMutation.isPending && onOpenChange(false)}
            disabled={createMutation.isPending}
            class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            Discard
          </button>
          <button 
            type="submit"
            form="link-form"
            disabled={!canSubmit}
            class="relative flex items-center justify-center gap-2 px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-indigo-400 hover:text-white shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:-translate-y-0 disabled:shadow-none"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-indigo-500/5 border border-indigo-500/50 rounded-xl transition-all group-hover:opacity-80"></div>
            {#if createMutation.isPending}
              <Loader2 class="h-4 w-4 animate-spin relative z-10" />
              <span class="relative z-10 drop-shadow-md">Forging Link...</span>
            {:else}
              <span class="relative z-10 drop-shadow-md">Forge Neural Link</span>
            {/if}
          </button>
        </div>

      </div>
    </div>
  </div>
{/if}
