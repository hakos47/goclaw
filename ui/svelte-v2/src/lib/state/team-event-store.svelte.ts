import { Methods, Events, TEAM_RELATED_EVENTS } from "../api/protocol";

const MAX_EVENTS = 500;
const PERSIST_MAX = 50;

export interface TeamEventEntry {
  id: number;
  event: string;
  payload: unknown;
  timestamp: number;
  teamId: string | null;
  userId: string | null;
  chatId: string | null;
}

export function extractTeamId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.team_id === "string" && p.team_id) return p.team_id;
  if (typeof p.teamId === "string" && p.teamId) return p.teamId;
  return null;
}

export function extractUserId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.user_id === "string" && p.user_id) return p.user_id;
  if (typeof p.userId === "string" && p.userId) return p.userId;
  return null;
}

export function extractChatId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.chat_id === "string" && p.chat_id) return p.chat_id;
  if (typeof p.chatId === "string" && p.chatId) return p.chatId;
  return null;
}

const STORAGE_KEY = "goclaw:recentEvents";

class TeamEventStore {
  events = $state<TeamEventEntry[]>([]);
  paused = $state(false);
  private counter = 0;
  private wsCleanup: (() => void) | null = null;

  constructor() {
    console.log("[EventsStore] Constructor invoked");
    this.hydrate();
  }

  bind(ws: any) {
    if (!ws) return;
    if (this.wsCleanup) this.wsCleanup();
    
    console.log("[EventsStore] Binding to WebSocket wildcard listener");
    this.wsCleanup = ws.on("*", (raw: any) => {
      const { event, payload } = raw as { event: string; payload: unknown };
      
      // Capture ALL events for now to debug
      console.log(`[EventsStore] RECEIVED EVENT: ${event}`);
      
      /*
      if (!TEAM_RELATED_EVENTS.has(event)) {
         return;
      }
      */
      
      if (event === "agent") {
        const p = payload as { type?: string };
        if (p.type === "chunk" || p.type === "thinking") return;
      }
      
      this.addEvent(event, payload);
    });
  }

  hydrate() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const eventsArray = parsed?.state?.events || parsed?.events;
        if (Array.isArray(eventsArray)) {
          this.events = eventsArray;
          console.log(`[EventsStore] Hydrated ${this.events.length} events`);
          if (this.events.length > 0) {
            this.counter = Math.max(...this.events.map(e => e.id), 0);
          }
        }
      }
    } catch (e) {
      console.error("Failed to hydrate team event store", e);
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      const toSave = {
        state: {
          events: this.events.slice(-PERSIST_MAX),
        },
        version: 0
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to persist team event store", e);
    }
  }

  addEvent(event: string, payload: unknown) {
    if (this.paused) return;

    this.counter++;
    const entry: TeamEventEntry = {
      id: this.counter,
      event,
      payload,
      timestamp: Date.now(),
      teamId: extractTeamId(payload),
      userId: extractUserId(payload),
      chatId: extractChatId(payload),
    };

    // Use reassignment for Svelte 5 reactivity
    this.events = [entry, ...this.events].slice(0, MAX_EVENTS);
    console.log(`[EventsStore] Event added! Total: ${this.events.length}`);
    this.persist();
  }

  clear() {
    this.events = [];
    this.persist();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }
}

// Ensure singleton across HMR
const globalAny = (typeof window !== "undefined" ? window : {}) as any;
if (!globalAny.__TEAM_EVENT_STORE__) {
  globalAny.__TEAM_EVENT_STORE__ = new TeamEventStore();
}

export const teamEventStore: TeamEventStore = globalAny.__TEAM_EVENT_STORE__;
