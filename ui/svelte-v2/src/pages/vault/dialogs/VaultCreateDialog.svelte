<script lang="ts">
  import { scale, fade, slide } from "svelte/transition";
  import { Upload, X, FileText, Loader2, Database, Bot, Users, ChevronDown } from "lucide-svelte";
  import { useVaultUpload } from "../hooks/use-vault-upload.svelte";
  import { agentsState } from "$lib/state/agents.svelte";
  import { teamsState } from "$lib/state/teams.svelte";

  let agentDropdownOpen = $state(false);
  let teamDropdownOpen = $state(false);

  function handleOutsideClick(e: MouseEvent) {
    agentDropdownOpen = false;
    teamDropdownOpen = false;
  }

  let {
    open,
    onOpenChange,
    onUploaded,
    defaultAgentId = "",
    defaultTeamId = "",
  } = $props<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUploaded?: () => void;
    defaultAgentId?: string;
    defaultTeamId?: string;
  }>();

  let destination = $state<"shared" | "agent" | "team">("shared");
  let agentId = $state("");
  let teamId = $state("");
  let files = $state<File[]>([]);
  let dragging = $state(false);

  const { upload, isPending } = useVaultUpload();

  const ACCEPTED_EXTS = new Set([
    ".md", ".txt", ".json", ".yaml", ".yml", ".csv", ".toml", ".xml", ".html", ".htm",
    ".go", ".py", ".js", ".ts", ".tsx", ".jsx", ".rs", ".java", ".rb", ".sh", ".sql",
    ".swift", ".kt", ".c", ".cpp", ".h",
  ]);

  const isAllowedExt = (name: string) => {
    const dot = name.lastIndexOf(".");
    if (dot < 0) return false;
    return ACCEPTED_EXTS.has(name.slice(dot).toLowerCase());
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  $effect(() => {
    if (open) {
      files = [];
      dragging = false;
      if (defaultAgentId) {
        destination = "agent";
        agentId = defaultAgentId;
      } else if (defaultTeamId) {
        destination = "team";
        teamId = defaultTeamId;
      } else {
        destination = "shared";
      }
    }
  });

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter(f => isAllowedExt(f.name));
    const names = new Set(files.map(f => f.name));
    files = [...files, ...valid.filter(f => !names.has(f.name))];
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer?.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const onFileInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      addFiles(Array.from(target.files));
    }
    target.value = "";
  };

  const handleUpload = async (e: Event) => {
    e.preventDefault();
    if (files.length === 0) return;
    const opts = destination === "agent" ? { agentId } : destination === "team" ? { teamId } : {};
    try {
      await upload(files, opts);
      onOpenChange(false);
      onUploaded?.();
    } catch (err) {
      console.error(err);
    }
  };

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open && !isPending) {
      onOpenChange(false);
    }
  }

  let canUpload = $derived(
    files.length > 0 &&
    !isPending &&
    (destination !== "agent" || !!agentId) &&
    (destination !== "team" || !!teamId)
  );

