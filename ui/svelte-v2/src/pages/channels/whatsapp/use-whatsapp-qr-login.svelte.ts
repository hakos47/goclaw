import { useWs } from "$lib/state/ws.svelte";
import { onMount, onDestroy } from "svelte";

export type QrStatus = "idle" | "waiting" | "done" | "connected" | "error";

export function useWhatsAppQrLogin(instanceId: string | null) {
  const ws = useWs();
  
  let qrPng = $state<string | null>(null);
  let status = $state<QrStatus>("idle");
  let errorMsg = $state("");
  let loading = $state(false);

  async function start(forceReauth = false) {
    if (!instanceId) return;
    status = "waiting";
    qrPng = null;
    errorMsg = "";
    loading = true;
    try {
      await ws.call("whatsapp.qr.start", { 
        instance_id: instanceId, 
        force_reauth: forceReauth 
      });
    } catch (err: any) {
      status = "error";
      errorMsg = err.message || "Failed to start QR session";
    } finally {
      loading = false;
    }
  }

  function triggerReauth() {
    return start(true);
  }

  function reset() {
    status = "idle";
    qrPng = null;
    errorMsg = "";
  }

  let unsubCode: (() => void) | null = null;
  let unsubDone: (() => void) | null = null;

  onMount(() => {
    unsubCode = ws.on("whatsapp.qr.code", (payload: any) => {
      if (payload.instance_id !== instanceId) return;
      qrPng = payload.png_b64;
      status = "waiting";
    });

    unsubDone = ws.on("whatsapp.qr.done", (payload: any) => {
      if (payload.instance_id !== instanceId) return;
      if (payload.success) {
        status = payload.already_connected ? "connected" : "done";
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

  return {
    get qrPng() { return qrPng; },
    get status() { return status; },
    get errorMsg() { return errorMsg; },
    get loading() { return loading; },
    start,
    reset,
    retry: start,
    triggerReauth,
  };
}
