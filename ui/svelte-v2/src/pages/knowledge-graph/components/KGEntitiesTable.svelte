<script lang="ts">
  import { GitFork, Trash2, Network } from "lucide-svelte";
  import type { KGEntity } from "../../../types/knowledge-graph";

  let {
    entities,
    loading,
    onView,
    onDelete
  } = $props<{
    entities: KGEntity[];
    loading: boolean;
    onView: (entity: KGEntity) => void;
    onDelete: (entity: KGEntity) => void;
  }>();

</script>

<div class="h-full flex flex-col p-4 bg-[#050510]/80">
  {#if loading && entities.length === 0}
    <div class="flex-1 flex flex-col items-center justify-center p-8 text-white/30">
      <div class="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-xs font-black uppercase tracking-widest">Loading Entities...</p>
    </div>
  {:else if entities.length === 0}
    <div class="flex-1 flex flex-col items-center justify-center p-8 text-white/30">
      <Network class="h-12 w-12 mb-4 opacity-50" />
      <p class="text-xs font-black uppercase tracking-widest">No Entities Found</p>
    </div>
  {:else}
    <div class="flex-1 overflow-auto custom-scrollbar border border-white/10 rounded-xl bg-black/40">
      <table class="w-full text-left text-sm text-white/80">
        <thead class="bg-black/60 text-[10px] font-black uppercase tracking-widest text-white/40 sticky top-0 z-10 backdrop-blur-md">
          <tr>
            <th class="px-6 py-4 border-b border-white/10">Entity</th>
            <th class="px-6 py-4 border-b border-white/10">Type</th>
            <th class="px-6 py-4 border-b border-white/10">Description</th>
            <th class="px-6 py-4 border-b border-white/10">Confidence</th>
            <th class="px-6 py-4 border-b border-white/10 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          {#each entities as e}
            <tr class="hover:bg-white/[0.02] transition-colors group">
              <td class="px-6 py-4">
                <button 
                  onclick={() => onView(e)}
                  class="text-emerald-400 font-bold hover:underline"
                >
                  {e.name}
                </button>
                <div class="text-[10px] font-mono text-white/30 mt-1">{e.external_id || e.id}</div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-white/70">
                  {e.entity_type}
                </span>
              </td>
              <td class="px-6 py-4 max-w-[300px] truncate text-xs text-white/50">
                {e.description || "-"}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full" style="width: {e.confidence * 100}%"></div>
                  </div>
                  <span class="text-[10px] text-white/50 font-mono">{Math.round(e.confidence * 100)}%</span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onclick={() => onView(e)}
                    class="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
                    title="View Relations"
                  >
                    <GitFork class="h-4 w-4" />
                  </button>
                  <button 
                    onclick={() => onDelete(e)}
                    class="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all"
                    title="Delete Entity"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
