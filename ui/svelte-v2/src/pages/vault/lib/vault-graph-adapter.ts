import Graph from "graphology";
import type { VaultDocument, VaultLink } from "../../../types/vault";
import type { GraphNodeDTO, GraphEdgeDTO } from "../hooks/use-vault-graph-data.svelte";
import { getNodeSize, truncateMiddle } from "./graph-utils";

export const VAULT_TYPE_COLORS_DARK: Record<string, string> = {
  context: "#60a5fa",  // blue-400
  memory: "#c084fc",   // purple-400
  note: "#fbbf24",     // amber-400
  skill: "#34d399",    // emerald-400
  episodic: "#fb923c", // orange-400
  media: "#fb7185",    // rose-400
  document: "#22d3ee", // cyan-400
};
const DEFAULT_COLOR_DARK = "#94a3b8";  // slate-400

export function getVaultNodeColor(docType: string): string {
  // Always use dark mode colors for Bento Brutalist
  return VAULT_TYPE_COLORS_DARK[docType] ?? DEFAULT_COLOR_DARK;
}

export function buildVaultGraphFromDTO(nodes: GraphNodeDTO[], edges: GraphEdgeDTO[]): Graph {
  const graph = new Graph({ multi: false, type: "directed" });
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Compute degrees
  const deg = new Map<string, number>();
  for (const e of edges) {
    deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
    deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
  }

  for (const n of nodes) {
    const degree = deg.get(n.id) ?? 0;
    graph.addNode(n.id, {
      label: truncateMiddle(n.label || n.id.slice(0, 8), 28),
      x: 0, y: 0,
      size: getNodeSize(degree, nodes.length),
      color: VAULT_TYPE_COLORS_DARK[n.type] ?? DEFAULT_COLOR_DARK,
      docType: n.type,
    });
  }

  for (const e of edges) {
    if (nodeIds.has(e.source) && nodeIds.has(e.target) && !graph.hasEdge(e.source, e.target)) {
      graph.addEdgeWithKey(e.id, e.source, e.target, {
        label: e.type, 
        type: "curvedArrow",
        color: "rgba(255, 255, 255, 0.1)", // glassmorphism edge
        size: 0.4,
      });
    }
  }

  return graph;
}
