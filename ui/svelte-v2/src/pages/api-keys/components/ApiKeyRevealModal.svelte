<script lang="ts">
  import { X, Copy, Check, AlertOctagon, Key } from "lucide-svelte";
  import { scale } from "svelte/transition";
  import type { ApiKeyCreateResponse } from "$lib/state/api-keys.svelte.ts";

  type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    response: ApiKeyCreateResponse | null;
  };

  let { open, onOpenChange, response }: Props = $props();

  let copied = $state(false);

  function copyKey() {
    if (!response) return;
    navigator.clipboard.writeText(response.key);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

</script>

{#if open && response}
  <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/90 backdrop-blur-2xl" onclick={() => onOpenChange(false)}></div>

    <div class="relative bg-black border border-amber-500/20 rounded-3xl shadow-[0_0_100px_rgba(245,158,11,0.2)] flex flex-col w-full max-w-2xl overflow-hidden" in:scale={{start: 0.9}}>
      
      <!-- Scanline effect -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl mix-blend-screen opacity-30">
        <div class="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
      </div>

      <div class="p-8 relative z-10 flex flex-col items-center text-center">
        <div class="h-16 w-16 mb-6 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
          <Key class="h-8 w-8" />
        </div>
        
        <h2 class="text-xl font-black text-white tracking-[0.4em] uppercase mb-2">Cryptographic Key Generated</h2>
        <p class="text-xs text-amber-500/70 uppercase tracking-widest max-w-md">
          {response.name}
        </p>
      </div>

      <div class="px-8 pb-8 relative z-10 space-y-6">
        
        <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertOctagon class="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div class="text-left">
            <h4 class="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Critical Warning</h4>
            <p class="text-xs text-red-500/70 leading-relaxed">
              This raw key will never be displayed again. If you lose it, you must revoke this key and generate a new one. Copy it to your secure vault immediately.
            </p>
          </div>
        </div>

        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 blur opacity-50"></div>
          <div class="relative bg-[#050505] border border-amber-500/30 rounded-2xl p-6 flex flex-col gap-4">
            <div class="font-mono text-xl sm:text-2xl text-amber-400 break-all text-center selection:bg-amber-500/30">
              {response.key}
            </div>
            <button onclick={copyKey} class="mx-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-black text-[10px] uppercase tracking-widest transition-all">
              {#if copied}
                <Check class="h-4 w-4" /> Copied to Clipboard
              {:else}
                <Copy class="h-4 w-4" /> Copy Raw Key
              {/if}
            </button>
          </div>
        </div>

      </div>

      <div class="p-6 border-t border-amber-500/10 bg-[#050505] flex justify-center relative z-10">
        <button onclick={() => onOpenChange(false)} class="px-10 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-colors border border-white/10">
          I Have Saved It Safely
        </button>
      </div>

    </div>
  </div>
{/if}
