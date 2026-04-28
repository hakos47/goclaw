<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Sigma from "sigma";
  import forceAtlas2 from "graphology-layout-forceatlas2";
  import circular from "graphology-layout/circular";
  import Graph from "graphology";
  import { useKGGraph } from "../hooks/use-knowledge-graph.svelte";
  import { Loader2 } from "lucide-svelte";
  import type { KGEntity, KGRelation } from "../../../types/knowledge-graph";

  let {
    agentId,
    userId,
    query = "",
    onEntityClick
  } = $props<{
    agentId: string;
    userId?: string;
    query?: string;
    onEntityClick?: (entity: KGEntity) => void;
  }>();

  let container: HTMLDivElement;
  let sigmaInstance: Sigma | null = null;
  let graph: Graph | null = null;

  const graphStore = useKGGraph(() => agentId, () => userId);

  // Type Colors
  const KG_TYPE_COLORS: Record<string, string> = {
    person: "#fb7185",       // rose-400
    organization: "#60a5fa", // blue-400
    location: "#34d399",     // emerald-400
    project: "#c084fc",      // purple-400
    technology: "#22d3ee",   // cyan-400
    concept: "#fbbf24",      // amber-400
    event: "#fb923c",        // orange-400
  };
  const DEFAULT_COLOR = "#94a3b8"; // slate-400

  let filteredEntities = $derived.by(() => {
    if (!query) return graphStore.entities;
    const q = query.toLowerCase();
    return graphStore.entities.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.entity_type.toLowerCase().includes(q) ||
      (e.description || "").toLowerCase().includes(q)
    );
  });

  let filteredRelations = $derived.by(() => {
    if (!query) return graphStore.relations;
    const matchedIds = new Set(filteredEntities.map(e => e.id));
    return graphStore.relations.filter(r => 
      matchedIds.has(r.source_entity_id) && matchedIds.has(r.target_entity_id)
    );
  });

  $effect(() => {
    if (!graphStore.loading && filteredEntities.length > 0) {
      initGraph(filteredEntities, filteredRelations);
    }
  });

  function initGraph(entities: KGEntity[], relations: KGRelation[]) {
    if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
      setTimeout(() => initGraph(entities, relations), 100);
      return;
    }

    if (sigmaInstance) {
      sigmaInstance.kill();
      sigmaInstance = null;
    }
    
    graph = new Graph({ multi: false, type: "directed" });
    const entityMap = new Map(entities.map(e => [e.id, e]));

    // Compute degrees
    const deg = new Map<string, number>();
    for (const r of relations) {
      deg.set(r.source_entity_id, (deg.get(r.source_entity_id) ?? 0) + 1);
      deg.set(r.target_entity_id, (deg.get(r.target_entity_id) ?? 0) + 1);
    }

    // Add nodes
    for (const e of entities) {
      const degree = deg.get(e.id) ?? 0;
      // Simple size mapping
      const size = Math.max(3, Math.min(15, 3 + Math.sqrt(degree) * 2));
      
      graph.addNode(e.id, {
        label: e.name.length > 25 ? e.name.slice(0, 22) + "..." : e.name,
        x: 0, y: 0,
        size,
        color: KG_TYPE_COLORS[e.entity_type.toLowerCase()] ?? DEFAULT_COLOR,
      });
    }

    // Add edges
    const nodeIds = new Set(entities.map(e => e.id));
    for (const r of relations) {
      if (nodeIds.has(r.source_entity_id) && nodeIds.has(r.target_entity_id) && !graph.hasEdge(r.source_entity_id, r.target_entity_id)) {
        graph.addEdgeWithKey(r.id, r.source_entity_id, r.target_entity_id, {
          label: r.relation_type,
          type: "arrow",
          color: "rgba(255, 255, 255, 0.15)",
          size: 0.5,
        });
      }
    }

    // Layouts
    circular.assign(graph);
    const orphanRatio = graph.order > 0 ? (graph.order - graph.edges().length) / graph.order : 0;
    
    forceAtlas2.assign(graph, {
      iterations: 100,
      settings: {
        barnesHutOptimize: graph.order > 1000,
        strongGravityMode: true,
        gravity: 0.05 + orphanRatio * 0.1,
        scalingRatio: 10,
        slowDown: 1 + orphanRatio * 2,
      }
    });

    sigmaInstance = new Sigma(graph, container, {
      allowInvalidContainer: true,
      defaultEdgeType: "arrow",
      labelColor: { color: "#ffffff" },
      labelSize: 11,
      labelFont: "monospace",
      labelRenderedSizeThreshold: 1,
      labelDensityWeight: 0,
      renderLabels: true,
    });

    sigmaInstance.on("clickNode", (e) => {
      const ent = entityMap.get(e.node);
      if (ent) onEntityClick?.(ent);
    });

    // Semantic zoom effect (dim inactive nodes)
    let hoveredNode: string | null = null;
    
    sigmaInstance.on("enterNode", (e) => {
      hoveredNode = e.node;
      sigmaInstance?.refresh();
    });
    
    sigmaInstance.on("leaveNode", () => {
      hoveredNode = null;
      sigmaInstance?.refresh();
    });

    sigmaInstance.setSetting("nodeReducer", (node, data) => {
      const res = { ...data };
      if (hoveredNode) {
        if (node === hoveredNode || graph?.hasEdge(node, hoveredNode) || graph?.hasEdge(hoveredNode, node)) {
          res.color = data.color;
          res.zIndex = 1;
        } else {
          res.color = "rgba(255, 255, 255, 0.1)"; // dimmed
          res.zIndex = 0;
          res.label = "";
        }
      }
      return res;
    });

    sigmaInstance.setSetting("edgeReducer", (edge, data) => {
      const res = { ...data };
      if (hoveredNode) {
        if (graph?.source(edge) === hoveredNode || graph?.target(edge) === hoveredNode) {
          res.color = "#34d399"; // Active edge (emerald)
          res.size = data.size * 2;
        } else {
          res.hidden = true;
        }
      }
      return res;
    });
  }

  onDestroy(() => {
    if (sigmaInstance) {
      sigmaInstance.kill();
    }
  });

