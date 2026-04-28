<script lang="ts">
  import { _ } from "svelte-i18n";
  import { Upload, FileArchive, Zap, Server, CheckCircle2, SkipForward } from "lucide-svelte";
  import { useSseProgress } from "../../lib/api/sse-progress.svelte";

  const impSkills = useSseProgress();
  const impMcp = useSseProgress();

  let activeTab = $state<"skills" | "mcp">("skills");
  
  let fileSkills = $state<File | null>(null);
  let draggingSkills = $state(false);
  let fileInputSkills: HTMLInputElement;

  let fileMcp = $state<File | null>(null);
  let draggingMcp = $state(false);
  let fileInputMcp: HTMLInputElement;

  function handleFileSkills(f: File) {
    fileSkills = f;
  }
  function handleFileMcp(f: File) {
    fileMcp = f;
  }

  function handleDropSkills(e: DragEvent) {
    e.preventDefault();
    draggingSkills = false;
    if (e.dataTransfer?.files?.[0]) handleFileSkills(e.dataTransfer.files[0]);
  }
  function handleDropMcp(e: DragEvent) {
    e.preventDefault();
    draggingMcp = false;
    if (e.dataTransfer?.files?.[0]) handleFileMcp(e.dataTransfer.files[0]);
  }

  function submitSkills() {
    if (!fileSkills) return;
    const fd = new FormData();
    fd.append("file", fileSkills);
    impSkills.startPost(`${window.location.origin}/v1/skills/import?stream=true`, fd);
  }

  function submitMcp() {
    if (!fileMcp) return;
    const fd = new FormData();
    fd.append("file", fileMcp);
    impMcp.startPost(`${window.location.origin}/v1/mcp/import?stream=true`, fd);
  }

  function clearSkills() {
    fileSkills = null;
    impSkills.reset();
  }

  function clearMcp() {
    fileMcp = null;
    impMcp.reset();
  }
</script>

