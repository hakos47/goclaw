<script lang="ts">
  import { UploadCloud, X, Loader2, File as FileIcon } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { formatSize } from "$lib/file-helpers";

  type Props = {
    open: boolean;
    title?: string;
    description?: string;
    onClose: () => void;
    onUpload: (file: File) => Promise<void>;
  };

  let {
    open,
    title = "Upload File",
    description = "Select a file to upload",
    onClose,
    onUpload,
  }: Props = $props();

  let selectedFile = $state<File | null>(null);
  let isDragging = $state(false);
  let uploading = $state(false);
  let error = $state<string | null>(null);
  let fileInput: HTMLInputElement;

  $effect(() => {
    if (open) {
      selectedFile = null;
      isDragging = false;
      uploading = false;
      error = null;
    }
  });

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer?.files?.length) {
      selectedFile = e.dataTransfer.files[0];
      error = null;
    }
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      selectedFile = input.files[0];
      error = null;
    }
  }

  async function handleUpload() {
    if (!selectedFile) return;
    uploading = true;
    error = null;
    try {
      await onUpload(selectedFile);
      onClose();
    } catch (err: any) {
      error = err.message || "Upload failed";
    } finally {
      uploading = false;
    }
  }
</script>

{#if open}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-[#020008]/80 backdrop-blur-sm" onclick={!uploading ? onClose : undefined}></div>
    
    <div class="relative w-full max-w-md bg-[#050510]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Decorative Header Blur -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-emerald-500/10 blur-[50px] pointer-events-none"></div>

      <!-- Header -->
      <div class="px-8 pt-8 pb-6 relative z-10 shrink-0 border-b border-white/5">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-black text-white uppercase tracking-widest drop-shadow-md">
              {title}
            </h2>
            <p class="text-[10px] uppercase tracking-widest text-white/50 mt-1">
              {description}
            </p>
          </div>
          <button 
            onclick={onClose}
            disabled={uploading}
            class="p-2 -mr-2 rounded-xl text-white/30 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-8 relative z-10 flex-1 overflow-y-auto custom-scrollbar">
        {#if !selectedFile}
          <div
            class="w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer relative overflow-hidden group
              {isDragging ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.02]'}"
            ondragover={(e) => { e.preventDefault(); isDragging = true; }}
            ondragleave={() => isDragging = false}
            ondrop={handleDrop}
            onclick={() => fileInput.click()}
            role="button"
            tabindex="0"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <UploadCloud class="h-10 w-10 text-emerald-400/50 group-hover:text-emerald-400 mb-4 transition-colors" />
            <span class="text-xs font-bold text-white mb-1">Click to select or drag and drop</span>
            <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Any file type supported</span>
            
            <input 
              bind:this={fileInput}
              type="file" 
              class="hidden" 
              onchange={handleFileSelect}
            />
          </div>
        {:else}
          <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none"></div>
            <div class="h-12 w-12 rounded-xl bg-black/40 flex items-center justify-center shrink-0 border border-white/10">
              <FileIcon class="h-5 w-5 text-emerald-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-white truncate">{selectedFile.name}</p>
              <p class="text-[10px] font-black uppercase tracking-widest text-white/40 mt-0.5">{formatSize(selectedFile.size)}</p>
            </div>
            <button 
              onclick={() => { selectedFile = null; error = null; }}
              disabled={uploading}
              class="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title="Remove file"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        {/if}

        {#if error}
          <div class="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-end gap-3 shrink-0">
        <button 
          onclick={onClose}
          disabled={uploading}
          class="group relative flex items-center justify-center h-10 px-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white/50 hover:text-white transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden"
        >
          <span class="relative z-10">Cancel</span>
        </button>
        <button 
          onclick={handleUpload}
          disabled={!selectedFile || uploading}
          class="relative flex items-center gap-2 px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl overflow-hidden group shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
        >
          <div class="absolute inset-0 bg-gradient-to-t from-emerald-500/50 to-emerald-500/20 border border-emerald-500/50 rounded-xl transition-all group-hover:scale-105"></div>
          {#if uploading}
            <Loader2 class="w-3.5 h-3.5 relative z-10 animate-spin text-white" />
          {:else}
            <UploadCloud class="w-3.5 h-3.5 relative z-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          {/if}
          <span class="relative z-10 text-white drop-shadow-md">{uploading ? 'Uploading...' : 'Upload'}</span>
        </button>
      </div>

    </div>
  </div>
{/if}
