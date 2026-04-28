<script lang="ts">
  import { FileImage, FileCode, PackageOpen, Download, Loader2 } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { isImageFile, isTextFile, langFor } from "$lib/file-helpers";
  import { onMount } from "svelte";

  type Props = {
    fileContent: { content: string; path: string; size: number } | null;
    contentLoading: boolean;
    fetchBlob?: (path: string) => Promise<Blob>;
    onDownload?: (path: string) => void;
  };

  let { fileContent, contentLoading, fetchBlob, onDownload }: Props = $props();

  let objectUrl = $state<string | null>(null);
  let blobLoading = $state(false);

  $effect(() => {
    // When the file changes, fetch blob if it's an image
    if (fileContent?.path && isImageFile(fileContent.path) && fetchBlob) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
      blobLoading = true;
      fetchBlob(fileContent.path).then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        blobLoading = false;
      }).catch(() => {
        blobLoading = false;
      });
    }
  });

  // Cleanup objectUrl on unmount
  onMount(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  });
</script>

<div class="h-full w-full flex flex-col bg-[#030010] rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
  {#if !fileContent}
    <div class="flex-1 flex flex-col items-center justify-center text-white/20 p-8 text-center relative overflow-hidden">
      <div class="absolute inset-0 bg-goclaw-neon-purple/5 blur-[100px]"></div>
      <PackageOpen class="h-16 w-16 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
      <span class="text-xs font-black uppercase tracking-[0.2em] relative z-10">
        {$_('common.selectFile', {default: "Select a file to view"})}
      </span>
    </div>
  {:else if contentLoading}
    <div class="flex-1 flex items-center justify-center text-white/50">
      <Loader2 class="h-8 w-8 animate-spin" />
    </div>
  {:else}
    <!-- Toolbar -->
    <div class="shrink-0 h-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-4">
      <div class="flex items-center gap-2 overflow-hidden">
        {#if isImageFile(fileContent.path)}
          <FileImage class="h-4 w-4 shrink-0 text-amber-400" />
        {:else if isTextFile(fileContent.path)}
          <FileCode class="h-4 w-4 shrink-0 text-emerald-400" />
        {:else}
          <PackageOpen class="h-4 w-4 shrink-0 text-white/50" />
        {/if}
        <span class="text-[10px] font-mono text-white/70 truncate">{fileContent.path}</span>
      </div>
      
      {#if onDownload}
        <button
          class="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          title={$_('common.download', {default: "Download"})}
          onclick={() => onDownload(fileContent!.path)}
        >
          <Download class="h-3.5 w-3.5" />
        </button>
      {/if}
    </div>

    <!-- Content Area -->
    <div class="flex-1 min-h-0 relative bg-black/60">
      {#if isImageFile(fileContent.path)}
        <div class="absolute inset-0 flex items-center justify-center p-4">
          <!-- Transparent checkerboard background for images with alpha -->
          <div class="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAOklEQVQYV2NkYGAwYkAD////Z4Qx0BUxMQ5E5mJQBWNgMRxqkGwIQ8iG4LMYk2K8Boz/Hw1Hw3BoOACyqwjL//G6LwAAAABJRU5ErkJggg==')] opacity-10 pointer-events-none"></div>
          {#if blobLoading}
            <Loader2 class="h-8 w-8 animate-spin text-white/30" />
          {:else if objectUrl}
            <img src={objectUrl} alt={fileContent.path} class="max-w-full max-h-full object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] relative z-10" />
          {:else}
            <span class="text-xs font-black uppercase text-red-400">Failed to load image</span>
          {/if}
        </div>
      {:else if isTextFile(fileContent.path)}
        <!-- Text View -->
        <div class="absolute inset-0 overflow-auto p-4 custom-scrollbar">
          <!-- In a real high-fidelity app we might use Monaco or CodeMirror, but simple pre/code suffices for parity -->
          <pre class="text-xs font-mono text-white/80 leading-relaxed"><code class="language-{langFor(fileContent.path.split('.').pop() || '')}">{fileContent.content}</code></pre>
        </div>
      {:else}
        <!-- Unsupported Format View -->
        <div class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <PackageOpen class="h-16 w-16 text-white/10 mb-6" />
          <h3 class="text-lg font-black text-white/80 uppercase tracking-widest mb-2">Unsupported Format</h3>
          <p class="text-[10px] text-white/40 max-w-sm uppercase tracking-wider leading-relaxed">
            No preview available for this file type. You can download it to view locally.
          </p>
          {#if onDownload}
            <button
              class="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-inner"
              onclick={() => onDownload(fileContent!.path)}
            >
              <Download class="h-3.5 w-3.5" /> Download File
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
