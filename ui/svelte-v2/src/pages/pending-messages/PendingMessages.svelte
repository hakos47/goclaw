<script lang="ts">
  import { 
    Inbox, RefreshCw, Trash2, Archive, Loader2, Info, ChevronDown, 
    ChevronUp, MessageSquare, History, User, Building2, Clock, Check
  } from "lucide-svelte";
  import PageHeader from "$lib/components/shared/PageHeader.svelte";
  import EmptyState from "$lib/components/shared/EmptyState.svelte";
  import TableSkeleton from "$lib/components/shared/TableSkeleton.svelte";
  import ConfirmDialog from "$lib/components/shared/ConfirmDialog.svelte";
  import { Badge } from "$lib/components/ui/badge";
  import { onMount } from "svelte";
  import { usePendingMessages } from "./hooks/use-pending-messages.svelte";
  import { _ } from "svelte-i18n";

  const pm = usePendingMessages();

  let showInfo = $state(true);
  let confirmClearGroup = $state<any>(null);
  let compactingKeys = $state<Set<string>>(new Set());
  
  onMount(() => {
    pm.loadGroups();
  });

  async function handleCompact(group: any) {
    const key = `${group.channel_name}/${group.history_key}`;
    compactingKeys.add(key);
    const ok = await pm.compactGroup(group.channel_name, group.history_key);
    if (ok) {
        // Poll for status change
        const interval = setInterval(async () => {
            await pm.loadGroups();
            const current = pm.groups.find(g => `${g.channel_name}/${g.history_key}` === key);
            if (current?.has_summary) {
                clearInterval(interval);
                compactingKeys.delete(key);
            }
        }, 5000);
    } else {
        compactingKeys.delete(key);
    }
  }

  async function handleClear() {
    if (!confirmClearGroup) return;
    await pm.clearGroup(confirmClearGroup.channel_name, confirmClearGroup.history_key);
    confirmClearGroup = null;
    pm.loadGroups();
  }

  function formatDate(iso: string) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString();
  }
</script>

