<script lang="ts">
  import { _ } from "svelte-i18n";
  import { Upload, FileArchive, AlertTriangle } from "lucide-svelte";
  import { useSseProgress } from "../../lib/api/sse-progress.svelte";

  const imp = useSseProgress();

  let file = $state<File | null>(null);
  let dragging = $state(false);
  let fileInput: HTMLInputElement;

  function handleFile(f: File) {
    file = f;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer?.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleSubmit() {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const url = `${window.location.origin}/v1/teams/import?stream=true`;
    imp.startPost(url, fd);
  }

  function clearFile() {
    file = null;
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

      <!-- Tree Steps display -->
      <div class="space-y-3 mb-8">
         {#if true}
           {@const teamStep = imp.steps.find(s => s.id === "team")}
           {@const agentSteps = imp.steps.filter(s => s.id !== "team" && s.id !== "workspace")}
           
           <div class="rounded-xl border border-white/10 bg-black/40 overflow-hidden text-sm shadow-inner">
             <!-- Team node -->
           {#if teamStep}
             <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
               <div class="flex items-center gap-2">
                 <div class={`w-2 h-2 rounded-full ${teamStep.status === 'done' ? 'bg-emerald-500' : teamStep.status === 'error' ? 'bg-red-500' : 'bg-goclaw-neon-cyan animate-pulse'}`}></div>
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
                    <div class={`w-1.5 h-1.5 rounded-full ${step.status === 'done' ? 'bg-emerald-500' : step.status === 'error' ? 'bg-red-500' : 'bg-goclaw-neon-cyan animate-pulse'}`}></div>
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
             {imp.elapsed < 60 ? `${imp.elapsed}s` : `${Math.floor(imp.elapsed / 60)}m ${imp.elapsed % 60}s`}
           </div>
         </div>
         {/if}
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
             {$_('import-export.teamDontClose', {default: "Do not close this page"})}
           </p>
           <button onclick={imp.cancel} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
             {$_('common.cancel', {default: "Cancel"})}
           </button>
        {/if}
        {#if imp.status === 'complete' || imp.status === 'error'}
           <button onclick={clearFile} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
             {imp.status === 'complete' ? $_('import-export.teamImportAnother', {default: "Import Another Team"}) : $_('import-export.teamTryAgain', {default: "Try Again"})}
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
          <p class="text-sm font-bold text-white tracking-wide">{$_('import-export.teamDropHere', {default: "Drag and drop a team archive here"})}</p>
          <p class="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mt-2">{$_('import-export.teamDropFormats', {default: "Supports .tar.gz, .gz"})}</p>
        </div>
        <input bind:this={fileInput} type="file" class="hidden" accept=".tar.gz,.gz"
          onchange={(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f); }} />
      </button>
    {/if}

    {#if file}
      <div class="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <!-- File Info -->
        <div class="rounded-xl border border-goclaw-neon-cyan/30 bg-goclaw-neon-cyan/5 p-4 flex items-center justify-between shadow-inner">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-goclaw-neon-cyan/10 flex items-center justify-center border border-goclaw-neon-cyan/20">
              <FileArchive class="h-5 w-5 text-goclaw-neon-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
            <div>
              <p class="text-sm font-bold text-white">{file.name}</p>
            </div>
          </div>
          <span class="text-xs font-mono text-white/40">{(file.size / 1024).toFixed(0)} KB</span>
        </div>

        <div class="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
          <button onclick={clearFile} class="px-6 py-3 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
            {$_('import-export.teamChangeFile', {default: "Change File"})}
          </button>
          <button 
            onclick={handleSubmit}
            class="group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-goclaw-neon-cyan border border-goclaw-neon-cyan/50 transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-105"
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
