<script lang="ts">
  import { onMount } from "svelte";
  import {
    ChevronLeft,
    Save,
    Trash2,
    Play,
    Settings,
    ShieldCheck,
    Users,
    Info,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Activity,
    Zap,
    History,
    Terminal,
    Smartphone
  } from "lucide-svelte";

  import { _ } from "svelte-i18n";
  import { cn } from "$lib/utils";
  import { wsState } from "$lib/state/ws.svelte";
  import { toast } from "$lib/components/ui/toast/toast.svelte";
  import { useChannels } from "./hooks/use-channels.svelte";
  import { agentsState, loadAgents } from "../agents/hooks/use-agents.svelte";
  import type { ChannelInstanceData } from "$lib/types/channel";
  import ChannelFields from "./components/ChannelFields.svelte";
  import ChannelManagersTab from "./components/ChannelManagersTab.svelte";
  import TelegramGroupsTab from "./components/TelegramGroupsTab.svelte";
  import ChannelDiagnosticsCard from "./components/ChannelDiagnosticsCard.svelte";
  import ChannelAdvancedDialog from "./components/ChannelAdvancedDialog.svelte";
  import WhatsAppReauthDialog from "./whatsapp/WhatsAppReauthDialog.svelte";
  import WhatsAppPairingTab from "./whatsapp/WhatsAppPairingTab.svelte";
  import ZaloReauthDialog from "./zalo/ZaloReauthDialog.svelte";
  import { credentialsSchema, configSchema } from "./channel-schemas";
  import { 
    getChannelStatusMeta, 
    getRenderableChannelStatus, 
    getChannelCheckedLabel,
    getChannelRemediationMeta,
    formatRelativeTime
  } from "./status-utils";

  const ESSENTIAL_CONFIG_KEYS: Record<string, string[]> = {
    _default: ["dm_policy", "group_policy", "require_mention"],
    telegram: ["dm_policy", "group_policy", "mention_mode", "require_mention"],
    whatsapp: ["authority_code", "owner_jid", "owner_user_id", "dm_policy", "group_policy", "require_mention"],
  };

  type Props = {
    id: string;
    onBack: () => void;
  };

  let { id, onBack }: Props = $props();

  const channels = useChannels();
  
  let instance = $state<ChannelInstanceData | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let activeTab = $state("general");
  let showAdvanced = $state(false);
  let reauthOpen = $state(false);
  let testing = $state(false);

  // Form states
  let displayName = $state("");
  let enabled = $state(true);
  let agentId = $state("");
  let config = $state<Record<string, any>>({});
  let credentials = $state<Record<string, any>>({});
  let policyValues = $state<Record<string, any>>({});

  onMount(async () => {
    loadAgents();
    await loadData();
  });

  $effect(() => {
    if (wsState.connected) {
      // Initial fetch on connection established
      channels.loadStatus();
      
      // Setup polling interval
      const interval = setInterval(() => {
        loadData(false); // background refresh for http
        channels.loadStatus();
      }, 15000);
      
      return () => clearInterval(interval);
    }
  });

  async function loadData(showLoading = true) {
    if (showLoading) loading = true;
    try {
      instance = await channels.getInstance(id);
      if (instance) {
        displayName = instance.display_name || "";
        enabled = instance.enabled;
        agentId = instance.agent_id;
        config = (instance.config as Record<string, any>) || {};
        
        // Extract policy values
        const type = instance.channel_type;
        const keys = ESSENTIAL_CONFIG_KEYS[type] || ESSENTIAL_CONFIG_KEYS._default || [];
        const policies: Record<string, any> = {};
        keys.forEach(k => {
          if (config[k] !== undefined && config[k] !== null) {
            policies[k] = config[k];
          }
        });
        policyValues = policies;
      }
    } catch (e) {
      console.error("Failed to load instance", e);
    } finally {
      if (showLoading) loading = false;
    }
  }

  async function handleSave() {
    if (!instance) return;
    saving = true;
    try {
      // Merge policy values into config
      const mergedConfig = { ...config, ...policyValues };
      
      await channels.updateInstance(id, {
        display_name: displayName || null,
        enabled,
        agent_id: agentId,
        config: mergedConfig,
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined
      });
      await Promise.all([
        loadData(),
        channels.loadStatus()
      ]);
      // Clear credentials after save since they are write-only
      credentials = {};
    } catch (e) {
      console.error("Failed to save", e);
    } finally {
      saving = false;
    }
  }

  async function handleSaveAdvanced(newConfig: Record<string, any>) {
     if (!instance) return;
     try {
       await channels.updateInstance(id, { config: newConfig });
       await Promise.all([
         loadData(),
         channels.loadStatus()
       ]);
     } catch (e) {
       console.error("Failed to save advanced", e);
     }
  }

  async function handleDelete() {
    if (confirm($_('channels.deleteConfirm', { default: "Are you sure you want to delete this channel?" }))) {
      try {
        await channels.deleteInstance(id);
        onBack();
      } catch (e) {
        console.error("Failed to delete", e);
      }
    }
  }

  async function handleTest() {
    if (!instance || testing) return;
    testing = true;
    try {
      // Force a fresh status check from the engine
      await Promise.all([
        channels.loadStatus(),
        // Add a small artificial delay so the user sees the button reacting
        new Promise(r => setTimeout(r, 600))
      ]);
      
      const newStatus = channels.channelsStatus[instance.name];
      if (newStatus?.state === 'healthy') {
        toast.success(`Connection verified: ${instance.display_name || instance.name} is operational`);
      } else if (newStatus?.state === 'failed' || newStatus?.failure_kind) {
        toast.error(`Channel degraded: ${newStatus.summary || "Connectivity issues detected"}`);
      } else {
        toast.info(`Status updated: ${newStatus?.state || 'Unknown state'}`);
      }
    } catch (e: any) {
      toast.error(`Test failed: ${e.message || "Could not reach engine"}`);
    } finally {
      testing = false;
    }
  }

  let renderableStatus = $derived.by(() => {
     if (!instance) return null;
     const status = channels.channelsStatus[instance.name] || null;
     return getRenderableChannelStatus(status, instance);
  });
  let statusMeta = $derived(getChannelStatusMeta(renderableStatus, instance?.enabled ?? true));

  let checkedLabel = $derived(getChannelCheckedLabel(renderableStatus));
  let remediationMeta = $derived(getChannelRemediationMeta(renderableStatus, true));

  let timelineItems = $derived.by(() => {
    const items = [];
    if (checkedLabel) items.push({ label: $_('channels.detail.timeline.lastChecked', { default: "Last checked" }), value: checkedLabel.replace("Checked ", "") });
    if (renderableStatus?.last_healthy_at) {
        const rel = formatRelativeTime(renderableStatus.last_healthy_at);
        if (rel) items.push({ label: $_('channels.detail.timeline.lastHealthy', { default: "Last healthy" }), value: rel });
    }
    return items;
  });

  let tabs = $derived.by(() => {
    const t = [
      { id: "general", label: "General", icon: Info },
      { id: "credentials", label: "Credentials", icon: ShieldCheck },
      { id: "members", label: "Managers", icon: Users }
    ];

    if (instance?.channel_type === 'telegram') {
      t.splice(2, 0, { id: "groups", label: "Groups", icon: Users });
    }

    if (instance?.channel_type === 'whatsapp') {
      t.splice(2, 0, { id: "pairing", label: "Pairing", icon: Smartphone });
    }

    t.push({ id: "diagnostics", label: "Diagnostics", icon: AlertCircle });
    return t;
  });

  let agentOptions = $derived(agentsState.agents.map(a => ({
    value: a.id,
    label: a.display_name || a.agent_key
  })));

  function getAgentName(aid: string) {
     const a = agentsState.agents.find(x => x.id === aid);
     return a?.display_name || a?.agent_key || aid;
  }

  let configFields = $derived.by(() => {
    if (!instance) return [];
    const all = configSchema[instance.channel_type] || [];
    const keys = ESSENTIAL_CONFIG_KEYS[instance.channel_type] || ESSENTIAL_CONFIG_KEYS._default || [];
    return all.filter(f => keys.includes(f.key));
  });

  let credentialFields = $derived(instance ? (credentialsSchema[instance.channel_type] || []) : []);


