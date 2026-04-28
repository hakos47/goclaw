import { useWs } from "./ws.svelte";
import { Methods } from "../api/protocol";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source?: string;
  attrs?: Record<string, any>;
  _id?: number;
}

const MAX_LOGS = 1000;
let logIdSeq = 0;

class LogsStore {
  logs = $state<LogEntry[]>([]);
  tailing = $state(false);
  level = $state<LogLevel>("debug");
  error = $state<string | null>(null);

  appendLog(entry: LogEntry) {
    (entry as any)._id = ++logIdSeq;
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }
  }

  async startTail(newLevel?: LogLevel) {
    const ws = useWs();
    if (!ws) return;
    
    const lvl = newLevel ?? this.level;
    this.error = null;
    try {
      await ws.call(Methods.LOGS_TAIL, { action: "start", level: lvl });
      this.tailing = true;
      this.level = lvl;
    } catch (e: any) {
      this.error = "logs.tail is not available on this backend.";
    }
  }

  async stopTail() {
    const ws = useWs();
    if (!ws) return;
    try {
      await ws.call(Methods.LOGS_TAIL, { action: "stop" });
    } catch {
      // ignore
    }
    this.tailing = false;
  }

  clear() {
    this.logs = [];
    this.error = null;
  }
  
  // Hydrate from localStorage is not typically done for raw system logs
  // because they are transient terminal outputs, but we keep the state alive 
  // globally while the SPA is running.
}

export const logsStore = new LogsStore();
