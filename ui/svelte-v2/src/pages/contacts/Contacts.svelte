<script lang="ts">
  import { 
    Users, Search, RefreshCw, Merge, Unlink, Info, ChevronDown, 
    ChevronUp, User, Building, MessageSquare
  } from "lucide-svelte";
  import PageHeader from "$lib/components/shared/PageHeader.svelte";
  import EmptyState from "$lib/components/shared/EmptyState.svelte";
  import TableSkeleton from "$lib/components/shared/TableSkeleton.svelte";
  import MergeContactsDialog from "./MergeContactsDialog.svelte";
  import { Badge } from "$lib/components/ui/badge";
  import { onMount } from "svelte";
  import { useContacts } from "./hooks/use-contacts.svelte";
  import { useContactMerge } from "./hooks/use-contact-merge.svelte";

  const contactHook = useContacts();
  const { unmerge } = useContactMerge();

  let search = $state("");
  let appliedSearch = $state("");
  let channelType = $state("");
  let contactType = $state("");
  let page = $state(1);
  let pageSize = $state(50);
  
  let selectedIds = $state(new Set<string>());
  let showPermissions = $state(true);
  let mergeDialogOpen = $state(false);

  const CHANNEL_TYPES = ["telegram", "discord", "slack", "whatsapp", "zalo_oa", "zalo_personal", "feishu"];
  const PERM_CHANNELS = ["telegram", "discord", "zalo", "slack", "feishu"];

  onMount(() => {
    refresh();
  });

  async function refresh() {
    await contactHook.loadContacts({
      search: appliedSearch || undefined,
      channelType: channelType || undefined,
      contactType: contactType || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  }

  function handleSearch(e: Event) {
    e.preventDefault();
    appliedSearch = search;
    page = 1;
  }

  $effect(() => {
    const _page = page;
    const _ps = pageSize;
    const _s = appliedSearch;
    const _ct = channelType;
    const _cot = contactType;
    
    selectedIds = new Set();
    refresh();
  });

  function toggleSelect(id: string) {
    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }
    selectedIds = new Set(selectedIds);
  }

  function toggleSelectAll() {
    if (selectedIds.size === contactHook.contacts.length) {
        selectedIds = new Set();
    } else {
        selectedIds = new Set(contactHook.contacts.map(c => c.id));
    }
  }

  const selectedContacts = $derived(contactHook.contacts.filter(c => selectedIds.has(c.id)));
  const allSelectedMerged = $derived(selectedContacts.length > 0 && selectedContacts.every(c => c.merged_id));

  async function handleUnmerge() {
    try {
        await unmerge(selectedContacts.map(c => c.id));
        selectedIds = new Set();
        refresh();
    } catch (e) {
        console.error(e);
    }
  }

  function formatDate(iso: string) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString();
  }
</script>

