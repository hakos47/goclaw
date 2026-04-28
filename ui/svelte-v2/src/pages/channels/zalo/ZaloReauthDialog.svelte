<script lang="ts">
  import { X, RefreshCw, CheckCircle2, AlertCircle, Smartphone } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { useWs } from "$lib/state/ws.svelte";
  import { onMount, onDestroy } from "svelte";

  type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    instanceId: string;
    instanceName: string;
    onSuccess: () => void;
  };

  let { open, onOpenChange, instanceId, instanceName, onSuccess }: Props = $props();

  const ws = useWs();
  
  let qrPng = $state<string | null>(null);
  let status = $state<"idle" | "waiting" | "done" | "error">("idle");
  let errorMsg = $state("");
  let loading = $state(false);

  async function start() {
    if (!instanceId) return;
    status = "waiting";
    qrPng = null;
    errorMsg = "";
    loading = true;
    try {
      await ws.call("zalo.personal.qr.start", { instance_id: instanceId });
    } catch (err: any) {
      status = "error";
      errorMsg = err.message || "Failed to start QR session";
    } finally {
      loading = false;
    }
  }

  function reset() {
    status = "idle";
    qrPng = null;
    errorMsg = "";
  }

  let unsubCode: (() => void) | null = null;
  let unsubDone: (() => void) | null = null;

  onMount(() => {
    unsubCode = ws.on("zalo.personal.qr.code", (payload: any) => {
      if (payload.instance_id !== instanceId) return;
      qrPng = payload.png_b64;
      status = "waiting";
    });

    unsubDone = ws.on("zalo.personal.qr.done", (payload: any) => {
      if (payload.instance_id !== instanceId) return;
      if (payload.success) {
        status = "done";
        onSuccess();
        setTimeout(() => onOpenChange(false), 1500);
      } else {
        status = "error";
        errorMsg = payload.error || "QR authentication failed";
      }
    });
  });

  onDestroy(() => {
    unsubCode?.();
    unsubDone?.();
  });

  $effect(() => {
    if (open && status === "idle") start();
  });

  $effect(() => {
    if (!open) reset();
  });
</script>

{#if open}
  <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
    <button 
      onclick={() => !loading && onOpenChange(false)}
      class="absolute inset-0 bg-[#030014]/90 backdrop-blur-2xl transition-all duration-500 pointer-events-auto"
      aria-label="Close dialog"
    ></button>

    <div class="relative w-full max-w-md bg-[#030014]/95 border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
      <!-- Header -->
      <div class="relative px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Smartphone class="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 class="text-lg font-bold tracking-tight text-white uppercase tracking-tighter">Zalo Re-auth</h2>
            <p class="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-0.5">{instanceName}</p>
          </div>
        </div>
        <button 
          onclick={() => onOpenChange(false)}
          disabled={loading}
          class="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all disabled:opacity-20"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="px-8 py-10 flex flex-col items-center justify-center min-h-[320px] text-center">
        {#if status === "done"}
           <div class="space-y-4 animate-in fade-in scale-95 duration-500">
              <div class="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
                 <CheckCircle2 class="w-8 h-8 text-emerald-400" />
              </div>
              <p class="text-sm font-bold text-white tracking-widest uppercase">Connection Successful</p>
           </div>

        {:else if status === "error"}
           <div class="space-y-6 animate-in fade-in duration-500">
              <div class="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                 <AlertCircle class="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p class="text-sm font-bold text-red-400">Authentication Failed</p>
                <p class="text-xs text-white/40 mt-2 px-6">{errorMsg}</p>
              </div>
              <button 
                onclick={start}
                class="px-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Try Again
              </button>
           </div>

        {:else if status === "waiting"}
           <div class="space-y-8 animate-in fade-in duration-700">
              {#if qrPng}
                <div class="relative p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <img
                    src={`data:image/png;base64,${qrPng}`}
                    alt="Zalo QR Code"
                    class="w-48 h-48"
                  />
                </div>
                <p class="text-xs text-white/50 leading-relaxed max-w-[240px] mx-auto">
                  Scan this code with your Zalo mobile app.
                </p>
              {:else}
                <div class="space-y-4">
                  <RefreshCw class="w-10 h-10 text-sky-400/20 animate-spin mx-auto" />
                  <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Generating QR Code...</p>
                </div>
              {/if}
           </div>

        {:else}
           <div class="space-y-4">
              <div class="w-12 h-1 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin mx-auto"></div>
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Handshaking...</p>
           </div>
        {/if}
      </div>

      <div class="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-center shrink-0">
        <p class="text-[9px] font-mono text-white/20 uppercase tracking-widest">
          GoClaw Gateway Protocol v3.0 • Zalo Private Tunnel
        </p>
      </div>
    </div>
  </div>
{/if}
