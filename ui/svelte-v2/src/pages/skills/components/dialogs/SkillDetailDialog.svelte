<script lang="ts">
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import { X, Code2, FolderTree, Info, Terminal, ChevronRight, FileCode2, PackageOpen } from "lucide-svelte";
  import type { SkillInfo, SkillFile, SkillVersions } from "../../hooks/use-skills.svelte";

  let { skill, onClose, getSkillVersions, getSkillFiles, getSkillFileContent } = $props<{
    skill: SkillInfo & { content: string };
    onClose: () => void;
    getSkillVersions: (id: string) => Promise<SkillVersions>;
    getSkillFiles: (id: string, version?: number) => Promise<SkillFile[]>;
    getSkillFileContent: (id: string, path: string, version?: number) => Promise<{ content: string; path: string; size: number }>;
  }>();

  const hasFiles = !!skill.id;

  let activeTab = $state<"content" | "files">("content");
  let versions = $state<SkillVersions | null>(null);
  let selectedVersion = $state<number | null>(null);
  
  let files = $state<SkillFile[]>([]);
  let filesLoading = $state(false);
  let activePath = $state<string | null>(null);
  
  let fileContent = $state<{ content: string; path: string; size: number } | null>(null);
  let contentLoading = $state(false);

  let showVersionDropdown = $state(false);

  marked.setOptions({
    gfm: true,
    breaks: true
  });

  let parsedDocs = $derived.by(() => {
    if (!skill.content) return "";
    try {
      const rawHtml = marked.parse(skill.content) as string;
      return DOMPurify.sanitize(rawHtml);
    } catch (e) {
      console.error("Error parsing markdown:", e);
      return skill.content;
    }
  });

  // Group files into a simple tree structure
  const fileTree = $derived(() => {
    const root: Record<string, any> = {};
    for (const f of files) {
      const parts = f.path.split('/');
      let current = root;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = { _isDir: true, children: {} };
        current = current[parts[i]].children;
      }
      current[parts[parts.length - 1]] = { ...f, _isDir: false };
    }
    return root;
  });

  async function loadVersions() {
    if (!skill.id || versions) return;
    versions = await getSkillVersions(skill.id);
    selectedVersion = versions.current;
  }

  async function loadFiles(version?: number) {
    if (!skill.id) return;
    filesLoading = true;
    try {
      files = await getSkillFiles(skill.id, version);
      activePath = null;
      fileContent = null;
    } finally {
      filesLoading = false;
    }
  }

  async function loadFileContent(path: string) {
    if (!skill.id) return;
    activePath = path;
    contentLoading = true;
    try {
      fileContent = await getSkillFileContent(skill.id, path, selectedVersion ?? undefined);
    } finally {
      contentLoading = false;
    }
  }

  $effect(() => {
    if (activeTab === "files" && hasFiles && !versions) {
      loadVersions();
    }
  });

  $effect(() => {
    if (selectedVersion != null && activeTab === "files") {
      loadFiles(selectedVersion);
    }
  });

  function getLang(path: string) {
    if (path.endsWith(".py")) return "python";
    if (path.endsWith(".js") || path.endsWith(".ts")) return "javascript";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
    if (path.endsWith(".md")) return "markdown";
    if (path.endsWith(".go")) return "go";
    return "plaintext";
  }

