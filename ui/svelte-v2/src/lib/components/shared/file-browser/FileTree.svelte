<script lang="ts">
  import { Folder, FolderOpen, ChevronRight, Loader2, Trash2, File, Image as ImageIcon, Code, FileText, Database } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { formatSize, type TreeNode } from "$lib/file-helpers";

  type Props = {
    tree: TreeNode[];
    depth?: number;
    filesLoading: boolean;
    activePath: string | null;
    onSelect: (path: string) => void;
    onDelete?: (path: string, isDir: boolean) => void;
    onLoadMore?: (path: string) => void;
    onMove?: (fromPath: string, toFolder: string) => void;
    showSize?: boolean;
    // Internal state for recursive drag target tracking
    dragOverPath?: string | null;
    onDragOverPathChange?: (path: string | null) => void;
  };

  let {
    tree,
    depth = 0,
    filesLoading,
    activePath,
    onSelect,
    onDelete,
    onLoadMore,
    onMove,
    showSize = false,
    dragOverPath = null,
    onDragOverPathChange = () => {}
  }: Props = $props();

  let expandedState = $state<Record<string, boolean>>({});

  // When depth is 0, we could auto-expand the root nodes.
  $effect(() => {
    if (depth === 0) {
      for (const node of tree) {
        if (expandedState[node.path] === undefined && node.isDir) {
          expandedState[node.path] = true;
        }
      }
    }
  });

  function toggleExpand(node: TreeNode, e: MouseEvent) {
    e.stopPropagation();
    const willExpand = !expandedState[node.path];
    expandedState[node.path] = willExpand;
    if (willExpand && node.hasChildren && node.children.length === 0 && !node.loading && onLoadMore) {
      onLoadMore(node.path);
    }
  }

  function handleSelect(node: TreeNode, e: MouseEvent) {
    e.stopPropagation();
    onSelect(node.path);
  }

  // --- Drag & Drop ---
  function handleDragStart(e: DragEvent, node: TreeNode) {
    if (!onMove) return;
    e.dataTransfer?.setData("text/plain", node.path);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragOver(e: DragEvent, node: TreeNode | null) {
    if (!onMove) return;
    e.preventDefault(); // Necessary to allow dropping
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
    const targetPath = node ? (node.isDir ? node.path : "") : "";
    if (dragOverPath !== targetPath) {
      onDragOverPathChange(targetPath);
    }
  }

  function handleDragLeave(e: DragEvent, node: TreeNode | null) {
    if (!onMove) return;
    // If we leave, we might clear the hover state, but dragenter on child usually fires first.
    // For simplicity, we just rely on dragOver.
  }

  function handleDrop(e: DragEvent, node: TreeNode | null) {
    if (!onMove) return;
    e.preventDefault();
    e.stopPropagation();
    onDragOverPathChange(null);
    const fromPath = e.dataTransfer?.getData("text/plain");
    if (!fromPath) return;

    const toFolder = node ? (node.isDir ? node.path : "") : "";
    onMove(fromPath, toFolder);
  }

  function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'].includes(ext)) return ImageIcon;
    if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'json', 'yaml', 'yml', 'css', 'html'].includes(ext)) return Code;
    if (['txt', 'md', 'csv', 'log'].includes(ext)) return FileText;
    if (['db', 'sqlite', 'sql'].includes(ext)) return Database;
    return File;
  }
</script>

