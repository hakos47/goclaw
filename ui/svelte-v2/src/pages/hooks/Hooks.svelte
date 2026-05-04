<script lang="ts">
  import { Webhook, Plus, RefreshCw, Search, Terminal, Play } from "lucide-svelte";
  import { useHooksList } from "./hooks/use-hooks.svelte";
  import { wsState } from "../../lib/state/ws.svelte";
  import HookListRow from "./components/HookListRow.svelte";
  import HookFormDialog from "./components/HookFormDialog.svelte";
  // import HookDetail from "./HookDetail.svelte";

  // Placeholder for navigation/router setup
  // let currentView = $state<"list" | "detail">("list");
  // let detailId = $state<string | null>(null);

  let search = $state("");
  let filterEvent = $state("all");
  let filterScope = $state("all");

  const HOOK_EVENTS = [
    "session_start", "user_prompt_submit", "pre_tool_use",
    "post_tool_use", "stop", "subagent_start", "subagent_stop",
  ];

  const SCOPES = ["global", "tenant", "agent"];

  const hooksList = useHooksList(() => ({}));

  let hasLoaded = false;
  $effect(() => {
    if (wsState.connected && !hasLoaded) {
      hasLoaded = true;
      hooksList.loadHooks();
    }
  });

  const filtered = $derived(
    hooksList.hooks.filter((h) => {
      if (filterEvent !== "all" && h.event !== filterEvent) return false;
      if (filterScope !== "all" && h.scope !== filterScope) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!h.event.toLowerCase().includes(q) && 
            !h.handler_type.toLowerCase().includes(q) && 
            !(h.name || "").toLowerCase().includes(q) &&
            !(h.matcher || "").toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    })
  );

  let showCreate = $state(false);
  let editTarget = $state<any | null>(null);
  let showBetaInfo = $state(true);
  // let deleteTarget = $state<any | null>(null);
  // let testTarget = $state<any | null>(null);

  function handleCreate() {
    editTarget = null;
    showCreate = true;
  }

  function handleEdit(hook: any) {
    editTarget = hook;
    showCreate = true;
  }

  async function handleFormSubmit(data: any) {
    if (editTarget) {
      await hooksList.updateHook(editTarget.id, data);
    } else {
      await hooksList.createHook(data);
    }
    showCreate = false;
    editTarget = null;
  }

  function handleDelete(hook: any) {
    console.log("Delete hook", hook);
  }

  function handleTest(hook: any) {
    console.log("Test hook", hook);
  }

  function navigateToDetail(id: string) {
    // Implement routing logic when hooking up to main router
    // currentView = "detail";
    // detailId = id;
    console.log("Navigate to detail", id);
  }

</script>

