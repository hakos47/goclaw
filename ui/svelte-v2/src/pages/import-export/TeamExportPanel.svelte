<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { Package, Download, Info, ChevronDown } from "lucide-svelte";
  import { teamsState, loadTeams } from "../../lib/state/teams.svelte";
  import { useHttp, wsState } from "../../lib/state/ws.svelte";
  import { useSseProgress } from "../../lib/api/sse-progress.svelte";

  const http = useHttp();
  const exp = useSseProgress();

  export interface TeamExportPreview {
    team_name: string;
    team_id: string;
    tasks: number;
    members: number;
    agent_links: number;
    agent_count: number;
  }

  function clickOutside(node: HTMLElement, handler: () => void) {
    const onClick = (event: MouseEvent) => {
      if (!node.contains(event.target as Node)) {
        handler();
      }
    };
    window.addEventListener('click', onClick);
    return {
      destroy() {
        window.removeEventListener('click', onClick);
      }
    };
  }

  let teamId = $state("");
  let dropdownOpen = $state(false);
  let preview = $state<TeamExportPreview | null>(null);

  $effect(() => {
    if (wsState.connected && teamsState.teams.length === 0) {
      loadTeams();
    }
  });

  $effect(() => {
    if (teamId) {
      http.get<TeamExportPreview>(`/v1/teams/${teamId}/export/preview`)
        .then(res => preview = res)
        .catch(() => preview = null);
    } else {
      preview = null;
    }
  });

  function handleExport() {
    if (!teamId) return;
    const url = `${window.location.origin}/v1/teams/${teamId}/export?stream=true`;
    exp.startGet(url);
  }

  async function downloadResult() {
    if (!exp.result?.download_url) return;
    try {
      const blob = await http.downloadBlob(exp.result.download_url);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = exp.result.file_name ?? "team-export.tar.gz";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Download failed");
    }
  }

  let selectedTeam = $derived(teamsState.teams.find(t => t.id === teamId));
</script>

