<script lang="ts">
  import {
    X,
    Radio,
    Plus,
    Loader2,
    MessageSquare,
    Globe,
    Hash,
    Shield,
    MessageCircle,
    Layers,
    Send,
    User,
    AppWindow,
    LayoutGrid,
    Share2,
    Hash as HashIcon
  } from "lucide-svelte";

  import { _ } from "svelte-i18n";
  import { useChannels } from "./hooks/use-channels.svelte";
  import { agentsState } from "../agents/hooks/use-agents.svelte";
  import { credentialsSchema, configSchema, type FieldDef } from "./channel-schemas";
  import ChannelFields from "./components/ChannelFields.svelte";
  import { unflattenConfig } from "$lib/config-flatten";

  type Props = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
  };

  let { open, onClose, onSuccess }: Props = $props();

  const { createInstance } = useChannels();
  
  let name = $state("");
  let displayName = $state("");
  let channelType = $state("whatsapp");
  let agentId = $state("");
  let loading = $state(false);
  let error = $state("");

  let credsValues = $state<Record<string, any>>({});
  let configValues = $state<Record<string, any>>({});

  let currentCredsSchema = $derived(credentialsSchema[channelType] || []);
  let currentConfigSchema = $derived(configSchema[channelType] || []);

  $effect(() => {
    if (open) {
      name = "";
      displayName = "";
      channelType = "whatsapp";
      agentId = agentsState.agents[0]?.id || "";
      error = "";
    }
  });

  // Track the current channel type to reset defaults when it changes
  $effect(() => {
    if (channelType || !channelType) { // Re-run when channelType changes
      credsValues = {};
      const defaultCfg: Record<string, any> = {};
      const schema = configSchema[channelType] || [];
      for (const f of schema) {
        if (f.defaultValue !== undefined) defaultCfg[f.key] = f.defaultValue;
      }
      configValues = defaultCfg;
    }
  });

  async function handleSubmit() {
    if (!name || !agentId) {
      error = "Name and Agent are required";
      return;
    }

    // Required creds check
    const missingCreds = currentCredsSchema.filter(f => f.required && !credsValues[f.key]);
    if (missingCreds.length > 0) {
      error = `Required fields missing: ${missingCreds.map(f => f.label).join(", ")}`;
      return;
    }

    // Clean configs
    const cleanConfig = Object.fromEntries(
      Object.entries(configValues).filter(([, v]) => v !== undefined && v !== "" && v !== null),
    );

    // Required config check
    const missingCfg = currentConfigSchema.filter(f => f.required && (cleanConfig[f.key] === undefined || cleanConfig[f.key] === "" || cleanConfig[f.key] === null));
    if (missingCfg.length > 0) {
      error = `Required fields missing: ${missingCfg.map(f => f.label).join(", ")}`;
      return;
    }

    const cleanCreds = Object.fromEntries(
      Object.entries(credsValues).filter(([, v]) => v !== undefined && v !== "" && v !== null),
    );

    loading = true;
    error = "";
    try {
      await createInstance({
        name,
        display_name: displayName || undefined,
        channel_type: channelType,
        agent_id: agentId,
        enabled: true,
        config: Object.keys(cleanConfig).length > 0 ? unflattenConfig(cleanConfig) : undefined,
        credentials: Object.keys(cleanCreds).length > 0 ? cleanCreds : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      error = err.message || "Failed to create channel";
    } finally {
      loading = false;
    }
  }

  const channelTypes = [
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400' },
    { value: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-400' },
    { value: 'discord', label: 'Discord', icon: Hash, color: 'text-indigo-400' },
    { value: 'slack', label: 'Slack', icon: HashIcon, color: 'text-orange-400' },
    { value: 'feishu', label: 'Feishu / Lark', icon: AppWindow, color: 'text-blue-400' },
    { value: 'zalo_oa', label: 'Zalo OA', icon: MessageCircle, color: 'text-blue-500' },
    { value: 'zalo_personal', label: 'Zalo Personal', icon: User, color: 'text-blue-600' },
    { value: 'facebook', label: 'Facebook', icon: Share2, color: 'text-blue-700' },
    { value: 'pancake', label: 'Pancake', icon: Layers, color: 'text-amber-500' },
  ];
</script>

{#if open}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <button 
      onclick={onClose}
      class="absolute inset-0 bg-[#030014]/80 backdrop-blur-xl transition-all duration-500 pointer-events-auto"
      aria-label="Close dialog"
    ></button>

    <!-- Dialog -->
    <div class="relative w-full max-w-2xl bg-[#030014]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
      <!-- Glow Effects -->
      <div class="absolute top-0 right-0 w-80 h-80 bg-goclaw-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-goclaw-neon-cyan/5 rounded-full blur-[80px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 bg-goclaw-neon-cyan/5 rounded-full blur-[60px] pointer-events-none"></div>

      <!-- Header -->
      <div class="relative px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Radio class="w-6 h-6 text-goclaw-neon-purple" />
          </div>
          <div>
            <h2 class="text-xl font-bold tracking-tight text-white">Initialize Channel</h2>
            <p class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Connect new communication gateway</p>
          </div>
        </div>
        <button 
          onclick={onClose}
          class="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="px-8 py-8 space-y-6 overflow-y-auto custom-scrollbar">
        {#if error}
          <div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-3">
            <X class="w-4 h-4" />
            {error}
          </div>
        {/if}

        <div class="grid gap-6">
          <!-- Channel Type Selection -->
          <div class="space-y-3">
            <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Gateway Protocol</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {#each channelTypes as type}
                {@const isActive = channelType === type.value}
                <button 
                  onclick={() => channelType = type.value}
                  class={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-500 group overflow-hidden ${isActive ? 'bg-goclaw-neon-purple/5 border-goclaw-neon-purple/50 shadow-[0_0_20px_rgba(217,70,239,0.2)]' : 'bg-black/60 border-white/5 hover:border-white/10 hover:bg-black/80'}`}
                >
                  {#if isActive}
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none"></div>
                  {/if}
                  <div class={`relative z-10 p-2 rounded-lg bg-black border group-hover:scale-110 transition-transform ${isActive ? 'border-goclaw-neon-purple/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'border-white/5'}`}>
                    <type.icon class={`w-4 h-4 ${isActive ? type.color : 'text-white/20'}`} />
                  </div>
                  <span class={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40'}`}>{type.label}</span>
                  {#if isActive}
                    <div class="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-goclaw-neon-purple shadow-[0_0_8px_rgba(217,70,239,1)]"></div>
                  {/if}
                </button>
              {/each}
            </div>
          </div>

          <!-- Name Inputs -->
          <div class="grid sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                <Hash class="w-3 h-3" />
                System Key *
              </label>
              <input 
                type="text" 
                bind:value={name}
                placeholder="e.g. main_wa"
                class="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple/50 transition-all outline-none text-white placeholder:text-white/20 shadow-inner"
              />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                <Globe class="w-3 h-3" />
                Friendly Name
              </label>
              <input 
                type="text" 
                bind:value={displayName}
                placeholder="e.g. Sales WhatsApp"
                class="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple/50 transition-all outline-none text-white placeholder:text-white/20 shadow-inner"
              />
            </div>
          </div>

          <!-- Agent Selection -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
              <Shield class="w-3 h-3" />
              Auth Agent *
            </label>
            <select 
              bind:value={agentId}
              class="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple/50 transition-all outline-none text-white appearance-none shadow-inner"
            >
              <option value="" disabled>Select an agent to handle this channel</option>
              {#each agentsState.agents as agent}
                <option value={agent.id}>{agent.display_name || agent.agent_key}</option>
              {/each}
            </select>
          </div>

          <!-- Credentials -->
          {#if currentCredsSchema.length > 0}
            <div class="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.01)]">
              <div class="flex items-center gap-2 mb-4">
                <Shield class="w-4 h-4 text-emerald-400" />
                <h3 class="text-sm font-bold text-white uppercase tracking-widest">Credentials</h3>
              </div>
              <ChannelFields 
                fields={currentCredsSchema} 
                values={credsValues} 
                onChange={(k, v) => credsValues[k] = v} 
                idPrefix="cred" 
                contextValues={configValues}
              />
              <p class="text-[10px] text-white/30 italic mt-4">Credentials are securely encrypted before storage.</p>
            </div>
          {/if}

          <!-- Configuration -->
          {#if currentConfigSchema.length > 0}
            <div class="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.01)]">
              <div class="flex items-center gap-2 mb-4">
                <LayoutGrid class="w-4 h-4 text-goclaw-neon-cyan" />
                <h3 class="text-sm font-bold text-white uppercase tracking-widest">Configuration</h3>
              </div>
              <ChannelFields 
                fields={currentConfigSchema.filter(f => !f.advanced)} 
                values={configValues} 
                onChange={(k, v) => configValues[k] = v} 
                idPrefix="cfg" 
              />
            </div>
          {/if}
        </div>
      </div>

      <!-- Footer -->
      <div class="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-end gap-3 shrink-0">
        <button 
          onclick={onClose}
          class="group relative flex items-center justify-center h-10 px-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white/50 hover:text-white transition-all duration-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span class="relative z-10">Cancel</span>
        </button>
        <button 
          onclick={handleSubmit}
          disabled={loading}
          class="relative flex items-center gap-2 px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl overflow-hidden group shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/50 to-goclaw-neon-purple/20 border border-goclaw-neon-purple/50 rounded-xl transition-all group-hover:from-goclaw-neon-purple/60 group-hover:to-goclaw-neon-purple/30"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none z-0"></div>
          {#if loading}
            <Loader2 class="w-3.5 h-3.5 relative z-10 animate-spin text-white" />
          {:else}
            <Plus class="w-3.5 h-3.5 relative z-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          {/if}
          <span class="relative z-10 text-white drop-shadow-md">Create Channel</span>
        </button>
      </div>
    </div>
  </div>
{/if}

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