<div class="h-full overflow-y-auto p-4 sm:p-6 pb-10 space-y-8 relative isolate custom-scrollbar">
  <!-- Background Accents -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.05)_0%,transparent_50%)] pointer-events-none"></div>
  
  <PageHeader
    title="Mensajes Pendientes"
    description="Gestiona las conversaciones en bruto acumuladas antes de ser procesadas por el sistema."
    icon={Inbox}
  >
    {#snippet actions()}
      <button 
        class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        onclick={() => pm.loadGroups()}
        disabled={pm.loading}
      >
        <RefreshCw size={16} class={pm.loading ? "animate-spin" : ""} />
        Sincronizar
      </button>
    {/snippet}
  </PageHeader>

  <!-- How it works -->
  <div class="bg-[#030014]/40 backdrop-blur-3xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
    <button 
      class="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
      onclick={() => showInfo = !showInfo}
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-blue-500/10 text-blue-400">
          <Info size={18} />
        </div>
        <div>
          <h4 class="text-sm font-bold text-white/90">Protocolo de Ingesta</h4>
          <p class="text-xs text-white/40 font-mono uppercase tracking-widest">Procedimiento de Compactación</p>
        </div>
      </div>
      {#if showInfo}
        <ChevronUp size={18} class="text-white/20" />
      {:else}
        <ChevronDown size={18} class="text-white/20" />
      {/if}
    </button>
    
    {#if showInfo}
      <div class="p-4 border-t border-white/5 bg-black/20 space-y-4 animate-in slide-in-from-top-2 duration-300">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-goclaw-neon-cyan font-bold text-xs uppercase tracking-tighter">
              <span class="flex h-5 w-5 items-center justify-center rounded-full bg-goclaw-neon-cyan/20 text-[10px]">1</span>
              Acumulación
            </div>
            <p class="text-xs text-white/50 leading-relaxed">Los mensajes entrantes se guardan en un búfer temporal fuera de la memoria principal del agente.</p>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-goclaw-neon-purple font-bold text-xs uppercase tracking-tighter">
              <span class="flex h-5 w-5 items-center justify-center rounded-full bg-goclaw-neon-purple/20 text-[10px]">2</span>
              Sintetización
            </div>
            <p class="text-xs text-white/50 leading-relaxed">La compactación utiliza un modelo de lenguaje para resumir el historial y extraer hechos clave.</p>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-tighter">
              <span class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-[10px]">3</span>
              Integración
            </div>
            <p class="text-xs text-white/50 leading-relaxed">El resumen resultante se inyecta en la memoria del agente, ahorrando tokens y contexto.</p>
          </div>
        </div>
        
        <div class="pt-2 flex gap-4 text-[10px] font-mono uppercase tracking-widest text-white/30 border-t border-white/5">
          <span class="flex items-center gap-1.5"><Archive size={12} /> Compactar: Iniciar IA</span>
          <span class="flex items-center gap-1.5"><Trash2 size={12} /> Limpiar: Purgar Búfer</span>
        </div>
      </div>
    {/if}
  </div>

  <div class="mt-8">
    {#if pm.loading && pm.groups.length === 0}
      <TableSkeleton rows={6} />
    {:else if pm.groups.length === 0}
      <EmptyState
        icon={Inbox}
        title="Bandeja de Entrada Vacía"
        description="No hay mensajes pendientes de procesamiento en ningún canal."
      />
    {:else}
      <div class="rounded-2xl border border-white/5 overflow-hidden bg-[#030014]/60 backdrop-blur-3xl shadow-2xl shadow-black/50 relative z-10">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead>
              <tr class="border-b border-white/5 bg-white/[0.02]">
                <th class="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40">Canal</th>
                <th class="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40">Grupo / Historial</th>
                <th class="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40">Mensajes</th>
                <th class="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40">Estado</th>
                <th class="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40 text-right">Última Actividad</th>
                <th class="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-white/40 text-right">Operaciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              {#each pm.groups as g}
                {@const rowKey = `${g.channel_name}/${g.history_key}`}
                {@const isCompacting = compactingKeys.has(rowKey)}
                <tr class="group hover:bg-white/[0.02] transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <div class="h-1.5 w-1.5 rounded-full bg-goclaw-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                        <span class="font-bold text-white/80">{g.channel_name}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-col max-w-[300px]">
                        {#if g.group_title}
                            <span class="font-bold text-white truncate">{g.group_title}</span>
                            {#if g.history_key.includes(":topic:")}
                                <span class="text-[9px] font-mono text-goclaw-neon-purple uppercase mt-0.5">
                                    &gt; topic:{g.history_key.split(":topic:")[1]}
                                </span>
                            {/if}
                        {:else}
                            <span class="font-mono text-[10px] text-white/40 truncate">{g.history_key}</span>
                        {/if}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-white/60">
                        <MessageSquare size={10} /> {g.message_count}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    {#if g.has_summary}
                      <Badge class="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                        <Check size={10} /> Compactado
                      </Badge>
                    {:else}
                      <Badge variant="secondary" class="bg-white/5 text-white/40 border-white/10">Bruto</Badge>
                    {/if}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="text-[11px] font-mono text-white/30 uppercase">{formatDate(g.last_activity)}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-tighter text-white/70 hover:bg-goclaw-neon-purple/20 hover:border-goclaw-neon-purple/30 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        disabled={isCompacting || g.has_summary}
                        onclick={() => handleCompact(g)}
                      >
                        {#if isCompacting}
                          <Loader2 size={12} class="animate-spin" />
                          Procesando...
                        {:else}
                          <Archive size={12} />
                          Compactar
                        {/if}
                      </button>
                      <button
                        class="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 hover:text-white transition-all cursor-pointer"
                        onclick={() => confirmClearGroup = g}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>

  <ConfirmDialog
    open={!!confirmClearGroup}
    onOpenChange={(v) => !v && (confirmClearGroup = null)}
    title="Purgar Búfer de Mensajes"
    description={`¿Estás seguro de que deseas eliminar permanentemente todos los mensajes pendientes del canal ${confirmClearGroup?.channel_name}? Esta acción no se puede deshacer.`}
    confirmLabel="Purgar Ahora"
    variant="destructive"
    onConfirm={handleClear}
  />
</div>