</script>

<div class="flex h-full flex-col overflow-hidden outline-none bg-transparent">
  <!-- Legend -->
  <div class="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2 border-b border-white/5 bg-black/40 backdrop-blur-sm shrink-0 z-10 text-[9px] font-black uppercase tracking-widest text-white/50">
    {#each Object.entries(KG_TYPE_COLORS) as [type, color]}
      <span class="flex items-center gap-1.5">
        <span class="inline-block h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]" style="background-color: {color}; color: {color}"></span>
        {type}
      </span>
    {/each}
  </div>

  <div class="min-h-0 flex-1 relative w-full h-full">
    {#if graphStore.loading && filteredEntities.length === 0}
      <div class="absolute inset-0 flex flex-col items-center justify-center text-emerald-400/50">
        <Loader2 class="h-8 w-8 animate-spin mb-4" />
        <span class="text-[10px] font-black uppercase tracking-widest">Generating Force Graph...</span>
      </div>
    {:else if filteredEntities.length === 0}
      <div class="absolute inset-0 flex flex-col items-center justify-center text-white/20">
        <span class="text-xs font-black uppercase tracking-widest">No Graph Data</span>
      </div>
    {/if}
    
    <div bind:this={container} class="w-full h-full bg-transparent outline-none"></div>
  </div>

  <!-- Footer Stats -->
  <div class="absolute bottom-4 left-4 z-10 bg-black/60 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
    <div class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/70">
      <div><span class="text-white text-xs">{filteredEntities.length}</span> Nodes</div>
      <div class="w-[1px] h-3 bg-white/20"></div>
      <div><span class="text-white text-xs">{filteredRelations.length}</span> Edges</div>
    </div>
  </div>
</div>