<div class="p-4 sm:p-6 pb-10 flex-1 flex flex-col max-w-7xl mx-auto w-full min-h-0 overflow-y-auto custom-scrollbar">
  <!-- Global Background Effects -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.05)_0%,transparent_50%)] pointer-events-none"></div>

  <!-- HUD Header -->
  <div class="shrink-0 relative bg-[#030014]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    <div class="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
    
    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Webhook class="h-6 w-6 text-purple-400" />
          </div>
          <h1 class="text-2xl font-black text-white tracking-tight drop-shadow-md">Global Hooks</h1>
        </div>
        <p class="text-sm font-medium text-white/50 max-w-xl">
          Intercept engine lifecycle events dynamically to run scripts, trigger webhooks, or evaluate LLM prompts.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button 
          type="button"
          onclick={() => hooksList.loadHooks(true)} 
          disabled={hooksList.loading}
          class="relative flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105"
        >
          <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          <RefreshCw class="h-3.5 w-3.5 relative z-10 text-white/30 group-hover:text-white/70 transition-colors duration-500 {hooksList.loading ? 'animate-spin' : ''}" />
          <span class="relative z-10 drop-shadow-md hidden sm:inline">Refresh</span>
        </button>

        <button 
          type="button"
          onclick={handleCreate} 
          class="relative flex items-center justify-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-purple-400 hover:text-white shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-105"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-500/5 border border-purple-500/50 rounded-xl transition-all group-hover:opacity-80"></div>
          <Plus class="h-3.5 w-3.5 relative z-10 transition-colors duration-500" />
          <span class="relative z-10 drop-shadow-md">Create Hook</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Beta Instructions Panel -->
  {#if showBetaInfo}
    <div class="shrink-0 mt-8 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-[inset_0_2px_40px_rgba(255,255,255,0.02),0_0_50px_rgba(0,0,0,0.8)] relative z-10 overflow-hidden group">
      
      <!-- Atmospheric Gradients & Cyber-Grid -->
      <div class="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none mix-blend-overlay"></div>
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none transition-opacity duration-1000 group-hover:opacity-70"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none transition-opacity duration-1000 group-hover:opacity-70"></div>
      <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50"></div>

      <!-- Header Section -->
      <div class="flex items-start justify-between mb-8 relative z-10">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl shadow-[inset_0_0_20px_rgba(59,130,246,0.2),0_0_20px_rgba(59,130,246,0.2)]">
            <Webhook class="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-black text-white uppercase tracking-[0.2em] drop-shadow-lg">Hooks Engine</h2>
              <span class="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse">BETA</span>
            </div>
            <p class="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Advanced Interception System</p>
          </div>
        </div>
        
        <button 
          onclick={() => showBetaInfo = false}
          class="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all hover:scale-105"
        >
          Dismiss <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <p class="text-sm font-medium text-white/60 mb-8 max-w-4xl relative z-10 leading-relaxed">
        Hooks allow deep interception of the AI agent lifecycle. You can <span class="text-white">allow</span>, <span class="text-white">block</span>, or <span class="text-white">mutate</span> events dynamically. As an experimental system, ensure handlers execute rapidly to prevent blocking the critical path.
      </p>

      <!-- Steps Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        
        <!-- Step 1 -->
        <div class="group/card flex flex-col h-full bg-[#050510]/50 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.02] hover:border-purple-500/30 transition-all duration-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <div class="flex items-center justify-between mb-4">
            <span class="text-4xl font-black text-purple-500/20 group-hover/card:text-purple-500/40 transition-colors">01</span>
            <div class="h-8 w-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Webhook class="h-4 w-4 text-purple-400" />
            </div>
          </div>
          <h3 class="text-sm font-black text-white/90 uppercase tracking-widest mb-3 group-hover/card:text-purple-400 transition-colors">Pick an Event</h3>
          <p class="text-xs text-white/50 font-medium leading-relaxed">
            Target precise lifecycle stages like <span class="text-purple-400 font-mono bg-purple-500/10 px-1 py-0.5 rounded border border-purple-500/20">user_prompt</span> or <span class="text-purple-400 font-mono bg-purple-500/10 px-1 py-0.5 rounded border border-purple-500/20">pre_tool</span>. Blocking hooks pause execution until resolved.
          </p>
        </div>

        <!-- Step 2 -->
        <div class="group/card flex flex-col h-full bg-[#050510]/50 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.02] hover:border-emerald-500/30 transition-all duration-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <div class="flex items-center justify-between mb-4">
            <span class="text-4xl font-black text-emerald-500/20 group-hover/card:text-emerald-500/40 transition-colors">02</span>
            <div class="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Terminal class="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <h3 class="text-sm font-black text-white/90 uppercase tracking-widest mb-3 group-hover/card:text-emerald-400 transition-colors">Choose Handler</h3>
          <p class="text-xs text-white/50 font-medium leading-relaxed">
            Execute sandboxed JavaScript, fire HTTP webhooks, or evaluate AI Prompts. Built-in <span class="text-blue-400 font-bold">System</span> hooks are immutable.
          </p>
        </div>

        <!-- Step 3 -->
        <div class="group/card flex flex-col h-full bg-[#050510]/50 border border-white/5 rounded-3xl p-6 hover:bg-white/[0.02] hover:border-blue-500/30 transition-all duration-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <div class="flex items-center justify-between mb-4">
            <span class="text-4xl font-black text-blue-500/20 group-hover/card:text-blue-500/40 transition-colors">03</span>
            <div class="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Play class="h-4 w-4 text-blue-400 pl-0.5" />
            </div>
          </div>
          <h3 class="text-sm font-black text-white/90 uppercase tracking-widest mb-3 group-hover/card:text-blue-400 transition-colors">Test & Deploy</h3>
          <p class="text-xs text-white/50 font-medium leading-relaxed">
            Simulate real payloads with the built-in test runner. Verify inputs and mutations safely before enabling the hook globally.
          </p>
        </div>

      </div>

      <!-- Footer Link -->
      <button class="mt-8 group flex items-center gap-3 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors relative z-10">
        <div class="p-1.5 rounded-md bg-white/5 border border-white/10 group-hover:bg-white/20 transition-colors">
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        View Architectural Documentation
      </button>
    </div>
  {:else}
    <!-- Collapsed Beta Banner -->
    <div class="shrink-0 mt-8 flex justify-center">
      <button 
        onclick={() => showBetaInfo = true}
        class="group flex items-center gap-4 bg-[#050510]/50 backdrop-blur-md border border-white/10 rounded-2xl p-2 pr-6 hover:bg-white/5 hover:border-white/20 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
      >
        <div class="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-500/20 transition-colors">
          <Webhook class="h-4 w-4 text-blue-400" />
        </div>
        <span class="text-xs font-black text-white/70 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Hooks Engine</span>
        <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">BETA</span>
      </button>
    </div>
  {/if}

  <!-- Toolbar -->
  <div class="mt-6 flex flex-wrap items-center gap-3 relative z-10">
    <!-- Search -->
    <div class="relative w-full sm:w-64 group">
      <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search class="h-4 w-4 text-white/30 group-focus-within:text-purple-400 transition-colors duration-300" />
      </div>
      <input 
        type="text" 
        bind:value={search} 
        placeholder="Filter hooks..." 
        class="w-full bg-[#030014]/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium text-white/90 placeholder:text-white/30 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all outline-none shadow-inner" 
      />
      {#if search}
        <button 
          type="button"
          onclick={() => search = ""}
          class="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white/70 transition-colors"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </div>

    <!-- Event Filter -->
    <div class="relative">
      <select 
        bind:value={filterEvent} 
        class="appearance-none h-[50px] px-5 pr-10 bg-[#030014]/40 hover:bg-white/[0.05] focus:bg-[#030014] border border-white/10 rounded-2xl text-purple-400 text-xs font-bold uppercase tracking-widest outline-none transition-all cursor-pointer focus:border-purple-500/50"
      >
        <option value="all" class="bg-[#030014] text-white/50">ALL EVENTS</option>
        {#each HOOK_EVENTS as event}
          <option value={event} class="bg-[#030014] text-white">{event}</option>
        {/each}
      </select>
      <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- Scope Filter -->
    <div class="relative">
      <select 
        bind:value={filterScope} 
        class="appearance-none h-[50px] px-5 pr-10 bg-[#030014]/40 hover:bg-white/[0.05] focus:bg-[#030014] border border-white/10 rounded-2xl text-emerald-400 text-xs font-bold uppercase tracking-widest outline-none transition-all cursor-pointer focus:border-emerald-500/50"
      >
        <option value="all" class="bg-[#030014] text-white/50">ALL SCOPES</option>
        {#each SCOPES as scope}
          <option value={scope} class="bg-[#030014] text-white">{scope}</option>
        {/each}
      </select>
      <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>

  <!-- List -->
  <div class="mt-6 flex-1 relative z-10">
    {#if hooksList.loading && hooksList.hooks.length === 0}
      <div class="flex flex-col gap-4">
        {#each Array(3) as _}
           <div class="h-24 bg-white/5 border border-white/10 rounded-[1.5rem] animate-pulse"></div>
        {/each}
      </div>
    {:else if filtered.length === 0}
      <div class="flex flex-col items-center justify-center h-64 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.02]">
        <Webhook class="h-12 w-12 text-white/20 mb-4" />
        <h3 class="text-lg font-bold text-white/80 mb-2">No hooks found</h3>
        <p class="text-sm font-medium text-white/40 max-w-md">
          Adjust filters or create a new hook to intercept events.
        </p>
        <button 
          type="button"
          onclick={handleCreate}
          class="mt-6 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-purple-400 transition-all hover:scale-105"
        >
          Create Hook
        </button>
      </div>
    {:else}
      <div class="flex flex-col gap-3 pb-8">
        {#each filtered as hook (hook.id)}
          <HookListRow 
            {hook} 
            onClick={() => navigateToDetail(hook.id)}
            onToggle={(enabled) => hooksList.toggleHook(hook.id, enabled)}
            onEdit={() => handleEdit(hook)}
            onDelete={() => handleDelete(hook)}
            onTest={() => handleTest(hook)}
          />
        {/each}
      </div>
    {/if}
  </div>

  <HookFormDialog 
    open={showCreate}
    onOpenChange={(v) => {
      showCreate = v;
      if (!v) editTarget = null;
    }}
    onSubmit={handleFormSubmit}
    initial={editTarget}
  />
</div>
