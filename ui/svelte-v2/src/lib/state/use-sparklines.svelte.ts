import { useHttp } from "./ws.svelte";

interface TimeSeriesPoint {
  bucket_time: string;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  request_count: number;
}

interface SummaryData {
  requests: number;
  input_tokens: number;
  output_tokens: number;
  cost: number;
}

interface SummaryResponse {
  current: SummaryData;
  previous: SummaryData;
}

function computeTrend(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function useSparklines() {
  let requestSparkline = $state<number[]>([]);
  let tokenSparkline = $state<number[]>([]);
  let costSparkline = $state<number[]>([]);
  let trends = $state({ requests: 0, tokens: 0, cost: 0 });
  let loading = $state(false);

  async function load() {
    loading = true;
    try {
      const http = useHttp();
      const now = new Date();
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // In the React codebase, the endpoints are mapped via the HTTP client, we replicate here
      // But we pass URL params by appending them since the original TS client might expect it or handle it.
      // Svelte's HTTP client implementation signature: get(path, params)
      const tsRes = await http.get<{ points: TimeSeriesPoint[] }>("/v1/usage/timeseries", {
        from: from.toISOString(),
        to: now.toISOString(),
        group_by: "hour"
      });

      const sumRes = await http.get<SummaryResponse>("/v1/usage/summary", { period: "today" });

      const points = tsRes.points ?? [];
      
      requestSparkline = points.map((p) => p.request_count);
      tokenSparkline = points.map((p) => p.input_tokens + p.output_tokens);
      costSparkline = points.map((p) => p.total_cost);

      trends.requests = computeTrend(sumRes.current.requests, sumRes.previous.requests) || 0;
      trends.tokens = computeTrend(
        sumRes.current.input_tokens + sumRes.current.output_tokens,
        sumRes.previous.input_tokens + sumRes.previous.output_tokens
      ) || 0;
      trends.cost = computeTrend(sumRes.current.cost, sumRes.previous.cost) || 0;

    } catch (e) {
      console.error("Failed to load sparklines", e);
    } finally {
      loading = false;
    }
  }

  return {
    get requestSparkline() { return requestSparkline; },
    get tokenSparkline() { return tokenSparkline; },
    get costSparkline() { return costSparkline; },
    get trends() { return trends; },
    get loading() { return loading; },
    load
  };
}
