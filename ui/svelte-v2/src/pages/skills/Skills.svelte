<script lang="ts">
  import { Upload, Search, ShieldAlert, Cpu, CheckCircle2, AlertCircle, Wrench, RefreshCw, FolderOpen, Server, Zap, ScanSearch } from "lucide-svelte";
  import { useSkills, type SkillInfo } from "./hooks/use-skills.svelte";
  import { useRuntimes } from "./hooks/use-runtimes.svelte";
  import { authState } from "../../lib/state/auth.svelte";
  
  import PageHeader from "../../lib/components/shared/PageHeader.svelte";
  import EmptyState from "../../lib/components/shared/EmptyState.svelte";
  import SearchInput from "../../lib/components/shared/SearchInput.svelte";
  import Pagination from "../../lib/components/shared/Pagination.svelte";
  import ConfirmDialog from "../../lib/components/shared/ConfirmDialog.svelte";
  
  import SkillTableRow from "./components/SkillTableRow.svelte";
  import MissingDepsPanel from "./components/MissingDepsPanel.svelte";
  import SkillDetailDialog from "./components/dialogs/SkillDetailDialog.svelte";
  import SkillEditDialog from "./components/dialogs/SkillEditDialog.svelte";
  import SkillUploadDialog from "./components/dialogs/SkillUploadDialog.svelte";

  const MASTER_TENANT_ID = "0193a5b0-7000-7000-8000-000000000001";

  const skillsState = useSkills();
  const runtimesState = useRuntimes();

  let tab = $state<"core" | "custom">("core");
  let search = $state("");
  let selectedSkill = $state<(SkillInfo & { content: string }) | null>(null);
  let uploadOpen = $state(false);
  let editTarget = $state<SkillInfo | null>(null);
  let deleteTarget = $state<SkillInfo | null>(null);
  let deleteLoading = $state(false);
  let rescanning = $state(false);
  let toggling = $state<string | null>(null);

  // Pagination state
  let currentPage = $state(1);
  let pageSize = $state(10);

  const hasTenantScope = $derived(!!authState.tenantId && authState.tenantId !== MASTER_TENANT_ID);

  const coreSkills = $derived(skillsState.skills.filter(s => s.is_system));
  const customSkills = $derived(skillsState.skills.filter(s => !s.is_system));
  const tabSkills = $derived(tab === "core" ? coreSkills : customSkills);
  
  const allMissing = $derived([...new Set(tabSkills.flatMap(s => s.missing_deps ?? []))]);
  
  const filtered = $derived(tabSkills.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  ));

  const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)));
  const pageItems = $derived(filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize));

  $effect(() => {
    // Reset pagination when search or tab changes
    if (search !== undefined || tab !== undefined) {
      currentPage = 1;
    }
  });

  async function handleViewSkill(name: string) {
    const detail = await skillsState.getSkill(name);
    if (detail) selectedSkill = detail;
  }

  async function handleCycleVisibility(skill: SkillInfo) {
    if (!skill.id) return;
    const order = ["private", "internal", "public"] as const;
    const idx = order.indexOf(skill.visibility as any);
    const nextVis = order[(idx + 1) % order.length];
    await skillsState.updateSkill(skill.id, { visibility: nextVis });
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    deleteLoading = true;
    try {
      await skillsState.deleteSkill(deleteTarget.id);
      deleteTarget = null;
    } finally {
      deleteLoading = false;
    }
  }

  async function handleRescanDeps() {
    rescanning = true;
    try {
      await skillsState.rescanDeps();
    } finally {
      rescanning = false;
    }
  }

  async function handleToggle(skill: SkillInfo, enabled: boolean) {
    if (!skill.id) return;
    toggling = skill.id;
    try {
      await skillsState.toggleSkill(skill.id, enabled);
    } finally {
      toggling = null;
    }
  }

  async function handleSetTenantConfig(id: string, enabled: boolean) {
    toggling = id;
    try {
      await skillsState.setTenantConfig(id, enabled);
    } finally {
      toggling = null;
    }
  }

  async function handleDeleteTenantConfig(id: string) {
    toggling = id;
    try {
      await skillsState.deleteTenantConfig(id);
    } finally {
      toggling = null;
    }
  }

  async function handleSaveEdit(id: string, updates: Record<string, unknown>) {
    await skillsState.updateSkill(id, updates);
    editTarget = null;
  }
