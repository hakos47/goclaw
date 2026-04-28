import { useHttp, initClients } from "./ws.svelte";
import { subDays, subHours } from "date-fns";

export type Period = "24h" | "7d" | "30d" | "custom";

export interface UsageFilters {
  from: string;
  to: string;
  period: Period;
  agentId?: string;
  provider?: string;
  model?: string;
  channel?: string;
  granularity: "hour" | "day";
}

function buildTimeRange(period: Period): { from: string; to: string; granularity: "hour" | "day" } {
  const now = new Date();
  let from: Date;
  let granularity: "hour" | "day";
  if (period === "24h") {
    from = subHours(now, 24);
    granularity = "hour";
  } else if (period === "7d") {
    from = subDays(now, 7);
    granularity = "hour";
  } else {
    from = subDays(now, 30);
    granularity = "day";
  }
  return { from: from.toISOString(), to: now.toISOString(), granularity };
}

function defaultFilters(): UsageFilters {
  const { from, to, granularity } = buildTimeRange("7d");
  return { from, to, period: "7d", granularity };
}

export const usageState = $state({
  filters: defaultFilters(),
  timeseries: [] as any[],
  providerBreakdown: [] as any[],
  modelBreakdown: [] as any[],
  channelBreakdown: [] as any[],
  summary: null as any,
  records: [] as any[],
  totalRecords: 0,
  loading: false,
  error: null as Error | null
});

export function setPeriod(period: Period) {
  if (period === "custom") {
    usageState.filters.period = period;
    return;
  }
  const { from, to, granularity } = buildTimeRange(period);
  usageState.filters.from = from;
  usageState.filters.to = to;
  usageState.filters.period = period;
  usageState.filters.granularity = granularity;
  refreshUsage();
}

export function setFilter(key: keyof UsageFilters, value: string | undefined) {
    (usageState.filters as any)[key] = value;
    refreshUsage();
}

export function toggleFilter(key: "provider" | "model" | "channel" | "agentId", value: string) {
    if ((usageState.filters as any)[key] === value) {
        (usageState.filters as any)[key] = undefined;
    } else {
        (usageState.filters as any)[key] = value;
    }
    refreshUsage();
}

function buildParams(filters: UsageFilters, extra?: Record<string, string>): Record<string, string> {
  const p: Record<string, string> = {
    from: filters.from,
    to: filters.to,
  };
  if (filters.agentId) p.agent_id = filters.agentId;
  if (filters.provider) p.provider = filters.provider;
  if (filters.model) p.model = filters.model;
  if (filters.channel) p.channel = filters.channel;
  return { ...p, ...extra };
}

export async function loadRecords(opts?: { agentId?: string; limit?: number; offset?: number }) {
    usageState.loading = true;
    try {
        const { ws } = initClients();
        const res = await ws.call<{ records: any[]; total?: number }>("usage.get", {
            agentId: opts?.agentId,
            limit: opts?.limit || 20,
            offset: opts?.offset || 0,
        });
        usageState.records = res.records || [];
        usageState.totalRecords = res.total || 0;
    } catch (e: any) {
        console.error("Failed to load usage records", e);
    } finally {
        usageState.loading = false;
    }
}

function fillTimeSeries(points: any[], fromStr: string, toStr: string, granularity: "hour" | "day") {
  const fromTime = new Date(fromStr).getTime();
  const toTime = new Date(toStr).getTime();
  const filled = [];
  
  const step = granularity === "hour" ? 3600000 : 86400000;
  let curr = fromTime - (fromTime % step);
  const end = toTime - (toTime % step);

  const pointsMap = new Map();
  for (const p of points) {
    const pt = new Date(p.bucket_time).getTime();
    pointsMap.set(pt - (pt % step), p);
  }
  
  while (curr <= end) {
    if (pointsMap.has(curr)) {
      filled.push(pointsMap.get(curr));
    } else {
      filled.push({
        bucket_time: new Date(curr).toISOString(),
        request_count: 0, input_tokens: 0, output_tokens: 0,
        total_cost: 0, error_count: 0, llm_call_count: 0,
        tool_call_count: 0, avg_duration_ms: 0
      });
    }
    curr += step;
  }
  return filled;
}

export async function refreshUsage() {
    usageState.loading = true;
    try {
        const http = useHttp();
        const filters = usageState.filters;

        const [tsRes, providerRes, modelRes, channelRes, summaryRes] = await Promise.all([
            http.get<{ points: any[] }>("/v1/usage/timeseries", buildParams(filters, { group_by: filters.granularity })),
            http.get<{ rows: any[] }>("/v1/usage/breakdown", buildParams(filters, { group_by: "provider" })),
            http.get<{ rows: any[] }>("/v1/usage/breakdown", buildParams(filters, { group_by: "model" })),
            http.get<{ rows: any[] }>("/v1/usage/breakdown", buildParams(filters, { group_by: "channel" })),
            http.get<any>("/v1/usage/summary", buildParams(filters, { period: filters.period }))
        ]);

        usageState.timeseries = fillTimeSeries(tsRes.points || [], filters.from, filters.to, filters.granularity);
        usageState.providerBreakdown = providerRes.rows || [];
        usageState.modelBreakdown = modelRes.rows || [];
        usageState.channelBreakdown = channelRes.rows || [];
        usageState.summary = summaryRes || null;
        usageState.error = null;
        
        await loadRecords();
    } catch (e: any) {
        console.error("Failed to refresh usage", e);
        usageState.error = e;
    } finally {
        usageState.loading = false;
    }
}
