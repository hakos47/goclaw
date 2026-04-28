<script lang="ts">
  import { onMount } from "svelte";
  import { 
    Users, Trash2, Plus, ChevronDown, ChevronRight, 
    Hash, Globe, Info, Save, Loader2 
  } from "lucide-svelte";
  import { useChannels, type GroupManagerGroupInfo } from "../hooks/use-channels.svelte";
  import { _ } from "svelte-i18n";
  import ChannelFields from "./ChannelFields.svelte";

  type Props = {
    instanceId: string;
    config: Record<string, any>;
    onSave: (groups: Record<string, any>) => Promise<void>;
  };

  let { instanceId, config, onSave }: Props = $props();

  const channels = useChannels();
  
  let groups = $state<Record<string, any>>(config.groups || {});
  let knownGroups = $state<GroupManagerGroupInfo[]>([]);
  let expanded = $state<Record<string, boolean>>({});
  let newGroupId = $state("");
  let saving = $state(false);

  onMount(async () => {
    try {
      knownGroups = await channels.listManagerGroups(instanceId);
    } catch (e) {
      console.error("Failed to load known groups", e);
    }
  });

  const groupFields = [
    { key: "enabled", label: "Enabled", type: "tristate" as const },
    { key: "dm_policy", label: "DM Policy", type: "tristate" as const, options: [
      { value: "pairing", label: "Pairing (require code)" },
      { value: "open", label: "Open (accept all)" },
      { value: "allowlist", label: "Allowlist only" },
      { value: "disabled", label: "Disabled" },
    ]},
    { key: "require_mention", label: "Require @mention", type: "tristate" as const },
    { key: "history_limit", label: "History Limit", type: "number" as const, placeholder: "Inherit" },
  ];

  function addGroup(id?: string) {
    const gid = (id || newGroupId).trim();
    if (!gid || groups[gid]) return;
    groups[gid] = {};
    expanded[gid] = true;
    if (!id) newGroupId = "";
  }

  function removeGroup(id: string) {
    const next = { ...groups };
    delete next[id];
    groups = next;
  }

  async function handleSave() {
    saving = true;
    try {
      await onSave(groups);
    } finally {
      saving = false;
    }
  }

  function extractGroupId(id: string): string {
    const m = id.match(/^group:[^:]+:(.+)$/);
    return m?.[1] ?? id;
  }

  let availableGroups = $derived(knownGroups.filter(g => {
    const rawId = extractGroupId(g.group_id);
    return !groups[rawId] && !groups[g.group_id];
  }));
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Globe class="w-4 h-4 text-sky-400" />
      <h3 class="text-sm font-bold text-white/90">Telegram Group Overrides</h3>
    </div>
    <button 
      onclick={handleSave}
      disabled={saving}
      class="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
    >
      {#if saving}
        <Loader2 class="w-3.5 h-3.5 animate-spin" />
      {:else}
        <Save class="w-3.5 h-3.5" />
      {/if}
      Save Overrides
    </button>
  </div>

  <p class="text-xs text-white/40 leading-relaxed max-w-xl font-mono uppercase tracking-widest">
    Configure specific policies for Telegram groups or use "*" for a global group fallback.
  </p>

  <div class="space-y-3">
    {#each Object.keys(groups) as id (id)}
      {@const isOpen = expanded[id]}
      <div class="rounded-2xl border border-white/10 overflow-hidden bg-[#030014]/40 shadow-xl transition-all duration-500">
        <div class="flex items-center justify-between px-6 py-4">
          <button
            onclick={() => expanded[id] = !isOpen}
            class="flex-1 flex items-center gap-3 text-left hover:text-white transition-all text-white/70"
          >
            {#if isOpen}
              <ChevronDown class="w-4 h-4 text-sky-400" />
            {:else}
              <ChevronRight class="w-4 h-4 text-white/20" />
            {/if}
            <span class="font-mono text-sm font-bold">
              {id === "*" ? "Global Wildcard (*)" : `Group ID: ${id}`}
            </span>
          </button>
          <button 
            onclick={() => removeGroup(id)}
            class="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>

        {#if isOpen}
          <div class="px-6 pb-6 pt-2 border-t border-white/5 space-y-6 animate-in slide-in-from-top-2 duration-300">
            <ChannelFields
              fields={groupFields}
              values={groups[id]}
              onChange={(k, v) => groups[id][k] = v}
              idPrefix={`grp-${id}`}
              isEdit
            />
          </div>
        {/if}
      </div>
    {/each}

    {#if Object.keys(groups).length === 0}
       <div class="py-12 flex flex-col items-center justify-center text-center bg-black/40 border border-white/5 rounded-[2rem] shadow-2xl opacity-50">
          <Globe class="w-8 h-8 text-white/10 mb-4" />
          <h3 class="text-[10px] font-black uppercase tracking-widest text-white/40">No overrides defined</h3>
       </div>
    {/if}
  </div>

  <!-- Quick Add / Manual Add -->
  <div class="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-6">
    {#if availableGroups.length > 0}
      <div class="space-y-3">
        <span class="text-[10px] font-black uppercase tracking-widest text-white/30">Detected Groups</span>
        <div class="flex flex-wrap gap-2">
          {#each availableGroups as g}
            {@const rawId = extractGroupId(g.group_id)}
            <button 
              onclick={() => addGroup(rawId)}
              class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-white/60 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
            >
              <Plus class="w-3 h-3" /> {rawId}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="space-y-3">
      <span class="text-[10px] font-black uppercase tracking-widest text-white/30">Manual Add (ID or "*")</span>
      <div class="flex gap-2">
        <input 
          type="text" 
          bind:value={newGroupId}
          placeholder="e.g. -100123456789"
          class="flex-1 bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:border-sky-500/50 transition-all text-white"
        />
        <button 
          onclick={() => addGroup()}
          disabled={!newGroupId}
          class="px-6 py-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-sky-500/20 disabled:opacity-30"
        >
          Add Overrides
        </button>
      </div>
    </div>
  </div>
</div>
