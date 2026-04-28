<script lang="ts">
  import { onMount } from "svelte";
  import { Wrench, RefreshCw, AlertTriangle, Settings, Package, Search } from "lucide-svelte";
  import { useBuiltinTools, type BuiltinToolData } from "./hooks/use-builtin-tools.svelte";
  import { authState } from "../../lib/state/auth.svelte";
  import EmptyState from "../../lib/components/shared/EmptyState.svelte";
  import SearchInput from "../../lib/components/shared/SearchInput.svelte";
  import TableSkeleton from "../../lib/components/shared/TableSkeleton.svelte";
  import CategoryGroup from "./components/CategoryGroup.svelte";
  import BuiltinSettingsDialog from "./components/dialogs/BuiltinSettingsDialog.svelte";

  const CATEGORY_ORDER = [
    "filesystem", "runtime", "web", "memory", "media", "browser",
    "sessions", "messaging", "scheduling", "subagents", "skills", "delegation", "teams",
  ];

  const HIDDEN_TOOL_NAMES = new Set(["tts"]);
  const MASTER_TENANT_ID = "0193a5b0-7000-7000-8000-000000000001";
  const MEDIA_TOOLS = new Set(["create_image", "create_audio", "create_video", "knowledge_graph_search", "web_fetch", "web_search", "stt"]); // Using rough set from react

  const toolsState = useBuiltinTools();

  let search = $state("");
  let settingsTool = $state<BuiltinToolData | null>(null);
  
  const hasTenantScope = $derived(!!authState.tenantId && authState.tenantId !== MASTER_TENANT_ID);

  function needsProviderConfig(tool: BuiltinToolData): boolean {
    if (!MEDIA_TOOLS.has(tool.name) || !tool.enabled) return false;
    const settings = tool.settings;
    if (!settings) return true;
    
    // Simplistic check for providers array
    const providers = settings.providers as unknown[] | undefined;
    if (providers !== undefined) return providers.length === 0;
    
    return false; // If not using providers array, assume it doesn't need it for this check
  }

  const unconfigured = $derived(toolsState.tools.filter(needsProviderConfig));

  const filtered = $derived(toolsState.tools
    .filter((t) => !HIDDEN_TOOL_NAMES.has(t.name))
    .filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.display_name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    ));

  const grouped = $derived.by(() => {
    const map = new Map<string, BuiltinToolData[]>();
    for (const tool of filtered) {
      const cat = tool.category || "general";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(tool);
    }
    return map;
  });

  const sortedCategories = $derived([...grouped.keys()].sort(
    (a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a);
      const ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }
  ));

  async function handleToggle(tool: BuiltinToolData) {
    await toolsState.updateTool(tool.name, { enabled: !tool.enabled });
  }

  async function handleSaveSettings(name: string, settings: Record<string, unknown>) {
    if (hasTenantScope) {
      await toolsState.setTenantSettings(name, settings);
    } else {
      await toolsState.updateTool(name, { settings });
    }
  }

  async function handleResetTenantSettings(name: string) {
    await toolsState.clearTenantSettings(name);
  }
</script>

