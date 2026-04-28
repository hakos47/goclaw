<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Sigma from "sigma";
  import forceAtlas2 from "graphology-layout-forceatlas2";
  import circular from "graphology-layout/circular";
  import type Graph from "graphology";
  import { useVaultGraphData } from "../hooks/use-vault-graph-data.svelte";
  import { buildVaultGraphFromDTO, VAULT_TYPE_COLORS_DARK } from "../lib/vault-graph-adapter";
  import { assignCommunityColors, getFA2WorkerSettings, SIGMA_SETTINGS, ZOOM_TIERS } from "../lib/graph-utils";
  import { Loader2 } from "lucide-svelte";

  let {
    agentId,
    teamId,
    selectedDocId = null,
    onNodeSelect,
    onNodeDoubleClick
  } = $props<{
    agentId: string;
    teamId?: string;
    selectedDocId?: string | null;
    onNodeSelect?: (docId: string | null) => void;
    onNodeDoubleClick?: (docId: string) => void;
  }>();

  let container: HTMLDivElement;
  let sigmaInstance: Sigma | null = null;
  let graph: Graph | null = null;
  let fa2Layout: ReturnType<typeof forceAtlas2> | null = null;

  const graphData = useVaultGraphData(() => agentId, () => ({ teamId }));

  let nodeLimit = $state(2000);
  let isLimited = $derived(graphData.totalNodes > nodeLimit);

  // Rebuild graph when data changes
  $effect(() => {
    if (!graphData.loading && graphData.nodes.length > 0) {
      initGraph(graphData.nodes, graphData.edges);
    }
  });

  function initGraph(nodes: any[], edges: any[]) {
    if (sigmaInstance) {
      sigmaInstance.kill();
      sigmaInstance = null;
    }
    
    graph = buildVaultGraphFromDTO(nodes, edges);
    assignCommunityColors(graph);

    // Initial layout
    circular.assign(graph);
    
    // FA2 Layout
    const orphanRatio = graph.order > 0 ? (graph.order - graph.edges().length) / graph.order : 0;
    const fa2Settings = getFA2WorkerSettings(graph.order, orphanRatio);
    forceAtlas2.assign(graph, {
      iterations: 100,
      settings: fa2Settings.settings
    });

    sigmaInstance = new Sigma(graph, container, {
      ...SIGMA_SETTINGS,
      defaultEdgeType: "line",
      labelColor: { color: "#ffffff" },
      labelSize: 10,
    });

    // Events
    sigmaInstance.on("clickNode", (e) => {
      onNodeSelect?.(e.node);
    });
    
    sigmaInstance.on("doubleClickNode", (e) => {
      onNodeDoubleClick?.(e.node);
    });

    sigmaInstance.on("clickStage", () => {
      onNodeSelect?.(null);
    });

    // Semantic zoom effect (nodeReducer/edgeReducer)
    sigmaInstance.setSetting("nodeReducer", (node, data) => {
      const res = { ...data };
      if (selectedDocId) {
        if (node === selectedDocId || graph?.hasEdge(node, selectedDocId) || graph?.hasEdge(selectedDocId, node)) {
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
      if (selectedDocId) {
        if (graph?.source(edge) === selectedDocId || graph?.target(edge) === selectedDocId) {
          res.color = "#818cf8"; // active edge
          res.size = data.size * 2;
        } else {
          res.hidden = true;
        }
      }
      return res;
    });
  }

  $effect(() => {
    if (sigmaInstance) {
      sigmaInstance.refresh();
    }
  });

  onDestroy(() => {
    if (sigmaInstance) {
      sigmaInstance.kill();
    }
  });
</script>

<div class="flex h-full flex-col overflow-hidden outline-none">
  <!-- Top bar -->
  <div class="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2 border-b border-white/5 bg-black/40 backdrop-blur-sm shrink-0 z-10">
    <div class="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-black uppercase tracking-widest text-white/50 flex-1 min-w-0">
      {#each Object.entries(VAULT_TYPE_COLORS_DARK) as [type, color]}
        <span class="flex items-center gap-1.5">
          <span class="inline-block h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]" style="background-color: {color}; color: {color}"></span>
          {type}
        </span>
      {/each}
    </div>
  </div>

  <!-- Graph canvas -->
  <div class="min-h-0 flex-1 relative w-full h-full">
    {#if graphData.loading && graphData.nodes.length === 0}
      <div class="absolute inset-0 flex items-center justify-center">
        <Loader2 class="h-8 w-8 animate-spin text-white/20" />
      </div>
    {:else if graphData.nodes.length === 0}
      <div class="absolute inset-0 flex items-center justify-center text-xs font-black uppercase tracking-widest text-white/20">
        No documents
      </div>
    {/if}
    
    <div bind:this={container} class="w-full h-full bg-transparent outline-none"></div>
  </div>

  <!-- Stats bar -->
  <div class="absolute bottom-4 left-4 z-10 bg-black/60 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
    <div class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/70">
      <div>
        <span class="text-white text-xs">{graphData.totalNodes}</span> Docs
      </div>
      <div class="w-[1px] h-3 bg-white/20"></div>
      <div>
        <span class="text-white text-xs">{graphData.totalEdges}</span> Links
      </div>
    </div>
  </div>
</div>
