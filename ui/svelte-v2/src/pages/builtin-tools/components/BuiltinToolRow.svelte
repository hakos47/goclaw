<script lang="ts">
  import { RefreshCw, Settings, Info } from "lucide-svelte";
  import type { BuiltinToolData } from "../hooks/use-builtin-tools.svelte";

  let {
    tool,
    hasTenantScope,
    onToggle,
    onSettings,
    onSetTenantConfig,
    onDeleteTenantConfig
  }: {
    tool: BuiltinToolData;
    hasTenantScope: boolean;
    onToggle: (tool: BuiltinToolData) => void;
    onSettings: (tool: BuiltinToolData) => void;
    onSetTenantConfig: (name: string, enabled: boolean) => Promise<void>;
    onDeleteTenantConfig: (name: string) => Promise<void>;
  } = $props();

  const CONFIGURABLE_TOOLS = new Set([
    "web_search", "web_fetch", "tts", "knowledge_graph_search", "stt",
    "create_image", "create_audio", "create_video",
    "read_image", "read_audio", "read_video", "read_document"
  ]);

  const editable = $derived(CONFIGURABLE_TOOLS.has(tool.name) || (tool.settings != null && Object.keys(tool.settings).length > 0));
  const configHint = $derived((tool.metadata as any)?.config_hint as string | undefined);
  const deprecated = $derived((tool.metadata as any)?.deprecated === true);
  const hasOverride = $derived(tool.tenant_enabled !== null && tool.tenant_enabled !== undefined);

  let toggling = $state(false);

  async function handleToggle() {
    toggling = true;
    try {
      if (hasTenantScope) {
        await onSetTenantConfig(tool.name, hasOverride ? !(tool.tenant_enabled ?? false) : !tool.enabled);
      } else {
        await onToggle(tool);
      }
    } finally {
      toggling = false;
    }
  }

  async function handleDeleteOverride() {
    toggling = true;
    try {
      await onDeleteTenantConfig(tool.name);
    } finally {
      toggling = false;
    }
  }

  const isChecked = $derived(hasTenantScope && hasOverride ? (tool.tenant_enabled ?? false) : tool.enabled);
</script>

<div class="flex items-center gap-5 px-6 py-4 hover:bg-white/[0.03] transition-all duration-300 border-b border-white/[0.02] last:border-b-0 group {deprecated ? 'opacity-50' : ''}">
  <div class="min-w-0 flex-1">
    <div class="flex items-center gap-3">
      <span class="text-sm font-black text-white/90 truncate uppercase tracking-[0.2em] group-hover:text-goclaw-neon-purple transition-colors drop-shadow-sm">{tool.display_name}</span>
      <code class="text-[10px] text-white/30 font-mono tracking-widest bg-white/5 px-2 py-0.5 rounded-md border border-white/10 group-hover:border-goclaw-neon-purple/30 group-hover:text-goclaw-neon-purple/70 transition-colors">[{tool.name}]</code>
      
      {#if deprecated}
        <span class="text-[9px] font-bold text-red-400 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">
          Deprecated
        </span>
      {/if}
      
      {#if !deprecated && tool.requires && tool.requires.length > 0}
        <span class="text-[9px] font-black text-goclaw-neon-cyan border border-goclaw-neon-cyan/30 bg-goclaw-neon-cyan/10 px-1.5 py-0.5 rounded uppercase tracking-[0.2em] shadow-[0_0_10px_rgba(6,182,212,0.2)]" title="Requires: {tool.requires.join(', ')}">
          REQ
        </span>
      {/if}
    </div>
    
    {#if tool.description}
      <p class="text-[11px] text-white/40 leading-relaxed truncate mt-1.5 tracking-wide group-hover:text-white/60 transition-colors">
        {tool.description}
      </p>
    {/if}
  </div>

  <div class="flex items-center gap-3 shrink-0">
    {#if editable && !deprecated}
      <button
        onclick={() => onSettings(tool)}
        class="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-3 rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10"
      >
        <Settings class="h-3.5 w-3.5" />
        Settings
      </button>
    {/if}
    
    {#if !editable && !deprecated && configHint}
      <span class="flex items-center gap-1.5 text-[10px] text-white/30 font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" title={configHint}>
        <Info class="h-3 w-3" />
        {configHint}
      </span>
    {/if}

    {#if hasTenantScope && !deprecated}
      <div class="flex items-center gap-2 border-r border-white/10 pr-3 mr-1">
        <span class={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${hasOverride ? (tool.tenant_enabled ? 'bg-goclaw-neon-purple/20 text-goclaw-neon-purple border border-goclaw-neon-purple/30' : 'bg-white/10 text-white/50 border border-white/20') : 'text-white/30 border border-dashed border-white/20'}`}>
          {hasOverride ? (tool.tenant_enabled ? 'Tenant ON' : 'Tenant OFF') : 'Default'}
        </span>
        
        {#if hasOverride}
          <button
            onclick={handleDeleteOverride}
            disabled={toggling}
            class="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Reset to global default"
          >
            <RefreshCw class="h-3 w-3 {toggling ? 'animate-spin' : ''}" />
          </button>
        {/if}
      </div>
    {/if}

    {#if !deprecated}
      <button 
        onclick={handleToggle}
        disabled={toggling}
        class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {isChecked ? 'bg-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'bg-[#1a1a1a]'}"
      >
        <span class="sr-only">Toggle tool</span>
        <span class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {isChecked ? 'translate-x-4' : 'translate-x-0'}"></span>
      </button>
    {/if}
  </div>
</div>