<div class="p-4 sm:p-6 pb-10 flex-1 flex flex-col max-w-7xl mx-auto w-full min-h-0 overflow-y-auto custom-scrollbar">
  
  <!-- Global Background Effects -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.05)_0%,transparent_50%)] pointer-events-none"></div>
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.05)_0%,transparent_50%)] pointer-events-none"></div>

  <!-- HUD Header -->
  <div class="shrink-0 relative bg-[#030014]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-64 h-64 bg-goclaw-neon-cyan/10 rounded-full blur-[80px] pointer-events-none"></div>
    
    <div class="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div class="flex items-start gap-5">
        <div class="relative hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-[#030014] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1)] group">
          <Wrench class="w-8 h-8 text-goclaw-neon-purple drop-shadow-[0_0_10px_rgba(217,70,239,0.8)] animate-pulse-slow" strokeWidth={1.5} />
        </div>
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[9px] font-bold text-goclaw-neon-purple uppercase tracking-[0.3em] bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 px-2.5 py-0.5 rounded">System: Registry</span>
          </div>
          <h1 class="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/30 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Built-in Tools
          </h1>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button 
          onclick={toolsState.refresh}
          disabled={toolsState.loading}
          class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105"
        >
          <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          <RefreshCw class="h-3.5 w-3.5 relative z-10 text-white/30 group-hover:text-white/70 transition-colors duration-500 {toolsState.loading ? 'animate-spin' : ''}" />
          <span class="relative z-10 drop-shadow-md">REFRESH</span>
        </button>
      </div>
    </div>
  </div>

  <div class="shrink-0 mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-20">
    <div class="max-w-sm w-full relative group">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Search class="h-4 w-4 text-white/40 group-focus-within:text-goclaw-neon-purple transition-colors" />
      </div>
      <input 
        type="text" 
        bind:value={search} 
        placeholder="SEARCH TOOLS..." 
        class="block w-full pl-10 pr-4 h-10 rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md text-xs font-semibold text-white placeholder-white/30 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner uppercase tracking-widest"
      />
    </div>
    
    <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
      <span class="text-[10px] font-mono text-white/50 uppercase tracking-widest">{filtered.length} Tools</span>
      {#if sortedCategories.length > 0}
        <span class="text-white/20 px-2">•</span>
        <span class="text-[10px] font-mono text-white/50 uppercase tracking-widest">{sortedCategories.length} Categories</span>
      {/if}
    </div>
  </div>

  {#if unconfigured.length > 0}
    <div class="shrink-0 mt-4 flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_20px_rgba(245,158,11,0.1)] relative overflow-hidden group">
      <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(245,158,11,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]"></div>
      <AlertTriangle class="h-6 w-6 text-amber-400 shrink-0 relative z-10 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
      <div class="flex-1 min-w-0 relative z-10">
        <p class="text-xs font-black uppercase tracking-widest text-amber-400 drop-shadow-md">
          {unconfigured.length} tool(s) require provider configuration
        </p>
        <div class="flex flex-wrap gap-2 mt-3">
          {#each unconfigured as tool}
            <button
              onclick={() => settingsTool = tool}
              class="h-8 px-3 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-amber-500/50 text-amber-200 bg-amber-950/50 hover:bg-amber-500/20 hover:text-amber-100 transition-all shadow-inner"
            >
              <Settings class="h-3 w-3" />
              {tool.display_name}
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <div class="mt-6 flex flex-col flex-1 min-h-0">
    {#if toolsState.loading && toolsState.tools.length === 0}
      <TableSkeleton />
    {:else if filtered.length === 0}
      <div class="flex-1 rounded-3xl border border-white/5 bg-[#030014]/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
        <EmptyState 
          icon={Package} 
          title={search ? "NO TOOLS MATCH" : "NO BUILT-IN TOOLS"} 
          description={search ? "Try adjusting your search query." : "No built-in tools are registered in the system."} 
        />
      </div>
    {:else}
      <div class="space-y-4">
        {#each sortedCategories as category (category)}
          <CategoryGroup
            {category}
            tools={grouped.get(category)!}
            onToggle={handleToggle}
            onSettings={(t) => settingsTool = t}
            tenantId={authState.tenantId}
            onSetTenantConfig={toolsState.setTenantConfig}
            onDeleteTenantConfig={toolsState.deleteTenantConfig}
          />
        {/each}
      </div>
    {/if}
  </div>

  <BuiltinSettingsDialog
    tool={settingsTool}
    open={settingsTool !== null}
    onOpenChange={(v) => { if (!v) settingsTool = null; }}
    onSave={handleSaveSettings}
    {hasTenantScope}
    onResetToDefault={hasTenantScope ? handleResetTenantSettings : undefined}
  />
</div>
