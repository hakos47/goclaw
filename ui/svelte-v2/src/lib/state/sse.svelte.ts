export interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
  current?: number;
  total?: number;
  errorMessage?: string;
}

export interface SseCompleteEvent {
  download_url?: string;
  file_size?: number;
  file_name?: string;
  agent_id?: string;
  agent_key?: string;
  summary?: Record<string, number>;
  [key: string]: unknown;
}

interface SseErrorEvent {
  phase: string;
  detail: string;
  rolled_back: boolean;
  cleanup?: { db?: string; files?: string };
}

export type SseStatus = "idle" | "running" | "complete" | "error";

interface SseProgressEvent {
  phase: string;
  status: "running" | "done" | "error";
  detail?: string;
  current?: number;
  total?: number;
}

export class SseProgress {
  steps = $state<ProgressStep[]>([]);
  status = $state<SseStatus>("idle");
  error = $state<SseErrorEvent | null>(null);
  elapsed = $state(0);
  result = $state<SseCompleteEvent | null>(null);

  private abortController: AbortController | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private authHeadersFn: () => Record<string, string>;

  constructor(authHeadersFn: () => Record<string, string>) {
    this.authHeadersFn = authHeadersFn;
  }

  private cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startTimer() {
    const t0 = Date.now();
    this.timer = setInterval(() => {
      this.elapsed = Math.floor((Date.now() - t0) / 1000);
    }, 1000);
  }

  private handleProgress(evt: SseProgressEvent) {
    const idx = this.steps.findIndex((s) => s.id === evt.phase);
    const step: ProgressStep = {
      id: evt.phase,
      label: evt.phase.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      status: evt.status === "error" ? "error" : evt.status === "done" ? "done" : "running",
      detail: evt.detail,
      current: evt.current,
      total: evt.total,
    };
    
    if (idx >= 0) {
      this.steps[idx] = step;
    } else {
      this.steps = [...this.steps, step];
    }
  }

  private async processStream(res: Response) {
    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let eventType = "";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.slice(6);
          } else if (line === "" && eventType && dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (eventType === "progress") {
                this.handleProgress(data as SseProgressEvent);
              } else if (eventType === "complete") {
                this.result = data as SseCompleteEvent;
                this.status = "complete";
                this.cleanup();
              } else if (eventType === "error") {
                this.error = data as SseErrorEvent;
                this.status = "error";
                this.cleanup();
              }
            } catch { /* skip malformed */ }
            eventType = "";
            dataStr = "";
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        this.error = { phase: "connection", detail: (e as Error).message, rolled_back: false };
        this.status = "error";
      }
    } finally {
      this.cleanup();
    }
  }

  private async doFetch(url: string, init: RequestInit) {
    this.abortController?.abort();
    this.abortController = new AbortController();

    this.steps = [];
    this.status = "running";
    this.error = null;
    this.result = null;
    this.elapsed = 0;
    this.startTimer();

    try {
      const res = await fetch(url, { ...init, signal: this.abortController.signal });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        const detail = typeof err.error === "string" ? err.error : err.error?.message ?? res.statusText;
        this.error = { phase: "request", detail, rolled_back: false };
        this.status = "error";
        this.cleanup();
        return;
      }
      await this.processStream(res);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        this.error = { phase: "network", detail: (e as Error).message, rolled_back: false };
        this.status = "error";
        this.cleanup();
      }
    }
  }

  startGet(url: string) {
    this.doFetch(url, { method: "GET", headers: this.authHeadersFn() });
  }

  startPost(url: string, body: FormData) {
    this.doFetch(url, { method: "POST", headers: this.authHeadersFn(), body });
  }

  cancel() {
    this.abortController?.abort();
    this.cleanup();
    if (this.status === "running") {
      this.status = "error";
      this.error = { phase: "cancelled", detail: "Operation cancelled by user", rolled_back: false };
    }
  }

  reset() {
    this.abortController?.abort();
    this.cleanup();
    this.steps = [];
    this.status = "idle";
    this.error = null;
    this.result = null;
    this.elapsed = 0;
  }
}
