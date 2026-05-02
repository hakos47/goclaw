<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { ChevronLeft, ChevronRight, Hash, Shield, MessageSquare, Send, Globe, LayoutGrid, User, Share2, Layers, MessageCircle, AppWindow, Hash as HashIcon } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { credentialsSchema } from "../../../pages/channels/channel-schemas";
  import ChannelFields from "../../../pages/channels/components/ChannelFields.svelte";

  let { agent, onComplete, onBack, onSkip } = $props<{ 
    agent: any, 
    onComplete: (channel: any) => void,
    onBack: () => void,
    onSkip: () => void
  }>();

  const channelTypes = [
    { value: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-400' },
    { value: 'discord', label: 'Discord', icon: Hash, color: 'text-indigo-400' },
    { value: 'slack', label: 'Slack', icon: HashIcon, color: 'text-orange-400' },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400' }
  ];

  let channelType = $state("telegram");
  let channelName = $state("telegram");
  let displayName = $state("");
  let credsValues = $state<Record<string, any>>({});
  
  let currentCredsSchema = $derived(credentialsSchema[channelType] || []);

  $effect(() => {
    if (channelType || !channelType) {
      credsValues = {};
    }
  });

  function slugify(text: string) {
    return text.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
  }

  function handleTypeChange(type: string) {
    channelType = type;
    channelName = slugify(type);
  }

  function handleComplete() {
    if (!channelName.trim()) return;
    
    const cleanCreds = Object.fromEntries(
      Object.entries(credsValues).filter(([, v]) => v !== undefined && v !== "" && v !== null),
    );

    onComplete({
      name: channelName.trim(),
      display_name: displayName.trim() || undefined,
      channel_type: channelType,
      agent_id: agent.id, // Ensure agent ID is sent
      credentials: Object.keys(cleanCreds).length > 0 ? cleanCreds : undefined,
      config: {
        dm_policy: "pairing",
        group_policy: "pairing",
        ...(channelType === "telegram" && { reaction_level: "full" }),
      },
      enabled: true
    });
  }
</script>

<div class="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 max-w-2xl mx-auto w-full">
  <div class="text-center space-y-2 mb-8">
    <h2 class="text-2xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Establish Uplink</h2>
    <p class="text-white/40 text-xs font-mono uppercase tracking-widest">Create a communication channel for <span class="text-goclaw-neon-purple font-mono">{agent.display_name || agent.name || 'Agent'}</span>.</p>
  </div>

  <div class="space-y-6 bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-30"></div>
    
    <div class="space-y-3 relative z-10">
      <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Gateway Protocol</label>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        {#each channelTypes as type}
          {@const isActive = channelType === type.value}
          <button 
            onclick={() => handleTypeChange(type.value)}
            class={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 group ${isActive ? 'bg-goclaw-neon-purple/10 border-goclaw-neon-purple shadow-[inset_0_0_15px_rgba(217,70,239,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <type.icon class={`w-6 h-6 ${isActive ? type.color : 'text-white/30 group-hover:text-white/50'}`} />
            <span class={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40'}`}>{type.label}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
      <div class="space-y-3 group/input">
        <label for="channelName" class="text-[10px] font-bold uppercase tracking-widest text-white/60 ml-1 flex items-center gap-2">
          <Hash class="w-3 h-3 text-cyan-400" />
          System Key
        </label>
        <input
          id="channelName"
          type="text"
          bind:value={channelName}
          class="w-full h-12 px-4 rounded-xl bg-black/60 border border-[#d946ef]/20 text-white font-mono text-sm focus:outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-white/20"
          placeholder="e.g. main_tg"
        />
      </div>

      <div class="space-y-3 group/input">
        <label for="displayName" class="text-[10px] font-bold uppercase tracking-widest text-white/60 ml-1 flex items-center gap-2">
          <Globe class="w-3 h-3 text-emerald-400" />
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          bind:value={displayName}
          class="w-full h-12 px-4 rounded-xl bg-black/60 border border-[#d946ef]/20 text-white font-sans text-sm focus:outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-white/20"
          placeholder="e.g. Support Bot"
        />
      </div>
    </div>

    {#if currentCredsSchema.length > 0}
      <div class="space-y-4 bg-white/[0.02] border border-white/5 rounded-2xl p-6 shadow-[inset_0_0_20px_rgba(255,255,255,0.01)] relative z-10 mt-4">
        <div class="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
          <Shield class="w-4 h-4 text-orange-400" />
          <h3 class="text-xs font-black text-white/80 uppercase tracking-widest">Credentials</h3>
        </div>
        <div class="text-[10px] text-white/30 italic mb-4">API tokens are securely encrypted before storage.</div>
        
        <ChannelFields 
          fields={currentCredsSchema} 
          values={credsValues} 
          onChange={(k, v) => credsValues[k] = v} 
          idPrefix="setup-cred" 
        />
      </div>
    {/if}

  </div>

  <div class="flex justify-between items-center pt-8">
    <Button 
      variant="ghost" 
      onclick={onBack}
      class="text-white/50 hover:text-white hover:bg-white/5 uppercase tracking-[0.2em] font-bold text-[10px] rounded-none px-6"
    >
      <ChevronLeft class="w-4 h-4 mr-2" />
      Back
    </Button>

    <div class="flex gap-4">
      <Button 
        variant="ghost"
        onclick={onSkip} 
        class="text-white/30 hover:text-white hover:bg-white/5 uppercase tracking-[0.2em] font-bold text-[10px] rounded-none"
      >
        Skip Uplink
      </Button>
      <button 
        disabled={!channelName.trim()}
        onclick={handleComplete} 
        class="h-14 relative flex items-center justify-center gap-2 px-10 py-3.5 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 overflow-hidden group text-white hover:scale-[1.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 disabled:opacity-50 disabled:hover:scale-100 disabled:grayscale min-w-[200px]"
      >
        <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
        <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-purple pointer-events-none group-hover:opacity-70 transition-opacity"></div>
        <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
        
        <span class="relative z-10 drop-shadow-md">Finalize Setup</span>
        <ChevronRight class="h-4 w-4 relative z-10 text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)] transition-all duration-500 group-hover:translate-x-1.5" strokeWidth={3} />
      </button>
    </div>
  </div>
</div>
