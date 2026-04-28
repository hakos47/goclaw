import { wsState, useWsCall, useWs } from "./ws.svelte";
import { Methods, Events } from "../api/protocol";

export interface PendingApproval {
  id: string;
  command: string;
  agentId: string;
  createdAt: number;
}

class ApprovalsStore {
  pending = $state<PendingApproval[]>([]);
  loading = $state(true);
  error = $state<string | null>(null);

  async load() {
    if (!wsState.connected) return;
    this.loading = true;
    this.error = null;
    try {
      const ws = useWs();
      const res = await ws.call<{ pending: PendingApproval[] }>(Methods.APPROVALS_LIST);
      this.pending = res.pending || [];
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to load approvals";
    } finally {
      this.loading = false;
    }
  }

  async approve(id: string, always = false) {
    const ws = useWs();
    await ws.call(Methods.APPROVALS_APPROVE, { id, always });
    this.pending = this.pending.filter((a) => a.id !== id);
  }

  async deny(id: string) {
    const ws = useWs();
    await ws.call(Methods.APPROVALS_DENY, { id });
    this.pending = this.pending.filter((a) => a.id !== id);
  }

  bind() {
    const ws = useWs();
    
    // Setup listeners
    const handleEvent = () => {
      this.load();
    };

    const unsub1 = ws.on(Events.EXEC_APPROVAL_REQUESTED, handleEvent);
    const unsub2 = ws.on(Events.EXEC_APPROVAL_RESOLVED, handleEvent);

    return () => {
      unsub1();
      unsub2();
    };
  }
}

export const approvalsStore = new ApprovalsStore();
