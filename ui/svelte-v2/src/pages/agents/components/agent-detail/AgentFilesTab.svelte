<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { RefreshCw, FileCode2, Save, Loader2, FileText, Bot, History, Sparkles, RotateCcw } from "lucide-svelte";
  import type { BootstrapFile } from "../../../../lib/types/agent";

  type Props = {
      agentId: string;
      files: BootstrapFile[];
      refresh: () => void;
      // Provided from context or parent over time, mocking the setter
      onGetFile?: (name: string) => Promise<BootstrapFile | null>;
      onSetFile?: (name: string, content: string) => Promise<void>;
  };

  let { agentId, files, refresh, onGetFile, onSetFile }: Props = $props();

  let selectedFile = $state<string | null>(null);
  let content = $state("");
  let loading = $state(false);
  let saving = $state(false);
  let dirty = $state(false);

  // Group files strictly for UI
  let displayFiles = $derived(files.filter(f => f.name !== "MEMORY.json"));

  // Svelte effect when switching files
  $effect(() => {
    if (selectedFile && onGetFile) {
        async function fetchFile() {
             loading = true;
             try {
                const f = await onGetFile!(selectedFile as string);
                content = f?.content || "";
                dirty = false;
             } catch(e) {
                console.error("Failed to load file content", e);
             } finally {
                loading = false;
             }
        }
        fetchFile();
    } else if (selectedFile) {
        // Fallback to local memory if API setter not injected natively yet
        const f = files.find(x => x.name === selectedFile);
        content = f?.content || "";
        dirty = false;
        loading = false;
    }
  });

  function handleContentChange(e: Event) {
       const target = e.target as HTMLTextAreaElement;
       content = target.value;
       dirty = true;
  }

  async function handleSave() {
     if (!selectedFile || !onSetFile) return;
     saving = true;
     try {
         await onSetFile(selectedFile, content);
         dirty = false;
     } catch (e) {
         console.error("Save error", e);
     } finally {
         saving = false;
     }
  }

</script>

