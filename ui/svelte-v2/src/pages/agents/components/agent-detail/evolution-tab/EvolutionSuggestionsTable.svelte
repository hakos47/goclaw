<script lang="ts">
  import { Check, X, RotateCcw, Loader2 } from "lucide-svelte";
  import type { EvolutionSuggestion } from "../../../../../lib/types/evolution";

  type Props = {
    suggestions: EvolutionSuggestion[];
    loading: boolean;
    onUpdateStatus: (id: string, status: "approved" | "rejected" | "rolled_back") => Promise<void>;
  };

  let { suggestions, loading, onUpdateStatus }: Props = $props();

  let actingId = $state<string | null>(null);

  const TYPE_COLORS: Record<string, string> = {
    threshold: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    tool_order: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    skill_add: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-500 border border-amber-500/30",
    approved: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    applied: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    rejected: "bg-red-500/20 text-red-500 border border-red-500/30",
    rolled_back: "bg-white/10 text-white/50 border border-white/20",
  };

  function formatRelative(iso: string | null): string {
    if (!iso) return "N/A";
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
    return d.toLocaleDateString();
  }

  async function handleAction(id: string, action: "approved" | "rejected" | "rolled_back") {
    if (confirm(`Are you sure you want to mark this suggestion as ${action}?`)) {
      actingId = id;
      try {
        await onUpdateStatus(id, action);
      } finally {
        actingId = null;
      }
    }
  }
</script>

{#if loading}
  <div class="h-32 w-full bg-white/5 animate-pulse rounded-2xl border border-white/10 mt-4"></div>
{:else if suggestions.length === 0}
  <div class="flex items-center justify-center py-10 bg-black/40 border border-white/10 rounded-2xl mt-4">
    <p class="text-xs text-white/30 font-bold uppercase tracking-widest">No evolution suggestions found</p>
  </div>
{:else}
  <div class="rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-sm mt-4">
    <div class="overflow-x-auto scroller-no-scrollbar">
      <table class="w-full text-left min-w-[700px] border-collapse">
        <thead class="bg-black/60 border-b border-white/10">
          <tr>
            <th class="px-4 py-3 text-[9px] font-bold text-white/50 uppercase tracking-widest w-28">Type</th>
            <th class="px-4 py-3 text-[9px] font-bold text-white/50 uppercase tracking-widest">Suggestion & Rationale</th>
            <th class="px-4 py-3 text-[9px] font-bold text-white/50 uppercase tracking-widest w-24">Status</th>
            <th class="px-4 py-3 text-[9px] font-bold text-white/50 uppercase tracking-widest w-24 text-right">Age</th>
            <th class="px-4 py-3 text-[9px] font-bold text-white/50 uppercase tracking-widest w-24 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each suggestions as s}
            <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
              <td class="px-4 py-3">
                <span class={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${TYPE_COLORS[s.suggestion_type] ?? ""}`}>
                  {s.suggestion_type.replace("_", " ")}
                </span>
              </td>
              <td class="px-4 py-3">
                <p class="text-xs font-bold text-white/90 break-words">{s.suggestion}</p>
                <p class="text-[10px] text-white/40 mt-1 leading-relaxed break-words max-w-xl">{s.rationale}</p>
              </td>
              <td class="px-4 py-3">
                <span class={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${STATUS_COLORS[s.status] ?? ""}`}>
                  {s.status.replace("_", " ")}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-[10px] text-white/30 font-mono">{formatRelative(s.created_at)}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  {#if actingId === s.id}
                    <Loader2 class="h-4 w-4 animate-spin text-white/50" />
                  {:else if s.status === "pending"}
                    <button
                      onclick={() => handleAction(s.id, "approved")}
                      class="h-7 w-7 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                      title="Approve"
                    >
                      <Check class="h-3.5 w-3.5" />
                    </button>
                    <button
                      onclick={() => handleAction(s.id, "rejected")}
                      class="h-7 w-7 rounded bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                      title="Reject"
                    >
                      <X class="h-3.5 w-3.5" />
                    </button>
                  {:else if s.status === "applied"}
                    <button
                      onclick={() => handleAction(s.id, "rolled_back")}
                      class="h-7 w-7 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 flex items-center justify-center transition-colors"
                      title="Rollback"
                    >
                      <RotateCcw class="h-3.5 w-3.5" />
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
