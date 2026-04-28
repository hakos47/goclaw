<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { Upload, FileArchive, AlertTriangle, ChevronDown } from "lucide-svelte";
  import { agentsState, loadAgents } from "../agents/hooks/use-agents.svelte";
  import { useHttp, wsState } from "../../lib/state/ws.svelte";
  import { useSseProgress } from "../../lib/api/sse-progress.svelte";
  import SectionPicker, { type SectionDef } from "./SectionPicker.svelte";

  const http = useHttp();
  const imp = useSseProgress();

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

  let file = $state<File | null>(null);
  let dragging = $state(false);
  let mode = $state<"new" | "merge">("new");
  let agentKey = $state("");
  let displayName = $state("");
  let keyTouched = $state(false);
  let mergeTarget = $state("");
  let dropdownOpen = $state(false);
  let mergeSelected = $state<Set<string>>(new Set(["context_files", "memory", "knowledge_graph"]));
  let parseError = $state("");
  let manifest = $state<any>(null);

  let fileInput: HTMLInputElement;

  const MERGE_SECTIONS: SectionDef[] = [
    { id: "context_files", labelKey: "sections.context_files" },
    { id: "memory", labelKey: "sections.memory" },
    { id: "knowledge_graph", labelKey: "sections.knowledge_graph" },
    { id: "cron", labelKey: "sections.cron" },
    { id: "user_profiles", labelKey: "sections.user_profiles" },
    { id: "user_overrides", labelKey: "sections.user_overrides" },
    { id: "workspace", labelKey: "sections.workspace" },
  ];

  async function handleFile(f: File) {
    file = f;
    parseError = "";
    
    // Parse
    const fd = new FormData();
    fd.append("file", f);
    try {
      manifest = await http.upload<{ agent_key?: string; version?: string; sections: any }>("/v1/agents/import/parse", fd);
      if (!manifest) {
        parseError = $_('import-export.import.errorTitle', {default: "Failed to parse archive"});
        return;
      }
      agentKey = manifest.agent_key || "";
      displayName = "";
      keyTouched = false;
      if (!manifest.sections?.agent_config) {
        mode = "merge";
      }
    } catch (e: any) {
      parseError = e.message || $_('import-export.import.errorTitle', {default: "Failed to parse archive"});
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer?.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  function isValidSlug(slug: string) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  }

  function handleNameChange(val: string) {
    displayName = val;
    if (!keyTouched) {
      agentKey = slugify(val);
    }
  }

  function handleSubmit() {
    if (!file) return;
    
    const fd = new FormData();
    fd.append("file", file);

    if (mode === "merge") {
      if (!mergeTarget) return;
      // Convert parent sections to specific children if needed, or backend handles it.
      // Backend expects sections array.
      fd.append("agent_id", mergeTarget);
      fd.append("sections", Array.from(mergeSelected).join(","));
    } else {
      if (agentKey) fd.append("agent_key", agentKey);
      if (displayName) fd.append("display_name", displayName);
    }

    const url = `${window.location.origin}/v1/agents/import?stream=true`;
    imp.startPost(url, fd);
  }

  function clearFile() {
    file = null;
    manifest = null;
    parseError = "";
    agentKey = "";
    displayName = "";
    keyTouched = false;
    imp.reset();
  }
</script>

<div class="space-y-6">
  {#if imp.status !== 'idle'}
    <!-- Running / Complete / Error State -->
    <div class="p-6 rounded-2xl bg-[#030014]/50 border border-white/10 shadow-inner">
      <h3 class="text-sm font-black uppercase tracking-[0.2em] mb-6 text-white flex items-center gap-2">
         {#if imp.status === 'running'}
           <div class="w-2 h-2 rounded-full bg-goclaw-neon-cyan animate-pulse"></div>
           {$_('import-export.import.importing', {default: "Importing..."})}
         {:else if imp.status === 'error'}
           <div class="w-2 h-2 rounded-full bg-red-500"></div>
           {$_('import-export.import.errorTitle', {default: "Import Failed"})}
         {:else}
           <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
           {$_('import-export.import.done', {default: "Import Complete"})}
         {/if}
      </h3>

      <!-- Steps display -->
      <div class="space-y-3 mb-8">
         {#each imp.steps as step}
            <div class="flex flex-col gap-1">
               <div class="flex items-center justify-between text-xs">
                 <span class={`font-bold uppercase tracking-wider ${step.status === 'error' ? 'text-red-400' : step.status === 'done' ? 'text-emerald-400' : 'text-goclaw-neon-cyan'}`}>{step.label}</span>
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
                    <div class="absolute inset-y-0 left-0 bg-goclaw-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-300" style={`width: ${step.total ? Math.max(5, ((step.current||0)/step.total)*100) : 100}%`}></div>
                 {/if}
               </div>
               {#if step.detail}
                 <p class="text-[9px] font-mono text-white/40">{step.detail}</p>
               {/if}
            </div>
         {/each}
      </div>

      {#if imp.status === 'error' && imp.error}
        <div class="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-mono">
           {imp.error.detail}
        </div>
      {/if}

      <div class="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
        {#if imp.status === 'running'}
           <p class="text-[10px] text-amber-500 mr-auto flex items-center gap-1 uppercase tracking-widest font-bold">
             <AlertTriangle class="h-3.5 w-3.5" />
             {$_('import-export.betaWarningShort', {default: "Beta Feature"})}
           </p>
           <button onclick={imp.cancel} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
             {$_('common.cancel', {default: "Cancel"})}
           </button>
        {/if}
        {#if imp.status === 'complete' && imp.result}
           <button onclick={clearFile} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
             {$_('import-export.import.startImport', {default: "New Import"})}
           </button>
           {#if imp.result.agent_id}
              <button onclick={() => window.location.href = `/agents/${imp.result.agent_id}`} class="px-6 py-2.5 rounded-xl bg-goclaw-neon-cyan/20 border border-goclaw-neon-cyan/50 text-[10px] font-bold uppercase tracking-widest text-goclaw-neon-cyan hover:bg-goclaw-neon-cyan/30 transition-all shadow-inner">
                {$_('import-export.export.done', {default: "View Agent"})}
              </button>
           {/if}
        {/if}
        {#if imp.status === 'error'}
           <button onclick={clearFile} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
             {$_('import-export.import.startImport', {default: "Try Again"})}
           </button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Idle State -->
    {#if !file}
      <button
        class={`w-full flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-16 transition-all duration-500 cursor-pointer ${
          dragging ? 'border-goclaw-neon-cyan bg-goclaw-neon-cyan/5 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'border-white/10 hover:border-goclaw-neon-cyan/50 bg-[#030014]/50 hover:bg-[#030014]'
        }`}
        ondragover={(e) => { e.preventDefault(); dragging = true; }}
        ondragleave={() => dragging = false}
        ondrop={handleDrop}
        onclick={() => fileInput.click()}
      >
        <div class={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${dragging ? 'bg-goclaw-neon-cyan/20 text-goclaw-neon-cyan' : 'bg-white/5 text-white/20'}`}>
          <Upload class="h-8 w-8" />
        </div>
        <div class="text-center">
          <p class="text-sm font-bold text-white tracking-wide">{$_('import-export.import.filePlaceholder', {default: "Drag and drop an agent archive here"})}</p>
          <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mt-2">{$_('import-export.import.file', {default: "Supports .tar.gz, .gz, .json"})}</p>
        </div>
        <input bind:this={fileInput} type="file" class="hidden" accept=".tar.gz,.gz,.json,.agent.json"
          onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f); }} />
      </button>
    {/if}

    {#if parseError}
      <p class="text-xs font-mono text-red-400 mt-2">{parseError}</p>
    {/if}

    {#if file && manifest}
      <div class="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <!-- File Info -->
        <div class="rounded-xl border border-goclaw-neon-cyan/30 bg-goclaw-neon-cyan/5 p-4 flex items-center justify-between shadow-inner">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-goclaw-neon-cyan/10 flex items-center justify-center border border-goclaw-neon-cyan/20">
              <FileArchive class="h-5 w-5 text-goclaw-neon-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
            <div>
              <p class="text-sm font-bold text-white">{file.name}</p>
              {#if manifest.agent_key}
                <p class="text-[10px] font-mono text-goclaw-neon-cyan uppercase tracking-widest mt-0.5">Agent: {manifest.agent_key} · v{manifest.version}</p>
              {/if}
            </div>
          </div>
          <span class="text-xs font-mono text-white/40">{(file.size / 1024).toFixed(0)} KB</span>
        </div>

        <!-- Mode Selection -->
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">{$_('import-export.import.mode', {default: "Import Mode"})}</label>
          <div class="flex gap-2">
            <button 
              onclick={() => mode = "new"}
              class={`flex-1 py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${mode === "new" ? 'bg-goclaw-neon-cyan/20 border-goclaw-neon-cyan text-goclaw-neon-cyan shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]' : 'border-white/5 bg-[#030014] text-white/40 hover:bg-white/5'}`}
            >
              {$_('import-export.import.modeNew', {default: "Create New Agent"})}
            </button>
            <button 
              onclick={() => mode = "merge"}
              class={`flex-1 py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${mode === "merge" ? 'bg-goclaw-neon-cyan/20 border-goclaw-neon-cyan text-goclaw-neon-cyan shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]' : 'border-white/5 bg-[#030014] text-white/40 hover:bg-white/5'}`}
            >
              {$_('import-export.import.modeMerge', {default: "Merge into Existing"})}
            </button>
          </div>
        </div>

        <!-- Mode specific inputs -->
        {#if mode === "new"}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">{$_('import-export.import.agentKey', {default: "Display Name"})}</label>
              <input value={displayName} oninput={(e) => handleNameChange(e.currentTarget.value)} class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-goclaw-neon-cyan outline-none shadow-inner transition-colors placeholder:text-white/20" placeholder="My Imported Agent" />
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Unique ID (Key)</label>
              <input value={agentKey} oninput={(e) => { agentKey = e.currentTarget.value; keyTouched = true; }} class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-goclaw-neon-cyan outline-none shadow-inner transition-colors placeholder:text-white/20" placeholder="my-imported-agent" />
            </div>
          </div>
        {:else if mode === "merge"}
          <div>
            <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">{$_('import-export.import.targetAgent', {default: "Target Agent to Merge Into"})}</label>
            <div class="relative w-full" use:clickOutside={() => dropdownOpen = false}>
              <button 
                onclick={() => dropdownOpen = !dropdownOpen}
                class="w-full flex items-center justify-between bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-cyan outline-none shadow-inner transition-colors group"
              >
                <span class={!mergeTarget ? 'text-white/40' : 'text-white font-medium'}>
                  {mergeTarget ? (agentsState.agents.find(a => a.id === mergeTarget)?.display_name || agentsState.agents.find(a => a.id === mergeTarget)?.agent_key || mergeTarget) : $_('import-export.import.targetAgentPlaceholder', {default: "Choose target..."})}
                </span>
                <ChevronDown class={`w-4 h-4 text-white/40 group-hover:text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {#if dropdownOpen}
                <div class="absolute top-full left-0 w-full mt-2 bg-[#050505]/95 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden backdrop-blur-xl">
                  <div class="max-h-60 overflow-y-auto scroller-no-scrollbar py-2">
                    {#each agentsState.agents as a}
                      <button
                        class="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2 {mergeTarget === a.id ? 'text-goclaw-neon-cyan font-bold bg-white/[0.05]' : 'text-white/70'}"
                        onclick={() => { mergeTarget = a.id; dropdownOpen = false; }}
                      >
                        <div class="w-1.5 h-1.5 rounded-full {mergeTarget === a.id ? 'bg-goclaw-neon-cyan' : 'bg-transparent'}"></div>
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
          <SectionPicker sections={MERGE_SECTIONS} selected={mergeSelected} onChange={(v) => mergeSelected = v} />
        {/if}

        <div class="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
          <button onclick={clearFile} class="px-6 py-3 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
            {$_('common.cancel', {default: "Cancel"})}
          </button>
          <button 
            onclick={handleSubmit}
            disabled={(mode === "new" && agentKey !== "" && !isValidSlug(agentKey)) || (mode === "merge" && !mergeTarget)}
            class="group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-goclaw-neon-cyan border border-goclaw-neon-cyan/50 transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-cyan/50 to-transparent"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-cyan shadow-[0_0_15px_rgba(6,182,212,1)] rounded-t-full"></div>
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
            <Upload class="h-4 w-4 relative z-10 text-white" strokeWidth={2.5} />
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-[#030014] relative z-10 drop-shadow-sm">{$_('import-export.import.startImport', {default: "Start Import"})}</span>
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
