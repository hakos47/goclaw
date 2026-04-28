<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import { Shield, Plus, Loader2, Trash2, FolderOpen, RefreshCw } from "lucide-svelte";
  import { useConfigPermissions } from "../../hooks/use-config-permissions.svelte";
  import { useAgentHeartbeat } from "../../hooks/use-agent-heartbeat.svelte";
  import UserPickerCombobox from "./UserPickerCombobox.svelte";
  import Combobox from "../../../../lib/components/ui/Combobox.svelte";

  type Props = {
    agentId: string;
  };

  let { agentId }: Props = $props();

  let perms = $derived(useConfigPermissions(agentId));
  let hb = $derived(useAgentHeartbeat(agentId));

  let userId = $state("");
  let configType = $state("file_writer");
  let scope = $state("group:*");
  let permission = $state("allow");
  let adding = $state(false);

  const CONFIG_TYPES = [
    { value: "file_writer", label: "File Writer", desc: "Controls who can edit files and manage cron in group chats. First user auto-added." },
    { value: "heartbeat", label: "Heartbeat", desc: "Controls who can configure or trigger heartbeats for this scope." },
    { value: "cron", label: "Cron", desc: "Controls who can manage cron schedules." },
    { value: "context_files", label: "Context Files", desc: "Controls who can modify context memories." },
    { value: "*", label: "All (*)", desc: "Full permissions across configurations." },
  ];

  let currentDesc = $derived(CONFIG_TYPES.find(c => c.value === configType)?.desc || "");

  let scopeOptions = $derived.by(() => {
    let opts = [];
    if (configType !== "file_writer") {
        opts.push({ value: "agent", label: "Agent (DM)" });
    }
    opts.push({ value: "group:*", label: "All Groups" });
    
    // Attempt to extract targets from heartbeat hook if loaded
    // This is optional functionality
    opts.push({ value: "*", label: "Global (*)" });
    return opts;
  });

  let permissionOptions = [
    { value: "allow", label: "Allow" },
    { value: "deny", label: "Deny" }
  ];

  $effect(() => {
    if (configType === "file_writer") {
        scope = "group:*";
    } else {
        scope = "agent";
    }
  });

  onMount(() => {
    if (agentId) {
        perms.load();
        hb.refresh();
    }
  });

  async function handleAdd() {
    const trimmed = userId.trim();
    if (!trimmed) return;
    adding = true;
    await perms.grant(scope, configType, trimmed, permission);
    userId = "";
    adding = false;
  }

  // Derived partitions
  let fileWriters = $derived(perms.permissions.filter(p => p.configType === "file_writer"));
  let otherPerms = $derived(perms.permissions.filter(p => p.configType !== "file_writer"));

  let fileWritersByScope = $derived.by(() => {
     const map = new Map<string, typeof fileWriters>();
     for (const p of fileWriters) {
         const list = map.get(p.scope) || [];
         list.push(p);
         map.set(p.scope, list);
     }
     return map;
  });

</script>

