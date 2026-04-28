<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { Package, Download, Info, ChevronDown } from "lucide-svelte";
  import { agentsState, loadAgents } from "../agents/hooks/use-agents.svelte";
  import { useHttp, wsState } from "../../lib/state/ws.svelte";
  import { useSseProgress, type ExportPreview } from "../../lib/api/sse-progress.svelte";
  import SectionPicker, { type SectionDef } from "./SectionPicker.svelte";

  const http = useHttp();
  const exp = useSseProgress();

  $effect(() => {
    if (wsState.connected && agentsState.agents.length === 0) {
      loadAgents();
    }
  });

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

  let agentId = $state("");
  let dropdownOpen = $state(false);
  let selected = $state<Set<string>>(new Set(["config", "context_files", "memory_global", "knowledge_graph", "cron", "workspace"]));
  let preview = $state<ExportPreview | null>(null);

  const PRESETS = {
    minimal: ["config"],
    standard: ["config", "context_files", "memory_global", "knowledge_graph", "cron", "workspace"],
    complete: ["config", "context_files", "user_context_files", "user_profiles", "user_overrides", "memory_global", "memory_per_user", "knowledge_graph", "cron", "workspace"]
  };

  $effect(() => {
    if (agentId) {
      http.get<ExportPreview>(`/v1/agents/${agentId}/export/preview`)
        .then(res => preview = res)
        .catch(() => preview = null);
    } else {
      preview = null;
    }
  });

  let sections = $derived<SectionDef[]>(() => {
    const p = preview;
    return [
      { id: "config", labelKey: "sections.config", required: true },
      { id: "context_files", labelKey: "sections.context_files", count: p?.context_files },
      {
        id: "user_data", labelKey: "sections.user_data", count: p?.user_context_files_users,
        countLabel: p ? `${p.user_context_files_users} users` : undefined,
        children: [
          { id: "user_context_files", labelKey: "sections.user_context_files", count: p?.user_context_files_users },
          { id: "user_profiles", labelKey: "sections.user_profiles", count: p?.user_profiles },
          { id: "user_overrides", labelKey: "sections.user_overrides", count: p?.user_overrides },
        ],
      },
      {
        id: "memory", labelKey: "sections.memory",
        count: p ? p.memory_global + p.memory_per_user : undefined,
        countLabel: p ? `${p.memory_global + p.memory_per_user} docs` : undefined,
        children: [
          { id: "memory_global", labelKey: "sections.memory_global", count: p?.memory_global },
          { id: "memory_per_user", labelKey: "sections.memory_per_user", count: p?.memory_per_user },
        ],
      },
      {
        id: "knowledge_graph", labelKey: "sections.knowledge_graph",
        countLabel: p ? `${p.kg_entities?.toLocaleString() || 0} ent / ${p.kg_relations?.toLocaleString() || 0} rel` : undefined,
      },
      { id: "cron", labelKey: "sections.cron", count: p?.cron_jobs },
      { id: "workspace", labelKey: "sections.workspace", count: p?.workspace_files },
    ];
  });

  function handlePreset(preset: keyof typeof PRESETS) {
    selected = new Set(PRESETS[preset]);
  }

  function setsEqual(a: ReadonlySet<string>, b: string[]): boolean {
    if (a.size !== b.length) return false;
    for (const v of b) if (!a.has(v)) return false;
    return true;
  }

  function handleExport() {
    if (!agentId) return;
    const secs = Array.from(selected).filter((s) => !s.startsWith("memory_") && !s.startsWith("user_") && s !== "config");
    // Expand parents
    if (selected.has("memory_global") || selected.has("memory_per_user")) secs.push("memory");
    if (selected.has("user_context_files") || selected.has("user_profiles") || selected.has("user_overrides")) secs.push("user_data");
    secs.push("config");
    
    // Deduplicate
    const uniqueSecs = [...new Set(secs)];

    const params = new URLSearchParams({ sections: uniqueSecs.join(","), stream: "true" });
    const url = `${window.location.origin}/v1/agents/${agentId}/export?${params}`;
    exp.startGet(url);
  }

  async function downloadResult() {
    if (!exp.result?.download_url) return;
    try {
      const blob = await http.downloadBlob(exp.result.download_url);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = exp.result.file_name ?? "export.tar.gz";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Download failed");
    }
  }

  let selectedAgent = $derived(agentsState.agents.find(a => a.id === agentId));
