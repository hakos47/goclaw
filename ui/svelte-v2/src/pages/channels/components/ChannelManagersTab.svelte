<script lang="ts">
  import { onMount } from "svelte";
  import { 
    Users, Trash2, Loader2, RefreshCw, 
    ChevronDown, ChevronRight, Plus, Hash, User, UserPlus
  } from "lucide-svelte";
  import { useChannels, type GroupManagerGroupInfo, type GroupManagerData } from "../hooks/use-channels.svelte";
  import { _ } from "svelte-i18n";

  type Props = {
    instanceId: string;
  };

  let { instanceId }: Props = $props();

  const channels = useChannels();
  
  let groups = $state<GroupManagerGroupInfo[]>([]);
  let loadingGroups = $state(true);
  let expanded = $state<Record<string, boolean>>({});
  let managersMap = $state<Record<string, GroupManagerData[]>>({});
  let loadingMap = $state<Record<string, boolean>>({});

  // Inline add form state
  let newGroupId = $state("");
  let newUserId = $state("");
  let newDisplayName = $state("");
  let adding = $state(false);

  onMount(() => {
    refreshGroups();
  });

  async function refreshGroups() {
    loadingGroups = true;
    try {
      groups = await channels.listManagerGroups(instanceId);
    } catch (e) {
      console.error("Failed to load manager groups", e);
    } finally {
      loadingGroups = false;
    }
  }

  async function loadManagersForGroup(groupId: string) {
    loadingMap[groupId] = true;
    try {
      const w = await channels.listManagers(instanceId, groupId);
      managersMap[groupId] = w;
    } catch (e) {
      console.error("Failed to load managers", e);
      managersMap[groupId] = [];
    } finally {
      loadingMap[groupId] = false;
    }
  }

  function toggleGroup(groupId: string) {
    const isOpen = !expanded[groupId];
    expanded[groupId] = isOpen;
    if (isOpen && !managersMap[groupId]) {
      loadManagersForGroup(groupId);
    }
  }

  async function handleRemoveManager(groupId: string, userId: string) {
    if (confirm("Remove this manager?")) {
      try {
        await channels.removeManager(instanceId, groupId, userId);
        managersMap[groupId] = (managersMap[groupId] || []).filter(m => m.user_id !== userId);
        await refreshGroups();
      } catch (e) {
        console.error("Failed to remove manager", e);
      }
    }
  }

  async function handleAddManager(groupId: string) {
    if (!newUserId) return;
    adding = true;
    try {
      await channels.addManager(instanceId, groupId, newUserId, newDisplayName);
      newUserId = "";
      newDisplayName = "";
      await loadManagersForGroup(groupId);
      await refreshGroups();
    } catch (e) {
      console.error("Failed to add manager", e);
    } finally {
      adding = false;
    }
  }

  function shortGroupId(id: string): string {
    const m = id.match(/^group:[^:]+:(.+)$/);
    return m?.[1] ?? id;
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Users class="w-4 h-4 text-goclaw-neon-purple" />
      <h3 class="text-sm font-bold text-white/90">Identity Managers</h3>
      {#if groups.length > 0}
        <span class="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/40">
          {groups.length}
        </span>
      {/if}
    </div>
    <button 
      onclick={refreshGroups}
      disabled={loadingGroups}
      class="p-2 rounded-xl hover:bg-white/5 text-white/40 transition-all disabled:opacity-50"
    >
      <RefreshCw class={`w-4 h-4 ${loadingGroups ? 'animate-spin' : ''}`} />
    </button>
  </div>

  <p class="text-xs text-white/40 leading-relaxed max-w-xl font-mono uppercase tracking-widest">
    Configure external identities (UIDs) allowed to manage or act as this channel's owner.
  </p>

  {#if groups.length === 0 && !loadingGroups}
    <div class="py-12 flex flex-col items-center justify-center text-center bg-black/40 border border-white/5 rounded-[2rem] shadow-2xl">
      <div class="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Users class="w-8 h-8 text-white/10" />
      </div>
      <h3 class="text-xs font-bold text-white/60 uppercase tracking-widest">No Managed Groups</h3>
      <p class="text-[10px] text-white/20 mt-2 uppercase tracking-widest">Add a group ID below to start managing members.</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each groups as g (g.group_id)}
        {@const isOpen = expanded[g.group_id]}
        {@const groupManagers = managersMap[g.group_id] || []}
        {@const isLoading = loadingMap[g.group_id]}

        <div class="rounded-2xl border border-white/10 overflow-hidden bg-[#030014]/40 shadow-xl transition-all duration-500">
          <button
            onclick={() => toggleGroup(g.group_id)}
            class="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-white/5 transition-all"
          >
            {#if isOpen}
              <ChevronDown class="w-4 h-4 text-goclaw-neon-purple" />
            {:else}
              <ChevronRight class="w-4 h-4 text-white/20" />
            {/if}
            <div class="flex-1 flex items-baseline gap-3">
              <span class="font-mono text-sm text-white/90">{shortGroupId(g.group_id)}</span>
              <span class="text-[10px] font-mono text-white/20 uppercase truncate">{g.group_id}</span>
            </div>
            <span class="px-2 py-0.5 rounded-lg bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/20 text-[10px] font-black text-goclaw-neon-purple uppercase">
              {g.writer_count} Managers
            </span>
          </button>

          {#if isOpen}
            <div class="px-6 pb-6 pt-2 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
              {#if isLoading}
                <div class="flex items-center justify-center py-8">
                  <Loader2 class="w-6 h-6 animate-spin text-goclaw-neon-purple/40" />
                </div>
              {:else}
                <div class="grid gap-2">
                  {#each groupManagers as m}
                    <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 group/row">
                      <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-[#030014] border border-white/10">
                          <User class="w-3.5 h-3.5 text-white/30" />
                        </div>
                        <div class="flex flex-col">
                          <span class="text-xs font-bold text-white/80">{m.display_name || 'Unnamed Manager'}</span>
                          <span class="text-[9px] font-mono text-white/30 uppercase">{m.user_id} {m.username ? `(@${m.username})` : ''}</span>
                        </div>
                      </div>
                      <button 
                        onclick={() => handleRemoveManager(g.group_id, m.user_id)}
                        class="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all opacity-0 group-hover/row:opacity-100"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  {/each}

                  {#if groupManagers.length === 0}
                    <p class="text-[10px] text-white/20 py-4 text-center uppercase tracking-widest">No individual managers defined.</p>
                  {/if}
                </div>
              {/if}

              <!-- Add to existing group -->
              <div class="flex gap-2 pt-2 border-t border-white/5">
                <div class="flex-1 grid grid-cols-2 gap-2">
                  <input 
                    type="text" 
                    bind:value={newUserId}
                    placeholder="User ID (e.g. phone/UID)"
                    class="bg-[#030014] border border-white/10 rounded-xl px-4 py-2 text-xs font-mono outline-none focus:border-goclaw-neon-purple/50 transition-all"
                  />
                  <input 
                    type="text" 
                    bind:value={newDisplayName}
                    placeholder="Display Name (optional)"
                    class="bg-[#030014] border border-white/10 rounded-xl px-4 py-2 text-xs font-mono outline-none focus:border-goclaw-neon-purple/50 transition-all"
                  />
                </div>
                <button 
                  onclick={() => handleAddManager(g.group_id)}
                  disabled={!newUserId || adding}
                  class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                >
                  {#if adding}
                    <Loader2 class="w-3.5 h-3.5 animate-spin" />
                  {:else}
                    <UserPlus class="w-3.5 h-3.5" />
                  {/if}
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Add new group form -->
  <div class="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-4">
    <div class="flex items-center gap-2 text-white/30 mb-2">
      <Plus class="w-3.5 h-3.5" />
      <span class="text-[10px] font-black uppercase tracking-widest">Add New Management Group</span>
    </div>
    <div class="flex gap-2">
      <input 
        type="text" 
        bind:value={newGroupId}
        placeholder="group:protocol:id"
        class="flex-1 bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-goclaw-neon-purple/50 transition-all text-white"
      />
      <button 
        onclick={async () => {
          if (!newGroupId) return;
          await handleAddManager(newGroupId);
          newGroupId = "";
        }}
        disabled={!newGroupId || adding}
        class="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 flex items-center gap-2"
      >
        Initialize
      </button>
    </div>
  </div>
</div>
