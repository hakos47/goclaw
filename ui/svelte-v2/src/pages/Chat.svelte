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

<div class="flex h-full w-full overflow-hidden relative isolate">

    <!-- Sidebar -->
    <div class="h-full {sessionKey && sessionKey !== 'chat' ? 'hidden md:block' : 'w-full md:w-auto'}">
        <ChatSidebar activeKey={sessionKey} />
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col min-w-0 relative z-10 {(!sessionKey || sessionKey === 'chat') ? 'hidden md:flex' : 'flex'}">
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
            <div class="flex-1 flex items-center justify-center relative p-6 overflow-y-auto custom-scrollbar">
                <!-- Glowing orb background for empty state -->
                <div class="absolute w-[500px] h-[500px] bg-gradient-to-br from-goclaw-neon-purple/10 to-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                <div class="absolute w-64 h-64 bg-goclaw-neon-cyan/5 blur-[80px] rounded-full pointer-events-none translate-x-32 translate-y-32"></div>
                
                <div class="text-center space-y-8 relative z-10 max-w-2xl w-full py-10">
                    <div class="relative w-32 h-32 mx-auto mb-6">
                        <div class="absolute inset-0 bg-goclaw-neon-purple/20 blur-[40px] rounded-full animate-pulse-slow"></div>
                        <img src="/goclaw-nix.png" alt="GoClaw" class="relative w-32 h-32 opacity-90 drop-shadow-[0_0_20px_rgba(217,70,239,0.8)] mx-auto animate-float" />
                    </div>
                    <div>
                        <h2 class="text-3xl md:text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-[#d946ef] to-[#3b82f6] drop-shadow-[0_0_10px_rgba(217,70,239,0.3)]">Command Uplink</h2>
                        <p class="text-xs font-mono text-white/40 uppercase tracking-[0.2em] mt-3">Select an operative from the sidebar to establish a secure session</p>
                    </div>
                    <div class="pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 z-20 relative text-left">
                        {#if agentsState.agents.length === 0}
                            <div class="col-span-full text-center text-goclaw-neon-purple/50 text-[10px] font-mono tracking-widest uppercase py-8 border border-goclaw-neon-purple/20 rounded-2xl bg-goclaw-neon-purple/5 border-dashed">
                                NO OPERATIVES DEPLOYED
                            </div>
                        {:else}
                            {#each agentsState.agents as agent}
                                <button 
                                    onclick={() => launchAgent(agent.id || agent.agent_key)}
                                    class="relative p-5 group/agent transition-all duration-500 hover:-translate-y-1 isolate overflow-hidden bg-black/40 backdrop-blur-3xl border border-[#d946ef]/20 shadow-[0_0_30px_rgba(217,70,239,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(217,70,239,0.3)] hover:border-[#d946ef]/50 rounded-3xl flex flex-col h-[140px]"
                                >
                                    <!-- Ambient Glow -->
                                    <div class="absolute inset-0 bg-gradient-to-br from-goclaw-neon-purple/0 to-goclaw-neon-cyan/0 group-hover/agent:from-goclaw-neon-purple/10 group-hover/agent:to-goclaw-neon-cyan/5 transition-all duration-500 pointer-events-none"></div>
                                    
                                    <!-- Scanline Background -->
                                    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
                                    
                                    <!-- Header (Avatar + Name) -->
                                    <div class="flex items-start gap-4 relative z-10 w-full">
                                        <div class="h-12 w-12 shrink-0 rounded-xl bg-[#030014] flex items-center justify-center border border-white/10 group-hover/agent:border-goclaw-neon-purple/50 group-hover/agent:text-goclaw-neon-purple group-hover/agent:shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all duration-500 shadow-inner">
                                            {#if agent.emoji}
                                                <span class="text-xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{agent.emoji}</span>
                                            {:else}
                                                <Bot class="h-6 w-6 text-white/50 group-hover/agent:text-goclaw-neon-purple transition-colors duration-500" />
                                            {/if}
                                        </div>
                                        <div class="flex flex-col min-w-0 pt-0.5 flex-1">
                                            <span class="text-[9px] font-mono text-goclaw-neon-cyan uppercase tracking-[0.3em] mb-1">Operative</span>
                                            <p class="text-xs font-bold text-white/80 group-hover/agent:text-white uppercase tracking-wider truncate transition-colors duration-300 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                                                {agent.name || agent.display_name || agent.agent_key || agent.id}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <!-- Footer (Model) -->
                                    <div class="relative z-10 w-full mt-auto pt-4 flex items-center gap-2">
                                        <div class="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover/agent:via-goclaw-neon-purple/40 transition-colors duration-500"></div>
                                        <p class="text-[10px] font-mono text-white/40 group-hover/agent:text-goclaw-neon-cyan truncate uppercase tracking-widest flex items-center gap-1.5 shrink-0 transition-colors duration-500">
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.8)] group-hover/agent:animate-pulse"></span>
                                            {agent.model || 'Unknown Model'}
                                        </p>
                                        <div class="h-px flex-1 bg-gradient-to-r from-white/10 via-transparent to-transparent group-hover/agent:from-goclaw-neon-cyan/40 transition-colors duration-500"></div>
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
