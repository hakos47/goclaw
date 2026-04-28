<script lang="ts">
  import { fade } from "svelte/transition";
  import { _, } from "svelte-i18n";
  import { X, Save, AlertCircle, Loader2 } from "lucide-svelte";
  import type { AgentData } from "../../../../lib/types/agent";
  import UserPickerCombobox from "./UserPickerCombobox.svelte";

  type Props = {
    agent: AgentData;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: (data: Partial<AgentData>) => Promise<void>;
  };

  let { agent, open, onOpenChange, onUpdate }: Props = $props();

  let loading = $state(false);
  let error = $state("");
  let success = $state(false);

  // Configuration State
  let comp = $state<Record<string, any>>({});
  let pruneEnabled = $state(false);
  let sbEnabled = $state(false);
  let wsSharing = $state<Record<string, any>>({});
  let reasoningObj = $state<Record<string, any>>({});
  
  let memFlushEnabled = $state(false);
  let newSharedUser = $state("");

  $effect(() => {
    if (open && agent) {
        error = "";
        success = false;

        comp = { ...(agent.compaction_config || {}) };
        memFlushEnabled = !!(agent.compaction_config?.memoryFlush?.enabled);
        
        pruneEnabled = agent.context_pruning?.mode === "cache-ttl";
        sbEnabled = agent.sandbox_config != null;
        wsSharing = { ...(agent.workspace_sharing || {}) };
        reasoningObj = { ...((agent.reasoning_config as Record<string, any>) || {}) };
    }
  });

  async function handleSave() {
    error = "";
    success = false;
    loading = true;
    
    try {
        const fullComp = { ...comp };
        if (memFlushEnabled) {
            fullComp.memoryFlush = { enabled: true };
        } else {
            delete fullComp.memoryFlush;
        }

        const updates: Partial<AgentData> = {
            compaction_config: Object.keys(fullComp).length ? fullComp : null,
            context_pruning: pruneEnabled ? { mode: "cache-ttl" } as any : null,
            sandbox_config: sbEnabled ? {} : null,
            workspace_sharing: Object.keys(wsSharing).length ? wsSharing : null,
            reasoning_config: Object.keys(reasoningObj).length ? reasoningObj as any : null
        };

        if (!pruneEnabled) updates.context_pruning = { mode: "off" } as any;

        if (reasoningObj.override_mode === 'custom' && reasoningObj.effort) {
            updates.thinking_level = reasoningObj.effort;
        } else {
            updates.thinking_level = null;
        }

        await onUpdate(updates);
        success = true;
        setTimeout(() => {
            if (open) onOpenChange(false);
        }, 1000);
    } catch (e: any) {
        error = e.message || "Failed to update configuration";
    } finally {
        loading = false;
    }
  }

  function addSharedUser() {
      if (newSharedUser.trim()) {
          if (!wsSharing.shared_users) wsSharing.shared_users = [];
          if (!wsSharing.shared_users.includes(newSharedUser.trim())) {
              wsSharing.shared_users = [...wsSharing.shared_users, newSharedUser.trim()];
          }
          newSharedUser = "";
      }
  }

  function removeSharedUser(user: string) {
      if (wsSharing.shared_users) {
          wsSharing.shared_users = wsSharing.shared_users.filter((u: string) => u !== user);
      }
  }
</script>