<div class="space-y-6">
  <!-- Inner Tabs (Skills / MCP) -->
  <div class="flex items-center justify-center mb-6">
    <div class="inline-flex p-1 rounded-xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 shadow-inner">
      <button 
        class={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'skills' ? 'bg-goclaw-neon-cyan/20 text-goclaw-neon-cyan border border-goclaw-neon-cyan/30 shadow-[inset_0_1px_1px_rgba(6,182,212,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'}`}
        onclick={() => activeTab = 'skills'}
      >
        <Zap class="h-3.5 w-3.5" /> {$_('import-export.skillsMcp.skillsTab', {default: "Skills"})}
      </button>
      <button 
        class={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'mcp' ? 'bg-goclaw-neon-cyan/20 text-goclaw-neon-cyan border border-goclaw-neon-cyan/30 shadow-[inset_0_1px_1px_rgba(6,182,212,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'}`}
        onclick={() => activeTab = 'mcp'}
      >
        <Server class="h-3.5 w-3.5" /> {$_('import-export.skillsMcp.mcpTab', {default: "MCP Servers"})}
      </button>
    </div>
  </div>

  {#if activeTab === 'skills'}
    <!-- SKILLS IMPORT -->
    {#if impSkills.status !== 'idle'}
      <div class="p-6 rounded-2xl bg-[#030014]/50 border border-white/10 shadow-inner animate-in fade-in zoom-in-95 duration-300">
        <h3 class="text-sm font-black uppercase tracking-[0.2em] mb-6 text-white flex items-center gap-2">
           {#if impSkills.status === 'running'}
             <div class="w-2 h-2 rounded-full bg-goclaw-neon-cyan animate-pulse"></div>
             {$_('import-export.import.importing', {default: "Importing..."})}
           {:else if impSkills.status === 'error'}
             <div class="w-2 h-2 rounded-full bg-red-500"></div>
             {$_('import-export.import.errorTitle', {default: "Import Failed"})}
           {:else}
             <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
             {$_('import-export.import.done', {default: "Import Complete"})}
           {/if}
        </h3>

        {#if impSkills.status === 'complete' && impSkills.result}
          <div class="rounded-xl border border-white/10 bg-black/40 overflow-hidden text-sm shadow-inner divide-y divide-white/5 mb-8">
            <div class="flex items-center gap-3 px-4 py-3 bg-white/[0.02]">
               <CheckCircle2 class="h-4 w-4 text-emerald-500" />
               <span class="text-white/80">{$_('import-export.skillsMcp.importedSkills', {default: "Skills Imported"})}</span>
               <span class="ml-auto font-mono text-white">{(impSkills.result.skills_imported ?? 0)}</span>
            </div>
            {#if impSkills.result.skills_skipped}
              <div class="flex items-center gap-3 px-4 py-3 bg-white/[0.02]">
                 <SkipForward class="h-4 w-4 text-white/40" />
                 <span class="text-white/80">{$_('import-export.skillsMcp.skippedSkills', {default: "Skills Skipped (Existing)"})}</span>
                 <span class="ml-auto font-mono text-white/60">{impSkills.result.skills_skipped}</span>
              </div>
            {/if}
            <div class="flex items-center gap-3 px-4 py-3 bg-white/[0.02]">
               <CheckCircle2 class="h-4 w-4 text-emerald-500" />
               <span class="text-white/80">{$_('import-export.skillsMcp.grants', {default: "Agent Grants Applied"})}</span>
               <span class="ml-auto font-mono text-white">{(impSkills.result.grants_applied ?? 0)}</span>
            </div>
            <div class="px-4 py-2 text-[10px] font-mono text-white/30 bg-black/50">
               {impSkills.elapsed < 60 ? `${impSkills.elapsed}s` : `${Math.floor(impSkills.elapsed / 60)}m ${impSkills.elapsed % 60}s`}
            </div>
          </div>
        {:else}
          <div class="space-y-3 mb-8">
             <div class="rounded-xl border border-white/10 bg-black/40 overflow-hidden text-sm shadow-inner divide-y divide-white/5">
               {#each impSkills.steps as step}
                 <div class="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                   <div class="flex items-center gap-2">
                     <div class={`w-1.5 h-1.5 rounded-full ${step.status === 'done' ? 'bg-emerald-500' : step.status === 'error' ? 'bg-red-500' : 'bg-goclaw-neon-cyan animate-pulse'}`}></div>
                     <span class="font-bold text-white/80 tracking-wide text-xs">{step.label}</span>
                   </div>
                 </div>
               {/each}
               <div class="px-4 py-2 text-[10px] font-mono text-white/30 bg-black/50">
                 {impSkills.elapsed < 60 ? `${impSkills.elapsed}s` : `${Math.floor(impSkills.elapsed / 60)}m ${impSkills.elapsed % 60}s`}
               </div>
             </div>
          </div>
        {/if}

        {#if impSkills.status === 'error' && impSkills.error}
          <div class="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-mono">
             {impSkills.error.detail}
          </div>
        {/if}

        <div class="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
          {#if impSkills.status === 'running'}
             <button onclick={impSkills.cancel} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
               {$_('common.cancel', {default: "Cancel"})}
             </button>
          {/if}
          {#if impSkills.status === 'complete' || impSkills.status === 'error'}
             <button onclick={clearSkills} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
               {impSkills.status === 'complete' ? $_('import-export.teamImportAnother', {default: "Import Another"}) : $_('import-export.teamTryAgain', {default: "Try Again"})}
             </button>
          {/if}
        </div>
      </div>
    {:else}
      {#if !fileSkills}
        <button
          class={`w-full flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-16 transition-all duration-500 cursor-pointer ${
            draggingSkills ? 'border-goclaw-neon-cyan bg-goclaw-neon-cyan/5 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'border-white/10 hover:border-goclaw-neon-cyan/50 bg-[#030014]/50 hover:bg-[#030014]'
          }`}
          ondragover={(e) => { e.preventDefault(); draggingSkills = true; }}
          ondragleave={() => draggingSkills = false}
          ondrop={handleDropSkills}
          onclick={() => fileInputSkills.click()}
        >
          <div class={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${draggingSkills ? 'bg-goclaw-neon-cyan/20 text-goclaw-neon-cyan' : 'bg-white/5 text-white/20'}`}>
            <Upload class="h-8 w-8" />
          </div>
          <div class="text-center">
            <p class="text-sm font-bold text-white tracking-wide">{$_('import-export.skillsMcp.dropSkills', {default: "Drag and drop a skills archive here"})}</p>
            <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mt-2">{$_('import-export.teamDropFormats', {default: "Supports .tar.gz, .gz"})}</p>
          </div>
          <input bind:this={fileInputSkills} type="file" class="hidden" accept=".tar.gz,.gz"
            onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFileSkills(f); }} />
        </button>
      {/if}

      {#if fileSkills}
        <div class="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div class="rounded-xl border border-goclaw-neon-cyan/30 bg-goclaw-neon-cyan/5 p-4 flex items-center justify-between shadow-inner">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-goclaw-neon-cyan/10 flex items-center justify-center border border-goclaw-neon-cyan/20">
                <FileArchive class="h-5 w-5 text-goclaw-neon-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </div>
              <div>
                <p class="text-sm font-bold text-white">{fileSkills.name}</p>
              </div>
            </div>
            <span class="text-xs font-mono text-white/40">{(fileSkills.size / 1024).toFixed(0)} KB</span>
          </div>

          <div class="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
            <button onclick={clearSkills} class="px-6 py-3 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
              {$_('import-export.teamChangeFile', {default: "Change File"})}
            </button>
            <button 
              onclick={submitSkills}
              class="group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-goclaw-neon-cyan border border-goclaw-neon-cyan/50 transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-105"
            >
              <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-cyan/50 to-transparent"></div>
              <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-cyan shadow-[0_0_15px_rgba(6,182,212,1)] rounded-t-full"></div>
              <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
              <Upload class="h-4 w-4 relative z-10 text-white" strokeWidth={2.5} />
              <span class="text-[11px] font-black uppercase tracking-[0.2em] text-[#030014] relative z-10 drop-shadow-sm">{$_('import-export.skillsMcp.importSkills', {default: "Import Skills"})}</span>
            </button>
          </div>
        </div>
      {/if}
    {/if}
  {:else}
    <!-- MCP IMPORT -->
    {#if impMcp.status !== 'idle'}
      <div class="p-6 rounded-2xl bg-[#030014]/50 border border-white/10 shadow-inner animate-in fade-in zoom-in-95 duration-300">
        <h3 class="text-sm font-black uppercase tracking-[0.2em] mb-6 text-white flex items-center gap-2">
           {#if impMcp.status === 'running'}
             <div class="w-2 h-2 rounded-full bg-goclaw-neon-cyan animate-pulse"></div>
             {$_('import-export.import.importing', {default: "Importing..."})}
           {:else if impMcp.status === 'error'}
             <div class="w-2 h-2 rounded-full bg-red-500"></div>
             {$_('import-export.import.errorTitle', {default: "Import Failed"})}
           {:else}
             <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
             {$_('import-export.import.done', {default: "Import Complete"})}
           {/if}
        </h3>

        {#if impMcp.status === 'complete' && impMcp.result}
          <div class="rounded-xl border border-white/10 bg-black/40 overflow-hidden text-sm shadow-inner divide-y divide-white/5 mb-8">
            <div class="flex items-center gap-3 px-4 py-3 bg-white/[0.02]">
               <CheckCircle2 class="h-4 w-4 text-emerald-500" />
               <span class="text-white/80">{$_('import-export.skillsMcp.importedServers', {default: "Servers Imported"})}</span>
               <span class="ml-auto font-mono text-white">{(impMcp.result.servers_imported ?? 0)}</span>
            </div>
            {#if impMcp.result.servers_skipped}
              <div class="flex items-center gap-3 px-4 py-3 bg-white/[0.02]">
                 <SkipForward class="h-4 w-4 text-white/40" />
                 <span class="text-white/80">{$_('import-export.skillsMcp.skippedServers', {default: "Servers Skipped (Existing)"})}</span>
                 <span class="ml-auto font-mono text-white/60">{impMcp.result.servers_skipped}</span>
              </div>
            {/if}
            <div class="flex items-center gap-3 px-4 py-3 bg-white/[0.02]">
               <CheckCircle2 class="h-4 w-4 text-emerald-500" />
               <span class="text-white/80">{$_('import-export.skillsMcp.grants', {default: "Agent Grants Applied"})}</span>
               <span class="ml-auto font-mono text-white">{(impMcp.result.grants_applied ?? 0)}</span>
            </div>
            <div class="px-4 py-2 text-[10px] font-mono text-white/30 bg-black/50">
               {impMcp.elapsed < 60 ? `${impMcp.elapsed}s` : `${Math.floor(impMcp.elapsed / 60)}m ${impMcp.elapsed % 60}s`}
            </div>
          </div>
        {:else}
          <div class="space-y-3 mb-8">
             <div class="rounded-xl border border-white/10 bg-black/40 overflow-hidden text-sm shadow-inner divide-y divide-white/5">
               {#each impMcp.steps as step}
                 <div class="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                   <div class="flex items-center gap-2">
                     <div class={`w-1.5 h-1.5 rounded-full ${step.status === 'done' ? 'bg-emerald-500' : step.status === 'error' ? 'bg-red-500' : 'bg-goclaw-neon-cyan animate-pulse'}`}></div>
                     <span class="font-bold text-white/80 tracking-wide text-xs">{step.label}</span>
                   </div>
                 </div>
               {/each}
               <div class="px-4 py-2 text-[10px] font-mono text-white/30 bg-black/50">
                 {impMcp.elapsed < 60 ? `${impMcp.elapsed}s` : `${Math.floor(impMcp.elapsed / 60)}m ${impMcp.elapsed % 60}s`}
               </div>
             </div>
          </div>
        {/if}

        {#if impMcp.status === 'error' && impMcp.error}
          <div class="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-mono">
             {impMcp.error.detail}
          </div>
        {/if}

        <div class="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
          {#if impMcp.status === 'running'}
             <button onclick={impMcp.cancel} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
               {$_('common.cancel', {default: "Cancel"})}
             </button>
          {/if}
          {#if impMcp.status === 'complete' || impMcp.status === 'error'}
             <button onclick={clearMcp} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
               {impMcp.status === 'complete' ? $_('import-export.teamImportAnother', {default: "Import Another"}) : $_('import-export.teamTryAgain', {default: "Try Again"})}
             </button>
          {/if}
        </div>
      </div>
    {:else}
      {#if !fileMcp}
        <button
          class={`w-full flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-16 transition-all duration-500 cursor-pointer ${
            draggingMcp ? 'border-goclaw-neon-cyan bg-goclaw-neon-cyan/5 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'border-white/10 hover:border-goclaw-neon-cyan/50 bg-[#030014]/50 hover:bg-[#030014]'
          }`}
          ondragover={(e) => { e.preventDefault(); draggingMcp = true; }}
          ondragleave={() => draggingMcp = false}
          ondrop={handleDropMcp}
          onclick={() => fileInputMcp.click()}
        >
          <div class={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${draggingMcp ? 'bg-goclaw-neon-cyan/20 text-goclaw-neon-cyan' : 'bg-white/5 text-white/20'}`}>
            <Upload class="h-8 w-8" />
          </div>
          <div class="text-center">
            <p class="text-sm font-bold text-white tracking-wide">{$_('import-export.skillsMcp.dropMcp', {default: "Drag and drop an MCP archive here"})}</p>
            <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mt-2">{$_('import-export.teamDropFormats', {default: "Supports .tar.gz, .gz"})}</p>
          </div>
          <input bind:this={fileInputMcp} type="file" class="hidden" accept=".tar.gz,.gz"
            onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFileMcp(f); }} />
        </button>
      {/if}

      {#if fileMcp}
        <div class="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div class="rounded-xl border border-goclaw-neon-cyan/30 bg-goclaw-neon-cyan/5 p-4 flex items-center justify-between shadow-inner">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-goclaw-neon-cyan/10 flex items-center justify-center border border-goclaw-neon-cyan/20">
                <FileArchive class="h-5 w-5 text-goclaw-neon-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </div>
              <div>
                <p class="text-sm font-bold text-white">{fileMcp.name}</p>
              </div>
            </div>
            <span class="text-xs font-mono text-white/40">{(fileMcp.size / 1024).toFixed(0)} KB</span>
          </div>

          <div class="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
            <button onclick={clearMcp} class="px-6 py-3 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
              {$_('import-export.teamChangeFile', {default: "Change File"})}
            </button>
            <button 
              onclick={submitMcp}
              class="group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-goclaw-neon-cyan border border-goclaw-neon-cyan/50 transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-105"
            >
              <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-cyan/50 to-transparent"></div>
              <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-cyan shadow-[0_0_15px_rgba(6,182,212,1)] rounded-t-full"></div>
              <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
              <Upload class="h-4 w-4 relative z-10 text-white" strokeWidth={2.5} />
              <span class="text-[11px] font-black uppercase tracking-[0.2em] text-[#030014] relative z-10 drop-shadow-sm">{$_('import-export.skillsMcp.importMcp', {default: "Import MCP"})}</span>
            </button>
          </div>
        </div>
      {/if}
    {/if}
  {/if}
</div>
