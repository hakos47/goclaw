<script lang="ts">
  import type { BuiltinToolData } from "../hooks/use-builtin-tools.svelte";
  import BuiltinToolRow from "./BuiltinToolRow.svelte";

  let {
    category,
    tools,
    tenantId,
    onToggle,
    onSettings,
    onSetTenantConfig,
    onDeleteTenantConfig
  }: {
    category: string;
    tools: BuiltinToolData[];
    tenantId: string | null;
    onToggle: (tool: BuiltinToolData) => void;
    onSettings: (tool: BuiltinToolData) => void;
    onSetTenantConfig: (name: string, enabled: boolean) => Promise<void>;
    onDeleteTenantConfig: (name: string) => Promise<void>;
  } = $props();

  const hasTenantScope = $derived(!!tenantId && tenantId !== "0193a5b0-7000-7000-8000-000000000001");
</script>

<div class="rounded-3xl border border-white/5 bg-[#030014]/40 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden mb-6 relative group/cat transition-all duration-500 hover:border-white/10">
  <div class="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
  
  <div class="flex items-center gap-4 border-b border-white/5 bg-[#0a0a0a]/50 px-6 py-4 relative z-10">
    <div class="absolute bottom-0 left-0 w-1/4 h-[1px] bg-gradient-to-r from-goclaw-neon-purple to-transparent opacity-50 group-hover/cat:w-1/2 transition-all duration-700"></div>
    <span class="text-sm font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 drop-shadow-md">{category}</span>
    <div class="h-6 px-3 rounded-xl bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/20 flex items-center justify-center shadow-[0_0_10px_rgba(217,70,239,0.1)]">
      <span class="text-[10px] font-black text-goclaw-neon-purple uppercase tracking-widest">{tools.length}</span>
    </div>
  </div>
  <div class="divide-y divide-white/5 bg-transparent relative z-10">
    {#each tools as tool (tool.name)}
      <BuiltinToolRow
        {tool}
        {hasTenantScope}
        {onToggle}
        {onSettings}
        {onSetTenantConfig}
        {onDeleteTenantConfig}
      />
    {/each}
  </div>
</div>
