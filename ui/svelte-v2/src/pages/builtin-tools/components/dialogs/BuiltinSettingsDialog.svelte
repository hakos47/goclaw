<script lang="ts">
  import { X, Settings } from "lucide-svelte";
  import type { BuiltinToolData } from "../../hooks/use-builtin-tools.svelte";
  import JsonSettingsForm from "./forms/JsonSettingsForm.svelte";
  import WebSearchChainForm from "./forms/WebSearchChainForm.svelte";
  import SttSettingsForm from "./forms/SttSettingsForm.svelte";
  import WebFetchChainForm from "./forms/WebFetchChainForm.svelte";
  import KGSettingsForm from "./forms/KGSettingsForm.svelte";
  import MediaProviderChainForm from "./forms/MediaProviderChainForm.svelte";

  let {
    tool,
    open,
    onOpenChange,
    onSave,
    tenantScope = false,
    onResetToDefault
  }: {
    tool: BuiltinToolData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (name: string, settings: Record<string, unknown>) => Promise<void>;
    tenantScope?: boolean;
    onResetToDefault?: (name: string) => Promise<void>;
  } = $props();

  const initialSettings = $derived(
    (tenantScope ? (tool?.tenant_settings ?? tool?.settings) : tool?.settings) ?? {}
  );
  
  const hasTenantOverride = $derived(tenantScope && tool?.tenant_settings != null);

  function handleClose() {
    onOpenChange(false);
  }
</script>

{#if open && tool}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#030014]/80 backdrop-blur-3xl animate-in fade-in duration-500" onclick={(e) => e.target === e.currentTarget && handleClose()}>
    <div class="relative w-full max-w-2xl bg-[#050505]/90 border border-white/5 shadow-[0_0_100px_rgba(0,0,0,1),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
      
      <!-- Scanlines & Background Effects -->
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
      <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-goclaw-neon-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>

      <!-- Header -->
      <div class="relative z-10 flex flex-col p-6 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="h-14 w-14 rounded-2xl bg-[#030014] border border-white/10 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_20px_rgba(217,70,239,0.2)] overflow-hidden relative">
              <div class="absolute inset-0 bg-goclaw-neon-purple/10"></div>
              <Settings class="h-7 w-7 text-goclaw-neon-purple drop-shadow-[0_0_10px_rgba(217,70,239,0.5)] relative z-10" />
            </div>
            <div>
              <h2 class="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">{tool.display_name}</h2>
              <p class="text-[10px] text-goclaw-neon-purple font-bold uppercase tracking-[0.4em] mt-1 ml-0.5 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]">TOOL CONFIGURATION</p>
            </div>
          </div>
          <button onclick={handleClose} class="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#030014]/50 border border-white/5 hover:bg-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all duration-300 shadow-inner group">
            <X class="h-6 w-6 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {#if tenantScope}
          <div class="mt-4 flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <div class="flex items-center gap-3">
              <span class="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-amber-400">
                Tenant Override
              </span>
              <span class="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                {hasTenantOverride ? "Custom settings active" : "Using global defaults"}
              </span>
            </div>
            {#if hasTenantOverride && onResetToDefault}
              <button
                type="button"
                onclick={async () => {
                  await onResetToDefault(tool!.name);
                  onOpenChange(false);
                }}
                class="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 hover:underline underline-offset-4 transition-all"
              >
                Reset to Global Defaults
              </button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Content -->
      <div class="relative z-10 p-6 overflow-y-auto flex-1 custom-scrollbar">
        {#if tool.name === "web_search"}
          <WebSearchChainForm
            {tool}
            {initialSettings}
            {onOpenChange}
            {onSave}
          />
        {:else if tool.name === "stt"}
          <SttSettingsForm
            {tool}
            {initialSettings}
            {onOpenChange}
            {onSave}
          />
        {:else if tool.name === "web_fetch"}
          <WebFetchChainForm
            {tool}
            {initialSettings}
            {onOpenChange}
            {onSave}
          />
        {:else if tool.name === "knowledge_graph_search"}
          <KGSettingsForm
            {tool}
            {initialSettings}
            {onOpenChange}
            {onSave}
          />
        {:else if ["create_image", "create_audio", "create_video", "read_image", "read_audio", "read_video", "read_document"].includes(tool.name)}
          <MediaProviderChainForm
            {tool}
            {initialSettings}
            {onOpenChange}
            {onSave}
          />
        {:else}
          <JsonSettingsForm
            {tool}
            {initialSettings}
            {onOpenChange}
            {onSave}
          />
        {/if}
      </div>

    </div>
  </div>
{/if}
