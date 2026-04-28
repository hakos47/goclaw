<script lang="ts">
  import { ShieldAlert, DatabaseBackup, UploadCloud, Users, ServerCrash } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { authState } from "$lib/state/auth.svelte";
  
  import SystemBackupPanel from "./panels/SystemBackupPanel.svelte";
  import SystemRestorePanel from "./panels/SystemRestorePanel.svelte";
  import S3ConfigPanel from "./panels/S3ConfigPanel.svelte";
  import TenantBackupPanel from "./panels/TenantBackupPanel.svelte";

  let activeTab = $state("system-backup");

  let tabs = $derived([
    { id: "system-backup", label: $_("backup.tabs.systemBackup"), icon: DatabaseBackup },
    { id: "system-restore", label: $_("backup.tabs.systemRestore"), icon: ServerCrash },
    { id: "s3-config", label: $_("backup.tabs.s3Config"), icon: UploadCloud },
    ...(authState.isOwner ? [{ id: "tenant-backup", label: $_("backup.tabs.tenantBackup"), icon: Users }] : [])
  ]);
</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 overflow-hidden">
  
  <div class="flex flex-col lg:flex-row gap-6 lg:gap-10 h-full">
    
    <!-- Left Sidebar / Header / Tabs -->
    <div class="w-full lg:w-80 flex flex-col shrink-0 space-y-6">
      
      <!-- Module Header -->
      <div class="relative p-6 rounded-[2rem] border border-indigo-500/20 bg-[#050010]/80 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(99,102,241,0.05)] overflow-hidden shrink-0">
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>

        <div class="flex items-center gap-4 relative z-10 mb-4">
          <div class="h-12 w-12 rounded-2xl bg-black/60 border border-indigo-500/20 flex items-center justify-center shadow-inner relative overflow-hidden group">
            <div class="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <ShieldAlert class="h-5 w-5 text-indigo-400 transition-transform group-hover:scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>
          <div>
            <h1 class="text-xl font-black tracking-widest text-white uppercase drop-shadow-md">
              {$_("backup.title")}
            </h1>
          </div>
        </div>
        
        <p class="text-[10px] font-black uppercase tracking-[0.1em] text-white/50 leading-relaxed relative z-10">
          {$_("backup.description")}
        </p>
      </div>

      <!-- Tab Navigation -->
      <div class="flex flex-col gap-2 relative z-10 flex-1">
        {#each tabs as tab}
          <button 
            class="flex items-center gap-3 px-5 py-4 rounded-2xl border font-bold text-[10px] uppercase tracking-widest transition-all w-full text-left {activeTab === tab.id ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)] translate-x-2' : 'bg-black/40 border-white/5 text-white/50 hover:bg-white/5 hover:text-white/80 hover:border-white/20 hover:translate-x-1'}"
            onclick={() => activeTab = tab.id}
          >
            <tab.icon class="h-4 w-4 shrink-0" />
            <span class="truncate">{tab.label}</span>
            
            {#if activeTab === tab.id}
              <div class="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
            {/if}
          </button>
        {/each}
      </div>

    </div>

    <!-- Right Content Area -->
    <div class="flex-1 min-w-0 flex flex-col relative rounded-[2rem] border border-white/5 bg-[#050505] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
      
      <div class="flex-1 overflow-y-auto scroller-no-scrollbar p-6 sm:p-8 lg:p-10 relative">
        <div class="max-w-[1200px] w-full">
          {#if activeTab === "system-backup"}
            <div class="animate-in fade-in slide-in-from-right-4 duration-500">
              <SystemBackupPanel />
            </div>
          {:else if activeTab === "system-restore"}
            <div class="animate-in fade-in slide-in-from-right-4 duration-500">
              <SystemRestorePanel />
            </div>
          {:else if activeTab === "s3-config"}
            <div class="animate-in fade-in slide-in-from-right-4 duration-500">
              <S3ConfigPanel />
            </div>
          {:else if activeTab === "tenant-backup"}
            <div class="animate-in fade-in slide-in-from-right-4 duration-500">
              <TenantBackupPanel />
            </div>
          {/if}
        </div>
      </div>
    </div>

  </div>
</div>
