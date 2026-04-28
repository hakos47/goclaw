<script lang="ts">
  import { X, FileText, Save, Clock, Plus } from "lucide-svelte";
  import { fade, scale } from "svelte/transition";
  import { onMount } from "svelte";

  let { 
    open = $bindable(false),
    agentId,
    knownUserIds = [],
    onCreate
  } = $props<{
    open: boolean;
    agentId: string;
    knownUserIds?: string[];
    onCreate: (path: string, content: string, userId?: string) => Promise<void>;
  }>();

  let path = $state("");
  let content = $state("");
  let userId = $state("");
  let saving = $state(false);

  $effect(() => {
    if (open) {
      path = "";
      content = "";
      userId = "";
    }
  });

  const handleCreate = async () => {
    if (!path.trim() || !content.trim()) return;
    saving = true;
    try {
      await onCreate(path.trim(), content.trim(), userId.trim() || undefined);
      open = false;
    } catch (err) {
      console.error("Failed to create document", err);
    } finally {
      saving = false;
    }
  };

  const close = () => {
    if (!saving) open = false;
  };
</script>

{#if open}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 z-50 bg-[#030014]/80 backdrop-blur-sm flex items-center justify-center p-4"
    in:fade={{ duration: 150 }}
    out:fade={{ duration: 150 }}
  >
    <!-- Modal -->
    <div 
      class="relative w-full max-w-2xl bg-[#050510]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col"
      in:scale={{ duration: 200, start: 0.95 }}
      out:scale={{ duration: 150, start: 0.95 }}
    >
      <!-- Background Effects -->
      <div class="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 -translate-x-1/2"></div>
      
      <!-- Header -->
      <div class="relative z-10 flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
        <div class="flex items-center gap-4">
          <div class="p-2.5 bg-white/5 border border-white/10 rounded-xl shadow-inner">
            <Plus class="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 tracking-tight uppercase">
              Inject Memory
            </h2>
            <p class="text-[10px] uppercase tracking-widest text-white/40 mt-1">
              Add new semantic knowledge to the agent's banks
            </p>
          </div>
        </div>
        
        <button 
          onclick={close}
          class="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 flex flex-col gap-5 relative z-10">
        
        <!-- Path Input -->
        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">Document Path / Name</label>
          <input
            type="text"
            bind:value={path}
            placeholder="e.g. CORE_RULES.md, facts/user_preferences.txt"
            class="w-full h-10 px-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-sm font-bold text-white/90 placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
          />
        </div>

        <!-- Scope Input -->
        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">Target Scope (User ID)</label>
          <div class="relative">
            <input
              type="text"
              bind:value={userId}
              list="known-users"
              placeholder="Leave empty for Global scope"
              class="w-full h-10 px-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl text-sm font-bold text-white/90 placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
            />
            <datalist id="known-users">
              {#each knownUserIds as uid}
                <option value={uid}></option>
              {/each}
            </datalist>
          </div>
          <p class="text-[10px] text-white/30 font-medium ml-1">If filled, this memory will only be retrieved when interacting with this specific user.</p>
        </div>

        <!-- Content Input -->
        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">Raw Content</label>
          <textarea
            bind:value={content}
            class="w-full min-h-[200px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 font-mono text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all custom-scrollbar resize-none shadow-inner"
            placeholder="Enter the textual data to be chunked and vectorized..."
          ></textarea>
        </div>

      </div>

      <!-- Footer -->
      <div class="relative z-10 p-5 border-t border-white/5 bg-white/[0.02] flex items-center justify-end gap-3">
        <button 
          onclick={close}
          disabled={saving}
          class="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        
        <button 
          onclick={handleCreate}
          disabled={saving || !path.trim() || !content.trim()}
          class="flex items-center gap-2 px-6 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-xl text-xs font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:hover:shadow-none"
        >
          {#if saving}
            <Clock class="h-4 w-4 animate-spin" /> Uploading...
          {:else}
            <Plus class="h-4 w-4" /> Inject Memory
          {/if}
        </button>
      </div>
      
    </div>
  </div>
{/if}
