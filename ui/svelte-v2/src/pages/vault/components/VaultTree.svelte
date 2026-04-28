<script lang="ts">
  import { ChevronRight, Folder, FolderOpen, Loader2, FileText, Brain, StickyNote, Sparkles, Clock, Image, FileType } from "lucide-svelte";
  import { formatRelativeTime } from "$lib/format";
  import type { TreeNode } from "$lib/file-helpers";
  import type { VaultTreeEntry } from "../hooks/use-vault-tree.svelte";

  let {
    tree,
    meta,
    loading,
    activePath,
    onSelect,
    onLoadMore,
    depth = 0
  } = $props<{
    tree: TreeNode[];
    meta: Map<string, VaultTreeEntry>;
    loading: boolean;
    activePath: string | null;
    onSelect: (path: string) => void;
    onLoadMore: (path: string) => void;
    depth?: number;
  }>();

  const DOC_TYPE_ICONS: Record<string, { icon: any; color: string }> = {
    context:  { icon: FileText,   color: "text-blue-400" },
    memory:   { icon: Brain,      color: "text-purple-400" },
    note:     { icon: StickyNote, color: "text-amber-400" },
    skill:    { icon: Sparkles,   color: "text-emerald-400" },
    episodic: { icon: Clock,      color: "text-orange-400" },
    media:    { icon: Image,      color: "text-rose-400" },
    document: { icon: FileType,   color: "text-cyan-400" },
  };
  const DEFAULT_ICON = { icon: FileText, color: "text-white/40" };

  const SCOPE_DOT: Record<string, string> = {
    personal: "bg-blue-400",
    team:     "bg-green-400",
    shared:   "bg-amber-400",
  };

  function truncateMiddle(s: string, max = 28): string {
    if (s.length <= max) return s;
    const keep = Math.floor((max - 1) / 2);
    return s.slice(0, keep) + "…" + s.slice(s.length - keep);
  }

  // State maps for node expansion to avoid mutating TreeNode props
  let expandedState = $state<Record<string, boolean>>({});
  let didAutoLoad = $state<Record<string, boolean>>({});

  const handleToggle = (node: TreeNode) => {
    expandedState[node.path] = !expandedState[node.path];
    if (expandedState[node.path] && node.isDir && node.hasChildren && node.children.length === 0 && !node.loading) {
      onLoadMore(node.path);
    }
  };

  $effect(() => {
    // Auto-expand depth 0 by default
    if (depth === 0) {
      for (const node of tree) {
        if (node.isDir && expandedState[node.path] === undefined) {
          expandedState[node.path] = true;
          if (!didAutoLoad[node.path] && node.hasChildren && node.children.length === 0 && !node.loading) {
            didAutoLoad[node.path] = true;
            onLoadMore(node.path);
          }
        }
      }
    }
  });

</script>

{#if depth === 0 && loading && tree.length === 0}
  <div class="flex items-center justify-center py-8">
    <Loader2 class="h-5 w-5 animate-spin text-white/40" />
  </div>
{:else if depth === 0 && tree.length === 0}
  <div class="flex flex-col items-center justify-center py-8 gap-2 text-white/40">
    <FileText class="h-8 w-8 mb-2 opacity-50" />
    <span class="text-[10px] font-black uppercase tracking-widest">No Documents</span>
  </div>
{:else}
  <div class="flex-1 min-h-0 w-full flex flex-col gap-[2px]">
    {#each tree as node (node.path)}
      {@const entry = meta.get(node.path)}
      
      {#if node.isDir}
        <div>
          <button
            class="group flex w-full items-center gap-1.5 rounded-lg py-1.5 text-left text-sm cursor-pointer hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
            style="padding-left: {depth * 16 + 8}px; padding-right: 8px;"
            onclick={() => handleToggle(node)}
          >
            <ChevronRight class="h-3 w-3 shrink-0 transition-transform text-white/30 group-hover:text-white/60 {expandedState[node.path] ? 'rotate-90' : ''}" />
            {#if expandedState[node.path]}
              <FolderOpen class="h-4 w-4 shrink-0 text-yellow-500/80" />
            {:else}
              <Folder class="h-4 w-4 shrink-0 text-yellow-500/80" />
            {/if}
            <span class="truncate text-xs font-semibold text-white/70 group-hover:text-white tracking-wide">{node.name}</span>
            
            {#if node.loading}
              <Loader2 class="h-3 w-3 shrink-0 animate-spin text-white/30 ml-auto" />
            {:else if node.children.length > 0}
              <span class="ml-auto shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-black tabular-nums text-white/50 border border-white/5">
                {node.children.length}
              </span>
            {/if}
          </button>
          
          {#if expandedState[node.path]}
            <!-- Recursive call -->
            <svelte:self
              tree={node.children}
              {meta}
              loading={false}
              {activePath}
              {onSelect}
              {onLoadMore}
              depth={depth + 1}
            />
            
            {#if node.hasChildren && node.children.length === 0 && !node.loading}
              <button 
                class="flex w-full items-center gap-1.5 py-1 text-xs text-white/30 hover:text-white/60 transition-colors"
                style="padding-left: {(depth + 1) * 16 + 20}px;"
                onclick={() => onLoadMore(node.path)}
              >
                <Loader2 class="h-3 w-3" />
                <span class="text-[10px] font-black uppercase tracking-widest">Load more</span>
              </button>
            {/if}
          {/if}
        </div>
      {:else}
        <!-- File Node -->
        {@const isActive = activePath === node.path}
        {@const docType = entry?.docType ?? ""}
        {@const cfg = DOC_TYPE_ICONS[docType] ?? DEFAULT_ICON}
        {@const Icon = cfg.icon}
        {@const fullTitle = entry?.title || node.name}
        {@const scopeDot = entry?.scope ? SCOPE_DOT[entry.scope] : null}
        
        <button
          class="group flex w-full items-center gap-2 rounded-lg py-1.5 text-left cursor-pointer transition-all border {isActive ? 'bg-indigo-500/20 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'}"
          style="padding-left: {depth * 16 + 24}px; padding-right: 8px;"
          onclick={() => onSelect(node.path)}
          title="{fullTitle}\n{entry?.scope ? 'Scope: ' + entry.scope : ''}"
        >
          <Icon class="h-3.5 w-3.5 shrink-0 {cfg.color}" />
          <span class="truncate text-[11px] font-medium {isActive ? 'text-indigo-200' : 'text-white/60 group-hover:text-white/90'}">
            {truncateMiddle(node.name)}
          </span>
          {#if scopeDot}
            <span class="ml-auto h-1.5 w-1.5 rounded-full shrink-0 {scopeDot} shadow-[0_0_5px_currentColor]"></span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>
{/if}
