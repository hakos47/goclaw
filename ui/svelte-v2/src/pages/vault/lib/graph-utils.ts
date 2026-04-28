import louvain from "graphology-communities-louvain";
import type Graph from "graphology";

const COMMUNITY_PALETTE = [
  "#e6194B", "#3cb44b", "#4363d8", "#f58231",
  "#42d4f4", "#f032e6", "#bfef45", "#fabed4",
  "#469990", "#dcbeff", "#9A6324", "#ffe119",
  "#800000", "#aaffc3", "#808000", "#000075",
] as const;

export function assignCommunityColors(graph: Graph): void {
  if (graph.order === 0) return;
  const communities = louvain(graph, { resolution: 1.0 });
  graph.forEachNode((node) => {
    const c = communities[node] ?? 0;
    graph.setNodeAttribute(node, "community", c);
    graph.setNodeAttribute(node, "color", COMMUNITY_PALETTE[c % COMMUNITY_PALETTE.length]);
  });
}

export function getCommunityColor(idx: number): string {
  return COMMUNITY_PALETTE[idx % COMMUNITY_PALETTE.length]!;
}

export function getNodeSize(degree: number, nodeCount = 200): number {
  const s = nodeCount < 100 ? 1.0 : nodeCount < 500 ? 0.6 : nodeCount < 2000 ? 0.4 : 0.3;
  const base = 3 * s;
  if (degree === 0) return base;
  return base + Math.min(Math.log2(degree + 1) * 1.2 * s, 5 * s);
}

export function truncateMiddle(str: string, maxLength = 28): string {
  if (!str || str.length <= maxLength) return str;
  const keepStart = Math.ceil((maxLength - 1) * 0.6);
  const keepEnd = Math.floor((maxLength - 1) * 0.4);
  return `${str.slice(0, keepStart)}…${str.slice(-keepEnd)}`;
}

export function getFA2WorkerSettings(nodeCount: number, orphanRatio: number) {
  const baseScaling = nodeCount < 200 ? 5 : nodeCount < 1000 ? 10 : 20;
  return {
    settings: {
      linLogMode: false,
      outboundAttractionDistribution: true,
      gravity: 0.5 + orphanRatio * 2.0,
      scalingRatio: baseScaling + (1 - orphanRatio) * 5,
      strongGravityMode: false,
      slowDown: 5,
      barnesHutOptimize: nodeCount > 50,
      barnesHutTheta: 0.5,
      edgeWeightInfluence: 0,
      adjustSizes: true,
    },
    durationMs: nodeCount < 200 ? 2000 :
                nodeCount < 1000 ? 3500 :
                nodeCount < 5000 ? 5000 : 8000,
  };
}

export const ZOOM_TIERS = {
  FAR: 0.6,
  MID: 0.3,
  NEAR: 0.12,
} as const;

export const TIER_MIN_DEGREE = {
  FAR: 2,
  MID: 1,
  NEAR: 0,
} as const;

export const TIER_EDGE_DEGREE = {
  FAR: Infinity,
  MID: 6,
  NEAR: 2,
} as const;

export const SIGMA_SETTINGS = {
  labelRenderedSizeThreshold: 14,
  labelDensity: 0.04,
  labelGridCellSize: 200,
  defaultEdgeColor: "#334155",
  minCameraRatio: 0.02,
  maxCameraRatio: 8,
} as const;
