<script lang="ts">
  import { onMount } from "svelte";
  import { sessionsState, loadSessions, deleteSession, getSessionLabel, type SessionCategory } from "../../state/sessions.svelte";
  import { agentsState, loadAgents } from "../../../pages/agents/hooks/use-agents.svelte";
  import { wsState } from "../../state/ws.svelte";
  import { Plus, Target, LifeBuoy, TrendingUp, ChevronDown, ChevronRight, User, Terminal, Trash2, MessageSquare, Bot, Phone, Globe, Loader2 } from "lucide-svelte";
  import { cn } from "../../utils";
  import { _ } from "svelte-i18n";

  type Props = {
    activeKey: string;
  };

  let { activeKey }: Props = $props();

  let selectedAgentId = $state("");
  let collapsed = $state<Record<string, boolean>>({
    personal: false,
    inbound: false,
    support: false,
    system: true,
    evolution: true,
  });

  // Reactive effect to load data as soon as WS is connected
  $effect(() => {
    if (wsState.connected) {
        loadAgents();
        loadSessions(selectedAgentId);
    }
  });

  function toggleCategory(cat: string) {
    collapsed[cat] = !collapsed[cat];
  }

  const categories: { key: SessionCategory; icon: any; label: string; color: string }[] = [
    { key: "personal", icon: User, label: "Personal", color: "text-blue-400" },
    { key: "inbound", icon: Target, label: "Inbound", color: "text-emerald-400" },
    { key: "support", icon: LifeBuoy, label: "Support", color: "text-amber-400" },
    { key: "system", icon: Terminal, label: "System", color: "text-purple-400" },
    { key: "evolution", icon: TrendingUp, label: "Evolution", color: "text-pink-400" },
  ];

  function handleNewChat() {
    if (selectedAgentId) {
        const convId = crypto.randomUUID().slice(0, 8);
        const newKey = `agent:${selectedAgentId}:ws:direct:${convId}`;
        window.history.pushState({}, '', `/chat/${newKey}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  function handleAgentChange() {
    if (wsState.connected) {
        loadSessions(selectedAgentId);
    }
  }
</script>

<div class="w-80 h-full flex flex-col border-r border-white/5 bg-[#030014]/60 backdrop-blur-3xl shadow-[5px_0_30px_rgba(0,0,0,0.5)] z-10 relative overflow-hidden">
  <!-- Scanline Background for Sidebar -->
  <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
  <div class="absolute top-0 right-0 w-64 h-64 bg-goclaw-neon-purple/10 blur-[80px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

  <!-- Agent Selector -->
  <div class="p-4 border-b border-white/5 relative z-50">
    <div class="relative group z-50">
        <div class="absolute inset-0 bg-goclaw-neon-purple/5 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div class="w-full h-12 pl-12 pr-10 flex items-center justify-between rounded-2xl bg-black/40 border border-white/10 text-white text-sm hover:border-goclaw-neon-purple/50 outline-none transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] cursor-pointer relative z-10 group-hover:shadow-[0_0_15px_rgba(217,70,239,0.2)]">
            <span class="truncate font-bold tracking-wider uppercase text-white/80 group-hover:text-white transition-colors">{agentsState.agents.find(a => a.id === selectedAgentId)?.name || 'All Agents'}</span>
        </div>
        <Bot class="absolute left-4 top-3.5 h-5 w-5 text-goclaw-neon-purple z-10 pointer-events-none" />
        <ChevronDown class="absolute right-4 top-4 h-4 w-4 text-white/20 pointer-events-none z-10 transition-transform group-hover:text-goclaw-neon-purple" />

        <div class="absolute top-full left-0 right-0 mt-2 bg-[#030014]/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,1),inset_0_1px_1px_rgba(255,255,255,0.05)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] flex flex-col p-2 max-h-[300px] overflow-y-auto custom-scrollbar relative isolate">
            <!-- Scanline Background for Dropdown -->
            <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none rounded-2xl"></div>
            
            <button 
                onclick={() => { selectedAgentId = ""; handleAgentChange(); }}
                class="relative z-10 text-left px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors"
            >
                All Agents
            </button>
            <div class="relative z-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1 mx-2"></div>
            {#each agentsState.agents as agent}
                <button 
                    onclick={() => { selectedAgentId = agent.id; handleAgentChange(); }}
                    class={`relative z-10 text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 truncate group/item overflow-hidden isolate ${selectedAgentId === agent.id ? 'bg-goclaw-neon-purple/10 text-goclaw-neon-purple border border-goclaw-neon-purple/30 shadow-[0_0_20px_rgba(217,70,239,0.15)]' : 'text-white/70 hover:text-white border border-transparent hover:bg-white/[0.03] hover:border-white/10'}`}
                >
                    <!-- Active indicator / hover effect -->
                    <div class={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${selectedAgentId === agent.id ? 'bg-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.8)]' : 'bg-white/20 opacity-0 group-hover/item:opacity-100'}`}></div>
                    <div class={`absolute inset-0 bg-gradient-to-r from-goclaw-neon-purple/5 to-transparent pointer-events-none transition-opacity duration-300 ${selectedAgentId === agent.id ? 'opacity-100' : 'opacity-0'}`}></div>
                    
                    <span class="pl-2">{agent.name || agent.agent_key}</span>
                </button>
            {/each}
        </div>
    </div>
  </div>

  <!-- New Chat Button -->
  <div class="p-4 relative z-20">
    <button 
        onclick={handleNewChat}
        disabled={!selectedAgentId}
        class="w-full h-11 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 hover:bg-goclaw-neon-cyan/10 hover:text-goclaw-neon-cyan hover:border-goclaw-neon-cyan/50 transition-all shadow-sm disabled:opacity-20 relative overflow-hidden group/btn shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
        <!-- Cybernetic Corners -->
        <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 rounded-tl-xl opacity-50 group-hover/btn:border-goclaw-neon-cyan group-hover/btn:opacity-100 transition-colors"></div>
        <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 rounded-br-xl opacity-50 group-hover/btn:border-goclaw-neon-cyan group-hover/btn:opacity-100 transition-colors"></div>
        
        <Plus class="h-4 w-4 relative z-10" />
        <span class="relative z-10">New Session</span>
    </button>
  </div>

  <!-- Session List -->
  <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3 relative z-20">
    {#if !wsState.connected}
        <div class="py-10 text-center space-y-3 px-6">
            <Loader2 class="h-5 w-5 animate-spin text-goclaw-neon-purple mx-auto" />
            <p class="text-[9px] font-bold uppercase tracking-widest text-white/20">Waiting for Secure Link...</p>
        </div>
    {:else}
        {#each categories as cat}
            {@const items = sessionsState.categorized[cat.key] || []}
            {#if items.length > 0 || sessionsState.loading}
                <div class="space-y-1 relative">
                    <!-- Category Header -->
                    <button 
                        onclick={() => toggleCategory(cat.key)}
                        class="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.03] transition-colors group relative overflow-hidden"
                    >
                        <div class="absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class={cn("p-1.5 rounded-lg bg-black/40 border border-white/5 transition-colors group-hover:border-white/20", cat.color)}>
                            <cat.icon class="h-3 w-3" />
                        </div>
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white/60 transition-colors">{cat.label}</span>
                        <span class="ml-auto text-[9px] font-mono text-white/20 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">{items.length}</span>
                        <div class={cn("transition-transform duration-300 ml-1", !collapsed[cat.key] && "rotate-180")}>
                            <ChevronDown class="h-3 w-3 text-white/20 group-hover:text-white/50" />
                        </div>
                    </button>

                    {#if !collapsed[cat.key]}
                        <div class="space-y-1.5 px-2 mt-1 relative">
                            <!-- Tactical connecting line -->
                            <div class="absolute top-0 bottom-0 left-4 w-px bg-gradient-to-b from-white/10 to-transparent"></div>
                            
                            {#if sessionsState.loading && items.length === 0}
                                <div class="pl-6 py-2 animate-pulse">
                                    <div class="h-10 bg-white/5 rounded-xl border border-white/5"></div>
                                </div>
                            {/if}
                            {#each items as session}
                                {@const label = getSessionLabel(session)}
                                {@const isWhatsApp = session.channelType === "whatsapp" || session.key.includes("whatsapp")}
                                {@const Icon = isWhatsApp ? Phone : (session.channelType === "web" ? Globe : MessageSquare)}
                                {@const isActive = activeKey === session.key}
                                
                                <a 
                                    href="/chat/{session.key}"
                                    class={cn(
                                        "flex items-center gap-3 pl-4 pr-2 py-2.5 ml-2 rounded-xl transition-all group relative overflow-hidden",
                                        isActive ? "bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 shadow-[0_0_20px_rgba(217,70,239,0.15)]" : "hover:bg-white/[0.03] border border-transparent hover:border-white/10 bg-black/20"
                                    )}
                                >
                                    <!-- Active indicator strip -->
                                    {#if isActive}
                                        <div class="absolute left-0 top-0 bottom-0 w-1 bg-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.8)]"></div>
                                        <!-- Animated gradient background for active state -->
                                        <div class="absolute inset-0 bg-gradient-to-r from-goclaw-neon-purple/5 to-transparent pointer-events-none"></div>
                                    {:else}
                                        <div class="absolute left-0 top-2 bottom-2 w-px bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {/if}

                                    <div class={cn("p-1.5 rounded-lg flex items-center justify-center transition-colors relative z-10", isActive ? "bg-goclaw-neon-purple/20 text-goclaw-neon-purple" : "bg-white/5 text-white/30 group-hover:text-white/70 group-hover:bg-white/10")}>
                                        <Icon class="h-3.5 w-3.5" />
                                    </div>
                                    
                                    <div class="flex-1 min-w-0 relative z-10">
                                        <p class={cn("text-[11px] font-bold truncate tracking-wide uppercase transition-colors", isActive ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" : "text-white/60 group-hover:text-white/90")}>
                                            {label}
                                        </p>
                                        <p class="text-[8px] text-white/30 font-mono mt-0.5 truncate uppercase flex items-center gap-1 group-hover:text-white/50 transition-colors">
                                            <span>{session.agentName || 'Agent'}</span>
                                            <span class="w-0.5 h-0.5 rounded-full bg-white/20"></span>
                                            <span>{session.messageCount} msg</span>
                                        </p>
                                    </div>
                                    
                                    <button 
                                        onclick={(e) => { e.preventDefault(); deleteSession(session.key); }}
                                        class="p-1.5 rounded-lg hover:bg-red-500/20 text-white/0 group-hover:text-white/30 hover:!text-red-400 transition-all shrink-0 relative z-10"
                                    >
                                        <Trash2 class="h-3.5 w-3.5" />
                                    </button>
                                </a>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}
        {/each}
    {/if}
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
</style>
