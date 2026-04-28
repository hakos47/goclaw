<script lang="ts">
  import { onMount } from "svelte";
  import { Wrench, Loader2, Search, ShieldAlert } from "lucide-svelte";
  import { useMCP, type MCPServerData, type MCPToolInfo } from "../../hooks/use-mcp.svelte";

  let {
    open,
    onOpenChange,
    server
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    server: MCPServerData;
  } = $props();

  const { listServerTools } = useMCP();

  let tools = $state<MCPToolInfo[]>([]);
  let loading = $state(false);
  let error = $state("");
  let search = $state("");

  onMount(async () => {
    if (open) {
      loading = true;
      error = "";
      search = "";
      try {
        tools = await listServerTools(server.id);
      } catch (err: any) {
        error = err.message || "Failed to load tools from MCP server";
      } finally {
        loading = false;
      }
    }
  });

  let filtered = $derived(
    tools.filter(t => 
      t.name.toLowerCase().includes(search.toLowerCase()) || 
      (t.description || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  let prefix = $derived(server.tool_prefix || `mcp_${server.name.replace(/-/g, "_")}`);
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick={() => onOpenChange(false)}></div>
  
  <div class="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#030014] border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 p-6 border-b border-white/5 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-goclaw-neon-purple/5 rounded-full blur-[60px] pointer-events-none"></div>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-white/5 rounded-xl border border-white/10">
          <Wrench class="h-5 w-5 text-white/60" />
        </div>
        <div>
          <h2 class="text-xl font-black uppercase tracking-[0.2em] text-white">Exposed Tools</h2>
          <p class="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">
            {server.display_name || server.name}
          </p>
        </div>
      </div>
      
      <div class="mt-4 flex items-center gap-2">
        <span class="text-[9px] font-bold uppercase tracking-widest text-white/30">Integration Prefix:</span>
        <span class="text-[10px] font-mono text-goclaw-neon-purple bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/20 px-2 py-0.5 rounded">{prefix}</span>
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
      {#if loading}
        <div class="flex flex-col items-center justify-center py-20 text-white/40">
          <Loader2 class="h-8 w-8 animate-spin mb-4" />
          <span class="text-[10px] font-black uppercase tracking-[0.2em]">Discovering Tools...</span>
        </div>
      {:else if error}
        <div class="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner py-12">
          <ShieldAlert class="h-5 w-5" />
          {error}
        </div>
      {:else if tools.length === 0}
        <div class="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-black/20 text-center">
          <Wrench class="h-8 w-8 text-white/10 mb-4" />
          <p class="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">No Tools Found</p>
          <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest">This MCP server did not expose any tools.</p>
        </div>
      {:else}
        <div class="flex flex-col gap-4 min-h-0 h-full">
          <!-- Search -->
          <div class="flex items-center gap-3 shrink-0">
            <div class="relative flex-1 group">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-goclaw-neon-purple transition-colors" />
              <input
                type="text"
                bind:value={search}
                placeholder="SEARCH TOOLS..."
                class="w-full h-10 pl-9 pr-4 bg-black/40 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white placeholder-white/20 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner"
              />
            </div>
            <div class="shrink-0 px-3 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                {filtered.length} / {tools.length}
              </span>
            </div>
          </div>

          <!-- Tool List -->
          <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {#if filtered.length === 0}
              <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest text-center py-8">No tools match your search.</p>
            {:else}
              {#each filtered as tool}
                <div class="p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-white/5 transition-all group">
                  <div class="flex items-center gap-3 mb-1">
                    <Wrench class="h-3.5 w-3.5 text-white/20 group-hover:text-goclaw-neon-purple transition-colors shrink-0" />
                    <span class="text-xs font-mono text-white/90">{tool.name}</span>
                  </div>
                  {#if tool.description}
                    <p class="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed ml-6">
                      {tool.description}
                    </p>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="shrink-0 p-6 border-t border-white/5 bg-black/40 flex justify-end">
      <button 
        type="button"
        onclick={() => onOpenChange(false)}
        class="px-6 py-2.5 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/5 transition-all"
      >
        Close
      </button>
    </div>
  </div>
</div>