</script>

<div class="space-y-6">
  {#if exp.status === 'idle'}
    <div class="flex items-start gap-3 rounded-xl border border-white/10 bg-[#030014]/50 px-4 py-3 shadow-inner">
      <Info class="h-4 w-4 mt-0.5 shrink-0 text-white/50" />
      <p class="text-[11px] font-bold text-white/50 tracking-wide">{$_('import-export.export.infoNote', {default: "Export an agent's configuration, memories, and context into a portable archive. Use presets or customize exactly what to include."})}</p>
    </div>

    <!-- Agent Selection -->
    <div>
      <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">{$_('import-export.export.agent', {default: "Select Agent"})}</label>
      <div class="relative w-full sm:w-96" use:clickOutside={() => dropdownOpen = false}>
        <button 
          onclick={() => dropdownOpen = !dropdownOpen}
          class="w-full flex items-center justify-between bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple outline-none shadow-inner transition-colors group"
        >
          <span class={!agentId ? 'text-white/40' : 'text-white font-medium'}>
            {agentId ? (selectedAgent?.display_name || selectedAgent?.agent_key || agentId) : $_('import-export.export.agentPlaceholder', {default: "Choose an agent..."})}
          </span>
          <ChevronDown class={`w-4 h-4 text-white/40 group-hover:text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {#if dropdownOpen}
          <div class="absolute top-full left-0 w-full mt-2 bg-[#050505]/95 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden backdrop-blur-xl">
            <div class="max-h-60 overflow-y-auto scroller-no-scrollbar py-2">
              {#each agentsState.agents as a}
                <button
                  class="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2 {agentId === a.id ? 'text-goclaw-neon-purple font-bold bg-white/[0.05]' : 'text-white/70'}"
                  onclick={() => { agentId = a.id; dropdownOpen = false; }}
                >
                  <div class="w-1.5 h-1.5 rounded-full {agentId === a.id ? 'bg-goclaw-neon-purple' : 'bg-transparent'}"></div>
                  {a.display_name || a.agent_key}
                </button>
              {/each}
              {#if agentsState.agents.length === 0}
                <div class="px-4 py-4 text-xs text-white/30 italic text-center">{$_('import-export.export.noAgents', {default: "No agents found"})}</div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    {#if agentId}
      <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{$_('import-export.export.presetsLabel', {default: "Presets:"})}</span>
          <div class="flex gap-2">
            {#each ['minimal', 'standard', 'complete'] as p}
               {@const isActive = setsEqual(selected, PRESETS[p])}
               <button 
                 onclick={() => handlePreset(p)}
                 class={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${isActive ? 'bg-white/10 border-white/20 text-white shadow-inner' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white/80'}`}
               >
                 {$_(`import-export:presets.${p}`, {default: p})}
               </button>
            {/each}
          </div>
        </div>

        <SectionPicker sections={sections()} {selected} onChange={(v) => selected = v} />

        <div class="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
          <span class="text-xs font-mono text-white/50">{selectedAgent?.display_name || selectedAgent?.agent_key}</span>
          <button 
            onclick={handleExport}
            disabled={selected.size === 0}
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

      <!-- Steps display -->
      <div class="space-y-3 mb-8">
         {#each exp.steps as step}
            <div class="flex flex-col gap-1">
               <div class="flex items-center justify-between text-xs">
                 <span class={`font-bold uppercase tracking-wider ${step.status === 'error' ? 'text-red-400' : step.status === 'done' ? 'text-emerald-400' : 'text-goclaw-neon-purple'}`}>{step.label}</span>
                 {#if step.total && step.total > 0}
                    <span class="font-mono text-white/50">{step.current || 0} / {step.total}</span>
                 {/if}
               </div>
               <div class="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
                 {#if step.status === 'done'}
                    <div class="absolute inset-y-0 left-0 bg-emerald-500 w-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                 {:else if step.status === 'error'}
                    <div class="absolute inset-y-0 left-0 bg-red-500 w-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                 {:else}
                    <div class="absolute inset-y-0 left-0 bg-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.8)] transition-all duration-300" style={`width: ${step.total ? Math.max(5, ((step.current||0)/step.total)*100) : 100}%`}></div>
                 {/if}
               </div>
               {#if step.detail}
                 <p class="text-[9px] font-mono text-white/40">{step.detail}</p>
               {/if}
            </div>
         {/each}
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
