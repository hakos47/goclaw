<script lang="ts">
  import { Upload, X, Package, CheckCircle2, XCircle, Loader2, TriangleAlert } from "lucide-svelte";
  import { resolveUploadSkills } from "../../lib/resolve-upload-skills";
  import { createSkillSubZip } from "../../lib/create-skill-sub-zip";
  import JSZip from "jszip";
  import type { FileEntry, SkillEntry, SkillStatus } from "../../lib/skill-upload-types";
  import type { SkillUploadResponse } from "../../hooks/use-skills.svelte";

  let { open = false, onOpenChange, onUpload } = $props<{
    open?: boolean;
    onOpenChange: (open: boolean) => void;
    onUpload: (file: File) => Promise<SkillUploadResponse>;
  }>();

  let entries = $state<FileEntry[]>([]);
  let uploading = $state(false);
  let dragging = $state(false);
  let done = $state(false);
  let fileInput: HTMLInputElement;

  function uniqueId() {
    return crypto.randomUUID();
  }

  async function addFiles(fileList: FileList) {
    const newFiles = Array.from(fileList);
    const existingNames = new Set(entries.map(e => e.file.name));
    const fresh = newFiles.filter(f => !existingNames.has(f.name));
    if (fresh.length === 0) return;

    const pending: FileEntry[] = fresh.map(f => ({
      id: uniqueId(),
      file: f,
      skills: [{ id: uniqueId(), dir: "", status: "validating" as const }]
    }));
    entries = [...entries, ...pending];

    // Validate concurrently
    const results = await Promise.all(
      pending.map(async (entry) => {
        const resolved = await resolveUploadSkills(entry.file);
        return {
          id: entry.id,
          skills: resolved.map(s => ({ id: uniqueId(), ...s }))
        };
      })
    );

    entries = entries.map(e => {
      const match = results.find(r => r.id === e.id);
      return match ? { ...e, skills: match.skills } : e;
    });
  }

  function removeEntry(id: string) {
    entries = entries.filter(e => e.id !== id);
  }

  async function handleSubmit() {
    const actionable = entries.flatMap(e => 
      e.skills.filter(s => s.status === "valid").map(s => ({ fileEntry: e, skill: s }))
    );
    if (actionable.length === 0) return;

    uploading = true;
    const parsedZips = new Map<string, JSZip>();

    for (const { fileEntry, skill } of actionable) {
      entries = entries.map(e => 
        e.id === fileEntry.id 
          ? { ...e, skills: e.skills.map(s => s.id === skill.id ? { ...s, status: "uploading" } : s) }
          : e
      );

      try {
        let uploadFile: File;
        if (skill.dir && fileEntry.skills.length > 1) {
          if (!parsedZips.has(fileEntry.id)) {
            parsedZips.set(fileEntry.id, await JSZip.loadAsync(fileEntry.file));
          }
          uploadFile = await createSkillSubZip(parsedZips.get(fileEntry.id)!, skill.dir);
        } else {
          uploadFile = fileEntry.file;
        }

        const result = await onUpload(uploadFile);

        if (result.status === "unchanged") {
          entries = entries.map(e => 
            e.id === fileEntry.id 
              ? { ...e, skills: e.skills.map(s => s.id === skill.id ? { ...s, status: "unchanged" } : s) }
              : e
          );
          continue;
        }

        const depDetail = result.deps_warning 
          ? (result.deps_errors?.length ? `${result.deps_warning}: ${result.deps_errors.join("; ")}` : result.deps_warning)
          : undefined;

        entries = entries.map(e => 
          e.id === fileEntry.id
            ? { ...e, skills: e.skills.map(s => s.id === skill.id ? { ...s, status: result.deps_warning ? "warning" : "success", error: depDetail } : s) }
            : e
        );
      } catch (err: any) {
        entries = entries.map(e => 
          e.id === fileEntry.id
            ? { ...e, skills: e.skills.map(s => s.id === skill.id ? { ...s, status: "error", error: err.message || "Upload failed" } : s) }
            : e
        );
      }
    }

    uploading = false;
    done = true;
  }

  function handleClose() {
    if (uploading) return;
    entries = [];
    dragging = false;
    done = false;
    onOpenChange(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer?.files.length) addFiles(e.dataTransfer.files);
  }

  function handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) addFiles(target.files);
    if (fileInput) fileInput.value = "";
  }

  const allSkills = $derived(entries.flatMap(e => e.skills));
  const actionableCount = $derived(allSkills.filter(s => s.status === "valid").length);
