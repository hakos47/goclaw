<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { Package, Download, Info, Zap, Server } from "lucide-svelte";
  import { useHttp } from "../../lib/state/ws.svelte";
  import { useSseProgress } from "../../lib/api/sse-progress.svelte";

  const http = useHttp();
  
  // Two instances of SSE progress to keep state separate if needed, 
  // though we only export one at a time.
  const expSkills = useSseProgress();
  const expMcp = useSseProgress();

  export interface SkillsExportPreview {
    custom_skills: number;
    total_grants: number;
  }

  export interface McpExportPreview {
    servers: number;
    agent_grants: number;
  }

  let activeTab = $state<"skills" | "mcp">("skills");
  
  let skillsPreview = $state<SkillsExportPreview | null>(null);
  let mcpPreview = $state<McpExportPreview | null>(null);

  onMount(() => {
    http.get<SkillsExportPreview>("/v1/skills/export/preview")
      .then(res => skillsPreview = res)
      .catch(() => skillsPreview = null);

    http.get<McpExportPreview>("/v1/mcp/export/preview")
      .then(res => mcpPreview = res)
      .catch(() => mcpPreview = null);
  });

  function startSkillsExport() {
    expSkills.startGet(`${window.location.origin}/v1/skills/export?stream=true`);
  }

  function startMcpExport() {
    expMcp.startGet(`${window.location.origin}/v1/mcp/export?stream=true`);
  }

  async function downloadResult(exp: any, defaultName: string) {
    if (!exp.result?.download_url) return;
    try {
      const blob = await http.downloadBlob(exp.result.download_url);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = exp.result.file_name ?? defaultName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Download failed");
    }
  }
</script>