</script>

<div class="p-4 sm:p-6 pb-10 flex-1 flex flex-col max-w-7xl mx-auto w-full">
  
  <!-- Global Background Effects -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.05)_0%,transparent_50%)] pointer-events-none"></div>
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.05)_0%,transparent_50%)] pointer-events-none"></div>

  <!-- HUD Header -->
  <div class="relative bg-[#030014]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-64 h-64 bg-goclaw-neon-cyan/10 rounded-full blur-[80px] pointer-events-none"></div>
    
    <div class="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div class="flex items-start gap-5">
        <div class="relative hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-[#030014] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1)] group">
          <Wrench class="w-8 h-8 text-goclaw-neon-purple drop-shadow-[0_0_10px_rgba(217,70,239,0.8)] animate-pulse-slow" strokeWidth={1.5} />
        </div>
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-[9px] font-bold text-goclaw-neon-purple uppercase tracking-[0.3em] bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 px-2.5 py-0.5 rounded">System: Registry</span>
          </div>
          <h1 class="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/30 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Tool Registry
          </h1>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button 
          onclick={skillsState.refresh}
          disabled={skillsState.loading}
          class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105"
        >
          <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          <RefreshCw class="h-3.5 w-3.5 relative z-10 text-white/30 group-hover:text-white/70 transition-colors duration-500 {skillsState.loading ? 'animate-spin' : ''}" />
          <span class="relative z-10 drop-shadow-md">REFRESH</span>
        </button>

        <button 
          onclick={handleRescanDeps}
          disabled={rescanning}
          class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105 disabled:opacity-50"
        >
          <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          <ScanSearch class="h-3.5 w-3.5 relative z-10 text-white/30 group-hover:text-white/70 transition-colors duration-500 {rescanning ? 'animate-pulse text-goclaw-neon-purple' : ''}" />
          <span class="relative z-10 drop-shadow-md">RESCAN DEPS</span>
        </button>

        {#if tab === "custom"}
          <button 
            onclick={() => uploadOpen = true}
            class="relative flex items-center justify-center gap-2 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
            <Upload class="h-3.5 w-3.5 relative z-10 text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" strokeWidth={3} />
            <span class="relative z-10 drop-shadow-md">UPLOAD SKILL</span>
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="mt-8 flex flex-wrap items-center gap-3 relative z-20">
    <!-- Type Filter Tabs -->
    <div class="flex items-center gap-2 p-1.5 rounded-2xl bg-[#030014]/80 backdrop-blur-3xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-x-auto">
      {#each [
        { id: "core", label: `Core Infrastructure (${coreSkills.length})`, icon: Server },
        { id: "custom", label: `Custom Skills (${customSkills.length})`, icon: FolderOpen }
      ] as opt}
        {@const isActive = tab === opt.id}
        {@const Icon = opt.icon}
        <button 
          onclick={() => tab = opt.id as "core" | "custom"}
          class={`relative flex items-center justify-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group whitespace-nowrap ${isActive ? 'text-white shadow-[0_0_20px_rgba(217,70,239,0.3)]' : 'text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-105'}`}
        >
          {#if isActive}
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
          {:else}
            <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          {/if}
          <Icon class={`h-3.5 w-3.5 relative z-10 transition-colors duration-500 ${isActive ? 'text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'text-white/30 group-hover:text-white/70'}`} />
          <span class="relative z-10 drop-shadow-md">{opt.label}</span>
        </button>
      {/each}
    </div>

    <!-- Search Input -->
    <div class="max-w-sm w-full sm:w-auto relative group flex-1">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <Search class="h-4 w-4 text-white/40 group-focus-within:text-goclaw-neon-purple transition-colors" />
      </div>
      <input 
        type="text" 
        bind:value={search} 
        placeholder="SEARCH SKILLS BY NAME OR DESCRIPTION..." 
        class="block w-full sm:min-w-[300px] pl-10 pr-4 h-10 rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md text-xs font-semibold text-white placeholder-white/30 focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner uppercase tracking-widest"
      />
    </div>
  </div>

  <div class="mt-6 flex flex-col flex-1">
    
    <MissingDepsPanel 
      missing={allMissing} 
      onInstallItem={skillsState.installSingleDep} 
      runtimes={tab === "core" ? runtimesState.runtimes : undefined} 
    />

    <div class="mb-6">
      <SearchInput 
        bind:value={search} 
        placeholder="SEARCH SKILLS BY NAME OR DESCRIPTION..." 
      />
    </div>

    {#if skillsState.loading && skillsState.skills.length === 0}
      <div class="flex-1 flex items-center justify-center">
        <div class="h-8 w-8 rounded-full border-2 border-goclaw-neon-purple border-t-transparent animate-spin"></div>
      </div>
    {:else if filtered.length === 0}
      <div class="flex-1 rounded-3xl border border-white/5 bg-[#030014]/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
        <EmptyState 
          icon={Zap} 
          title={search ? "NO SKILLS MATCH" : "NO SKILLS FOUND"} 
          description={search ? "Try adjusting your search query." : "No skills are registered in this category."} 
        />
      </div>
    {:else}
      <div class="flex-1 rounded-3xl border border-white/5 bg-[#030014]/60 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col">
        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-white/5 bg-white/[0.02]">
                <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Tool Identity</th>
                <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Purpose / Details</th>
                {#if tab === "custom"}
                  <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Author</th>
                {/if}
                <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-white/40">System Status</th>
                {#if tab === "custom"}
                  <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-white/40">Access Scope</th>
                {/if}
                <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-white/40 text-right">Overrides & Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              {#each pageItems as skill (skill.id || skill.name)}
                <SkillTableRow 
                  {skill}
                  {tab}
                  {hasTenantScope}
                  toggling={toggling}
                  onView={handleViewSkill}
                  onEdit={(s) => editTarget = s}
                  onDelete={(s) => deleteTarget = s}
                  onToggle={handleToggle}
                  onCycleVisibility={handleCycleVisibility}
                  onSetTenantConfig={handleSetTenantConfig}
                  onDeleteTenantConfig={handleDeleteTenantConfig}
                />
              {/each}
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="p-4 border-t border-white/5 bg-[#030014]/80 flex items-center justify-between">
          <span class="text-[10px] font-mono text-white/40 tracking-widest uppercase">
            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} Skills
          </span>
          <div class="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onclick={() => currentPage--}
              class="inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none border border-white/10 bg-white/5 hover:bg-white/10 text-white h-8 px-3 disabled:opacity-30 disabled:pointer-events-none"
            >
              Prev
            </button>
            <div class="inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-white/10 bg-transparent text-white/80 h-8 px-4 font-mono">
              {currentPage} / {totalPages}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onclick={() => currentPage++}
              class="inline-flex items-center justify-center rounded-lg text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline-none border border-white/10 bg-white/5 hover:bg-white/10 text-white h-8 px-3 disabled:opacity-30 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if selectedSkill}
  <SkillDetailDialog 
    skill={selectedSkill}
    onClose={() => selectedSkill = null}
    getSkillVersions={skillsState.getSkillVersions}
    getSkillFiles={skillsState.getSkillFiles}
    getSkillFileContent={skillsState.getSkillFileContent}
  />
{/if}

{#if editTarget}
  <SkillEditDialog 
    skill={editTarget}
    onClose={() => editTarget = null}
    onSave={handleSaveEdit}
  />
{/if}

<SkillUploadDialog 
  open={uploadOpen}
  onOpenChange={(v) => uploadOpen = v}
  onUpload={skillsState.uploadSkill}
/>

<ConfirmDialog 
  open={!!deleteTarget}
  title="Purge Skill Registry"
  message={`Are you sure you want to permanently delete the skill "${deleteTarget?.name}"? This will physically remove the files and unregister it from all active agents.`}
  confirmLabel="Purge Skill"
  confirmInput={deleteTarget?.name}
  isDestructive={true}
  loading={deleteLoading}
  onConfirm={handleDelete}
  onCancel={() => deleteTarget = null}
/>