{#if open}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
    transition:fade={{ duration: 200 }}
    onclick={() => onOpenChange(false)}
  >
    <!-- Modal -->
    <div 
      class="bg-gradient-to-br from-[#030014]/95 to-[#1a0033]/90 border border-white/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8),inset_0_2px_20px_rgba(0,0,0,0.5)] flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Cyber Grid Background -->
      <div class="absolute inset-0 pointer-events-none mix-blend-screen overflow-hidden rounded-3xl">
        <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-80"></div>
      </div>

      <!-- Header -->
      <div class="px-8 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div class="flex items-center gap-3">
          <h2 class="text-xs font-black text-white/90 tracking-[0.3em] uppercase">
            Advanced Configuration
          </h2>
        </div>
        
        <button 
          onclick={() => onOpenChange(false)}
          class="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors border border-white/5"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Editor -->
      <div class="flex-1 overflow-y-auto flex flex-col p-8 space-y-10 relative z-10 scroller-no-scrollbar">
          
          <div class="space-y-6">
              <h3 class="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Workspace & Isolation</h3>
              
              <!-- Workspace Path -->
              <div class="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                  <div>
                      <h4 class="text-white/90 text-[11px] font-bold uppercase tracking-widest">Workspace Path</h4>
                  </div>
                  <div class="relative group/input">
                      <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/30 rounded-xl pointer-events-none transition-colors z-20"></div>
                      <input type="text" readonly value={`~/.goclaw/workspace/${agent.agent_key}`} class="w-full h-11 px-4 bg-white/[0.05] border border-white/5 rounded-xl text-white/70 text-sm font-mono outline-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10" />
                  </div>
                  <p class="text-white/30 text-[10px]">Automatically assigned when the agent is created. Per-user subdirectories are created at runtime.</p>
              </div>

              <!-- Memory & Knowledge Graph -->
              <div class="flex items-start gap-4">
                  <div class="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-orange-500/10 rounded-2xl border border-orange-500/30 text-orange-500 font-black shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                    M
                  </div>
                  <div class="flex-1 space-y-3">
                      <div>
                          <h4 class="text-white/90 text-sm font-bold">Memory & Knowledge Graph</h4>
                          <p class="text-white/40 text-[10px] uppercase tracking-widest mt-1">Control memory and knowledge graph isolation between users</p>
                      </div>
                      <div class="bg-black/40 border border-white/5 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                          <div class="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors rounded-t-2xl">
                              <span class="text-white/80 text-xs font-bold uppercase tracking-widest">Shared Memory</span>
                              <div onclick={() => wsSharing.share_memory = !wsSharing.share_memory} class={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${wsSharing.share_memory ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}>
                                  <div class={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${wsSharing.share_memory ? 'translate-x-5' : 'translate-x-0'}`}></div>
                              </div>
                          </div>
                          <div class="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <span class="text-white/80 text-xs font-bold uppercase tracking-widest">Shared Knowledge Graph</span>
                              <div onclick={() => wsSharing.share_knowledge_graph = !wsSharing.share_knowledge_graph} class={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${wsSharing.share_knowledge_graph ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}>
                                  <div class={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${wsSharing.share_knowledge_graph ? 'translate-x-5' : 'translate-x-0'}`}></div>
                              </div>
                          </div>
                          <div class="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors rounded-b-2xl">
                              <span class="text-white/80 text-xs font-bold uppercase tracking-widest">Share Sessions</span>
                              <div onclick={() => wsSharing.share_sessions = !wsSharing.share_sessions} class={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${wsSharing.share_sessions ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}>
                                  <div class={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${wsSharing.share_sessions ? 'translate-x-5' : 'translate-x-0'}`}></div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Workspace Sharing -->
              <div class="flex items-start gap-4 mt-6">
                  <div class="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-orange-500/10 rounded-2xl border border-orange-500/30 text-orange-500 font-black shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                    W
                  </div>
                  <div class="flex-1 space-y-4">
                      <div>
                          <h4 class="text-white/90 text-sm font-bold">Workspace Sharing</h4>
                          <p class="text-white/40 text-[10px] uppercase tracking-widest mt-1">Control workspace file isolation between users</p>
                      </div>

                      {#if wsSharing.shared_dm || wsSharing.shared_group}
                        <div class="bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-xl flex items-start gap-3 shadow-[inset_0_2px_10px_rgba(245,158,11,0.1)]">
                          <AlertCircle class="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <p class="text-amber-500 text-[11px] leading-relaxed">
                              When sharing is enabled, all shared users can read and write files in the same workspace directory. Memory sharing is controlled separately. Context files remain isolated per user.
                          </p>
                        </div>
                      {/if}

                      <div class="grid grid-cols-2 gap-4">
                          <div class="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                              <span class="text-white/80 text-xs font-bold uppercase tracking-widest">Share in DMs</span>
                              <div onclick={() => wsSharing.shared_dm = !wsSharing.shared_dm} class={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${wsSharing.shared_dm ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}>
                                  <div class={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${wsSharing.shared_dm ? 'translate-x-5' : 'translate-x-0'}`}></div>
                              </div>
                          </div>
                          <div class="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                              <span class="text-white/80 text-xs font-bold uppercase tracking-widest">Share in Groups</span>
                              <div onclick={() => wsSharing.shared_group = !wsSharing.shared_group} class={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${wsSharing.shared_group ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}>
                                  <div class={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${wsSharing.shared_group ? 'translate-x-5' : 'translate-x-0'}`}></div>
                              </div>
                          </div>
                      </div>

                      <!-- Shared Users -->
                      <div class="pt-4 space-y-3">
                          <h5 class="text-white/80 text-xs font-bold uppercase tracking-widest">Shared Users</h5>
                          <div class="flex gap-2 relative z-50">
                              <div class="flex-1 relative group/input" onkeydown={(e) => { if (e.key === 'Enter') addSharedUser(); }}>
                                  <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(168,85,247,0.3)]"></div>
                                  <UserPickerCombobox 
                                      bind:value={newSharedUser} 
                                      placeholder="Enter user ID (e.g. telegram:386246614)" 
                                  />
                              </div>
                              <button onclick={addSharedUser} class="w-11 h-11 flex shrink-0 items-center justify-center bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-white/50 hover:text-white transition-colors shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                                  <Plus class="w-5 h-5" />
                              </button>
                          </div>
                          {#if wsSharing.shared_users && wsSharing.shared_users.length > 0}
                              <div class="flex flex-wrap gap-2 mt-4">
                                  {#each wsSharing.shared_users as user (user)}
                                      <div class="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-mono text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                                          {user}
                                          <button onclick={() => removeSharedUser(user)} class="text-purple-300/50 hover:text-purple-300 transition-colors">
                                              <X class="w-3 h-3" />
                                          </button>
                                      </div>
                                  {/each}
                              </div>
                          {/if}
                      </div>
                  </div>
              </div>
          </div>

          <!-- Extended Thinking -->
          <div class="space-y-6 pt-6 border-t border-white/10">
              <div>
                  <h4 class="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Extended Thinking</h4>
                  <p class="text-white/40 text-[10px] mt-1">Allow the model to reason before responding. Higher levels use more tokens but produce better results on complex tasks.</p>
              </div>

              <div class="space-y-2">
                  <h5 class="text-white/50 text-[10px] font-bold uppercase tracking-widest">Reasoning Mode</h5>
                  <div class="flex gap-4">
                      <button onclick={() => reasoningObj.override_mode = 'inherit'} class={`flex-1 h-11 rounded-xl text-xs uppercase tracking-widest font-black transition-all border shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] ${reasoningObj.override_mode !== 'custom' ? 'border-purple-500 text-purple-400 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/5 text-white/50 bg-white/[0.02] hover:text-white hover:border-white/20 hover:bg-white/[0.05]'}`}>
                          Provider Defaults
                      </button>
                      <button onclick={() => reasoningObj.override_mode = 'custom'} class={`flex-1 h-11 rounded-xl text-xs uppercase tracking-widest font-black transition-all border shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] ${reasoningObj.override_mode === 'custom' ? 'border-purple-500 text-purple-400 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-white/5 text-white/50 bg-white/[0.02] hover:text-white hover:border-white/20 hover:bg-white/[0.05]'}`}>
                          Custom Strategy
                      </button>
                  </div>
              </div>
              
              {#if reasoningObj.override_mode === 'custom'}
                  <div class="space-y-2 relative group/select">
                      <label class="text-white/80 font-bold text-[10px] uppercase tracking-widest">Thinking Level</label>
                      <div class="relative">
                          <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)] group-focus-within/select:shadow-[inset_0_0_20px_rgba(168,85,247,0.3)]"></div>
                          <select bind:value={reasoningObj.effort} class="w-64 h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 text-sm font-bold outline-none appearance-none cursor-pointer relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                              <option value="low" class="bg-black">Low (~1-5K token budget)</option>
                              <option value="medium" class="bg-black">Medium (~10-16K token budget)</option>
                              <option value="high" class="bg-black">High (>16K token budget)</option>
                          </select>
                      </div>
                  </div>
              {/if}

              <div class="p-5 bg-white/[0.02] border border-white/5 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                  <p class="text-white/40 text-[10px]">GoClaw does not have explicit reasoning metadata for <span class="text-purple-400 font-mono">{agent.model}</span> yet.</p>
                  <p class="text-white/40 text-[10px] mt-2">Advanced reasoning controls are only available when the selected model has explicit capability metadata from the provider models endpoint.</p>
              </div>
          </div>

          <!-- PERFORMANCE -->
          <div class="space-y-6 pt-6 border-t border-white/10">
              <div>
                  <h3 class="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Performance Engine</h3>
                  <p class="text-white/40 text-[10px] mt-1">Context management and execution environment</p>
              </div>
              
              <div class="space-y-3">
                  <h4 class="text-white/90 text-sm font-bold">Compaction</h4>
                  <p class="text-white/40 text-[10px] uppercase tracking-widest">Context window compaction and memory flush settings</p>
                  <div class="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                      <div class="grid grid-cols-2 gap-6">
                          <div class="space-y-2 relative group/input">
                              <label class="text-white/80 font-bold text-[10px] uppercase tracking-widest">Max History Share (0-1)</label>
                              <div class="relative">
                                  <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                                  <input type="number" step="0.01" bind:value={comp.maxHistoryShare} placeholder="0.85" class="w-full h-11 px-4 bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-mono text-sm outline-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10" />
                              </div>
                          </div>
                          <div class="space-y-2 relative group/input">
                              <label class="text-white/80 font-bold text-[10px] uppercase tracking-widest">Keep Last Messages</label>
                              <div class="relative">
                                  <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                                  <input type="number" bind:value={comp.keepLastMessages} placeholder="4" class="w-full h-11 px-4 bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-mono text-sm outline-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10" />
                              </div>
                          </div>
                      </div>
                      <div class="flex items-center gap-3 pt-2">
                          <div onclick={() => memFlushEnabled = !memFlushEnabled} class={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${memFlushEnabled ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}>
                              <div class={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${memFlushEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                          </div>
                          <span class="text-white/90 text-xs font-bold uppercase tracking-widest">Memory Flush</span>
                      </div>
                  </div>
              </div>

              <!-- Context Pruning & Sandbox -->
              <div class="space-y-4 pt-4 border-t border-white/5">
                  <div class="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                      <div>
                          <h4 class="text-white/90 text-sm font-bold">Context Pruning</h4>
                          <p class="text-white/40 text-[10px] mt-1 uppercase tracking-widest">Automatically trims old tool results to prevent context overflow.</p>
                          <p class="text-white/30 text-[10px] font-mono mt-1">Using system defaults</p>
                      </div>
                      <div onclick={() => pruneEnabled = !pruneEnabled} class={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${pruneEnabled ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}>
                          <div class={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${pruneEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                  </div>

                  <div class="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                      <div>
                          <h4 class="text-white/90 text-sm font-bold">Sandbox</h4>
                          <p class="text-white/40 text-[10px] mt-1 uppercase tracking-widest">Docker sandbox for code execution isolation</p>
                          <p class="text-white/30 text-[10px] font-mono mt-1">Using system defaults</p>
                      </div>
                      <div onclick={() => sbEnabled = !sbEnabled} class={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${sbEnabled ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}>
                          <div class={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${sbEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                  </div>
              </div>
          </div>
          
        {#if error}
            <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p class="text-red-400 text-[10px] font-bold uppercase tracking-widest">{error}</p>
            </div>
        {/if}
        {#if success}
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <p class="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Configuration saved successfully.</p>
            </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-8 py-5 border-t border-white/5 flex justify-end gap-4 relative z-10 bg-black/40 backdrop-blur-md">
        <button
            onclick={() => onOpenChange(false)}
            class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/10"
        >
            Cancel
        </button>
        <button
            onclick={handleSave}
            disabled={loading}
            class="relative group h-10 px-8 flex items-center justify-center gap-2 rounded-xl bg-purple-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] border border-purple-400 overflow-hidden"
        >
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
            {#if loading}
                <Loader2 class="h-4 w-4 animate-spin relative z-10" /> <span class="relative z-10">Saving...</span>
            {:else}
                <Save class="h-4 w-4 relative z-10" strokeWidth={2.5} /> <span class="relative z-10">Save Configuration</span>
            {/if}
        </button>
      </div>

    </div>
  </div>
{/if}
