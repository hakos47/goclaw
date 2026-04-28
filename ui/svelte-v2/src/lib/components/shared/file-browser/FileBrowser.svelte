<script lang="ts">
  import type { TreeNode } from "$lib/file-helpers";
  import FileTree from "./FileTree.svelte";
  import FileContent from "./FileContent.svelte";
  import { PanelLeftClose, PanelLeftOpen } from "lucide-svelte";

  type Props = {
    tree: TreeNode[];
    filesLoading: boolean;
    activePath: string | null;
    onSelect: (path: string) => void;
    contentLoading: boolean;
    fileContent: { content: string; path: string; size: number } | null;
    onDelete?: (path: string, isDir: boolean) => void;
    onLoadMore?: (path: string) => void;
    onMove?: (fromPath: string, toFolder: string) => void;
    onDownload?: (path: string) => void;
    fetchBlob?: (path: string) => Promise<Blob>;
    showSize?: boolean;
  };

  let {
    tree,
    filesLoading,
    activePath,
    onSelect,
    contentLoading,
    fileContent,
    onDelete,
    onLoadMore,
    onMove,
    onDownload,
    fetchBlob,
    showSize
  }: Props = $props();

  let sidebarVisible = $state(true);
  let dragOverPath = $state<string | null>(null);

  // Resize logic for desktop could be added here, but for simplicity we use a fixed flex or standard responsive grid.
  // The Bento Brutalist style prefers structured panels over fully draggable resizers in many cases, but we can add it if needed.
</script>

<div class="flex-1 flex h-full min-h-0 w-full gap-4 relative">
  <!-- Sidebar Panel (Tree) -->
  <div class="h-full flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] {sidebarVisible ? 'w-64 sm:w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}">
    <div class="flex-1 min-h-0 bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
      <!-- Toolbar -->
      <div class="shrink-0 h-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-4">
        <span class="text-[10px] font-black uppercase tracking-widest text-white/50">Explorer</span>
        <button
          onclick={() => sidebarVisible = false}
          class="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
          title="Collapse Explorer"
        >
          <PanelLeftClose class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Tree Content -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
        <FileTree
          {tree}
          {filesLoading}
          {activePath}
          {onSelect}
          {onDelete}
          {onLoadMore}
          {onMove}
          {showSize}
          {dragOverPath}
          onDragOverPathChange={(path) => dragOverPath = path}
        />
      </div>
    </div>
  </div>

  <!-- Main Content Panel (Viewer) -->
  <div class="flex-1 min-w-0 h-full flex flex-col relative">
    {#if !sidebarVisible}
      <button
        onclick={() => sidebarVisible = true}
        class="absolute -left-3 top-4 z-20 p-1.5 rounded-r-lg bg-white/10 border border-white/20 border-l-0 text-white/50 hover:text-white hover:bg-white/20 transition-all shadow-md backdrop-blur-md"
        title="Expand Explorer"
      >
        <PanelLeftOpen class="h-4 w-4" />
      </button>
    {/if}

    <div class="flex-1 min-h-0 relative">
      <FileContent
        {fileContent}
        {contentLoading}
        {fetchBlob}
        {onDownload}
      />
    </div>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
</style>
