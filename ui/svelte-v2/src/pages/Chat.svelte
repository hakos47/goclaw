<script lang="ts">
  import { onMount } from "svelte";
  import { chatState, loadChatHistory } from "../lib/state/chat.svelte";
  import ChatSidebar from "../lib/components/chat/ChatSidebar.svelte";
  import ChatTopBar from "../lib/components/chat/ChatTopBar.svelte";
  import ChatThread from "../lib/components/chat/ChatThread.svelte";
  import ChatInput from "../lib/components/chat/ChatInput.svelte";
  import { authState } from "../lib/state/auth.svelte";
  import { wsState } from "../lib/state/ws.svelte";
  import { agentsState } from "./agents/hooks/use-agents.svelte";
  import { Bot } from "lucide-svelte";
  
  let sessionKey = $derived(wsState.currentPath.split('/').pop() || "");
  let agentId = $state(""); 

  let isReadOnly = $derived.by(() => {
      if (!sessionKey || sessionKey === 'chat') return false;
      const parts = sessionKey.split(':');
      if (parts.length >= 3) {
          const channel = parts[2];
          return channel === 'whatsapp' || channel === 'system';
      }
      return false;
  });

  // Reactive effect to load history when sessionKey changes AND WS is connected
  $effect(() => {
      if (wsState.connected && sessionKey && sessionKey !== 'chat' && sessionKey !== chatState.activeSessionKey) {
          chatState.activeSessionKey = sessionKey;
          const parts = sessionKey.split(':');
          if (parts.length >= 2) {
              // agent:uuid:channel:user:conv
              agentId = parts[1];
              loadChatHistory(sessionKey, agentId);
          }
      }
  });

  function launchAgent(id: string) {
      const convId = crypto.randomUUID().slice(0, 8);
      const newKey = `agent:${id}:ws:direct:${convId}`;
      window.history.pushState({}, '', `/chat/${newKey}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
  }
</script>

<div class="flex h-full w-full overflow-hidden bg-[#030014]/80 rounded-[2rem] border border-white/5 shadow-[0_0_50px_rgba(217,70,239,0.03)] backdrop-blur-3xl relative">
    <!-- Grid Background -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-30"></div>

    <!-- Sidebar -->
    <ChatSidebar activeKey={sessionKey} />

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col min-w-0 relative z-10">
        {#if sessionKey && sessionKey !== 'chat'}
            <ChatTopBar {agentId} />
            <ChatThread />
            <div class="p-4 relative z-20">
                {#if isReadOnly}
                    <div class="w-full p-4 rounded-[2rem] bg-[#030014]/60 backdrop-blur-3xl border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] flex items-center justify-center relative overflow-hidden group">
                        <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]"></div>
                        <span class="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30 flex items-center gap-2 relative z-10">
                            <div class="w-1.5 h-1.5 rounded-full bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                            Secure Channel [ Read-Only Mode ]
                        </span>
                    </div>
                {:else}
                    <ChatInput />
                {/if}
            </div>
        {:else}
            <div class="flex-1 flex items-center justify-center relative">
                <!-- Glowing orb background for empty state -->
                <div class="absolute w-96 h-96 bg-goclaw-neon-purple/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div class="absolute w-64 h-64 bg-goclaw-neon-cyan/5 blur-[80px] rounded-full pointer-events-none translate-x-20 translate-y-20"></div>
                
                <div class="text-center space-y-6 relative z-10 max-w-lg">
                    <div class="h-24 w-24 bg-black/60 rounded-3xl flex items-center justify-center mx-auto border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
                        <img src="/goclaw-nix.png" alt="GoClaw" class="h-12 w-12 opacity-40 grayscale" />
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold tracking-widest uppercase text-white/80">Command Uplink</h2>
                        <p class="text-xs font-mono text-white/40 uppercase tracking-[0.2em] mt-2">Select an operative from the sidebar to establish a secure session</p>
                    </div>
                    <div class="pt-8 grid grid-cols-2 gap-3 z-20 relative">
                        {#if agentsState.agents.length === 0}
                            <div class="col-span-2 text-center text-white/30 text-[10px] font-mono tracking-widest uppercase py-4">
                                NO OPERATIVES DEPLOYED
                            </div>
                        {:else}
                            {#each agentsState.agents as agent}
                                <button 
                                    onclick={() => launchAgent(agent.id || agent.agent_key)}
                                    class="relative p-5 group/agent transition-all duration-700 hover:-translate-y-1 isolate overflow-hidden bg-[#030014]/60 backdrop-blur-2xl border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl flex flex-col h-32 text-left"
                                >
                                    <!-- Cybernetic Corner Accents -->
                                    <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/20 rounded-tl-xl opacity-50 group-hover/agent:border-goclaw-neon-purple group-hover/agent:opacity-100 transition-colors duration-500"></div>
                                    <div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/20 rounded-tr-xl opacity-50 group-hover/agent:border-goclaw-neon-purple group-hover/agent:opacity-100 transition-colors duration-500"></div>
                                    <div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/20 rounded-bl-xl opacity-50 group-hover/agent:border-goclaw-neon-purple group-hover/agent:opacity-100 transition-colors duration-500"></div>
                                    <div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/20 rounded-br-xl opacity-50 group-hover/agent:border-goclaw-neon-purple group-hover/agent:opacity-100 transition-colors duration-500"></div>

                                    <!-- Ambient Glow & Scanline Background -->
                                    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
                                    <div class="absolute -right-8 -top-8 w-24 h-24 bg-goclaw-neon-purple/20 rounded-full blur-[30px] group-hover/agent:bg-goclaw-neon-purple/40 group-hover/agent:scale-150 transition-all duration-1000 ease-out"></div>
                                    <div class="absolute -left-8 -bottom-8 w-24 h-24 bg-goclaw-neon-cyan/10 rounded-full blur-[30px] group-hover/agent:bg-goclaw-neon-cyan/30 group-hover/agent:scale-150 transition-all duration-1000 ease-out"></div>
                                    
                                    <!-- Header (Avatar + Name) -->
                                    <div class="flex items-start gap-3 relative z-10 flex-1 w-full">
                                        <div class="h-10 w-10 shrink-0 rounded-xl bg-black/50 flex items-center justify-center border border-white/10 group-hover/agent:border-goclaw-neon-purple/50 group-hover/agent:text-goclaw-neon-purple group-hover/agent:shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-all duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                                            {#if agent.emoji}
                                                <span class="text-lg">{agent.emoji}</span>
                                            {:else}
                                                <Bot class="h-5 w-5 text-white/70 group-hover/agent:text-goclaw-neon-purple transition-colors duration-500" />
                                            {/if}
                                        </div>
                                        <div class="flex flex-col min-w-0 pt-0.5">
                                            <span class="text-[8px] font-mono text-goclaw-neon-cyan/70 uppercase tracking-[0.3em] mb-0.5">Operative</span>
                                            <p class="text-xs font-bold text-white/60 group-hover/agent:text-white uppercase tracking-wider truncate transition-colors duration-300">
                                                {agent.name || agent.display_name || agent.agent_key || agent.id}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <!-- Footer (Model) -->
                                    <div class="relative z-10 w-full mt-auto pt-3 flex items-center gap-2">
                                        <div class="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover/agent:via-goclaw-neon-purple/30 transition-colors duration-500"></div>
                                        <p class="text-[9px] font-mono text-white/30 group-hover/agent:text-white/60 truncate uppercase tracking-widest flex items-center gap-1.5 shrink-0 transition-colors duration-500">
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover/agent:animate-pulse"></span>
                                            {agent.model || 'Unknown Model'}
                                        </p>
                                        <div class="h-px flex-1 bg-gradient-to-r from-white/10 via-transparent to-transparent group-hover/agent:from-goclaw-neon-purple/30 transition-colors duration-500"></div>
                                    </div>
                                </button>
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>
