<script lang="ts">
  import { Merge, UserPlus, Link, X, Check, Loader2 } from "lucide-svelte";
  import { useContactMerge } from "./hooks/use-contact-merge.svelte";
  import UserPickerCombobox from "../agents/components/agent-detail/UserPickerCombobox.svelte";
  import { Badge } from "$lib/components/ui/badge";
  import type { ChannelContact } from "$lib/types/contact";

  let { open, onOpenChange, selectedContacts, onSuccess } = $props<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedContacts: ChannelContact[];
    onSuccess: () => void;
  }>();

  const { merge } = useContactMerge();

  let mode = $state<"existing" | "create">("existing");
  let selectedUserId = $state("");
  let newDisplayName = $state("");
  let newUserId = $state("");
  let submitting = $state(false);

  // Derive default user_id from first contact
  let defaultUserId = $derived(selectedContacts[0]?.username || selectedContacts[0]?.sender_id || "");

  $effect(() => {
    if (open) {
      mode = "existing";
      selectedUserId = "";
      newDisplayName = "";
      newUserId = "";
    }
  });

  async function handleSubmit() {
    const contactIds = selectedContacts.map(c => c.id);
    submitting = true;
    try {
      if (mode === "existing") {
        if (!selectedUserId) return;
        await merge({ contact_ids: contactIds, tenant_user_id: selectedUserId });
      } else {
        const userId = newUserId || defaultUserId;
        if (!userId) return;
        await merge({
          contact_ids: contactIds,
          create_user: {
            user_id: userId,
            display_name: newDisplayName || undefined,
          },
        });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      submitting = false;
    }
  }

  const canSubmit = $derived(mode === "existing" ? !!selectedUserId : !!(newUserId || defaultUserId));
</script>

{#if open}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick={() => onOpenChange(false)}></div>
    
    <div class="relative w-full max-w-md rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <div class="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-goclaw-neon-purple/20 text-goclaw-neon-purple">
            <Merge size={18} />
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">Fusionar Contactos</h3>
            <p class="text-xs text-white/40">Vincula múltiples identidades a un usuario único.</p>
          </div>
        </div>
        <button onclick={() => onOpenChange(false)} class="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div class="p-6 space-y-6">
        <div class="space-y-4">
          <!-- Option 1: Existing -->
          <label class={`flex flex-col gap-3 p-4 rounded-xl border transition-all cursor-pointer ${mode === 'existing' ? 'bg-goclaw-neon-purple/5 border-goclaw-neon-purple/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
            <div class="flex items-center gap-3">
              <input type="radio" name="mergeMode" value="existing" bind:group={mode} class="accent-goclaw-neon-purple" />
              <div class="flex items-center gap-2">
                <Link size={14} class={mode === 'existing' ? 'text-goclaw-neon-purple' : 'text-white/40'} />
                <span class="text-sm font-bold text-white/80">Vincular a Usuario Existente</span>
              </div>
            </div>
            
            {#if mode === 'existing'}
              <div class="pl-7 animate-in fade-in slide-in-from-top-1 duration-300">
                <UserPickerCombobox
                  bind:value={selectedUserId}
                  placeholder="Seleccionar usuario o contacto..."
                  valueMode="uuid"
                />
              </div>
            {/if}
          </label>

          <!-- Option 2: Create New -->
          <label class={`flex flex-col gap-3 p-4 rounded-xl border transition-all cursor-pointer ${mode === 'create' ? 'bg-goclaw-neon-cyan/5 border-goclaw-neon-cyan/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
            <div class="flex items-center gap-3">
              <input type="radio" name="mergeMode" value="create" bind:group={mode} class="accent-goclaw-neon-cyan" />
              <div class="flex items-center gap-2">
                <UserPlus size={14} class={mode === 'create' ? 'text-goclaw-neon-cyan' : 'text-white/40'} />
                <span class="text-sm font-bold text-white/80">Crear Nueva Identidad</span>
              </div>
            </div>
            
            {#if mode === 'create'}
              <div class="pl-7 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                <div class="space-y-1.5">
                  <span class="text-[10px] font-black uppercase tracking-widest text-white/30">Nombre a Mostrar</span>
                  <input 
                    bind:value={newDisplayName}
                    placeholder="Ej. Williams Lozano"
                    class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-goclaw-neon-cyan/50 outline-none transition-all"
                  />
                </div>
                <div class="space-y-1.5">
                  <span class="text-[10px] font-black uppercase tracking-widest text-white/30">ID de Usuario (Unique)</span>
                  <input 
                    bind:value={newUserId}
                    placeholder={defaultUserId || "ID del sistema"}
                    class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-goclaw-neon-cyan/50 outline-none transition-all"
                  />
                  {#if !newUserId && defaultUserId}
                    <p class="text-[9px] text-white/20 italic">Sugerencia: {defaultUserId}</p>
                  {/if}
                </div>
              </div>
            {/if}
          </label>
        </div>

        <div class="p-3 rounded-lg bg-black/40 border border-white/5">
            <span class="text-[10px] font-bold text-white/30 uppercase tracking-widest">Resumen de Selección</span>
            <div class="mt-2 flex flex-wrap gap-1.5">
                {#each selectedContacts.slice(0, 3) as c}
                    <Badge variant="secondary" class="bg-white/5 border-white/10 text-[9px] py-0">{c.display_name || c.sender_id}</Badge>
                {/each}
                {#if selectedContacts.length > 3}
                    <Badge variant="outline" class="text-[9px] border-white/5 text-white/20">+{selectedContacts.length - 3} más</Badge>
                {/if}
            </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-white/[0.01]">
        <button 
          onclick={() => onOpenChange(false)}
          class="px-4 py-2 text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest"
        >
          Cancelar
        </button>
        <button 
          onclick={handleSubmit}
          disabled={!canSubmit || submitting}
          class="flex items-center gap-2 px-6 py-2 rounded-xl bg-goclaw-neon-purple text-white text-xs font-bold uppercase tracking-widest hover:brightness-125 disabled:opacity-30 transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] cursor-pointer"
        >
          {#if submitting}
            <Loader2 size={14} class="animate-spin" />
            Procesando
          {:else}
            <Check size={14} />
            Confirmar Fusión
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