</script>

<div class="flex flex-col h-full bg-[#030014]/30 backdrop-blur-md">
  <!-- Header -->
  <div class="relative z-20 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#030014]/60 backdrop-blur-2xl">
    <div class="flex items-center gap-4">
      <button 
        onclick={onBack}
        class="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>
      
      <div>
        {#if loading}
          <div class="h-6 w-32 bg-white/5 animate-pulse rounded"></div>
          <div class="h-3 w-20 bg-white/5 animate-pulse rounded mt-1"></div>
        {:else if instance}
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold tracking-tight text-white">
              {instance.display_name || instance.name}
            </h1>
            <div class="flex items-center gap-1.5 ml-2">
              <span class={cn(
                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border transition-all duration-500",
                statusMeta.surfaceClass,
                statusMeta.dotClass.replace('bg-', 'text-')
              )}>
                {statusMeta.label}
              </span>
              
              {#if renderableStatus?.failure_kind && instance.enabled}
                <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  Attention
                </span>
              {/if}
            </div>
          </div>
          
          <div class="flex items-center gap-3 mt-1 text-[10px] font-medium tracking-wide uppercase">
            <span class="text-white/20 font-mono">{instance.name}</span>
            <span class="text-white/10">•</span>
            <span class="text-white/40">{instance.channel_type}</span>
            <span class="text-white/10">•</span>
            <span class="text-white/40">Agent: <span class="text-white/60">{getAgentName(instance.agent_id)}</span></span>
            {#if checkedLabel}
              <span class="text-white/10">•</span>
              <span class="text-white/40">{checkedLabel}</span>
            {/if}
          </div>
          
          {#if renderableStatus?.summary}
             <p class="text-[10px] text-white/30 font-mono mt-1 lowercase italic">
               {renderableStatus.summary}
             </p>
          {/if}
        {/if}
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button 
        onclick={() => showAdvanced = true}
        class="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all"
      >
        <Settings class="w-3.5 h-3.5" />
        Advanced
      </button>

      <button 
        onclick={handleTest}
        disabled={testing}
        class="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
      >
        {#if testing}
          <Loader2 class="w-3.5 h-3.5 text-goclaw-neon-cyan animate-spin" />
          Testing...
        {:else}
          <Play class="w-3.5 h-3.5 text-goclaw-neon-cyan" />
          Test
        {/if}
      </button>

      <button 
        onclick={handleSave}
        disabled={saving || loading}
        class="relative flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl overflow-hidden group shadow-[0_0_20px_rgba(217,70,239,0.2)] disabled:opacity-50"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/40 to-goclaw-neon-purple/10 border border-goclaw-neon-purple/50 rounded-xl transition-all group-hover:scale-105"></div>
        {#if saving}
          <Loader2 class="w-3.5 h-3.5 relative z-10 animate-spin text-white" />
        {:else}
          <Save class="w-3.5 h-3.5 relative z-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        {/if}
        <span class="relative z-10 text-white drop-shadow-md">Save Changes</span>
      </button>

      <button 
        onclick={handleDelete}
        class="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-500/20 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
      >
        <Trash2 class="w-3.5 h-3.5" />
        Delete Channel
      </button>
    </div>
  </div>

  <!-- Tabs Nav -->
  <div class="px-6 border-b border-white/5 bg-[#030014]/40">
    <div class="flex gap-1 py-2">
      {#each tabs as tab}
        {@const isActive = activeTab === tab.id}
        {@const Icon = tab.icon}
        <button 
          onclick={() => activeTab = tab.id}
          class={`relative flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl ${isActive ? 'text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
        >
          {#if isActive}
            <div class="absolute inset-0 bg-white/5 border border-white/10 rounded-xl"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
          {/if}
          <Icon class={`w-4 h-4 ${isActive ? 'text-goclaw-neon-purple' : ''}`} />
          {tab.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
    <div class="max-w-4xl mx-auto space-y-6">
      {#if loading}
        <div class="space-y-6">
          <div class="h-32 bg-white/5 rounded-2xl animate-pulse"></div>
          <div class="h-64 bg-white/5 rounded-2xl animate-pulse"></div>
        </div>
      {:else if instance}
        <!-- Diagnostics Card (Auto-show if issue) -->
        {#if statusMeta.attention && renderableStatus}
          <ChannelDiagnosticsCard
            status={renderableStatus}
            {statusMeta}
            remediation={remediationMeta}
            {checkedLabel}
            diagnosticsHint={$_('channels.detail.diagnosticsHint', { default: "Review the latest diagnosis in this channel before changing settings." })}
            {timelineItems}
            onRemediationAction={() => {
              if (remediationMeta?.target === 'credentials') activeTab = 'credentials';
              else if (remediationMeta?.target === 'reauth') reauthOpen = true;
              else if (remediationMeta?.target === 'advanced') showAdvanced = true;
            }}
          />
        {/if}

        {#if activeTab === 'general'}
          <div class="grid gap-6">
            <!-- Basic Info Card -->
            <div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden group">
              <div class="absolute top-0 right-0 w-32 h-32 bg-goclaw-neon-purple/5 rounded-full blur-3xl group-hover:bg-goclaw-neon-purple/10 transition-all duration-700"></div>
              
              <h3 class="text-sm font-bold text-white/90 mb-6 flex items-center gap-2">
                <Settings class="w-4 h-4 text-goclaw-neon-purple" />
                Basic Configuration
              </h3>

              <div class="grid sm:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Display Name</label>
                  <input 
                    type="text" 
                    bind:value={displayName}
                    placeholder="Enter channel name"
                    class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple/30 transition-all outline-none text-white placeholder:text-white/10"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Assigned Agent</label>
                  <select 
                    bind:value={agentId}
                    class="w-full bg-[#030014] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple transition-all outline-none text-white"
                  >
                    {#each agentOptions as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
                </div>

                <div class="sm:col-span-2 flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <h4 class="text-xs font-bold text-white">Channel Enabled</h4>
                    <p class="text-[10px] text-white/40 mt-1 uppercase tracking-wider">Turn on/off all communication for this channel</p>
                  </div>
                  <button 
                    onclick={() => enabled = !enabled}
                    class={`relative w-12 h-6 rounded-full transition-all duration-500 border ${enabled ? 'bg-goclaw-neon-purple/20 border-goclaw-neon-purple/40' : 'bg-white/5 border-white/10'}`}
                  >
                    <div class={`absolute top-1 w-4 h-4 rounded-full transition-all duration-500 ${enabled ? 'left-7 bg-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.8)]' : 'left-1 bg-white/20'}`}></div>
                  </button>
                </div>
              </div>
            </div>

            <!-- Policies section -->
            {#if configFields.length > 0}
              <div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden">
                <h3 class="text-sm font-bold text-white/90 mb-6 flex items-center gap-2">
                  <ShieldCheck class="w-4 h-4 text-goclaw-neon-purple" />
                  Channel Policies
                </h3>
                <ChannelFields
                  fields={configFields}
                  values={policyValues}
                  onChange={(k, v) => policyValues[k] = v}
                  idPrefix="cd-pol"
                  instanceId={instance.id}
                  contextValues={policyValues}
                  isEdit
                />
              </div>
            {/if}

            <!-- Runtime Status Info -->
            <div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden">
               <div class="flex items-start gap-4">
                  <div class={`p-3 rounded-2xl border ${renderableStatus?.running ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {#if renderableStatus?.running}
                      <CheckCircle2 class="w-6 h-6" />
                    {:else}
                      <AlertCircle class="w-6 h-6" />
                    {/if}
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-white">System Status</h4>
                    <p class="text-xs text-white/40 mt-1 leading-relaxed">
                      {renderableStatus?.running ? 'The channel is currently active and processing messages.' : 'The channel is inactive or requires configuration.'}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        {:else if activeTab === 'credentials'}
          <div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl">
            <h3 class="text-sm font-bold text-white/90 mb-6 flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-goclaw-neon-cyan" />
              Credentials & Authentication
            </h3>

            <div class="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
              <p class="text-xs text-blue-400 leading-relaxed">
                Credentials are write-only for security. Leave fields blank to keep existing values.
              </p>
            </div>

            <div class="grid gap-6">
              {#if credentialFields.length > 0}
                <ChannelFields
                  fields={credentialFields}
                  values={credentials}
                  onChange={(k, v) => credentials[k] = v}
                  idPrefix="cd-cred"
                  instanceId={instance.id}
                  isEdit
                />
              {:else}
                <div class="py-12 flex flex-col items-center justify-center text-center px-6">
                  <div class="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <ShieldCheck class="w-8 h-8 text-white/20" />
                  </div>
                  <h3 class="text-sm font-bold text-white/80">No Specific Credentials</h3>
                  <p class="text-xs text-white/40 mt-2 max-w-xs mx-auto uppercase tracking-widest">
                    This channel type does not require static credentials.
                  </p>
                </div>
              {/if}
            </div>
          </div>
        {:else if activeTab === 'members'}
          <ChannelManagersTab instanceId={id} />
        {:else if activeTab === 'groups'}
          <TelegramGroupsTab 
            instanceId={id} 
            config={instance.config || {}} 
            onSave={async (groups) => {
              await channels.updateInstance(id, { config: { ...instance.config, groups } });
              await loadData();
            }}
          />
        {:else if activeTab === 'pairing'}
          {#if instance.channel_type === 'whatsapp'}
            <WhatsAppPairingTab 
              instanceId={id} 
              onSuccess={() => channels.loadStatus()} 
            />
          {/if}
        {:else if activeTab === 'diagnostics'}
          <div class="grid gap-6">
            <!-- Main Health Card -->
            <div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden">
              <h3 class="text-sm font-bold text-white/90 mb-6 flex items-center gap-2">
                <Activity class="w-4 h-4 text-emerald-400" />
                Health Overview
              </h3>
              
              <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p class="text-[9px] font-black text-white/20 uppercase tracking-widest">Protocol State</p>
                  <p class={cn("text-sm font-bold uppercase", renderableStatus?.state === 'healthy' ? 'text-emerald-400' : 'text-amber-400')}>
                    {renderableStatus?.state || 'Unknown'}
                  </p>
                </div>
                <div class="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p class="text-[9px] font-black text-white/20 uppercase tracking-widest">Runtime Execution</p>
                  <p class={cn("text-sm font-bold uppercase", renderableStatus?.running ? 'text-emerald-400' : 'text-red-400')}>
                    {renderableStatus?.running ? 'Running' : 'Stopped'}
                  </p>
                </div>
                <div class="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p class="text-[9px] font-black text-white/20 uppercase tracking-widest">Last Check</p>
                  <p class="text-sm font-bold text-white/80 tabular-nums">
                    {formatRelativeTime(renderableStatus?.checked_at) || 'Never'}
                  </p>
                </div>
                <div class="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p class="text-[9px] font-black text-white/20 uppercase tracking-widest">Connectivity</p>
                  <p class="text-sm font-bold text-white/80 uppercase">
                    {renderableStatus?.failure_kind ? renderableStatus.failure_kind : 'Stable'}
                  </p>
                </div>
              </div>

              {#if renderableStatus?.summary || renderableStatus?.detail}
                <div class="mt-6 p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                   <p class="text-xs font-bold text-white/70 italic">"{renderableStatus.summary || 'No summary provided'}"</p>
                   {#if renderableStatus.detail}
                     <p class="text-[10px] text-white/40 font-mono leading-relaxed break-all">{renderableStatus.detail}</p>
                   {/if}
                </div>
              {/if}
            </div>

            <!-- Reliability & Failures -->
            <div class="grid md:grid-cols-2 gap-6">
               <div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden">
                  <h3 class="text-sm font-bold text-white/90 mb-6 flex items-center gap-2">
                    <Zap class="w-4 h-4 text-amber-400" />
                    Reliability Metrics
                  </h3>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                       <span class="text-[10px] font-black text-white/30 uppercase tracking-widest">Total Failures</span>
                       <span class="text-sm font-mono font-bold text-white/80">{renderableStatus?.failure_count ?? 0}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                       <span class="text-[10px] font-black text-white/30 uppercase tracking-widest">Consecutive Failures</span>
                       <span class={cn("text-sm font-mono font-bold", (renderableStatus?.consecutive_failures ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400')}>
                         {renderableStatus?.consecutive_failures ?? 0}
                       </span>
                    </div>
                    <div class="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                       <span class="text-[10px] font-black text-white/30 uppercase tracking-widest">Retryable</span>
                       <span class="text-xs font-bold uppercase {renderableStatus?.retryable ? 'text-sky-400' : 'text-white/20'}">
                         {renderableStatus?.retryable ? 'Yes' : 'No'}
                       </span>
                    </div>
                  </div>
               </div>

               <div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden">
                  <h3 class="text-sm font-bold text-white/90 mb-6 flex items-center gap-2">
                    <History class="w-4 h-4 text-purple-400" />
                    Event Timeline
                  </h3>
                  <div class="space-y-3">
                    <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                       <span class="text-[9px] font-black text-white/20 uppercase tracking-widest">Last Healthy</span>
                       <span class="text-xs font-bold text-emerald-400/80">{formatRelativeTime(renderableStatus?.last_healthy_at) || 'N/A'}</span>
                    </div>
                    <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                       <span class="text-[9px] font-black text-white/20 uppercase tracking-widest">Last Failure</span>
                       <span class="text-xs font-bold text-red-400/80">{formatRelativeTime(renderableStatus?.last_failed_at) || 'N/A'}</span>
                    </div>
                    <div class="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                       <span class="text-[9px] font-black text-white/20 uppercase tracking-widest">First Failure Recorded</span>
                       <span class="text-xs font-bold text-white/40">{formatRelativeTime(renderableStatus?.first_failed_at) || 'N/A'}</span>
                    </div>
                  </div>
               </div>
            </div>

            <!-- Technical Inspector -->
            <div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden">
               <div class="flex items-center justify-between mb-6">
                  <h3 class="text-sm font-bold text-white/90 flex items-center gap-2">
                    <Terminal class="w-4 h-4 text-blue-400" />
                    Engine Raw State
                  </h3>
                  <button 
                    onclick={() => {
                      navigator.clipboard.writeText(JSON.stringify(renderableStatus, null, 2));
                    }}
                    class="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                  >
                    Copy JSON
                  </button>
               </div>
               <div class="p-4 rounded-2xl bg-black/60 border border-white/5 font-mono text-[10px] text-blue-400/60 overflow-x-auto custom-scrollbar">
                  <pre>{JSON.stringify(renderableStatus, null, 2)}</pre>
               </div>
            </div>

            <!-- Group Overrides (Always visible in diagnostics if present) -->
            {#if instance.config?.groups && Object.keys(instance.config.groups).length > 0}
                <div class="p-6 rounded-[2rem] bg-[#030014]/40 border border-white/10 shadow-2xl relative overflow-hidden">
                  <h4 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Active Group Logic Overrides</h4>
                  <div class="grid gap-2">
                    {#each Object.entries(instance.config.groups) as [groupKey, groupConf]}
                      <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 group/row">
                        <div class="flex flex-col gap-0.5">
                          <span class="font-mono text-[10px] text-white/80">{groupKey}</span>
                          <span class="text-[8px] text-white/20 uppercase tracking-tighter">
                            {Object.keys(groupConf || {}).length} rules applied
                          </span>
                        </div>
                        <span class="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[9px] font-black text-purple-400 uppercase tracking-widest">
                          Active
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </div>

  <ChannelAdvancedDialog
    open={showAdvanced}
    onClose={() => showAdvanced = false}
    instance={instance}
    onSave={handleSaveAdvanced}
  />

  {#if instance?.channel_type === 'whatsapp'}
    <WhatsAppReauthDialog
      open={reauthOpen}
      onOpenChange={(v) => reauthOpen = v}
      instanceId={instance.id}
      instanceName={instance.display_name || instance.name}
      onSuccess={() => channels.loadStatus()}
    />
  {:else if instance?.channel_type === 'zalo_personal'}
    <ZaloReauthDialog
      open={reauthOpen}
      onOpenChange={(v) => reauthOpen = v}
      instanceId={instance.id}
      instanceName={instance.display_name || instance.name}
      onSuccess={() => channels.loadStatus()}
    />
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(217, 70, 239, 0.2);
  }
</style>
