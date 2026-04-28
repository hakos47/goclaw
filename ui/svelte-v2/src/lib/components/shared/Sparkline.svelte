<script lang="ts">
  type Props = {
    data: number[];
    width?: string;
    height?: string;
    color?: string;
  };
  let { data, width = "100%", height = "40px", color = "var(--color-primary)" }: Props = $props();

  let max = $derived(Math.max(...data, 1));
  let min = $derived(Math.min(...data));
  let range = $derived(max - min || 1);

  // Bezier Smoothing Logic
  function getControlPoint(current: [number, number], previous: [number, number], next: [number, number], reverse: boolean) {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.2; // Smoothing factor
    
    const lengthX = n[0] - p[0];
    const lengthY = n[1] - p[1];
    
    const angle = Math.atan2(lengthY, lengthX);
    const length = Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)) * smoothing;
    
    const x = current[0] + Math.cos(angle + (reverse ? Math.PI : 0)) * length;
    const y = current[1] + Math.sin(angle + (reverse ? Math.PI : 0)) * length;
    
    return [x, y];
  }

  let points = $derived(data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 40 - ((val - min) / range) * 40;
    return [x, y] as [number, number];
  }));

  let pathD = $derived.by(() => {
    if (points.length < 2) return "";
    let d = `M ${points[0][0]} ${points[0][1]} `;
    
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const prev = points[i - 1];
      const cp1 = getControlPoint(prev, points[i - 2], p, false);
      const cp2 = getControlPoint(p, prev, points[i + 1], true);
      d += `C ${cp1[0]} ${cp1[1]}, ${cp2[0]} ${cp2[1]}, ${p[0]} ${p[1]} `;
    }
    return d;
  });

  let areaD = $derived.by(() => {
    if (!pathD) return "";
    return `${pathD} L 100 40 L 0 40 Z`;
  });
</script>

<div style="width: {width}; height: {height};" class="relative">
  {#if data && data.length > 1}
    <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 -1 100 42" class="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stop-color={color} stop-opacity="0.3" />
          <stop offset="95%" stop-color={color} stop-opacity="0" />
        </linearGradient>
      </defs>
      <!-- Area -->
      <path d={areaD} fill="url(#sparkGrad)" stroke="none" />
      <!-- Line -->
      <path d={pathD} fill="none" stroke={color} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity="0.9" />
    </svg>
  {:else}
    <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
      <path d="M 0 40 L 100 40" stroke="currentColor" stroke-opacity="0.1" stroke-width="1" stroke-dasharray="2 2" />
    </svg>
  {/if}
</div>