<div class="relative z-20 group p-6 rounded-3xl bg-gradient-to-br from-[#030014]/80 to-[#1a0033]/40 backdrop-blur-3xl border border-white/5 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_30px_rgba(16,185,129,0.1),0_0_40px_rgba(16,185,129,0.2)] hover:border-emerald-500/30 mt-6">
  <!-- Ambient Neon Corner Glows -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

  <!-- Animated cyber background grid mask -->
  <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none mix-blend-screen">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] opacity-80"></div>
  </div>

  <!-- Header -->
  <div class="relative z-10 flex items-center justify-between border-b border-white/10 pb-6 mb-6">
    <div class="flex items-center gap-3">
      <div class="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
        <Shield class="h-4 w-4 text-amber-500 animate-[pulse_3s_ease-in-out_infinite]" />
      </div>
      <div>
        <h3 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm">Permissions</h3>
        <p class="text-[10px] text-white/40 mt-1">Control who can modify agent config and files. Owner always has full access.</p>
      </div>
    </div>
    <button
      class="h-9 px-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] text-white/90 transition-colors text-[10px] font-bold uppercase tracking-widest shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
      onclick={() => perms.load()}
      disabled={perms.loading}
    >
      {#if perms.loading}
        <Loader2 class="h-3 w-3 animate-spin" />
      {:else}
        <RefreshCw class="h-3 w-3" />
      {/if}
      Sync
    </button>
  </div>

  <!-- Add Rule Form -->
  <div class="space-y-4 mt-6 p-6 rounded-3xl bg-[#030014]/40 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-50">
    <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] items-end gap-4 relative">
      <!-- User Input -->
      <div class="min-w-[200px] z-50 relative group/input">
        <label class="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 pl-1">Target User</label>
        <div class="relative">
          <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-emerald-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(16,185,129,0.3),0_0_15px_rgba(16,185,129,0.2)]"></div>
          <UserPickerCombobox 
             bind:value={userId} 
             placeholder="Search contacts or type ID..." 
          />
        </div>
      </div>

      <!-- Config Type Select -->
      <div class="w-[180px] z-40 relative group/select">
        <label class="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 pl-1">Config Type</label>
        <div class="relative">
          <Combobox
            value={configType}
            onChange={(val) => configType = val}
            options={CONFIG_TYPES}
            allowCustom={false}
          />
        </div>
      </div>

      <!-- Scope Select -->
      <div class="w-[160px] z-30 relative group/select">
        <label class="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 pl-1">Scope</label>
        <div class="relative">
          <Combobox
            value={scope}
            onChange={(val) => scope = val}
            options={scopeOptions}
            allowCustom={false}
          />
        </div>
      </div>

      <!-- Permission Type -->
      <div class="w-[110px] z-20 relative group/select">
        <label class="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 pl-1">Rule</label>
        <div class="relative">
          <Combobox
            value={permission}
            onChange={(val) => permission = val}
            options={permissionOptions}
            allowCustom={false}
          />
        </div>
      </div>

      <!-- Submit Button -->
      <button 
        onclick={handleAdd}
        disabled={adding || !userId.trim()}
        class="h-11 px-6 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-400 relative overflow-hidden group"
      >
        <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
        {#if adding}
           <Loader2 class="h-4 w-4 animate-spin relative z-10" />
        {:else}
           <Plus class="h-4 w-4 relative z-10" strokeWidth={3} />
           <span class="relative z-10">Add</span>
        {/if}
      </button>
    </div>
    
    {#if currentDesc}
       <p class="text-[11px] font-mono text-white/30 mt-4 px-2">{currentDesc}</p>
    {/if}
  </div>

  <!-- Rules List -->
  <div class="mt-6 relative z-10">
     {#if perms.loading && perms.permissions.length === 0}
        <div class="flex items-center justify-center py-12">
            <Loader2 class="h-6 w-6 animate-spin text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
        </div>
     {:else if perms.permissions.length === 0}
        <div class="text-[10px] uppercase tracking-widest text-white/30 text-center py-12 font-bold bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
            No permission rules. Owner has implicit full access.
        </div>
     {:else}
        <div class="space-y-6">
            <!-- File Writers section -->
            {#if fileWriters.length > 0}
                <div class="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                   <p class="text-[11px] font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <FolderOpen class="h-4 w-4 text-emerald-500" />
                     File Writers ({fileWriters.length})
                   </p>
                   <div class="rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5 bg-[#030014]/60 backdrop-blur-xl">
                      {#each [...fileWritersByScope.entries()] as [scopeKey, writers]}
                         <div>
                            <div class="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03]">
                                <span class="text-[10px] font-black text-white/70 tracking-widest uppercase">{scopeKey}</span>
                            </div>
                            {#each writers as p}
                               <div class="flex items-center justify-between gap-2 px-4 py-3 pl-8 hover:bg-white/[0.05] transition-colors">
                                  <div class="flex items-center gap-4 min-w-0">
                                     <span class={`text-[9px] uppercase font-black tracking-widest px-2 py-1 rounded-md ${p.permission === 'allow' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                        {p.permission}
                                     </span>
                                     <span class="font-bold text-white text-sm truncate max-w-[200px]">{p.userId}</span>
                                     {#if p.metadata?.username}
                                        <span class="text-xs text-white/40 shrink-0 font-mono">@{p.metadata.username}</span>
                                     {/if}
                                  </div>
                                  <button 
                                     onclick={() => perms.revoke(p.scope, p.configType, p.userId)}
                                     class="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-white/30 hover:text-red-400 transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]"
                                  >
                                      <Trash2 class="h-4 w-4" />
                                  </button>
                               </div>
                            {/each}
                         </div>
                      {/each}
                   </div>
                </div>
            {/if}

            <!-- Config Perms section -->
            {#if otherPerms.length > 0}
                <div class="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                   <p class="text-[11px] font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Shield class="h-4 w-4 text-amber-500" />
                     Configuration Privileges ({otherPerms.length})
                   </p>
                   <div class="rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5 bg-[#030014]/60 backdrop-blur-xl">
                     {#each otherPerms as p}
                        <div class="flex items-center justify-between gap-2 px-4 py-3 hover:bg-white/[0.05] transition-colors">
                           <div class="flex items-center gap-4 min-w-0">
                               <span class={`text-[9px] uppercase font-black tracking-widest px-2 py-1 rounded-md ${p.permission === 'allow' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                  {p.permission}
                               </span>
                               <span class="font-bold text-white text-sm max-w-[200px] truncate">{p.userId}</span>
                               <span class="text-[9px] text-amber-400/80 font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">{p.configType}</span>
                               <span class="text-[10px] text-white/30 font-mono tracking-widest uppercase">@ {p.scope}</span>
                           </div>
                           <button 
                              onclick={() => perms.revoke(p.scope, p.configType, p.userId)}
                              class="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-white/30 hover:text-red-400 transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]"
                           >
                               <Trash2 class="h-4 w-4" />
                           </button>
                        </div>
                     {/each}
                   </div>
                </div>
            {/if}
        </div>
     {/if}
  </div>
</div>