<div class="space-y-6">
  <!-- Inner Tabs (Skills / MCP) -->
  <div class="flex items-center justify-center mb-6">
    <div class="inline-flex p-1 rounded-xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 shadow-inner">
      <button 
        class={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'skills' ? 'bg-goclaw-neon-purple/20 text-goclaw-neon-purple border border-goclaw-neon-purple/30 shadow-[inset_0_1px_1px_rgba(217,70,239,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'}`}
        onclick={() => activeTab = 'skills'}
      >
        <Zap class="h-3.5 w-3.5" /> {$_('import-export.skillsMcp.skillsTab', {default: "Skills"})}
      </button>
      <button 
        class={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${activeTab === 'mcp' ? 'bg-goclaw-neon-purple/20 text-goclaw-neon-purple border border-goclaw-neon-purple/30 shadow-[inset_0_1px_1px_rgba(217,70,239,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'}`}
        onclick={() => activeTab = 'mcp'}
      >
        <Server class="h-3.5 w-3.5" /> {$_('import-export.skillsMcp.mcpTab', {default: "MCP Servers"})}
      </button>
    </div>
  </div>

  {#if activeTab === 'skills'}
    <!-- SKILLS EXPORT -->
    {#if expSkills.status === 'idle'}
      <div class="animate-in fade-in duration-500 space-y-6">
        <div class="flex items-start gap-3 rounded-xl border border-white/10 bg-[#030014]/50 px-4 py-3 shadow-inner">
          <Info class="h-4 w-4 mt-0.5 shrink-0 text-white/50" />
          <p class="text-[11px] font-bold text-white/50 tracking-wide">{$_('import-export.skillsMcp.skillsNote', {default: "Export all custom skills and agent grants into a portable archive."})}</p>
        </div>

        {#if skillsPreview}
          <div class="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 shadow-inner">
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <span class="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-white/60">
                {$_('import-export.skillsMcp.customSkills', {default: `${skillsPreview.custom_skills} custom skills`, values: {count: skillsPreview.custom_skills}})}
              </span>
              <span class="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-white/60">
                {$_('import-export.skillsMcp.grants', {default: `${skillsPreview.total_grants} grants`, values: {count: skillsPreview.total_grants}})}
              </span>
            </div>
          </div>
          {#if skillsPreview.custom_skills === 0}
            <p class="text-xs text-amber-500 font-mono pl-2">{$_('import-export.skillsMcp.noSkills', {default: "No custom skills found to export."})}</p>
          {/if}
        {:else}
          <p class="text-xs text-white/40 font-mono animate-pulse pl-2">{$_('import-export.export.previewLoading', {default: "Loading preview..."})}</p>
        {/if}

        <div class="flex items-center justify-end mt-6 pt-6 border-t border-white/5">
          <button 
            onclick={startSkillsExport}
            disabled={!skillsPreview || skillsPreview.custom_skills === 0}
            class="group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-goclaw-neon-purple border border-goclaw-neon-purple/50 transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/50 to-transparent"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
            <Package class="h-4 w-4 relative z-10 text-white" strokeWidth={2.5} />
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-white relative z-10 drop-shadow-md">{$_('import-export.skillsMcp.exportSkills', {default: "Export Skills"})}</span>
          </button>
        </div>
      </div>
    {:else}
      <!-- Skills Running / Complete / Error State -->
      <div class="p-6 rounded-2xl bg-[#030014]/50 border border-white/10 shadow-inner animate-in fade-in zoom-in-95 duration-300">
        <h3 class="text-sm font-black uppercase tracking-[0.2em] mb-6 text-white flex items-center gap-2">
           {#if expSkills.status === 'running'}
             <div class="w-2 h-2 rounded-full bg-goclaw-neon-purple animate-pulse"></div>
             {$_('import-export.export.exporting', {default: "Exporting..."})}
           {:else if expSkills.status === 'error'}
             <div class="w-2 h-2 rounded-full bg-red-500"></div>
             {$_('import-export.export.errorTitle', {default: "Export Failed"})}
           {:else}
             <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
             {$_('import-export.export.done', {default: "Export Complete"})}
           {/if}
        </h3>

        <div class="space-y-3 mb-8">
           <div class="rounded-xl border border-white/10 bg-black/40 overflow-hidden text-sm shadow-inner divide-y divide-white/5">
             {#each expSkills.steps as step}
               <div class="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                 <div class="flex items-center gap-2">
                   <div class={`w-1.5 h-1.5 rounded-full ${step.status === 'done' ? 'bg-emerald-500' : step.status === 'error' ? 'bg-red-500' : 'bg-goclaw-neon-purple animate-pulse'}`}></div>
                   <span class="font-bold text-white/80 tracking-wide text-xs">{step.label}</span>
                 </div>
                 {#if step.detail}
                    <div class="mt-1 ml-3 text-[10px] font-mono text-white/40">{step.detail}</div>
                 {/if}
               </div>
             {/each}
             <div class="px-4 py-2 text-[10px] font-mono text-white/30 bg-black/50">
               {expSkills.elapsed < 60 ? `${expSkills.elapsed}s` : `${Math.floor(expSkills.elapsed / 60)}m ${expSkills.elapsed % 60}s`}
             </div>
           </div>
        </div>

        {#if expSkills.status === 'error' && expSkills.error}
          <div class="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-mono">
             {expSkills.error.detail}
          </div>
        {/if}

        <div class="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
          {#if expSkills.status === 'running'}
             <button onclick={expSkills.cancel} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
               {$_('common.cancel', {default: "Cancel"})}
             </button>
          {/if}
          {#if expSkills.status === 'complete' && expSkills.result?.download_url}
             <button onclick={expSkills.reset} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
               {$_('import-export.export.startExport', {default: "New Export"})}
             </button>
             <button onclick={() => downloadResult(expSkills, "skills-export.tar.gz")} class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-goclaw-neon-cyan/20 border border-goclaw-neon-cyan/50 text-[10px] font-bold uppercase tracking-widest text-goclaw-neon-cyan hover:bg-goclaw-neon-cyan/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
               <Download class="h-3.5 w-3.5" /> {$_('import-export.export.download', {default: "Download Archive"})}
             </button>
          {/if}
          {#if expSkills.status === 'error'}
             <button onclick={expSkills.reset} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
               {$_('import-export.export.startExport', {default: "Try Again"})}
             </button>
          {/if}
        </div>
      </div>
    {/if}
  {:else}
    <!-- MCP EXPORT -->
    {#if expMcp.status === 'idle'}
      <div class="animate-in fade-in duration-500 space-y-6">
        <div class="flex items-start gap-3 rounded-xl border border-white/10 bg-[#030014]/50 px-4 py-3 shadow-inner">
          <Info class="h-4 w-4 mt-0.5 shrink-0 text-white/50" />
          <p class="text-[11px] font-bold text-white/50 tracking-wide">{$_('import-export.skillsMcp.mcpNote', {default: "Export MCP Server configurations and their agent grants."})}</p>
        </div>

        {#if mcpPreview}
          <div class="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 shadow-inner">
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <span class="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-white/60">
                {$_('import-export.skillsMcp.servers', {default: `${mcpPreview.servers} servers`, values: {count: mcpPreview.servers}})}
              </span>
              <span class="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-white/60">
                {$_('import-export.skillsMcp.grants', {default: `${mcpPreview.agent_grants} grants`, values: {count: mcpPreview.agent_grants}})}
              </span>
            </div>
          </div>
          {#if mcpPreview.servers === 0}
            <p class="text-xs text-amber-500 font-mono pl-2">{$_('import-export.skillsMcp.noServers', {default: "No MCP servers found to export."})}</p>
          {/if}
        {:else}
          <p class="text-xs text-white/40 font-mono animate-pulse pl-2">{$_('import-export.export.previewLoading', {default: "Loading preview..."})}</p>
        {/if}

        <div class="flex items-center justify-end mt-6 pt-6 border-t border-white/5">
          <button 
            onclick={startMcpExport}
            disabled={!mcpPreview || mcpPreview.servers === 0}
            class="group relative flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-goclaw-neon-purple border border-goclaw-neon-purple/50 transition-all duration-500 overflow-hidden shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/50 to-transparent"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
            <Package class="h-4 w-4 relative z-10 text-white" strokeWidth={2.5} />
            <span class="text-[11px] font-black uppercase tracking-[0.2em] text-white relative z-10 drop-shadow-md">{$_('import-export.skillsMcp.exportMcp', {default: "Export MCP"})}</span>
          </button>
        </div>
      </div>
    {:else}
      <!-- MCP Running / Complete / Error State -->
      <div class="p-6 rounded-2xl bg-[#030014]/50 border border-white/10 shadow-inner animate-in fade-in zoom-in-95 duration-300">
        <h3 class="text-sm font-black uppercase tracking-[0.2em] mb-6 text-white flex items-center gap-2">
           {#if expMcp.status === 'running'}
             <div class="w-2 h-2 rounded-full bg-goclaw-neon-purple animate-pulse"></div>
             {$_('import-export.export.exporting', {default: "Exporting..."})}
           {:else if expMcp.status === 'error'}
             <div class="w-2 h-2 rounded-full bg-red-500"></div>
             {$_('import-export.export.errorTitle', {default: "Export Failed"})}
           {:else}
             <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
             {$_('import-export.export.done', {default: "Export Complete"})}
           {/if}
        </h3>

        <div class="space-y-3 mb-8">
           <div class="rounded-xl border border-white/10 bg-black/40 overflow-hidden text-sm shadow-inner divide-y divide-white/5">
             {#each expMcp.steps as step}
               <div class="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                 <div class="flex items-center gap-2">
                   <div class={`w-1.5 h-1.5 rounded-full ${step.status === 'done' ? 'bg-emerald-500' : step.status === 'error' ? 'bg-red-500' : 'bg-goclaw-neon-purple animate-pulse'}`}></div>
                   <span class="font-bold text-white/80 tracking-wide text-xs">{step.label}</span>
                 </div>
                 {#if step.detail}
                    <div class="mt-1 ml-3 text-[10px] font-mono text-white/40">{step.detail}</div>
                 {/if}
               </div>
             {/each}
             <div class="px-4 py-2 text-[10px] font-mono text-white/30 bg-black/50">
               {expMcp.elapsed < 60 ? `${expMcp.elapsed}s` : `${Math.floor(expMcp.elapsed / 60)}m ${expMcp.elapsed % 60}s`}
             </div>
           </div>
        </div>

        {#if expMcp.status === 'error' && expMcp.error}
          <div class="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 font-mono">
             {expMcp.error.detail}
          </div>
        {/if}

        <div class="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
          {#if expMcp.status === 'running'}
             <button onclick={expMcp.cancel} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
               {$_('common.cancel', {default: "Cancel"})}
             </button>
          {/if}
          {#if expMcp.status === 'complete' && expMcp.result?.download_url}
             <button onclick={expMcp.reset} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
               {$_('import-export.export.startExport', {default: "New Export"})}
             </button>
             <button onclick={() => downloadResult(expMcp, "mcp-export.tar.gz")} class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-goclaw-neon-cyan/20 border border-goclaw-neon-cyan/50 text-[10px] font-bold uppercase tracking-widest text-goclaw-neon-cyan hover:bg-goclaw-neon-cyan/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
               <Download class="h-3.5 w-3.5" /> {$_('import-export.export.download', {default: "Download Archive"})}
             </button>
          {/if}
          {#if expMcp.status === 'error'}
             <button onclick={expMcp.reset} class="px-6 py-2.5 rounded-xl border border-white/20 bg-transparent text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white transition-all">
               {$_('import-export.export.startExport', {default: "Try Again"})}
             </button>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>
