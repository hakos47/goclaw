<script lang="ts">
  import { onMount } from "svelte";
  import { Plug, Plus, RefreshCw, RotateCcw, Pencil, Trash2, Users, Wrench, KeyRound, Search } from "lucide-svelte";
  import { mcpState, useMCP, type MCPServerData } from "./hooks/use-mcp.svelte";
  import MCPFormDialog from "./components/dialogs/MCPFormDialog.svelte";
  import MCPToolsDialog from "./components/dialogs/MCPToolsDialog.svelte";
  import MCPGrantsDialog from "./components/dialogs/MCPGrantsDialog.svelte";
  import MCPUserCredentialsDialog from "./components/dialogs/MCPUserCredentialsDialog.svelte";

  const {
    loadServers,
    deleteServer,
    reconnectServer,
    updateServer
  } = useMCP();

  let search = $state("");
  let formOpen = $state(false);
  
  let editServer = $state<MCPServerData | null>(null);
  let toolsServer = $state<MCPServerData | null>(null);
  let grantsServer = $state<MCPServerData | null>(null);
  let credentialsServer = $state<MCPServerData | null>(null);
  
  let deleteTarget = $state<MCPServerData | null>(null);
  let deleteLoading = $state(false);
  let reconnectingId = $state<string | null>(null);

  onMount(() => {
    loadServers();
  });

  let filtered = $derived(
    mcpState.servers.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      (s.display_name || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    deleteLoading = true;
    try {
      await deleteServer(deleteTarget.id);
      deleteTarget = null;
    } finally {
      deleteLoading = false;
    }
  }

  function handleAddClick() {
    editServer = null;
    formOpen = true;
  }

  function handleEditClick(server: MCPServerData) {
    editServer = server;
    formOpen = true;
  }

  async function toggleEnabled(server: MCPServerData) {
    await updateServer(server.id, { enabled: !server.enabled });
  }
</script>

<div class="p-4 sm:p-6 pb-10 flex-1 flex flex-col max-w-7xl mx-auto w-full min-h-0 overflow-y-auto custom-scrollbar">
  
  <!-- Global Background Effects -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.05)_0%,transparent_50%)] pointer-events-none"></div>

  <!-- HUD Header -->
  <div class="shrink-0 relative bg-[#030014]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-64 h-64 bg-goclaw-neon-purple/10 rounded-full blur-[80px] pointer-events-none"></div>
    
    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 bg-goclaw-neon-cyan/20 rounded-xl border border-goclaw-neon-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Plug class="h-6 w-6 text-goclaw-neon-cyan" />
          </div>
          <h1 class="text-2xl font-black uppercase tracking-[0.2em] text-white drop-shadow-md">
            Model Context Protocol
          </h1>
        </div>
        <p class="text-sm font-bold text-white/40 uppercase tracking-widest max-w-2xl leading-relaxed">
          Connect external tools and data sources to your agents via standard STDIO or SSE endpoints.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button 
          type="button"
          onclick={() => loadServers(true)} 
          disabled={mcpState.loading}
          class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105"
        >
          <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          <RefreshCw class="h-3.5 w-3.5 relative z-10 text-white/30 group-hover:text-white/70 transition-colors duration-500 {mcpState.loading ? 'animate-spin' : ''}" />
          <span class="relative z-10 drop-shadow-md">REFRESH</span>
        </button>

        <button 
          type="button"
          onclick={handleAddClick} 
          class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-goclaw-neon-cyan hover:text-white shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-105"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-goclaw-neon-cyan/20 to-goclaw-neon-cyan/5 border border-goclaw-neon-cyan/50 rounded-xl transition-all group-hover:opacity-80"></div>
          <Plus class="h-3.5 w-3.5 relative z-10 text-goclaw-neon-cyan group-hover:text-white transition-colors duration-500" />
          <span class="relative z-10 drop-shadow-md">ADD SERVER</span>
        </button>
      </div>
    </div>
  </div>

  <div class="shrink-0 mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-20">
    <div class="max-w-sm w-full relative group">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Search class="h-4 w-4 text-white/40 group-focus-within:text-goclaw-neon-cyan transition-colors" />
      </div>
      <input
        type="text"
        bind:value={search}
        placeholder="SEARCH SERVERS..."
        class="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white placeholder-white/20 focus:border-goclaw-neon-cyan focus:ring-1 focus:ring-goclaw-neon-cyan outline-none transition-all shadow-inner backdrop-blur-md"
      />
    </div>
  </div>

  <div class="mt-6 flex flex-col flex-1 min-h-0">
    {#if mcpState.loading && mcpState.servers.length === 0}
      <!-- Skeleton -->
      <div class="space-y-4">
        {#each Array(3) as _}
          <div class="h-24 bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
        {/each}
      </div>
    {:else if filtered.length === 0}
      <div class="flex-1 flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-black/20 backdrop-blur-sm">
        <div class="p-4 bg-white/5 rounded-full mb-4">
          <Plug class="h-8 w-8 text-white/20" />
        </div>
        <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white/60 mb-2">
          {search ? "No matches found" : "No MCP Servers"}
        </h3>
        <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest">
          {search ? "Try a different search term" : "Click 'Add Server' to configure your first MCP connection"}
        </p>
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-4">
        {#each filtered as srv}
          <div class="group relative bg-[#030014]/60 backdrop-blur-xl border border-white/10 hover:border-goclaw-neon-cyan/50 rounded-2xl p-5 transition-all overflow-hidden flex flex-col md:flex-row md:items-center gap-6 {srv.enabled ? '' : 'opacity-70 grayscale'}">
            <div class="absolute inset-0 bg-gradient-to-r from-goclaw-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

            <div class="flex-1 min-w-0 relative z-10 flex items-center gap-4">
              <button 
                onclick={() => toggleEnabled(srv)}
                class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none {srv.enabled ? 'bg-goclaw-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-[#1a1a1a]'}"
              >
                <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {srv.enabled ? 'translate-x-4' : 'translate-x-0'}"></span>
              </button>
              
              <div class="min-w-0">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-black uppercase tracking-widest text-white truncate">
                    {srv.display_name || srv.name}
                  </span>
                  {#if srv.transport === 'stdio'}
                    <span class="text-[9px] font-bold bg-white/10 text-white/70 px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest">STDIO</span>
                  {:else if srv.transport === 'sse'}
                    <span class="text-[9px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-widest">SSE</span>
                  {:else}
                    <span class="text-[9px] font-bold bg-white/5 text-white/50 px-2 py-0.5 rounded border border-white/5 uppercase tracking-widest">{srv.transport}</span>
                  {/if}
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] font-mono text-white/40">Prefix: {srv.tool_prefix || `mcp_${srv.name.replace(/-/g, "_")}`}</span>
                  <span class="text-[10px] text-white/20 px-2">•</span>
                  <span class="text-[10px] font-bold uppercase tracking-widest text-white/40">Agents: {srv.agent_count ?? 0}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 relative z-10 shrink-0">
              <button 
                onclick={async () => {
                  reconnectingId = srv.id;
                  try { await reconnectServer(srv.id); } finally { reconnectingId = null; }
                }}
                disabled={reconnectingId === srv.id}
                title="Reconnect Server"
                class="h-9 w-9 flex items-center justify-center rounded-xl bg-black/40 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <RotateCcw class="h-4 w-4 {reconnectingId === srv.id ? 'animate-spin text-goclaw-neon-cyan' : ''}" />
              </button>
              
              <button 
                onclick={() => toolsServer = srv}
                title="View Exposed Tools"
                class="h-9 w-9 flex items-center justify-center rounded-xl bg-black/40 border border-white/5 text-white/40 hover:text-goclaw-neon-purple hover:border-goclaw-neon-purple/30 hover:bg-goclaw-neon-purple/10 transition-colors"
              >
                <Wrench class="h-4 w-4" />
              </button>

              <button 
                onclick={() => grantsServer = srv}
                title="Manage Agent Grants"
                class="h-9 w-9 flex items-center justify-center rounded-xl bg-black/40 border border-white/5 text-white/40 hover:text-goclaw-neon-cyan hover:border-goclaw-neon-cyan/30 hover:bg-goclaw-neon-cyan/10 transition-colors"
              >
                <Users class="h-4 w-4" />
              </button>

              <button 
                onclick={() => credentialsServer = srv}
                title="User Credentials Override"
                class="h-9 w-9 flex items-center justify-center rounded-xl bg-black/40 border border-white/5 text-white/40 hover:text-amber-400 hover:border-amber-400/30 hover:bg-amber-400/10 transition-colors"
              >
                <KeyRound class="h-4 w-4" />
              </button>

              <div class="h-6 w-[1px] bg-white/10 mx-1"></div>

              <button 
                onclick={() => handleEditClick(srv)}
                title="Edit Configuration"
                class="h-9 w-9 flex items-center justify-center rounded-xl bg-black/40 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Pencil class="h-4 w-4" />
              </button>

              <button 
                onclick={() => deleteTarget = srv}
                title="Delete Server"
                class="h-9 w-9 flex items-center justify-center rounded-xl bg-black/40 border border-white/5 text-white/40 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if formOpen}
  <MCPFormDialog 
    server={editServer} 
    onOpenChange={(v) => formOpen = v}
    open={formOpen} 
  />
{/if}

{#if toolsServer}
  <MCPToolsDialog 
    server={toolsServer}
    onOpenChange={(open) => !open && (toolsServer = null)}
    open={!!toolsServer}
  />
{/if}

{#if grantsServer}
  <MCPGrantsDialog 
    server={grantsServer}
    onOpenChange={(open) => !open && (grantsServer = null)}
    open={!!grantsServer}
  />
{/if}

{#if credentialsServer}
  <MCPUserCredentialsDialog 
    server={credentialsServer}
    onOpenChange={(open) => !open && (credentialsServer = null)}
    open={!!credentialsServer}
  />
{/if}

{#if deleteTarget}
  <!-- Standard Custom Confirm Dialog directly embedded for simplicity -->
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick={() => !deleteLoading && (deleteTarget = null)}></div>
    <div class="relative w-full max-w-md bg-[#030014] border border-red-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[40px] pointer-events-none"></div>
      
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
          <Trash2 class="h-6 w-6 text-red-500" />
        </div>
        <h2 class="text-lg font-black uppercase tracking-widest text-white">Delete Server</h2>
      </div>
      
      <p class="text-sm font-bold text-white/60 mb-6 leading-relaxed">
        Are you sure you want to delete <span class="text-white">{deleteTarget.display_name || deleteTarget.name}</span>? This action cannot be undone and will break any agents currently relying on this server.
      </p>
      
      <div class="flex justify-end gap-3">
        <button 
          onclick={() => deleteTarget = null}
          disabled={deleteLoading}
          class="px-5 py-2.5 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          onclick={handleDelete}
          disabled={deleteLoading}
          class="px-5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/30 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {deleteLoading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
{/if}
