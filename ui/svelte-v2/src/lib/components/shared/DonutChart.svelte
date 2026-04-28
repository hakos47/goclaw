<script lang="ts">
  type DataItem = {
    label: string;
    value: number;
    color?: string;
  };

  type Props = {
    data: DataItem[];
    title?: string;
    size?: number;
    thickness?: number;
  };

  let { data, title, size = 180, thickness = 6 }: Props = $props();

  let total = $derived(data.reduce((sum, item) => sum + item.value, 0) || 1);
  let radius = $derived(size / 2 - 12);
  let circumference = $derived(2 * Math.PI * radius);

  const colors = [
    "#d946ef", // neon purple
    "#06b6d4", // neon cyan
    "#ec4899", // neon pink
    "#8b5cf6", // violet
    "#3b82f6"  // blue
  ];

  let slices = $derived.by(() => {
    let currentOffset = 0;
    return data.map((item, i) => {
      const pct = (item.value / total);
      const dashArray = `${pct * circumference} ${circumference}`;
      const offset = -currentOffset * circumference;
      currentOffset += pct;
      return {
        ...item,
        dashArray,
        offset,
        color: item.color || colors[i % colors.length]
      };
    });
  });
</script>

<div class="flex flex-col items-center justify-center p-4">
  <div class="relative flex items-center justify-center" style="width: {size}px; height: {size}px;">
    <svg width={size} height={size} viewBox="0 0 {size} {size}" class="rotate-[-90deg] overflow-visible">
      <!-- Background Track -->
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="rgba(255,255,255,0.03)"
        stroke-width={thickness}
      />
      
      {#each slices as slice}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={slice.color}
          stroke-width={thickness}
          stroke-dasharray={slice.dashArray}
          stroke-dashoffset={slice.offset}
          stroke-linecap="round"
          class="transition-all duration-1000 ease-out hover:opacity-100 opacity-90 cursor-crosshair hover:stroke-width-[8px]"
        >
          <title>{slice.label}: {slice.value}</title>
        </circle>
      {/each}
    </svg>
    <!-- Center Content -->
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span class="text-2xl font-mono font-bold text-white tracking-tighter">{total >= 1000 ? (total/1000).toFixed(1) + 'K' : total}</span>
      <span class="text-[9px] font-bold text-white/30 uppercase tracking-widest">{title || 'Total'}</span>
    </div>
  </div>

  <!-- Legend -->
  <div class="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 w-full">
    {#each slices as slice}
      <div class="flex items-center gap-2">
        <div class="h-1.5 w-1.5 rounded-full shadow-[0_0_5px_currentColor]" style="background-color: {slice.color}; color: {slice.color};"></div>
        <span class="text-[10px] font-medium text-white/60 truncate">{slice.label}</span>
      </div>
    {/each}
  </div>
</div>