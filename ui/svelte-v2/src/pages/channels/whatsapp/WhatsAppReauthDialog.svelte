<script lang="ts">
  import { X, RefreshCw, CheckCircle2, AlertCircle, Smartphone } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { useWhatsAppQrLogin } from "./use-whatsapp-qr-login.svelte";

  type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    instanceId: string;
    instanceName: string;
    onSuccess: () => void;
  };

  let { open, onOpenChange, instanceId, instanceName, onSuccess }: Props = $props();

  const qrFlow = useWhatsAppQrLogin(instanceId);

  $effect(() => {
    if (open && qrFlow.status === "idle") {
      qrFlow.start();
    }
  });

  $effect(() => {
    if (!open) {
      qrFlow.reset();
    }
  });

  $effect(() => {
    if (qrFlow.status === "done") {
      onSuccess();
      const id = setTimeout(() => onOpenChange(false), 1500);
      return () => clearTimeout(id);
    }
  });
</script>

{#if open}
  <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
    <button 
      onclick={() => !qrFlow.loading && onOpenChange(false)}
      class="absolute inset-0 bg-[#030014]/90 backdrop-blur-2xl transition-all duration-500 pointer-events-auto"
      aria-label="Close dialog"
    ></button>

    <div class="relative w-full max-w-md bg-[#030014]/95 border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
      <!-- Glow Effects -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-goclaw-neon-purple/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <!-- Header -->
      <div class="relative px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Smartphone class="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 class="text-lg font-bold tracking-tight text-white uppercase tracking-tighter">WhatsApp Re-auth</h2>
            <p class="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-0.5">{instanceName}</p>
          </div>
        </div>
        <button 
          onclick={() => onOpenChange(false)}
          disabled={qrFlow.loading}
          class="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all disabled:opacity-20"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="px-8 py-10 flex flex-col items-center justify-center min-h-[320px] text-center">
        {#if qrFlow.status === "connected"}
          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
               <CheckCircle2 class="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <p class="text-sm font-bold text-emerald-400">Already Connected</p>
              <p class="text-xs text-white/40 mt-2 max-w-[240px] mx-auto leading-relaxed">
                This channel instance is already linked and active.
              </p>
            </div>
            <div class="flex flex-col gap-2 pt-4">
              <button 
                onclick={qrFlow.triggerReauth}
                class="px-8 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
              >
                Force Relink Device
              </button>
              <button 
                onclick={() => onOpenChange(false)}
                class="px-8 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>

        {:else if qrFlow.status === "done"}
           <div class="space-y-4 animate-in fade-in scale-95 duration-500">
              <div class="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
                 <CheckCircle2 class="w-8 h-8 text-emerald-400" />
              </div>
              <p class="text-sm font-bold text-white tracking-widest uppercase">Connection Successful</p>
           </div>

        {:else if qrFlow.status === "error"}
           <div class="space-y-6 animate-in fade-in duration-500">
              <div class="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                 <AlertCircle class="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p class="text-sm font-bold text-red-400">Authentication Failed</p>
                <p class="text-xs text-white/40 mt-2 px-6">{qrFlow.errorMsg}</p>
              </div>
              <button 
                onclick={() => qrFlow.retry()}
                class="px-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Try Again
              </button>
           </div>

        {:else if qrFlow.status === "waiting"}
           <div class="space-y-8 animate-in fade-in duration-700">
              {#if qrFlow.qrPng}
                <div class="relative group">
                  <div class="absolute -inset-4 bg-emerald-500/5 rounded-3xl blur-2xl group-hover:bg-emerald-500/10 transition-all duration-1000"></div>
                  <div class="relative p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <img
                      src={`data:image/png;base64,${qrFlow.qrPng}`}
                      alt="WhatsApp QR Code"
                      class="w-48 h-48"
                    />
                  </div>
                </div>
                <p class="text-xs text-white/50 leading-relaxed max-w-[240px] mx-auto">
                  Scan this code with your WhatsApp mobile app to link the device.
                </p>
              {:else}
                <div class="space-y-4">
                  <RefreshCw class="w-10 h-10 text-emerald-400/20 animate-spin mx-auto" />
                  <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Waiting for engine...</p>
                </div>
              {/if}
           </div>

        {:else}
           <div class="space-y-4">
              <div class="w-12 h-1 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Initializing Handshake</p>
           </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-center shrink-0">
        <p class="text-[9px] font-mono text-white/20 uppercase tracking-widest">
          GoClaw Gateway Protocol v3.0 • Secure Tunnel Active
        </p>
      </div>
    </div>
  </div>
{/if}