{#if depth === 0 && filesLoading}
  <div class="flex items-center justify-center py-8">
    <Loader2 class="h-5 w-5 animate-spin text-white/50" />
  </div>
{:else if depth === 0 && tree.length === 0}
  <div 
    class="px-4 py-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-center h-full flex items-center justify-center"
    ondragover={(e) => handleDragOver(e, null)}
    ondrop={(e) => handleDrop(e, null)}
    role="region"
    aria-label="Empty Drop Zone"
  >
    {$_('common.noFiles', {default: "No files found"})}
  </div>
{:else}
  <!-- Root Drop Zone wrapper if depth === 0 -->
  <div 
    class="flex flex-col gap-[2px] w-full min-h-full pb-8"
    role="tree"
    ondragover={depth === 0 ? (e) => handleDragOver(e, null) : undefined}
    ondrop={depth === 0 ? (e) => handleDrop(e, null) : undefined}
  >
    {#each tree as node (node.path)}
      {@const isExpanded = expandedState[node.path]}
      {@const isActive = activePath === node.path}
      {@const isDropTarget = dragOverPath === node.path}
      {@const Icon = getFileIcon(node.name)}
      
      <div 
        class="group/tree flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-sm cursor-pointer select-none transition-all outline-none border border-transparent
          {isActive ? 'bg-goclaw-neon-purple/20 text-goclaw-neon-purple border-goclaw-neon-purple/30 shadow-[inset_0_0_10px_rgba(217,70,239,0.1)]' : 'hover:bg-white/[0.05] text-white/70'}
          {isDropTarget ? 'bg-emerald-500/20 ring-1 ring-emerald-500 border-emerald-500/30' : ''}"
        style="padding-left: {depth * 16 + 8}px"
        onclick={(e) => node.isDir ? toggleExpand(node, e) : handleSelect(node, e)}
        draggable={!!onMove}
        ondragstart={(e) => handleDragStart(e, node)}
        ondragover={(e) => handleDragOver(e, node)}
        ondrop={(e) => handleDrop(e, node)}
        role="treeitem"
        aria-selected={isActive}
        aria-expanded={node.isDir ? isExpanded : undefined}
        tabindex="0"
      >
        <!-- Expand Icon -->
        <div class="w-4 flex justify-center shrink-0">
          {#if node.isDir}
            <ChevronRight class="h-3.5 w-3.5 transition-transform duration-200 text-white/40 group-hover/tree:text-white/70 {isExpanded ? 'rotate-90' : ''}" />
          {/if}
        </div>

        <!-- Node Icon -->
        {#if node.isDir}
          {#if isExpanded}
            <FolderOpen class="h-4 w-4 shrink-0 text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
          {:else}
            <Folder class="h-4 w-4 shrink-0 text-amber-500/80 group-hover/tree:text-amber-500" />
          {/if}
        {:else}
          <Icon class="h-4 w-4 shrink-0 {isActive ? 'text-goclaw-neon-purple drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]' : 'text-white/50 group-hover/tree:text-white/80'}" />
        {/if}

        <span class="truncate text-xs font-semibold tracking-wide {isActive ? 'text-white' : ''}">
          {node.name}
        </span>

        {#if node.loading}
          <Loader2 class="h-3 w-3 shrink-0 animate-spin text-white/40 ml-1" />
        {/if}

        {#if showSize && (node.isDir ? 0 : node.size) > 0}
          <span class="ml-auto shrink-0 text-[9px] font-black uppercase tracking-widest text-white/30 bg-black/40 px-1.5 py-0.5 rounded">
            {formatSize(node.size)}
          </span>
        {/if}

        {#if onDelete && !node.protected}
          <!-- Delete button -->
          <button
            type="button"
            class="ml-auto shrink-0 opacity-0 group-hover/tree:opacity-100 p-1.5 rounded-md hover:bg-red-500/20 text-red-500/70 hover:text-red-400 transition-all focus:opacity-100"
            title={node.isDir ? $_('common.deleteFolder', {default: "Delete Folder"}) : $_('common.deleteFile', {default: "Delete File"})}
            onclick={(e) => { e.stopPropagation(); onDelete(node.path, node.isDir); }}
          >
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        {/if}
      </div>

      <!-- Recursive Children -->
      {#if node.isDir && isExpanded}
        <svelte:self
          tree={node.children}
          depth={depth + 1}
          {filesLoading}
          {activePath}
          {onSelect}
          {onDelete}
          {onLoadMore}
          {onMove}
          {showSize}
          {dragOverPath}
          {onDragOverPathChange}
        />
        {#if node.hasChildren && node.children.length === 0 && !node.loading && onLoadMore}
          <div
            class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30 cursor-pointer hover:text-white/70 py-1.5 transition-colors"
            style="padding-left: {(depth + 1) * 16 + 32}px"
            onclick={(e) => { e.stopPropagation(); onLoadMore(node.path); }}
            role="button"
            tabindex="0"
          >
            <Loader2 class="h-3.5 w-3.5" />
            <span>{$_('common.loadMore', {default: "Load more..."})}</span>
          </div>
        {/if}
      {/if}
    {/each}
  </div>
{/if}