</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#030014]/80 backdrop-blur-3xl animate-in fade-in duration-500" onclick={(e) => e.target === e.currentTarget && onClose()}>
  <div class="relative w-full max-w-5xl h-[85vh] bg-[#050505]/90 border border-white/5 shadow-[0_0_100px_rgba(0,0,0,1),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
    
    <!-- Scanlines & Background Effects -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
    <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-cyan/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-goclaw-neon-purple/5 rounded-full blur-[100px] pointer-events-none"></div>

    <!-- Header -->
    <div class="relative z-10 flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md shrink-0">
      <div class="flex items-center gap-4">
         <div class="h-14 w-14 rounded-2xl bg-[#030014] border border-white/10 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_20px_rgba(6,182,212,0.2)] overflow-hidden relative shrink-0">
           <div class="absolute inset-0 bg-goclaw-neon-cyan/10"></div>
           <PackageOpen class="h-7 w-7 text-goclaw-neon-cyan drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] relative z-10" />
         </div>
         <div class="flex-1 min-w-0">
           <div class="flex items-center gap-3">
             <h2 class="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 truncate">
               {skill.name}
             </h2>
             <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 uppercase tracking-widest shrink-0">{skill.source || "file"}</span>
             {#if skill.visibility}
               <span class="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[9px] font-bold text-purple-400 uppercase tracking-widest shrink-0">{skill.visibility}</span>
             {/if}
             {#if skill.version}
               <span class="text-xs font-mono text-white/30 uppercase tracking-widest shrink-0">v{skill.version}</span>
             {/if}
           </div>
           {#if skill.description}
             <p class="text-[10px] text-goclaw-neon-purple font-bold uppercase tracking-[0.2em] mt-1 drop-shadow-[0_0_5px_rgba(217,70,239,0.3)] truncate">{skill.description}</p>
           {:else}
             <p class="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">NO DESCRIPTION AVAILABLE</p>
           {/if}
         </div>
      </div>
      
      <button onclick={onClose} class="h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl bg-[#030014]/50 border border-white/5 hover:bg-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all duration-300 shadow-inner group">
        <X class="h-6 w-6 group-hover:rotate-90 transition-transform" />
      </button>
    </div>

    <!-- Tabs -->
    <div class="relative z-10 px-6 pt-4 bg-[#0a0a0a]/30 border-b border-white/5 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
      <button 
        onclick={() => activeTab = "content"}
        class={`relative flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-t-xl transition-all duration-500 overflow-hidden group whitespace-nowrap ${activeTab === 'content' ? 'text-white bg-[#030014]/60 border border-white/10 border-b-0' : 'text-white/40 hover:text-white/90 hover:bg-white/5'}`}
      >
        {#if activeTab === "content"}
          <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-cyan/10 to-transparent border-t border-goclaw-neon-cyan/30 rounded-t-xl"></div>
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-cyan shadow-[0_0_15px_rgba(6,182,212,1)] rounded-t-full"></div>
        {/if}
        <Info class={`h-3.5 w-3.5 relative z-10 transition-colors duration-500 ${activeTab === 'content' ? 'text-goclaw-neon-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-white/30 group-hover:text-white/70'}`} />
        <span class="relative z-10 drop-shadow-md">Documentation</span>
      </button>
      
      {#if hasFiles}
        <button 
          onclick={() => activeTab = "files"}
          class={`relative flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-t-xl transition-all duration-500 overflow-hidden group whitespace-nowrap ${activeTab === 'files' ? 'text-white bg-[#030014]/60 border border-white/10 border-b-0' : 'text-white/40 hover:text-white/90 hover:bg-white/5'}`}
        >
          {#if activeTab === "files"}
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/10 to-transparent border-t border-goclaw-neon-purple/30 rounded-t-xl"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
          {/if}
          <Code2 class={`h-3.5 w-3.5 relative z-10 transition-colors duration-500 ${activeTab === 'files' ? 'text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'text-white/30 group-hover:text-white/70'}`} />
          <span class="relative z-10 drop-shadow-md">Source Code</span>
        </button>
      {/if}
    </div>

    <!-- Body -->
    <div class="relative z-10 flex-1 overflow-hidden bg-[#030014]/40">
      {#if activeTab === "content"}
        <div class="absolute inset-0 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          {#if parsedDocs}
            <div class="markdown-content max-w-4xl mx-auto">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html parsedDocs}
            </div>
          {:else}
            <div class="flex flex-col items-center justify-center h-full text-white/30 gap-3">
              <Info class="h-8 w-8 opacity-20" />
              <p class="text-sm uppercase tracking-widest">No documentation available</p>
            </div>
          {/if}
        </div>
      {:else if activeTab === "files"}
        <div class="absolute inset-0 flex">
          <!-- Left Panel: File Explorer -->
          <div class="w-64 border-r border-white/5 bg-[#030014]/60 backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col">
            <div class="p-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div class="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <FolderTree class="h-3 w-3" /> Explorer
              </div>
              {#if versions && versions.versions.length > 1}
                <div class="relative">
                  <button 
                    onclick={() => showVersionDropdown = !showVersionDropdown}
                    class="flex items-center gap-2 bg-[#030014]/80 backdrop-blur-md border border-white/5 hover:border-goclaw-neon-purple/50 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-goclaw-neon-purple transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  >
                    <span>v{selectedVersion}{selectedVersion === versions.current ? ' (Cur)' : ''}</span>
                    <svg class="h-3 w-3 text-white/40 {showVersionDropdown ? 'rotate-180' : ''} transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  
                  {#if showVersionDropdown}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="fixed inset-0 z-40" onclick={() => showVersionDropdown = false}></div>
                    <div class="absolute top-full right-0 mt-2 w-32 bg-[#030014]/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div class="py-1">
                        {#each versions.versions as v}
                          <button 
                            onclick={() => { selectedVersion = v; showVersionDropdown = false; }}
                            class="w-full text-left px-4 py-2 text-[10px] font-mono text-white/60 hover:text-goclaw-neon-purple hover:bg-goclaw-neon-purple/10 transition-colors {selectedVersion === v ? 'bg-goclaw-neon-purple/5 text-goclaw-neon-purple font-bold' : ''}"
                          >
                            v{v}{v === versions.current ? ' (Current)' : ''}
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
            
            <div class="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {#if filesLoading}
                <div class="flex justify-center p-4"><div class="h-4 w-4 rounded-full border-2 border-goclaw-neon-purple border-t-transparent animate-spin"></div></div>
              {:else}
                <div class="space-y-0.5">
                  {#each files as f}
                    <button 
                      onclick={() => loadFileContent(f.path)}
                      class="w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors text-left {activePath === f.path ? 'bg-goclaw-neon-purple/10 text-goclaw-neon-purple' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}"
                    >
                      <FileCode2 class="h-3.5 w-3.5 shrink-0 {activePath === f.path ? 'text-goclaw-neon-purple' : 'text-white/30'}" />
                      <span class="text-xs font-mono truncate">{f.path}</span>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Right Panel: Code Viewer -->
          <div class="flex-1 flex flex-col bg-[#030014]/80 backdrop-blur-2xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] relative">
            {#if activePath}
              <div class="px-4 py-2 bg-[#030014]/60 backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border-b border-white/5 flex items-center gap-2 shadow-sm">
                <Terminal class="h-3.5 w-3.5 text-goclaw-neon-purple/50" />
                <span class="text-[10px] font-mono text-white/50 tracking-wider">{activePath}</span>
                {#if fileContent}
                   <span class="ml-auto text-[9px] font-mono text-white/20">{(fileContent.size / 1024).toFixed(1)} KB</span>
                {/if}
              </div>
              
              <div class="flex-1 overflow-auto relative custom-scrollbar p-4">
                {#if contentLoading}
                   <div class="absolute inset-0 flex items-center justify-center bg-transparent/20 backdrop-blur-[2px]">
                     <div class="h-6 w-6 rounded-full border-2 border-goclaw-neon-purple border-t-transparent animate-spin"></div>
                   </div>
                {/if}
                
                {#if fileContent}
                   <pre class="text-xs font-mono text-white/80 leading-relaxed"><code class="language-{getLang(activePath)}">{fileContent.content}</code></pre>
                {/if}
              </div>
            {:else}
              <div class="flex-1 flex flex-col items-center justify-center text-white/20 gap-3">
                <Code2 class="h-10 w-10 opacity-10" />
                <p class="text-xs uppercase tracking-widest font-bold">Select a file to view code</p>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

  </div>
</div>

<style>
  /* Advanced Cybernetic Markdown Styles */
  :global(.markdown-content) {
    line-height: 1.8;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 0.025em;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Twemoji Mozilla", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji";
  }
  
  :global(.markdown-content p) {
    margin-bottom: 1rem;
  }
  :global(.markdown-content p:last-child) {
    margin-bottom: 0;
  }

  :global(.markdown-content a) {
    color: #d946ef; /* goclaw-neon-purple */
    text-decoration: none;
    border-bottom: 1px solid rgba(217, 70, 239, 0.4);
    transition: all 0.2s;
  }
  :global(.markdown-content a:hover) {
    color: white;
    border-color: white;
  }

  :global(.markdown-content strong) {
    color: white;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  :global(.markdown-content ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
  :global(.markdown-content ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-bottom: 1rem;
  }
  :global(.markdown-content li) {
    margin-bottom: 0.5rem;
  }
  :global(.markdown-content li::marker) {
    color: #d946ef;
  }

  :global(.markdown-content pre) {
    background-color: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    padding: 1.25rem;
    overflow-x: auto;
    margin-bottom: 1.5rem;
    box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
  }

  :global(.markdown-content code) {
    color: #22d3ee; /* goclaw-neon-cyan */
    background-color: rgba(34, 211, 238, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 0.375rem;
    font-family: monospace;
    font-size: 0.85em;
  }
  
  :global(.markdown-content pre code) {
    color: inherit;
    background-color: transparent;
    padding: 0;
  }

  :global(.markdown-content h1), :global(.markdown-content h2), :global(.markdown-content h3) {
    color: white;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 2rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    padding-bottom: 0.5rem;
  }

  :global(.markdown-content blockquote) {
    border-left: 2px solid rgba(217, 70, 239, 0.5);
    background-color: rgba(217, 70, 239, 0.05);
    padding: 0.5rem 1.25rem;
    border-radius: 0 0.5rem 0.5rem 0;
    font-style: normal;
    margin-bottom: 1.5rem;
    color: rgba(255, 255, 255, 0.7);
  }
</style>