</script>

{#if open}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#030014]/80 backdrop-blur-3xl animate-in fade-in duration-500" onclick={(e) => e.target === e.currentTarget && handleClose()}>
  <div class="relative w-full max-w-2xl bg-[#050505]/90 border border-white/5 shadow-[0_0_100px_rgba(0,0,0,1),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
    
    <!-- Scanlines & Background Effects -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
    <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-goclaw-neon-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>

    <!-- Header -->
    <div class="relative z-10 flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md">
      <div class="flex items-center gap-4">
         <div class="h-14 w-14 rounded-2xl bg-[#030014] border border-white/10 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_20px_rgba(217,70,239,0.2)] overflow-hidden relative">
           <div class="absolute inset-0 bg-goclaw-neon-purple/10"></div>
           <Package class="h-7 w-7 text-goclaw-neon-purple drop-shadow-[0_0_10px_rgba(217,70,239,0.5)] relative z-10" />
         </div>
         <div>
           <h2 class="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">Upload Skills</h2>
           <p class="text-[10px] text-goclaw-neon-purple font-bold uppercase tracking-[0.4em] mt-1 ml-0.5 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">DEPLOY .ZIP PAYLOADS</p>
         </div>
      </div>
      <button onclick={handleClose} class="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#030014]/50 border border-white/5 hover:bg-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all duration-300 shadow-inner group">
        <X class="h-6 w-6 group-hover:rotate-90 transition-transform" />
      </button>
    </div>

    <!-- Content -->
    <div class="relative z-10 p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
        
        {#if !uploading && !done}
          <!-- Dropzone -->
          <button
            type="button"
            class="relative w-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 p-10 transition-all duration-300 overflow-hidden group {dragging ? 'bg-goclaw-neon-purple/10 border-goclaw-neon-purple/30 shadow-[0_0_30px_rgba(217,70,239,0.15)] scale-[1.02]' : 'bg-[#0a0a0a]/50 hover:bg-white/[0.02] hover:border-white/10'}"
            onclick={() => fileInput.click()}
            ondragover={(e) => { e.preventDefault(); dragging = true; }}
            ondragenter={(e) => { e.preventDefault(); dragging = true; }}
            ondragleave={() => dragging = false}
            ondrop={handleDrop}
          >
            <!-- Background glow -->
            <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,70,239,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div class="relative z-10 h-16 w-16 rounded-full bg-[#030014]/80 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center justify-center transition-transform duration-500 {dragging ? 'animate-bounce border-goclaw-neon-purple/50 shadow-[0_0_20px_rgba(217,70,239,0.3)]' : 'group-hover:scale-110'}">
              <Upload class="h-8 w-8 text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" strokeWidth={1.5} />
            </div>
            <div class="relative z-10 flex flex-col items-center gap-1">
              <p class="text-[11px] font-black text-white uppercase tracking-[0.2em] drop-shadow-md">
                {dragging ? 'Drop payload to scan...' : 'Click or Drop .zip payload'}
              </p>
              <p class="text-[9px] font-mono text-white/30 tracking-widest">
                AUTOMATIC SKILL VALIDATION
              </p>
            </div>
          </button>
          <input bind:this={fileInput} type="file" accept=".zip" multiple class="hidden" onchange={handleInputChange} />
        {/if}

        {#if entries.length > 0}
          <div class="space-y-3">
            {#each entries as entry (entry.id)}
              {@const isMulti = entry.skills.length > 1}
              {@const sizeKB = (entry.file.size / 1024).toFixed(1)}
              
              {#if !isMulti}
                {@const skill = entry.skills[0]}
                <div class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] backdrop-blur-sm border border-white/5">
                  <div class="h-8 w-8 rounded bg-white/5 flex items-center justify-center">
                    {@render statusIcon(skill.status)}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-white/80 truncate uppercase">{skill.name || entry.file.name}</span>
                      {@render skillBadge(skill.status)}
                    </div>
                    <span class="text-[10px] font-mono text-white/30">{sizeKB} KB</span>
                  </div>
                  {#if !uploading && skill.status !== 'success'}
                    <button onclick={() => removeEntry(entry.id)} class="h-6 w-6 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 flex items-center justify-center transition-colors">
                      <X class="h-4 w-4" />
                    </button>
                  {/if}
                </div>
              {:else}
                <div class="rounded-xl border border-white/5 overflow-hidden bg-white/[0.02] backdrop-blur-sm">
                  <div class="flex items-center gap-2 bg-white/[0.02] px-3 py-2 text-xs">
                    <Package class="h-4 w-4 text-white/30" />
                    <span class="flex-1 truncate font-mono text-white/60">{entry.file.name}</span>
                    <span class="text-[10px] font-mono text-white/30">{sizeKB} KB</span>
                    {#if !uploading}
                      <button onclick={() => removeEntry(entry.id)} class="h-6 w-6 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 flex items-center justify-center transition-colors">
                        <X class="h-4 w-4" />
                      </button>
                    {/if}
                  </div>
                  <div class="divide-y divide-white/5 pl-8">
                    {#each entry.skills as skill}
                      <div class="flex items-center gap-3 p-2">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            {@render statusIcon(skill.status)}
                            <span class="text-xs font-bold text-white/70 truncate">{skill.name || skill.dir || skill.slug || "..."}</span>
                            {@render skillBadge(skill.status)}
                          </div>
                          {#if skill.error}
                            <p class="text-[10px] text-red-400 mt-1 truncate pl-6">{skill.error}</p>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        {/if}

      </div>

      <!-- Footer -->
      <div class="relative z-10 p-6 border-t border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-between">
        <span class="text-[10px] uppercase font-mono tracking-[0.2em] text-white/30 font-bold">
          {#if entries.length > 0 && !done && !uploading}
            {actionableCount} VALID SKILLS READY
          {/if}
        </span>
        <div class="flex items-center gap-4">
          <button 
            onclick={handleClose} 
            disabled={uploading}
            class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105 disabled:opacity-30 disabled:pointer-events-none"
          >
            <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
            <span class="relative z-10 drop-shadow-md">{done ? 'Close' : 'Cancel'}</span>
          </button>
          {#if !done}
            <button 
              onclick={handleSubmit} 
              disabled={actionableCount === 0 || uploading}
              class="relative flex items-center justify-center gap-2 px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105 disabled:opacity-30 disabled:pointer-events-none"
            >
              <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
              
              {#if uploading}
                <Loader2 class="h-3.5 w-3.5 relative z-10 text-goclaw-neon-purple animate-spin" />
                <span class="relative z-10 drop-shadow-md">Processing</span>
              {:else}
                <Upload class="h-3.5 w-3.5 relative z-10 text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
                <span class="relative z-10 drop-shadow-md">Upload {actionableCount}</span>
              {/if}
            </button>
          {/if}
        </div>
      </div>

    </div>
  </div>
{/if}

{#snippet statusIcon(status: SkillStatus)}
  {#if status === "validating" || status === "uploading"}
    <Loader2 class="h-3.5 w-3.5 animate-spin text-goclaw-neon-purple" />
  {:else if status === "valid"}
    <CheckCircle2 class="h-3.5 w-3.5 text-goclaw-neon-purple" />
  {:else if status === "unchanged"}
    <CheckCircle2 class="h-3.5 w-3.5 text-white/20" />
  {:else if status === "success"}
    <CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
  {:else if status === "warning"}
    <TriangleAlert class="h-3.5 w-3.5 text-pink-500" />
  {:else}
    <XCircle class="h-3.5 w-3.5 text-red-500" />
  {/if}
{/snippet}

{#snippet skillBadge(status: SkillStatus)}
  {#if status === "valid"}
    <span class="px-1.5 py-0.5 rounded bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 text-[8px] font-black uppercase tracking-widest text-goclaw-neon-purple">NEW</span>
  {:else if status === "unchanged"}
    <span class="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-white/30">UNCHANGED</span>
  {:else if status === "error" || status === "invalid"}
    <span class="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-[8px] font-black uppercase tracking-widest text-red-400">FAILED</span>
  {/if}
{/snippet}