<div class="relative z-20 group p-6 rounded-3xl bg-gradient-to-br from-[#030014]/80 to-[#1a0033]/40 backdrop-blur-3xl border border-white/5 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_30px_rgba(6,182,212,0.1),0_0_40px_rgba(6,182,212,0.2)] hover:border-cyan-500/30">
  <!-- Ambient Neon Corner Glows -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

  <!-- Animated cyber background grid mask -->
  <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none mix-blend-screen">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] opacity-80"></div>
  </div>

  <!-- Header -->
  <div class="relative z-10 flex items-center justify-between border-b border-white/10 pb-6 mb-6">
      <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <FileCode2 class="h-4 w-4 text-cyan-500 animate-[pulse_3s_ease-in-out_infinite]" />
          </div>
          <div>
              <h3 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm">Container Files Workspace</h3>
              <p class="text-[10px] text-white/40 mt-1">Select and modify the configurations mounted in the agent's sandbox.</p>
          </div>
      </div>
      <div class="flex items-center gap-2">
         <button onclick={refresh} class="h-9 px-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] text-white/90 transition-colors text-[10px] font-bold uppercase tracking-widest shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
             <RefreshCw class="h-3 w-3" /> Sync
         </button>
      </div>
  </div>

  <!-- Workspace Split View -->
  <div class="relative z-10 flex h-[600px] gap-6 mt-2">
      <!-- File Sidebar -->
      <div class="w-64 shrink-0 flex flex-col gap-2 p-3 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-y-auto scroller-no-scrollbar shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          <p class="px-2 py-1 pb-3 text-[10px] font-bold uppercase tracking-widest text-white/30 sticky top-0 bg-transparent">
            Mounted Volumes
          </p>
          {#if displayFiles.length === 0}
             <div class="text-[10px] uppercase tracking-widest text-white/30 text-center py-10 font-bold">No files found.</div>
          {/if}
          {#each displayFiles as file}
              <button 
                onclick={() => selectedFile = file.name}
                class={`flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-300 ${selectedFile === file.name ? 'bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
              >
                 <div class={`h-8 w-8 flex items-center justify-center rounded-lg shrink-0 transition-colors ${selectedFile === file.name ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-white/5 text-white/50'}`}>
                    <FileText class="h-4 w-4" />
                 </div>
                 <div class="min-w-0 pr-1">
                    <h5 class={`text-sm font-bold truncate transition-colors ${selectedFile === file.name ? 'text-cyan-400' : 'text-white/70'}`}>{file.name}</h5>
                    <p class="text-[9px] font-mono text-white/30 truncate mt-0.5">{file.size ? Math.round(file.size / 1024) + ' KB' : 'Empty'}</p>
                 </div>
              </button>
          {/each}
      </div>

      <!-- Editor Area -->
      <div class="flex-1 flex flex-col rounded-2xl border border-white/10 bg-[#030014]/90 overflow-hidden relative shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)]">
         {#if !selectedFile}
             <div class="flex-1 flex flex-col items-center justify-center text-white/30 text-[10px] font-bold uppercase tracking-widest gap-4">
                 <div class="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
                    <FileCode2 class="h-6 w-6 opacity-50" />
                 </div>
                 Select a volume from the sidebar to inspect or modify
             </div>
         {:else}
             <!-- Editor Header -->
             <div class="h-14 border-b border-white/10 bg-black/60 flex items-center justify-between px-5">
                 <div class="flex items-center gap-3">
                     <FileCode2 class="h-4 w-4 text-cyan-400" />
                     <span class="text-sm font-bold text-white tracking-wide">{selectedFile}</span>
                     {#if dirty}
                        <span class="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" title="Unsaved changes"></span>
                     {/if}
                 </div>
                 <div class="flex items-center gap-2">
                     <button class="h-9 px-4 flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] text-white/90 transition-colors text-[10px] font-bold uppercase tracking-widest shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                         <RotateCcw class="h-3 w-3" /> Reload
                     </button>
                     <button class="h-9 px-4 flex items-center gap-2 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 transition-all text-[10px] font-bold uppercase tracking-widest shadow-[inset_0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                         <Sparkles class="h-3 w-3" /> AI Edit
                     </button>
                     {#if onSetFile}
                         <button 
                             onclick={handleSave}
                             disabled={!dirty || saving}
                             class="relative group h-9 px-6 flex items-center justify-center gap-2 rounded-xl bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] border border-cyan-400 overflow-hidden"
                         >
                             <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
                             {#if saving}
                                <Loader2 class="h-4 w-4 animate-spin relative z-10" />
                             {:else}
                                <Save class="h-4 w-4 relative z-10" strokeWidth={2.5} />
                             {/if}
                             <span class="relative z-10">Save</span>
                         </button>
                     {/if}
                 </div>
             </div>

             <!-- Editor Body -->
             <div class="flex-1 relative group">
                 {#if loading}
                     <div class="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm">
                         <Loader2 class="h-8 w-8 animate-spin text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                     </div>
                 {/if}
                 <!-- Add focus indicator border -->
                 <div class="absolute inset-0 border-2 border-transparent group-focus-within:border-cyan-500/50 pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] group-focus-within:shadow-[inset_0_0_20px_rgba(6,182,212,0.3),0_0_15px_rgba(6,182,212,0.2)]"></div>
                 <textarea 
                     value={content}
                     oninput={handleContentChange}
                     spellcheck="false"
                     placeholder="File is empty..."
                     class="absolute xl:relative inset-0 w-full h-full resize-none bg-transparent p-5 font-mono text-[13px] text-cyan-400 outline-none leading-relaxed scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent z-10 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"
                 ></textarea>
             </div>
         {/if}
      </div>
  </div>
</div>
