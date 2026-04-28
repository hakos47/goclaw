import { useWs } from "../../../lib/state/ws.svelte";
import { authState } from "../../../lib/state/auth.svelte";

export interface PendingPairing {
  code: string;
  sender_id: string;
  channel: string;
  chat_id: string;
  account_id: string;
  created_at: number;
  expires_at: number;
}

export interface PairedDevice {
  sender_id: string;
  channel: string;
  chat_id: string;
  paired_at: number;
  paired_by: string;
}

export function useNodes() {
  const ws = useWs();
  
  let pendingPairings = $state<PendingPairing[]>([]);
  let pairedDevices = $state<PairedDevice[]>([]);
  let loading = $state(true);

  async function load() {
    if (!authState.connected) return;
    loading = true;
    try {
      const res = await ws.call<{
        pending: PendingPairing[];
        paired: PairedDevice[];
      }>("device.pair.list");
      pendingPairings = res.pending ?? [];
      pairedDevices = res.paired ?? [];
    } catch (e) {
      console.error("Failed to load pairings", e);
    } finally {
      loading = false;
    }
  }

  // Effect to load data initially when connected
  $effect(() => {
    if (authState.connected) {
      load();
    }
  });

  // Listen to pairing events
  $effect(() => {
    const unsubReq = ws.on("device.pair_requested", () => {
      load();
    });
    const unsubRes = ws.on("device.pair_resolved", () => {
      load();
    });

    return () => {
      unsubReq();
      unsubRes();
    };
  });

  async function approvePairing(code: string) {
    try {
      await ws.call("device.pair.approve", { code });
      load();
    } catch (e) {
      console.error("Failed to approve pairing", e);
      throw e;
    }
  }

  async function denyPairing(code: string) {
    try {
      await ws.call("device.pair.deny", { code });
      load();
    } catch (e) {
      console.error("Failed to deny pairing", e);
      throw e;
    }
  }

  async function revokePairing(senderId: string, channel: string) {
    try {
      await ws.call("device.pair.revoke", { senderId, channel });
      load();
    } catch (e) {
      console.error("Failed to revoke pairing", e);
      throw e;
    }
  }

  return {
    get pendingPairings() { return pendingPairings; },
    get pairedDevices() { return pairedDevices; },
    get loading() { return loading; },
    refresh: load,
    approvePairing,
    denyPairing,
    revokePairing
  };
}
