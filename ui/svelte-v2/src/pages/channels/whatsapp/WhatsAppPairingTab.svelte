<script lang="ts">
  import { Play, RefreshCw, CheckCircle2, AlertCircle, Smartphone } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { useWhatsAppQrLogin } from "./use-whatsapp-qr-login.svelte";

  type Props = {
    instanceId: string;
    onSuccess: () => void;
  };

  let { instanceId, onSuccess }: Props = $props();

  const qrFlow = useWhatsAppQrLogin(instanceId);

  function handleStart() {
    qrFlow.start();
  }

  $effect(() => {
    if (qrFlow.status === "done") {
      onSuccess();
    }
  });
</script>

<div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden">
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Smartphone class="w-6 h-6 text-emerald-400" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-white tracking-tight">WhatsApp Pairing</h3>
        <p class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Device Linkage</p>
      </div>
    </div>
  </div>

  <div class="flex flex-col items-center justify-center min-h-[320px] text-center border border-white/5 rounded-3xl bg-black/20 p-8 relative">
    {#if qrFlow.status === "idle"}
      <div class="space-y-6 animate-in fade-in duration-500">
        <div class="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
           <Smartphone class="w-10 h-10 text-emerald-400" />
        </div>
        <div>
          <p class="text-sm font-bold text-emerald-400">Ready to Pair</p>
          <p class="text-xs text-white/40 mt-2 max-w-[280px] mx-auto leading-relaxed">
            Click the button below to generate a QR code and link your WhatsApp device to this channel.
          </p>
        </div>
        <button 
          onclick={handleStart}
          class="px-8 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2 mx-auto"
        >
          <Play class="w-4 h-4" />
          Start Pairing Session
        </button>
      </div>

    {:else if qrFlow.status === "connected"}
      <div class="space-y-6 animate-in fade-in duration-500">
        <div class="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
           <CheckCircle2 class="w-10 h-10 text-emerald-400" />
        </div>
        <div>
          <p class="text-sm font-bold text-emerald-400">Already Connected</p>
          <p class="text-xs text-white/40 mt-2 max-w-[280px] mx-auto leading-relaxed">
            This channel instance is already linked and active.
          </p>
        </div>
        <button 
          onclick={qrFlow.triggerReauth}
          class="px-8 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all mx-auto block"
        >
          Force Relink Device
        </button>
      </div>

    {:else if qrFlow.status === "done"}
       <div class="space-y-4 animate-in fade-in duration-500">
          <div class="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
             <CheckCircle2 class="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <p class="text-sm font-bold text-white tracking-widest uppercase">Connection Successful</p>
            <p class="text-xs text-white/40 mt-2">The device is now linked.</p>
          </div>
          <button 
            onclick={qrFlow.reset}
            class="px-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all mx-auto block mt-4"
          >
            Pair Another Device
          </button>
       </div>

    {:else if qrFlow.status === "error"}
       <div class="space-y-6 animate-in fade-in duration-500">
          <div class="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.2)]">
             <AlertCircle class="w-10 h-10 text-red-400" />
          </div>
          <div>
            <p class="text-sm font-bold text-red-400">Authentication Failed</p>
            <p class="text-xs text-white/40 mt-2 px-6 max-w-sm mx-auto">{qrFlow.errorMsg}</p>
          </div>
          <button 
            onclick={() => qrFlow.retry()}
            class="px-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all mx-auto block"
          >
            Try Again
          </button>
       </div>

    {:else if qrFlow.status === "waiting"}
       <div class="space-y-8 animate-in fade-in duration-700">
          {#if qrFlow.qrPng}
            <div class="relative group inline-block">
              <div class="absolute -inset-4 bg-emerald-500/5 rounded-3xl blur-2xl group-hover:bg-emerald-500/10 transition-all duration-1000"></div>
              <div class="relative p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] inline-block">
                <img
                  src={`data:image/png;base64,${qrFlow.qrPng}`}
                  alt="WhatsApp QR Code"
                  class="w-64 h-64"
                />
              </div>
            </div>
            <p class="text-xs text-white/50 leading-relaxed max-w-[280px] mx-auto">
              Scan this code with your WhatsApp mobile app to link the device.
            </p>
          {:else}
            <div class="space-y-6">
              <RefreshCw class="w-12 h-12 text-emerald-400/20 animate-spin mx-auto" />
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Waiting for engine...</p>
                <p class="text-xs text-white/20 mt-2">Connecting to WhatsApp network</p>
              </div>
            </div>
          {/if}
       </div>

    {:else}
       <div class="space-y-6">
          <div class="w-16 h-1 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Initializing Handshake</p>
            <p class="text-xs text-white/20 mt-2">Preparing pairing session</p>
          </div>
       </div>
    {/if}
  </div>
</div>