</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 bg-[#030014]/90 backdrop-blur-xl z-[100] transition-all duration-300 flex items-center justify-center p-4 sm:p-6"
    transition:fade={{ duration: 300 }}
    onclick={() => !isPending && onOpenChange(false)}
  >
    <!-- Modal Content -->
    <div 
      class="bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[95vh] shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col md:flex-row relative"
      onclick={(e) => e.stopPropagation()}
      transition:scale={{ duration: 400, start: 0.95, opacity: 0 }}
    >
      <!-- Atmospheric Glows -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-goclaw-neon-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none mix-blend-screen"></div>

      <!-- Left Sidebar (Info) -->
      <div class="w-full md:w-1/3 bg-black/40 border-r border-white/5 p-8 flex flex-col relative z-10 shrink-0">
        <div class="flex items-center gap-4 mb-8">
          <div class="p-3 bg-goclaw-neon-purple/20 text-goclaw-neon-purple rounded-2xl border border-goclaw-neon-purple/30 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
            <Upload class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-2xl font-black text-white tracking-tight">Vault Injection</h2>
            <p class="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1">Data Ingestion</p>
          </div>
        </div>

        <p class="text-sm text-white/50 leading-relaxed mb-8">
          Inject raw documents, code files, and structured data directly into the central neural storage or bind them to a specific node for contextual enrichment.
        </p>

        <div class="space-y-6 mt-auto">
          <div class="flex items-center gap-4 text-white/40">
            <Database class="w-5 h-5 shrink-0" />
            <div class="text-xs">
              <span class="text-white/80 font-bold block mb-0.5">Shared Database</span>
              Global documents accessible by all systems.
            </div>
          </div>
          <div class="flex items-center gap-4 text-white/40">
            <Bot class="w-5 h-5 shrink-0" />
            <div class="text-xs">
              <span class="text-white/80 font-bold block mb-0.5">Specific Agent</span>
              Inject knowledge directly into an agent's context.
            </div>
          </div>
          <div class="flex items-center gap-4 text-white/40">
            <Users class="w-5 h-5 shrink-0" />
            <div class="text-xs">
              <span class="text-white/80 font-bold block mb-0.5">Specific Team</span>
              Provide documents to a designated team of agents.
            </div>
          </div>
        </div>
      </div>

      <!-- Right Form Body -->
      <div class="w-full md:w-2/3 flex flex-col relative z-10 min-h-0">
        <!-- Header Actions -->
        <div class="absolute top-4 right-4 z-20">
          <button 
            type="button"
            onclick={() => !isPending && onOpenChange(false)}
            class="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all hover:scale-105"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable Form Body -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8 pt-12 relative">
          <form id="upload-form" onsubmit={handleUpload} class="space-y-8">
            
            <!-- Destination -->
            <div class="space-y-5">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-goclaw-neon-purple"></span> Injection Target
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label class="flex flex-col gap-2 p-4 rounded-2xl border cursor-pointer transition-all {destination === 'shared' ? 'bg-[#030014]/80 border-goclaw-neon-purple shadow-[inset_0_0_20px_rgba(217,70,239,0.15)]' : 'bg-[#030014]/40 border-white/10 hover:border-white/30'}">
                  <div class="flex items-center justify-between">
                    <Database class="h-5 w-5 {destination === 'shared' ? 'text-goclaw-neon-purple' : 'text-white/30'}" />
                    <input type="radio" bind:group={destination} value="shared" class="sr-only" />
                    <div class="h-4 w-4 rounded-full border-2 flex items-center justify-center {destination === 'shared' ? 'border-goclaw-neon-purple' : 'border-white/20'}">
                      {#if destination === 'shared'}
                        <div class="h-2 w-2 rounded-full bg-goclaw-neon-purple"></div>
                      {/if}
                    </div>
                  </div>
                  <span class="text-xs font-black text-white uppercase tracking-widest mt-2">Shared DB</span>
                </label>

                <label class="flex flex-col gap-2 p-4 rounded-2xl border cursor-pointer transition-all {destination === 'agent' ? 'bg-[#030014]/80 border-goclaw-neon-cyan shadow-[inset_0_0_20px_rgba(34,211,238,0.15)]' : 'bg-[#030014]/40 border-white/10 hover:border-white/30'}">
                  <div class="flex items-center justify-between">
                    <Bot class="h-5 w-5 {destination === 'agent' ? 'text-goclaw-neon-cyan' : 'text-white/30'}" />
                    <input type="radio" bind:group={destination} value="agent" class="sr-only" />
                    <div class="h-4 w-4 rounded-full border-2 flex items-center justify-center {destination === 'agent' ? 'border-goclaw-neon-cyan' : 'border-white/20'}">
                      {#if destination === 'agent'}
                        <div class="h-2 w-2 rounded-full bg-goclaw-neon-cyan"></div>
                      {/if}
                    </div>
                  </div>
                  <span class="text-xs font-black text-white uppercase tracking-widest mt-2">Agent</span>
                </label>

                <label class="flex flex-col gap-2 p-4 rounded-2xl border cursor-pointer transition-all {destination === 'team' ? 'bg-[#030014]/80 border-emerald-400 shadow-[inset_0_0_20px_rgba(52,211,153,0.15)]' : 'bg-[#030014]/40 border-white/10 hover:border-white/30'}">
                  <div class="flex items-center justify-between">
                    <Users class="h-5 w-5 {destination === 'team' ? 'text-emerald-400' : 'text-white/30'}" />
                    <input type="radio" bind:group={destination} value="team" class="sr-only" />
                    <div class="h-4 w-4 rounded-full border-2 flex items-center justify-center {destination === 'team' ? 'border-emerald-400' : 'border-white/20'}">
                      {#if destination === 'team'}
                        <div class="h-2 w-2 rounded-full bg-emerald-400"></div>
                      {/if}
                    </div>
                  </div>
                  <span class="text-xs font-black text-white uppercase tracking-widest mt-2">Team</span>
                </label>
              </div>

              {#if destination === 'agent'}
                <div class="relative z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <button 
                    type="button"
                    onclick={(e) => { e.stopPropagation(); agentDropdownOpen = !agentDropdownOpen; teamDropdownOpen = false; }}
                    class="w-full flex items-center justify-between bg-[#030014]/80 border {agentDropdownOpen ? 'border-goclaw-neon-cyan shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-goclaw-neon-cyan/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]'} rounded-2xl px-5 py-4 text-sm font-medium text-white transition-all outline-none"
                  >
                    <span>{agentId ? agentsState.agents.find(a => a.id === agentId)?.display_name || agentsState.agents.find(a => a.id === agentId)?.agent_key || agentId : '-- Select Agent... --'}</span>
                    <ChevronDown class="h-4 w-4 text-goclaw-neon-cyan/50 transition-transform {agentDropdownOpen ? 'rotate-180' : ''}" />
                  </button>

                  {#if agentDropdownOpen}
                    <div 
                      transition:slide={{ duration: 200 }}
                      class="absolute top-full left-0 mt-2 w-full bg-[#050510]/95 backdrop-blur-xl border border-goclaw-neon-cyan/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(34,211,238,0.1)] overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
                    >
                      <div class="p-2 space-y-1">
                        {#each agentsState.agents as a}
                          <button 
                            type="button"
                            onclick={(e) => { e.stopPropagation(); agentId = a.id; agentDropdownOpen = false; }}
                            class="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-goclaw-neon-cyan/20 transition-all {agentId === a.id ? 'bg-goclaw-neon-cyan/10 text-goclaw-neon-cyan border border-goclaw-neon-cyan/30' : 'border border-transparent'}"
                          >
                            {a.display_name || a.agent_key}
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {:else if destination === 'team'}
                <div class="relative z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <button 
                    type="button"
                    onclick={(e) => { e.stopPropagation(); teamDropdownOpen = !teamDropdownOpen; agentDropdownOpen = false; }}
                    class="w-full flex items-center justify-between bg-[#030014]/80 border {teamDropdownOpen ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)]' : 'border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.1)]'} rounded-2xl px-5 py-4 text-sm font-medium text-white transition-all outline-none"
                  >
                    <span>{teamId ? teamsState.teams.find(t => t.id === teamId)?.name || teamId : '-- Select Team... --'}</span>
                    <ChevronDown class="h-4 w-4 text-emerald-400/50 transition-transform {teamDropdownOpen ? 'rotate-180' : ''}" />
                  </button>

                  {#if teamDropdownOpen}
                    <div 
                      transition:slide={{ duration: 200 }}
                      class="absolute top-full left-0 mt-2 w-full bg-[#050510]/95 backdrop-blur-xl border border-emerald-400/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(52,211,153,0.1)] overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
                    >
                      <div class="p-2 space-y-1">
                        {#each teamsState.teams as t}
                          <button 
                            type="button"
                            onclick={(e) => { e.stopPropagation(); teamId = t.id; teamDropdownOpen = false; }}
                            class="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-emerald-400/20 transition-all {teamId === t.id ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/30' : 'border border-transparent'}"
                          >
                            {t.name}
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Payload (Dropzone) -->
            <div class="space-y-5">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-goclaw-neon-cyan"></span> Data Payload
              </h3>

              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div 
                class="relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all overflow-hidden {dragging ? 'border-goclaw-neon-cyan bg-goclaw-neon-cyan/10 scale-[1.02]' : 'border-white/10 bg-[#030014]/40 hover:border-goclaw-neon-cyan/50 hover:bg-[#030014]/80'}"
                ondragover={(e) => { e.preventDefault(); dragging = true; }}
                ondragleave={() => dragging = false}
                ondrop={onDrop}
                onclick={() => document.getElementById('vault-upload-input')?.click()}
              >
                <div class="relative z-10 flex flex-col items-center gap-4">
                  <div class="h-16 w-16 rounded-full bg-goclaw-neon-cyan/10 border border-goclaw-neon-cyan/30 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                    <Upload class="h-8 w-8 text-goclaw-neon-cyan" />
                  </div>
                  <div class="text-center">
                    <p class="text-lg font-black text-white tracking-tight drop-shadow-md">Drop Data Here</p>
                    <p class="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1">Or click to browse storage</p>
                  </div>
                </div>
                <input id="vault-upload-input" type="file" multiple accept={Array.from(ACCEPTED_EXTS).join(',')} onchange={onFileInput} class="hidden" />
              </div>

              <!-- File List -->
              {#if files.length > 0}
                <div class="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                  <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                    <span class="text-white/50">Selected Files</span>
                    <span class="text-goclaw-neon-cyan">{files.length}</span>
                  </div>
                  <div class="max-h-48 overflow-y-auto custom-scrollbar space-y-2 p-2 rounded-2xl bg-[#030014]/60 border border-white/5 shadow-inner">
                    {#each files as f, i}
                      <div class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors group">
                        <FileText class="h-5 w-5 text-white/30" />
                        <span class="truncate flex-1 font-mono text-sm text-white/80 group-hover:text-white transition-colors">{f.name}</span>
                        <span class="shrink-0 text-[10px] font-mono text-white/30 bg-black/50 px-2 py-1 rounded-lg border border-white/5">{formatBytes(f.size)}</span>
                        <button 
                          type="button"
                          onclick={(e) => { e.stopPropagation(); files = files.filter((_, idx) => idx !== i); }}
                          class="shrink-0 p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                        >
                          <X class="h-4 w-4" />
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>

          </form>
        </div>

        <!-- Footer Actions -->
        <div class="shrink-0 p-6 border-t border-white/10 bg-[#030014]/80 flex justify-between gap-4 relative z-20">
          <button 
            type="button"
            onclick={() => !isPending && onOpenChange(false)}
            disabled={isPending}
            class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            Discard
          </button>
          <button 
            type="submit"
            form="upload-form"
            disabled={!canUpload}
            class="relative flex items-center justify-center gap-2 px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-goclaw-neon-purple hover:text-white shadow-[0_0_20px_rgba(217,70,239,0.15)] hover:shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:-translate-y-0 disabled:shadow-none"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-goclaw-neon-purple/20 to-goclaw-neon-purple/5 border border-goclaw-neon-purple/50 rounded-xl transition-all group-hover:opacity-80"></div>
            {#if isPending}
              <Loader2 class="h-4 w-4 animate-spin relative z-10" />
              <span class="relative z-10 drop-shadow-md">Injecting...</span>
            {:else}
              <span class="relative z-10 drop-shadow-md">Inject Data</span>
            {/if}
          </button>
        </div>

      </div>
    </div>
  </div>
{/if}
