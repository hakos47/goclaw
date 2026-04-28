<script lang="ts">
  import { X, KeyRound, Server, AlertTriangle, Building2 } from "lucide-svelte";
  import { authState } from "../../../lib/state/auth.svelte.ts";
  import { createApiKey, type ApiKeyCreateInput, type ApiKeyCreateResponse } from "$lib/state/api-keys.svelte.ts";
  import { scale } from "svelte/transition";

  type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onCreated: (res: ApiKeyCreateResponse) => void;
  };

  let { open, onOpenChange, onCreated }: Props = $props();

  const SYSTEM_TENANT = "__system__";

  let name = $state("");
  let scopesInput = $state("");
  let expiresInDays = $state<number | "">("");
  let selectedTenant = $state(authState.tenantId || SYSTEM_TENANT);

  let saving = $state(false);
  let errorMsg = $state("");

  async function handleSubmit() {
    if (!name.trim()) return;
    saving = true;
    errorMsg = "";
    try {
      const payload: ApiKeyCreateInput = {
        name: name.trim(),
        scopes: scopesInput.split(",").map(s => s.trim()).filter(Boolean),
      };

      if (authState.isOwner && selectedTenant !== SYSTEM_TENANT) {
        payload.tenant_id = selectedTenant;
      }

      if (expiresInDays !== "" && expiresInDays > 0) {
        payload.expires_in = expiresInDays * 24 * 60 * 60; // convert days to seconds
      }

      const res = await createApiKey(payload);
      onOpenChange(false);
      onCreated(res); // Trigger reveal modal
    } catch (e: any) {
      errorMsg = e.message || "Failed to create API key";
    } finally {
      saving = false;
    }
  }

</script>

{#if open}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-xl" onclick={() => !saving && onOpenChange(false)}></div>

    <div class="relative bg-gradient-to-br from-[#0a0500]/95 to-[#2a1b00]/90 border border-amber-500/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8),inset_0_2px_20px_rgba(251,191,36,0.05)] flex flex-col w-full max-w-xl max-h-[90vh] overflow-hidden" in:scale={{start: 0.95}} out:scale={{start: 0.95}}>
      
      <div class="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/10 blur-[100px] pointer-events-none"></div>

      <div class="flex items-center justify-between p-6 border-b border-amber-500/5 relative z-10">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30">
            <KeyRound class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-xs font-black text-white/90 tracking-[0.3em] uppercase">Generate Key</h2>
            <div class="text-[10px] text-amber-500/50 mt-1 uppercase tracking-widest">System Access Token</div>
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

        <div class="space-y-4">
          {#if authState.isOwner}
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Target Tenant</label>
              <div class="relative">
                <select 
                  bind:value={selectedTenant}
                  class="w-full h-11 px-4 bg-[#050505] border border-amber-500/10 rounded-xl text-white font-mono text-sm outline-none focus:border-amber-500/50 transition-colors appearance-none"
                >
                  <option value={SYSTEM_TENANT}>System (Global)</option>
                  {#each authState.availableTenants as tenant}
                    <option value={tenant.id}>{tenant.name} ({tenant.slug})</option>
                  {/each}
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500/40">
                  <Building2 class="w-4 h-4" />
                </div>
              </div>
            </div>
          {/if}

          <div class="space-y-2">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Key Name</label>
            <input type="text" bind:value={name} placeholder="e.g. Jenkins CI Deployment" class="w-full h-11 px-4 bg-[#050505] border border-amber-500/10 rounded-xl text-white font-mono text-sm outline-none focus:border-amber-500/50 transition-colors" />
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Scopes</label>
            <input type="text" bind:value={scopesInput} placeholder="e.g. read:nodes, write:hooks" class="w-full h-11 px-4 bg-[#050505] border border-amber-500/10 rounded-xl text-white font-mono text-sm outline-none focus:border-amber-500/50 transition-colors" />
            <p class="text-[9px] text-white/30 px-1 font-mono">Comma separated. Leave empty for all scopes (if allowed).</p>
          </div>

          <div class="space-y-2 pt-2">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Expiration (Days)</label>
            <input type="number" bind:value={expiresInDays} placeholder="Never expires" class="w-full h-11 px-4 bg-[#050505] border border-amber-500/10 rounded-xl text-amber-500 font-mono text-sm outline-none focus:border-amber-500/50 transition-colors" />
          </div>
          
          <div class="p-4 mt-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-3">
            <AlertTriangle class="h-5 w-5 text-amber-500 shrink-0" />
            <div class="text-[10px] text-amber-500/80 leading-relaxed">
              The raw API key will only be shown once after creation. Ensure you have a secure vault ready to store it.
            </div>
          </div>
        </div>

      </div>

      <div class="p-6 border-t border-amber-500/5 bg-black/40 flex justify-end gap-4 relative z-10 rounded-b-3xl">
        <button onclick={() => onOpenChange(false)} disabled={saving} class="px-6 h-10 rounded-xl border border-transparent text-white/50 hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest">
          Cancel
        </button>
        <button onclick={handleSubmit} disabled={saving || !name.trim()} class="relative px-8 h-10 flex items-center gap-2 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50">
          {#if saving}
            <Server class="h-4 w-4 animate-spin" /> Generating...
          {:else}
            <KeyRound class="h-4 w-4" /> Generate
          {/if}
        </button>
      </div>

    </div>
  </div>
{/if}
