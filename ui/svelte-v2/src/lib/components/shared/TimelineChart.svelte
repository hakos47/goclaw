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

  let validDataCount = $derived(Math.max(data.length, 2));

  let maxLeft = $derived(Math.max(...data.flatMap(d => 
    series.filter(s => s.yAxis !== "right").map(s => d[s.key] || 0)
  ), 1));
  
  let maxRight = $derived(Math.max(...data.flatMap(d => 
    series.filter(s => s.yAxis === "right").map(s => d[s.key] || 0)
  ), 1));

  function getY(val: number, max: number) {
    // 10px padding top and bottom
    return svgH - 10 - (val / max) * (svgH - 20);
  }

  function getX(i: number) {
    if (data.length < 2) return svgW / 2; 
    return (i / (data.length - 1)) * svgW;
  }

  function generateSmoothPath(s: Series) {
    if (data.length < 1) return "";
    if (data.length === 1) {
       const y = getY(data[0][s.key] || 0, s.yAxis === "right" ? maxRight : maxLeft);
       return `M 0 ${y} L ${svgW} ${y}`; 
    }
    const max = s.yAxis === "right" ? maxRight : maxLeft;
    const points = data.map((d, i) => [getX(i), getY(d[s.key] || 0, max)] as [number, number]);
    
    let dStr = `M ${points[0][0]} ${points[0][1]} `;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const midX = (p0[0] + p1[0]) / 2;
      dStr += `C ${midX} ${p0[1]}, ${midX} ${p1[1]}, ${p1[0]} ${p1[1]} `;
    }
    return dStr;
  }

  function generateArea(s: Series) {
    const p = generateSmoothPath(s);
    if (!p) return "";
    return `${p} L ${svgW} ${svgH} L 0 ${svgH} Z`;
  }

  // --- Interactive Tooltip Logic ---
  let hoveredIndex = $state<number | null>(null);
  let localX = $state(0);
  let localY = $state(0);

  let svgW = $state(100);
  let svgH = $state(100);

  function handleMouseMove(e: MouseEvent) {
    if (data.length < 2 || svgW === 0) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percentage = x / rect.width;
    
    let index = Math.round(percentage * (data.length - 1));
    if (index < 0) index = 0;
    if (index >= data.length) index = data.length - 1;
    
    hoveredIndex = index;
    localX = x;
    localY = y;
  }

  function handleMouseLeave() {
    hoveredIndex = null;
  }

  function formatTime(ts: string) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="relative w-full flex flex-col" style="height: {height};">
  <div class="relative w-full flex-1" bind:clientWidth={svgW} bind:clientHeight={svgH}>
    <svg 
      width="100%" height="100%" 
      class="overflow-visible cursor-crosshair"
      onmousemove={handleMouseMove}
      onmouseleave={handleMouseLeave}
      role="graphics-document"
    >
      {#if showGrid}
        <g class="stroke-white/5" stroke-width="1" stroke-dasharray="4 4">
          <line x1="0" y1={svgH * 0.25} x2={svgW} y2={svgH * 0.25} />
          <line x1="0" y1={svgH * 0.5} x2={svgW} y2={svgH * 0.5} />
          <line x1="0" y1={svgH * 0.75} x2={svgW} y2={svgH * 0.75} />
        </g>
      {/if}

      {#each series as s}
        {#if s.type === "area"}
          <defs>
            <linearGradient id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color={s.color} stop-opacity="0.15" />
              <stop offset="100%" stop-color={s.color} stop-opacity="0" />
            </linearGradient>
          </defs>
          <path d={generateArea(s)} fill={`url(#grad-${s.key})`} />
          <path d={generateSmoothPath(s)} stroke={s.color} stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="opacity-90" />
        
        {:else if s.type === "line"}
          <path d={generateSmoothPath(s)} stroke={s.color} stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="opacity-90" />
        
        {:else if s.type === "bar"}
          <g>
            {#each data as d, i}
              {@const max = s.yAxis === "right" ? maxRight : maxLeft}
              {@const barHeight = (d[s.key] || 0) / max * (svgH - 20)}
              {@const barWidth = svgW / Math.max(data.length, 10) * 0.6}
              <rect
                x={getX(i) - (barWidth / 2)}
                y={svgH - 10 - barHeight}
                width={barWidth}
                height={Math.max(barHeight, 0.5)}
                fill={s.color}
                rx="0.5"
                class="opacity-60 hover:opacity-100"
              />
            {/each}
          </g>
        {/if}
      {/each}

      {#if hoveredIndex !== null}
        {@const hX = getX(hoveredIndex)}
        <line x1={hX} y1="0" x2={hX} y2={svgH} stroke="white" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="2 2" pointer-events="none" />
        {#each series as s}
          {@const val = data[hoveredIndex][s.key] || 0}
          {@const max = s.yAxis === "right" ? maxRight : maxLeft}
          {@const hY = getY(val, max)}
          <circle cx={hX} cy={hY} r="3" fill={s.color} stroke="#000" stroke-width="1" pointer-events="none" />
        {/each}
      {/if}
    </svg>
    
    <!-- Y-Axis Labels -->
    <div class="absolute left-0 top-0 h-[90%] flex flex-col justify-between py-1 text-[9px] font-bold tracking-widest text-white/30 pointer-events-none">
       <span class="bg-black/40 px-1.5 rounded backdrop-blur-md border border-white/5">{maxLeft >= 1000 ? (maxLeft/1000).toFixed(1)+'K' : maxLeft.toFixed(0)}</span>
       <span class="bg-black/40 px-1.5 rounded backdrop-blur-md border border-white/5">0</span>
    </div>
    {#if series.some(s => s.yAxis === "right")}
      <div class="absolute right-0 top-0 h-[90%] flex flex-col justify-between py-1 text-[9px] font-bold tracking-widest pointer-events-none">
         <span class="bg-black/40 px-1.5 rounded backdrop-blur-md border border-white/5 text-[#3b82f6]/70">{maxRight.toFixed(0)}</span>
         <span class="bg-black/40 px-1.5 rounded backdrop-blur-md border border-white/5 text-[#3b82f6]/70">0</span>
      </div>
    {/if}
      <!-- Tooltip Overlay -->
      {#if hoveredIndex !== null && data[hoveredIndex]}
        <div 
          class="absolute z-[9999] bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-15px] min-w-[160px]"
          style="left: {localX}px; top: {localY}px;"
        >
          <div class="text-[9px] font-bold text-white/50 mb-2 border-b border-white/10 pb-1.5 uppercase tracking-widest">
            {formatTime(data[hoveredIndex].timestamp || data[hoveredIndex].bucket_time)}
          </div>
          <div class="space-y-1.5">
            {#each series as s}
              <div class="flex items-center justify-between gap-6 text-[11px] font-mono">
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full" style="background-color: {s.color}; box-shadow: 0 0 5px {s.color}"></div>
                  <span class="text-white/70 uppercase tracking-wider text-[9px]">{s.label}</span>
                </div>
                <span class="text-white font-bold">{data[hoveredIndex][s.key] || 0}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- X-Axis Labels -->
    {#if data.length > 0}
      <div class="absolute bottom-0 left-0 w-full flex justify-between px-2 pt-1 pb-1 text-[8px] font-mono text-white/30 pointer-events-none bg-gradient-to-t from-black/50 to-transparent">
        <span>{formatTime(data[0].timestamp || data[0].bucket_time)}</span>
        {#if data.length > 2}
          <span>{formatTime(data[Math.floor(data.length / 2)].timestamp || data[Math.floor(data.length / 2)].bucket_time)}</span>
        {/if}
        <span>{formatTime(data[data.length - 1].timestamp || data[data.length - 1].bucket_time)}</span>
      </div>
    {/if}
</div>

<div class="mt-4 flex flex-wrap gap-4 justify-center">
  {#each series as s}
    <div class="flex items-center gap-2 px-2 py-1 rounded-md bg-white/5 border border-white/5 backdrop-blur-md shadow-inner">
      <div class="h-1.5 w-1.5 rounded-full shadow-[0_0_5px_currentColor]" style="background-color: {s.color}; color: {s.color}"></div>
      <span class="text-[9px] font-bold uppercase tracking-widest text-white/60">{s.label}</span>
    </div>
  {/each}
</div>