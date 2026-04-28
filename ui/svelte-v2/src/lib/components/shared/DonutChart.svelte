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

  let { data, title, size = 180, thickness = 25 }: Props = $props();

  let total = $derived(data.reduce((sum, item) => sum + item.value, 0) || 1);
  let radius = $derived(size / 2 - 10);
  let circumference = $derived(2 * Math.PI * radius);

  // Default NIX colors if none provided
  const colors = [
    "var(--color-goclaw-neon-purple)",
    "var(--color-goclaw-neon-cyan)",
    "var(--color-goclaw-neon-magenta)",
    "var(--color-emerald-500)",
    "var(--color-amber-500)"
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
  <div class="relative" style="width: {size}px; height: {size}px;">
    <svg width={size} height={size} viewBox="0 0 {size} {size}" class="rotate-[-90deg]">
      <!-- Background Track -->
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="rgba(255,255,255,0.05)"
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
          class="transition-all duration-1000 ease-out hover:opacity-80"
        />
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