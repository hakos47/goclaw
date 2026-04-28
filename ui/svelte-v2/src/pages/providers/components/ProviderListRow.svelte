<script lang="ts">
  import { Cpu, Trash2, Link } from "lucide-svelte";
  import type { ProviderData } from "../../../../../web/src/types/provider";
  import { PROVIDER_TYPE_BADGE } from "../provider-utils";

  export type ProviderOAuthPoolSummary = {
    availability: "ready" | "needs_sign_in" | "disabled";
    role: "owner" | "member" | "standalone";
    managedByLabel?: string;
    memberCount: number;
    strategy: string;
    connectorPosition?: "none" | "single" | "first" | "middle" | "last";
  };

  type Props = {
    provider: ProviderData;
    oauthPool?: ProviderOAuthPoolSummary;
    showPoolHint?: boolean;
    onClick: () => void;
    onDelete?: () => void;
    onPoolSetup?: () => void;
  };

  let { provider, oauthPool, showPoolHint, onClick, onDelete, onPoolSetup }: Props = $props();

  const typeBadge = $derived(PROVIDER_TYPE_BADGE[provider.provider_type] ?? {
    label: provider.provider_type,
    variant: "outline"
  });

  const isOwner = $derived(oauthPool?.role === "owner");
  const isMember = $derived(oauthPool?.role === "member");
  const showMemberConnector = $derived(isMember && oauthPool?.connectorPosition && oauthPool.connectorPosition !== "none");

  // Determine line height based on position
  const connectorLineClass = $derived(
    oauthPool?.connectorPosition === "first" || oauthPool?.connectorPosition === "middle"
      ? "top-[-1rem] h-[calc(100%+1.5rem)]"
      : "top-[-1rem] h-[calc(50%+1rem)]"
  );
</script>

<div 
  class={`relative flex w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all overflow-hidden group shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)]
    ${isOwner ? 'border-purple-500/30 bg-purple-500/[0.05] hover:border-purple-500/50' : ''}
    ${isMember ? 'border-sky-500/20 bg-sky-500/[0.02] hover:border-sky-500/40 ml-6 w-[calc(100%-1.5rem)]' : ''}
    ${!isOwner && !isMember ? 'border-white/5 bg-black/40 hover:bg-white/[0.02] hover:border-white/10' : ''}
  `}
  role="button"
  tabindex="0"
  onclick={onClick}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
>
  
  {#if showMemberConnector}
    <!-- HUD Connector Lines -->
    <span class="absolute left-0 top-1/2 h-[2px] w-6 -translate-x-full -translate-y-1/2 bg-sky-500/40 shadow-[0_0_10px_rgba(14,165,233,0.5)]"></span>
    <span class={`absolute -left-6 w-[2px] bg-sky-500/40 shadow-[0_0_10px_rgba(14,165,233,0.5)] ${connectorLineClass}`}></span>
    <div class="absolute -left-[27px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.8)]"></div>
  {/if}

  <div class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)]
    ${isOwner ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : ''}
    ${isMember ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : ''}
    ${!isOwner && !isMember ? 'bg-white/5 text-white/40 border border-white/10' : ''}
  `}>
    <Cpu class="h-5 w-5" />
  </div>

  <div class="min-w-0 flex-1 space-y-1">
    <div class="flex flex-wrap items-center gap-2">
      <span class="truncate text-sm font-bold text-white/90 uppercase tracking-widest">{provider.display_name || provider.name}</span>
      
      <!-- Status Dot -->
      <span class={`inline-block h-2 w-2 shrink-0 rounded-full shadow-[0_0_10px_currentColor] ${provider.enabled ? 'text-emerald-400 bg-emerald-400' : 'text-white/30 bg-white/30'}`}></span>
      
      {#if isOwner}
        <span class="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[9px] font-black uppercase tracking-widest text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]">Pool Owner</span>
      {:else if isMember}
        <span class="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-[9px] font-black uppercase tracking-widest text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.2)]">Pool Member</span>
      {/if}

      {#if showPoolHint && !isOwner && !isMember && onPoolSetup}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span 
          class="px-2 py-0.5 rounded border border-dashed border-purple-500/40 text-[9px] font-black uppercase tracking-widest text-purple-400 cursor-pointer hover:bg-purple-500/10 hover:border-purple-500 transition-colors flex items-center gap-1"
          onclick={(e) => { e.stopPropagation(); onPoolSetup(); }}
        >
          <Link class="h-3 w-3" /> Connect to Pool
        </span>
      {/if}
    </div>

    <!-- Subtitle / Meta -->
    <div class="flex min-w-0 items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-mono">
      {#if provider.provider_type === 'chatgpt_oauth'}
        <span class="truncate">Alias: {provider.name}</span>
      {:else if provider.display_name}
        <span class="truncate">{provider.name}</span>
      {/if}

      {#if isOwner}
        <span>• Strategy: {oauthPool?.strategy}</span>
        <span>• {oauthPool?.memberCount} Members</span>
      {:else if isMember && oauthPool?.managedByLabel}
        <span>• Managed By: {oauthPool.managedByLabel}</span>
      {/if}
    </div>
  </div>

  <div class="hidden shrink-0 sm:block">
    <span class="px-2 py-1 rounded bg-black/50 border border-white/10 text-[10px] font-mono text-white/50 uppercase tracking-widest">
      {typeBadge.label}
    </span>
  </div>

  <div class="hidden shrink-0 lg:block text-[10px] uppercase tracking-widest font-black" class:text-emerald-400={provider.enabled} class:text-white-30={!provider.enabled}>
    {provider.enabled ? 'Enabled' : 'Disabled'}
  </div>

  {#if onDelete}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
      class="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-transparent text-white/30 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer z-10"
      onclick={(e) => { e.stopPropagation(); onDelete(); }}
      title="Delete Provider"
    >
      <Trash2 class="h-4 w-4" />
    </div>
  {/if}

</div>
