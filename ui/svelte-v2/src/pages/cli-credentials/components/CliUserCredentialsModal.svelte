<script lang="ts">
  import { Users, X, Plus, Trash2, Pencil, Server } from "lucide-svelte";
  import type { SecureCLIBinary } from "$lib/state/cli-credentials.svelte";
  import { useHttp } from "$lib/state/ws.svelte";
  import { scale } from "svelte/transition";

  type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    binary: SecureCLIBinary;
  };

  interface UserCredEntry {
    id: string;
    binary_id: string;
    user_id: string;
    has_env: boolean;
    env_keys?: string[];
  }

  let { open, onOpenChange, binary }: Props = $props();

  let view = $state<"list" | "form">("list");
  let entries = $state<UserCredEntry[]>([]);
  let loadingList = $state(false);

  let userId = $state("");
  let envs = $state<{key: string, value: string}[]>([]);
  let saving = $state(false);
  let errorMsg = $state("");

  async function loadList() {
    loadingList = true;
    errorMsg = "";
    const http = useHttp();
    try {
      const res = await http.get<{ user_credentials: UserCredEntry[] }>(`/v1/cli-credentials/${binary.id}/user-credentials`);
      entries = res.user_credentials || [];
    } catch (e: any) {
      errorMsg = e.message;
    } finally {
      loadingList = false;
    }
  }

  $effect(() => {
    if (open && binary) {
      view = "list";
      loadList();
    }
  });

  function openAdd() {
    userId = "";
    envs = [{key: "", value: ""}];
    errorMsg = "";
    view = "form";
  }

  async function openEdit(entry: UserCredEntry) {
    userId = entry.user_id;
    envs = [];
    errorMsg = "";
    view = "form";
    const http = useHttp();
    try {
      const data = await http.get<{ env?: Record<string, string> }>(`/v1/cli-credentials/${binary.id}/user-credentials/${entry.user_id}`);
      if (data.env) {
        envs = Object.entries(data.env).map(([k, v]) => ({ key: k, value: v as string }));
      }
    } catch (e) {
      console.error(e);
    }
    if (envs.length === 0) envs = [{key: "", value: ""}];
  }

  async function handleSave() {
    if (!userId.trim()) return;
    saving = true;
    errorMsg = "";
    const http = useHttp();
    try {
      const envDict: Record<string, string> = {};
      for (const e of envs) {
        if (e.key.trim()) envDict[e.key.trim()] = e.value;
      }
      
      await http.put(`/v1/cli-credentials/${binary.id}/user-credentials/${userId.trim()}`, { env: envDict });
      
      await loadList();
      view = "list";
    } catch (e: any) {
      errorMsg = e.message;
    } finally {
      saving = false;
    }
  }

  async function handleDelete(entry: UserCredEntry) {
    const http = useHttp();
    try {
      await http.delete(`/v1/cli-credentials/${binary.id}/user-credentials/${entry.user_id}`);
      await loadList();
    } catch (e: any) {
      errorMsg = e.message;
    }
  }

  function addEnv() {
    envs = [...envs, {key: "", value: ""}];
  }
  function removeEnv(idx: number) {
    envs = envs.filter((_, i) => i !== idx);
  }

</script>

{#if open}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-xl" onclick={() => !saving && onOpenChange(false)}></div>

    <div class="relative bg-gradient-to-br from-[#030014]/95 to-[#1a0033]/90 border border-white/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8),inset_0_2px_20px_rgba(0,0,0,0.5)] flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden" in:scale={{start: 0.95}} out:scale={{start: 0.95}}>
      
      <div class="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/20 blur-[100px] pointer-events-none"></div>

      <div class="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Users class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-xs font-black text-white/90 tracking-[0.3em] uppercase">User Credentials</h2>
            <div class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">{binary.binary_name}</div>
          </div>
        </div>
        <button onclick={() => !saving && onOpenChange(false)} disabled={saving} class="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors border border-white/5 disabled:opacity-50">
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
        
        {#if errorMsg}
          <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-black uppercase tracking-widest text-red-400">
            {errorMsg}
          </div>
        {/if}

        {#if view === "list"}
          {#if loadingList}
            <div class="flex justify-center p-8"><Server class="h-6 w-6 animate-spin text-white/30" /></div>
          {:else if entries.length === 0}
            <div class="text-center p-8 border border-white/5 border-dashed rounded-xl text-[10px] font-mono text-white/30 uppercase">No user credentials found.</div>
          {:else}
            <div class="space-y-2">
              {#each entries as entry}
                <div class="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
                  <div>
                    <div class="font-bold text-sm text-blue-400">{entry.user_id}</div>
                    {#if entry.env_keys && entry.env_keys.length > 0}
                      <div class="text-[10px] font-mono text-white/40 mt-1">Keys: {entry.env_keys.join(", ")}</div>
                    {/if}
                  </div>
                  <div class="flex items-center gap-2">
                    <button onclick={() => openEdit(entry)} class="p-2 text-white/30 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"><Pencil class="h-4 w-4" /></button>
                    <button onclick={() => handleDelete(entry)} class="p-2 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 class="h-4 w-4" /></button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {:else}
          <!-- Form View -->
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">User ID</label>
              <input type="text" bind:value={userId} placeholder="Enter User ID..." class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500/50 transition-colors" />
            </div>

            <div class="space-y-2 pt-4">
              <div class="flex justify-between items-center">
                <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Environment Variables</label>
                <button onclick={addEnv} class="text-[10px] font-black uppercase text-blue-400">+ Add</button>
              </div>
              {#each envs as e, i}
                <div class="flex gap-2">
                  <input type="text" bind:value={e.key} placeholder="KEY" class="flex-1 h-9 px-3 bg-[#0a0a0a] border border-white/5 rounded-lg text-white font-mono text-xs outline-none focus:border-blue-500/50" />
                  <input type="password" bind:value={e.value} placeholder="Value..." class="flex-1 h-9 px-3 bg-[#0a0a0a] border border-white/5 rounded-lg text-white font-mono text-xs outline-none focus:border-blue-500/50" />
                  <button onclick={() => removeEnv(i)} class="text-white/30 hover:text-red-400"><X class="h-4 w-4" /></button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

      </div>

      <div class="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-4 relative z-10 rounded-b-3xl">
        {#if view === "list"}
          <button onclick={() => onOpenChange(false)} class="px-6 h-10 rounded-xl border border-transparent text-white/50 hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest">Close</button>
          <button onclick={openAdd} class="px-6 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Plus class="h-4 w-4" /> Add User Creds
          </button>
        {:else}
          <button onclick={() => {view = "list"; errorMsg = "";}} disabled={saving} class="px-6 h-10 rounded-xl border border-transparent text-white/50 hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest">Back</button>
          <button onclick={handleSave} disabled={saving || !userId} class="px-6 h-10 rounded-xl bg-blue-500 text-black shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-blue-400 transition-colors font-black text-[10px] uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
            {#if saving}<Server class="h-4 w-4 animate-spin" />{:else}<Pencil class="h-4 w-4" />{/if} Save
          </button>
        {/if}
      </div>

    </div>
  </div>
{/if}