<div class="h-full overflow-y-auto p-4 sm:p-6 pb-10 space-y-8 relative isolate custom-scrollbar">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.05)_0%,transparent_50%)] pointer-events-none"></div>

  <PageHeader
    title="Directorio de Contactos"
    description="Gestiona la identidad unificada de tus contactos a través de múltiples canales."
    icon={Users}
  >
    {#snippet actions()}
      <button 
        class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        onclick={() => refresh()}
        disabled={contactHook.fetching}
      >
        <RefreshCw size={16} class={contactHook.fetching ? "animate-spin" : ""} />
        Sincronizar
      </button>
    {/snippet}
  </PageHeader>

  <!-- Permissions HUD -->
  <div class="bg-[#030014]/40 backdrop-blur-3xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative z-10">
    <button 
      class="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
      onclick={() => showPermissions = !showPermissions}
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-blue-500/10 text-blue-400">
          <Info size={18} />
        </div>
        <div>
          <h4 class="text-sm font-bold text-white/90">Permisos de Identidad</h4>
          <p class="text-xs text-white/40 font-mono uppercase tracking-widest">Protocolo de Acceso por Canal</p>
        </div>
      </div>
      {#if showPermissions}
        <ChevronUp size={18} class="text-white/20" />
      {:else}
        <ChevronDown size={18} class="text-white/20" />
      {/if}
    </button>
    
    {#if showPermissions}
      <div class="p-4 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2 duration-300">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          {#each PERM_CHANNELS as ch}
            <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                <div class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-white/60">{ch}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Filters & Search -->
  <div class="flex flex-wrap items-center gap-4 relative z-10">
    <form onsubmit={handleSearch} class="flex-1 min-w-[300px] relative group">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-goclaw-neon-cyan transition-colors" />
      <input
        bind:value={search}
        placeholder="Buscar por nombre, ID o alias..."
        class="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0a0a0a]/60 border border-white/5 focus:border-goclaw-neon-cyan/50 focus:ring-1 focus:ring-goclaw-neon-cyan/20 outline-none text-sm transition-all backdrop-blur-xl text-white"
      />
    </form>

    <div class="flex items-center gap-2 p-1 rounded-2xl bg-[#030014]/60 border border-white/5 backdrop-blur-xl">
        <select 
            bind:value={channelType} 
            class="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest text-white/50 px-4 py-2 outline-none cursor-pointer hover:text-white transition-colors"
        >
            <option value="">Todos los Canales</option>
            {#each CHANNEL_TYPES as ct}
                <option value={ct}>{ct}</option>
            {/each}
        </select>
        <div class="w-px h-4 bg-white/10"></div>
        <select 
            bind:value={contactType}
            class="bg-transparent border-none text-[11px] font-bold uppercase tracking-widest text-white/50 px-4 py-2 outline-none cursor-pointer hover:text-white transition-colors"
        >
            <option value="">Tipos</option>
            <option value="user">Usuario</option>
            <option value="group">Grupo</option>
            <option value="topic">Tópico</option>
        </select>
    </div>
  </div>

  <!-- Selection Toolbar -->
  {#if selectedIds.size > 0}
    <div class="flex items-center justify-between px-6 py-3 rounded-2xl bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 backdrop-blur-2xl animate-in zoom-in-95 duration-300 relative z-20 shadow-[0_0_30px_rgba(217,70,239,0.1)]">
        <div class="flex items-center gap-4">
            <span class="text-xs font-bold text-white uppercase tracking-widest">
                {selectedIds.size} seleccionados
            </span>
        </div>
        <div class="flex items-center gap-3">
            <button 
                onclick={() => mergeDialogOpen = true}
                class="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-goclaw-neon-purple/20 border border-goclaw-neon-purple/40 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-goclaw-neon-purple/40 transition-all cursor-pointer"
            >
                <Merge size={14} /> Fusionar
            </button>
            {#if allSelectedMerged}
                <button 
                    onclick={handleUnmerge}
                    class="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 hover:text-white transition-all cursor-pointer"
                >
                    <Unlink size={14} /> Desvincular
                </button>
            {/if}
        </div>
    </div>
  {/if}

  <!-- Table -->
  <div class="relative z-10">
    {#if contactHook.loading && contactHook.contacts.length === 0}
        <TableSkeleton rows={8} />
    {:else if contactHook.contacts.length === 0}
        <EmptyState
            icon={User}
            title="Sin Resultados"
            description="No se han encontrado contactos que coincidan con los criterios de filtrado."
        />
    {:else}
        <div class="rounded-2xl border border-white/5 overflow-hidden bg-[#030014]/60 backdrop-blur-3xl shadow-2xl">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr class="border-b border-white/5 bg-white/[0.02]">
                            <th class="px-6 py-4 w-12 text-center">
                                <button onclick={toggleSelectAll} class="w-4 h-4 rounded border border-white/20 flex items-center justify-center hover:border-goclaw-neon-cyan transition-colors mx-auto">
                                    {#if selectedIds.size === contactHook.contacts.length && contactHook.contacts.length > 0}
                                        <div class="w-2 h-2 bg-goclaw-neon-cyan rounded-sm shadow-[0_0_5px_#06b6d4]"></div>
                                    {/if}
                                </button>
                            </th>
                            <th class="px-6 py-4 font-bold uppercase tracking-[0.2em] text-[10px] text-white/40">Identidad</th>
                            <th class="px-6 py-4 font-bold uppercase tracking-[0.2em] text-[10px] text-white/40">Canal</th>
                            <th class="px-6 py-4 font-bold uppercase tracking-[0.2em] text-[10px] text-white/40">Tipo</th>
                            <th class="px-6 py-4 font-bold uppercase tracking-[0.2em] text-[10px] text-white/40 text-right">Primer Avistamiento</th>
                            <th class="px-6 py-4 font-bold uppercase tracking-[0.2em] text-[10px] text-white/40 text-right">Última Actividad</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        {#each contactHook.contacts as c}
                            <tr 
                                class={`group hover:bg-white/[0.03] transition-all cursor-pointer ${selectedIds.has(c.id) ? 'bg-white/[0.05]' : ''}`}
                                onclick={() => toggleSelect(c.id)}
                            >
                                <td class="px-6 py-4 text-center" onclick={(e) => e.stopPropagation()}>
                                    <button onclick={() => toggleSelect(c.id)} class="w-4 h-4 rounded border border-white/20 flex items-center justify-center hover:border-goclaw-neon-cyan transition-colors mx-auto">
                                        {#if selectedIds.has(c.id)}
                                            <div class="w-2 h-2 bg-goclaw-neon-cyan rounded-sm shadow-[0_0_5px_#06b6d4]"></div>
                                        {/if}
                                    </button>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div class="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-goclaw-neon-purple/50 transition-colors">
                                            {#if c.avatar_url}
                                                <img src={c.avatar_url} alt="" class="h-full w-full object-cover" />
                                            {:else}
                                                <User size={18} class="text-white/20 group-hover:text-goclaw-neon-purple transition-colors" />
                                            {/if}
                                        </div>
                                        <div class="flex flex-col min-w-0">
                                            <span class="font-bold text-white truncate">{c.display_name || c.username || c.sender_id}</span>
                                            <span class="text-[10px] font-mono text-white/30 truncate uppercase tracking-widest">{c.sender_id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <Badge class="bg-white/5 border-white/10 text-white/60 font-mono text-[9px] uppercase tracking-widest">
                                            {c.channel_type}
                                        </Badge>
                                        {#if c.merged_id}
                                            <div class="h-4 w-4 rounded-full bg-goclaw-neon-purple/20 flex items-center justify-center text-goclaw-neon-purple" title="Contacto Fusionado">
                                                <Merge size={10} />
                                            </div>
                                        {/if}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    {#if c.contact_type === 'user'}
                                        <User size={14} class="text-goclaw-neon-cyan" />
                                    {:else if c.contact_type === 'group'}
                                        <Building size={14} class="text-amber-400" />
                                    {:else}
                                        <MessageSquare size={14} class="text-goclaw-neon-purple" />
                                    {/if}
                                </td>
                                <td class="px-6 py-4 text-right text-[11px] font-mono text-white/30 uppercase">
                                    {formatDate(c.first_seen_at)}
                                </td>
                                <td class="px-6 py-4 text-right text-[11px] font-mono text-white/30 uppercase">
                                    {formatDate(c.last_seen_at)}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
  </div>

  <MergeContactsDialog
    open={mergeDialogOpen}
    onOpenChange={(v) => mergeDialogOpen = v}
    selectedContacts={selectedContacts}
    onSuccess={() => {
        selectedIds = new Set();
        refresh();
    }}
  />
</div>

<style>
    option {
        background-color: #030014;
        color: white;
    }
</style>
