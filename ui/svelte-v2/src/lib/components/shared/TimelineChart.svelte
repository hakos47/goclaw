<script lang="ts">
  type Series = {
    label: string;
    key: string;
    color: string;
    type: "line" | "area" | "bar";
    yAxis?: "left" | "right";
  };

  type Props = {
    data: any[];
    series: Series[];
    height?: string;
    showGrid?: boolean;
  };

  let { data = [], series, height = "300px", showGrid = true }: Props = $props();

  // Scaling Logic
  let maxLeft = $derived(Math.max(...data.flatMap(d => 
    series.filter(s => s.yAxis !== "right").map(s => d[s.key] || 0)
  ), 1));
  
  let maxRight = $derived(Math.max(...data.flatMap(d => 
    series.filter(s => s.yAxis === "right").map(s => d[s.key] || 0)
  ), 1));

  function getY(val: number, max: number) {
    return 100 - (val / max) * 100;
  }

  function getX(i: number) {
    if (data.length < 2) return 0;
    return (i / (data.length - 1)) * 100;
  }

  // Bezier Smoothing Logic
  function getControlPoint(current: [number, number], previous: [number, number], next: [number, number], reverse: boolean) {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.15; // Slightly less smoothing for complex charts
    
    const lengthX = n[0] - p[0];
    const lengthY = n[1] - p[1];
    
    const angle = Math.atan2(lengthY, lengthX);
    const length = Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)) * smoothing;
    
    const x = current[0] + Math.cos(angle + (reverse ? Math.PI : 0)) * length;
    const y = current[1] + Math.sin(angle + (reverse ? Math.PI : 0)) * length;
    
    return [x, y];
  }

  function generateSmoothPath(s: Series) {
    if (data.length < 2) return "";
    const max = s.yAxis === "right" ? maxRight : maxLeft;
    const points = data.map((d, i) => [getX(i), getY(d[s.key] || 0, max)] as [number, number]);
    
    let d = `M ${points[0][0]} ${points[0][1]} `;
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const prev = points[i - 1];
      const cp1 = getControlPoint(prev, points[i - 2], p, false);
      const cp2 = getControlPoint(p, prev, points[i + 1], true);
      d += `C ${cp1[0]} ${cp1[1]}, ${cp2[0]} ${cp2[1]}, ${p[0]} ${p[1]} `;
    }
    return d;
  }

  function generateArea(s: Series) {
    const p = generateSmoothPath(s);
    if (!p) return "";
    return `${p} L 100 100 L 0 100 Z`;
  }
</script>

<div class="relative w-full overflow-hidden" style="height: {height};">
  <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" class="overflow-visible">
    {#if showGrid}
      <g class="stroke-white/5" stroke-width="0.5">
        <line x1="0" y1="25" x2="100" y2="25" />
        <line x1="0" y1="50" x2="100" y2="50" />
        <line x1="0" y1="75" x2="100" y2="75" />
      </g>
    {/if}

    {#each series as s}
      {#if s.type === "area"}
        <defs>
          <linearGradient id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={s.color} stop-opacity="0.2" />
            <stop offset="100%" stop-color={s.color} stop-opacity="0" />
          </linearGradient>
        </defs>
        <path d={generateArea(s)} fill={`url(#grad-${s.key})`} class="transition-all duration-1000" />
        <path d={generateSmoothPath(s)} stroke={s.color} stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" class="transition-all duration-1000" />
      {:else if s.type === "line"}
        <path d={generateSmoothPath(s)} stroke={s.color} stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" class="transition-all duration-1000" />
      {:else if s.type === "bar"}
        <g>
          {#each data as d, i}
            {@const max = s.yAxis === "right" ? maxRight : maxLeft}
            {@const barHeight = (d[s.key] || 0) / max * 100}
            <rect
              x={getX(i) - (100 / data.length / 4)}
              y={100 - barHeight}
              width={100 / data.length / 2}
              height={barHeight}
              fill={s.color}
              rx="1"
              class="transition-all duration-700 opacity-60 hover:opacity-100"
            />
          {/each}
        </g>
      {/if}
    {/each}
  </svg>
  
  <!-- Overlay Axis Labels (Simplified) -->
  <div class="absolute left-0 top-0 h-full flex flex-col justify-between py-1 text-[8px] font-mono text-white/20 pointer-events-none">
     <span>{maxLeft >= 1000 ? (maxLeft/1000).toFixed(1)+'K' : maxLeft}</span>
     <span>0</span>
  </div>
  {#if series.some(s => s.yAxis === "right")}
    <div class="absolute right-0 top-0 h-full flex flex-col justify-between py-1 text-[8px] font-mono text-white/20 pointer-events-none">
       <span class="text-right text-red-400/50">{maxRight}%</span>
       <span class="text-right">0%</span>
    </div>
  {/if}
</div>

<div class="mt-4 flex flex-wrap gap-4 justify-center">
  {#each series as s}
    <div class="flex items-center gap-2">
      <div class="h-1 w-4 rounded-full" style="background-color: {s.color}"></div>
      <span class="text-[9px] font-bold uppercase tracking-widest text-white/40">{s.label}</span>
    </div>
  {/each}
</div>