<div class="space-y-6">
  {#if exp.status === 'idle'}
    <div class="flex items-start gap-3 rounded-xl border border-white/10 bg-[#030014]/50 px-4 py-3 shadow-inner">
      <Info class="h-4 w-4 mt-0.5 shrink-0 text-white/50" />
      <p class="text-[11px] font-bold text-white/50 tracking-wide">{$_('import-export.teamExportNote', {default: "Export a team and all its agents, configurations, and tasks into a single portable archive."})}</p>
    </div>

    <!-- Team Selection -->
    <div>
      <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">{$_('import-export.tabs.teams', {default: "Select Team"})}</label>
      <div class="relative w-full sm:w-96" use:clickOutside={() => dropdownOpen = false}>
        <button 
          onclick={() => dropdownOpen = !dropdownOpen}
          class="w-full flex items-center justify-between bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple outline-none shadow-inner transition-colors group"
        >
          <span class={!teamId ? 'text-white/40' : 'text-white font-medium'}>
            {teamId ? (selectedTeam?.name || teamId) : $_('import-export.teamSelectPlaceholder', {default: "Choose a team..."})}
          </span>
          <ChevronDown class={`w-4 h-4 text-white/40 group-hover:text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {#if dropdownOpen}
          <div class="absolute top-full left-0 w-full mt-2 bg-[#050505]/95 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden backdrop-blur-xl">
            <div class="max-h-60 overflow-y-auto scroller-no-scrollbar py-2">
              {#each teamsState.teams as t}
                <button
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2 {teamId === t.id ? 'text-goclaw-neon-purple font-bold bg-white/[0.05]' : 'text-white/70'}"
                  onclick={() => { teamId = t.id; dropdownOpen = false; }}
                >
                  <div class="w-1.5 h-1.5 rounded-full {teamId === t.id ? 'bg-goclaw-neon-purple' : 'bg-transparent'}"></div>
                  {t.name}
                </button>
              {/each}
              {#if teamsState.teams.length === 0}
                <div class="px-4 py-4 text-xs text-white/30 italic text-center">No teams found</div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    {#if teamId && preview}
      <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <!-- Preview Info -->
        <div class="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 shadow-inner">
          <p class="text-sm font-bold text-white">{preview.team_name}</p>
          <div class="flex flex-wrap gap-x-4 gap-y-2">
            <span class="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-white/60">
              {$_('import-export.teamPreview.members', {default: `${preview.members} members`, values: {count: preview.members}})}
            </span>
            <span class="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-white/60">
              {$_('import-export.teamPreview.agents', {default: `${preview.agent_count} agents`, values: {count: preview.agent_count}})}
            </span>
            <span class="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-white/60">
              {$_('import-export.teamPreview.tasks', {default: `${preview.tasks} tasks`, values: {count: preview.tasks}})}
            </span>
            {#if preview.agent_links > 0}
               <span class="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-white/60">
                 {$_('import-export.teamPreview.links', {default: `${preview.agent_links} links`, values: {count: preview.agent_links}})}
               </span>
            {/if}
          </div>
        </div>

        <div class="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
          <span class="text-xs font-mono text-white/50">{selectedTeam?.name}</span>
          <button 
            onclick={handleExport}
            disabled={!teamId}
            class="group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-goclaw-neon-purple border border-goclaw-neon-purple/50 transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/50 to-transparent"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
            <Package class="h-4 w-4 relative z-10 text-white" strokeWidth={2.5} />
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-white relative z-10 drop-shadow-md">{$_('import-export.export.startExport', {default: "Start Export"})}</span>
          </button>
        </div>
      </div>
    {/if}
  {:else}
    <!-- Running / Complete / Error State -->
    <div class="p-6 rounded-2xl bg-[#030014]/50 border border-white/10 shadow-inner">
      <h3 class="text-sm font-black uppercase tracking-[0.2em] mb-6 text-white flex items-center gap-2">
         {#if exp.status === 'running'}
           <div class="w-2 h-2 rounded-full bg-goclaw-neon-purple animate-pulse"></div>
           {$_('import-export.export.exporting', {default: "Exporting..."})}
         {:else if exp.status === 'error'}
           <div class="w-2 h-2 rounded-full bg-red-500"></div>
           {$_('import-export.export.errorTitle', {default: "Export Failed"})}
         {:else}
           <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
           {$_('import-export.export.done', {default: "Export Complete"})}
         {/if}
      </h3>

      <!-- Tree Steps display -->
      <div class="space-y-3 mb-8">
         {#if true}
           {@const teamStep = exp.steps.find(s => s.id === "team")}
           {@const agentSteps = exp.steps.filter(s => s.id !== "team" && s.id !== "workspace")}
           
           <div class="rounded-xl border border-white/10 bg-black/40 overflow-hidden text-sm shadow-inner">
             <!-- Team node -->
           {#if teamStep}
             <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
               <div class="flex items-center gap-2">
                 <div class={`w-2 h-2 rounded-full ${teamStep.status === 'done' ? 'bg-emerald-500' : teamStep.status === 'error' ? 'bg-red-500' : 'bg-goclaw-neon-purple animate-pulse'}`}></div>
                 <span class="font-bold text-white tracking-wide">{$_('import-export.tabs.teams', {default: "Team Data"})}</span>
               </div>
               {#if teamStep.detail}
                 <span class="text-[10px] font-mono text-white/40">{teamStep.detail}</span>
               {/if}
             </div>
           {/if}

           <!-- Agent nodes -->
           <div class="divide-y divide-white/5">
             {#each agentSteps as step}
                {@const sections = step.detail?.split(" · ").filter(Boolean) ?? []}
                <div class="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div class="flex items-center gap-2">
                    <div class={`w-1.5 h-1.5 rounded-full ${step.status === 'done' ? 'bg-emerald-500' : step.status === 'error' ? 'bg-red-500' : 'bg-goclaw-neon-purple animate-pulse'}`}></div>
                    <span class="font-bold text-white/80 tracking-wide text-xs">{step.label}</span>
                  </div>
                  {#if sections.length > 0}
                    <ul class="mt-2 ml-6 space-y-1">
                      {#each sections as s}
                        <li class="text-[9px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
                          <span class="h-px w-2 bg-white/20"></span>
                          {s}
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </div>
             {/each}
           </div>

           <!-- Elapsed -->
           <div class="px-4 py-2 text-[10px] font-mono text-white/30 border-t border-white/5 bg-black/50">
             {exp.elapsed < 60 ? `${exp.elapsed}s` : `${Math.floor(exp.elapsed / 60)}m ${exp.elapsed % 60}s`}
           </div>
         </div>
         {/if}
      </div>

      {#if exp.status === 'error' && exp.error}
        <div class="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-mono">
           {exp.error.detail}
        </div>
      {/if}

      <div class="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
        {#if exp.status === 'running'}
           <button onclick={exp.cancel} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
             {$_('common.cancel', {default: "Cancel"})}
           </button>
        {/if}
        {#if exp.status === 'complete' && exp.result?.download_url}
           <button onclick={exp.reset} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
             {$_('import-export.export.startExport', {default: "New Export"})}
           </button>
           <button onclick={downloadResult} class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-goclaw-neon-cyan/20 border border-goclaw-neon-cyan/50 text-[10px] font-bold uppercase tracking-widest text-goclaw-neon-cyan hover:bg-goclaw-neon-cyan/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
             <Download class="h-3.5 w-3.5" /> {$_('import-export.export.download', {default: "Download Archive"})}
           </button>
        {/if}
        {#if exp.status === 'error'}
           <button onclick={exp.reset} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
             {$_('import-export.export.startExport', {default: "Try Again"})}
           </button>
        {/if}
      </div>
    </div>
  {/if}
</div>
