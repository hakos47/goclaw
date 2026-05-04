<script lang="ts">
  import { useWs } from "../../../../lib/state/ws.svelte.ts";
  import { createHook, updateHook } from "../../hooks/use-hooks.svelte.ts";
  import { agentsState, loadAgents } from "../../hooks/use-agents.svelte.ts";
  import { X, Check, Loader2, Webhook } from "lucide-svelte";
  import type { HookConfig } from "../../hooks/use-hooks.svelte.ts";

  type Props = {
    agentId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaveSuccess: () => void;
  };

  let { agentId, open, onOpenChange, onSaveSuccess }: Props = $props();

  const ws = useWs();
  let loading = $state(false);

  // Form state
  let hookName = $state("");
  let event = $state("session_start");
  let scope = $state<"global"|"tenant"|"agent">("agent");
  let selectedAgentIds = $state<string[]>([agentId]);
  let handlerType = $state<"script"|"http"|"prompt">("script");
  let matcher = $state("");
  let ifExpr = $state("");
  let timeoutMs = $state(5000);
  let onTimeout = $state("block");
  let priority = $state(100);
  let isEnabled = $state(true);

  // Handler specifics
  let scriptSource = $state("");
  let httpUrl = $state("");
  let httpMethod = $state("POST");
  let httpHeaders = $state("");
  let httpBodyTemplate = $state("");
  let promptTemplate = $state("");
  let promptModel = $state("haiku");
  let maxInvocations = $state(5);

  const HOOK_EVENTS = [
    "session_start", "user_prompt_submit", "pre_tool_use",
    "post_tool_use", "stop", "subagent_start", "subagent_stop"
  ];

  $effect(() => {
    loadAgents();
  });

  $effect(() => {
    if (open) {
      // Reset form
      hookName = "";
      event = "session_start";
      scope = "agent";
      selectedAgentIds = [agentId];
      handlerType = "script";
      matcher = "";
      ifExpr = "";
      scriptSource = "";
      isEnabled = true;
      timeoutMs = 5000;
      priority = 100;
      httpHeaders = "";
      httpBodyTemplate = "";
    }
  });

  async function handleSave() {
    if (loading) return;
    loading = true;

    try {
      const configObj: Record<string, any> = {};
      if (handlerType === "script") {
          configObj.source = scriptSource;
      } else if (handlerType === "http") {
          configObj.url = httpUrl;
          configObj.method = httpMethod;
          if (httpBodyTemplate) configObj.body_template = httpBodyTemplate;
          if (httpHeaders) {
              try { configObj.headers = JSON.parse(httpHeaders); }
              catch(e) { console.warn("Invalid JSON in HTTP Headers", e); }
          }
      } else if (handlerType === "prompt") {
          configObj.prompt_template = promptTemplate;
          configObj.model = promptModel;
          configObj.max_invocations_per_turn = maxInvocations;
      }

      const payload = {
        name: hookName || undefined,
        agent_id: null,
        agent_ids: scope === "agent" ? selectedAgentIds : [],
        event,
        handler_type: handlerType,
        scope,
        matcher: matcher || undefined,
        if_expr: ifExpr || undefined,
        enabled: isEnabled,
        timeout_ms: timeoutMs,
        on_timeout: onTimeout,
        priority: priority,
        config: configObj
      };

      await createHook(ws, payload);
      onSaveSuccess();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      alert("Failed to create hook");
    } finally {
      loading = false;
    }
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
    <div 
        class="absolute inset-0 bg-black/80 backdrop-blur-xl" 
        onclick={() => onOpenChange(false)}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Escape' && onOpenChange(false)}
        aria-label="Close dialog"
    ></div>
    
    <div class="relative w-full max-w-2xl bg-gradient-to-br from-[#030014]/95 to-[#1a0033]/90 border border-white/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8),inset_0_2px_20px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] overflow-hidden">
      
      <!-- Cyber Grid Background -->
      <div class="absolute inset-0 pointer-events-none mix-blend-screen overflow-hidden rounded-3xl">
        <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-80"></div>
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Webhook class="h-5 w-5 animate-[pulse_3s_ease-in-out_infinite]" />
          </div>
          <div>
            <h2 class="text-xs font-black text-white/90 tracking-[0.3em] uppercase">Connect Native Binding</h2>
            <div class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Register Lifecycle Interceptor</div>
          </div>
        </div>

        <button onclick={() => onOpenChange(false)} class="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors border border-white/5">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-8 overflow-y-auto space-y-8 scroller-no-scrollbar relative z-10">
        
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2 relative group/input">
            <label class="block">
                <span class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Hook Name</span>
                <div class="relative mt-1">
                    <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                    <input type="text" bind:value={hookName} placeholder="Optional" class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                </div>
            </label>
          </div>
          <div class="space-y-2 relative group/select">
            <label class="block">
                <span class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Trigger Event</span>
                <div class="relative mt-1">
                    <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                    <select bind:value={event} class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-bold text-sm outline-none transition-colors appearance-none relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer">
                      {#each HOOK_EVENTS as e}
                        <option value={e} class="bg-black">{e}</option>
                      {/each}
                    </select>
                </div>
            </label>
          </div>
          <div class="space-y-2 relative group/select">
            <label class="block">
                <span class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Scope</span>
                <div class="relative mt-1">
                    <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                    <select bind:value={scope} class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-bold text-sm outline-none transition-colors appearance-none relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer">
                      <option value="global" class="bg-black">global</option>
                      <option value="tenant" class="bg-black">tenant</option>
                      <option value="agent" class="bg-black">agent</option>
                    </select>
                </div>
            </label>
          </div>
        </div>

        {#if scope === "agent" && agentsState.agents.length > 0}
          <div class="space-y-3 pt-2">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Agents</label>
            <div class="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 border border-white/5 rounded-2xl bg-black/40 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] scroller-no-scrollbar">
              {#each agentsState.agents as a}
                <label class="flex items-center gap-3 cursor-pointer group p-2 hover:bg-white/[0.02] rounded-xl transition-colors border border-transparent hover:border-white/5">
                  <div class="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={selectedAgentIds.includes(a.id)}
                        onchange={(e) => {
                          if (e.currentTarget.checked) {
                            selectedAgentIds = [...selectedAgentIds, a.id];
                          } else {
                            selectedAgentIds = selectedAgentIds.filter(id => id !== a.id);
                          }
                        }}
                        class="peer appearance-none h-5 w-5 rounded-md border border-white/20 bg-black/50 checked:bg-purple-500 checked:border-purple-400 transition-all cursor-pointer shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]"
                      />
                      <Check class="absolute h-3 w-3 text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
                  </div>
                  <span class="text-sm font-bold text-white/70 group-hover:text-purple-400 transition-colors truncate">{a.display_name || a.agent_key}</span>
                </label>
              {/each}
            </div>
          </div>
        {/if}

        <div class="space-y-3 pt-2">
          <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Handler Type</label>
          <div class="flex gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
              {#each ["script", "http", "prompt"] as ht}
                <button 
                  onclick={() => handlerType = ht as any}
                   class={`flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${handlerType === ht ? 'bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                >
                    {ht}
                </button>
              {/each}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6 pt-2">
          <div class="space-y-2 relative group/input">
            <label class="block">
                <span class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Matcher Regex</span>
                <div class="relative mt-1">
                    <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                    <input type="text" bind:value={matcher} placeholder="^bash$" class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                </div>
            </label>
          </div>
          <div class="space-y-2 relative group/input">
            <label class="block">
                <span class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">If Expression</span>
                <div class="relative mt-1">
                    <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                    <input type="text" bind:value={ifExpr} placeholder="tool_input.path" class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                </div>
            </label>
          </div>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <div class="space-y-2 relative group/input">
            <label class="block">
                <span class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Timeout (ms)</span>
                <div class="relative mt-1">
                    <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                    <input type="number" bind:value={timeoutMs} min="100" class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                </div>
            </label>
          </div>
          <div class="space-y-2 relative group/select">
            <label class="block">
                <span class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">On Timeout</span>
                <div class="relative mt-1">
                    <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                    <select bind:value={onTimeout} class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-bold text-sm outline-none transition-colors appearance-none relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer">
                      <option value="block" class="bg-black">block</option>
                      <option value="allow" class="bg-black">allow</option>
                    </select>
                </div>
            </label>
          </div>
          <div class="space-y-2 relative group/input">
            <label class="block">
                <span class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Priority</span>
                <div class="relative mt-1">
                    <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                    <input type="number" bind:value={priority} class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                </div>
            </label>
          </div>
          <div class="space-y-2">
            <label id="status-label" class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Status</label>
            <button 
              onclick={() => isEnabled = !isEnabled} 
              aria-labelledby="status-label"
              class={`w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] ${isEnabled ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-white/[0.02] text-white/50 border border-white/5 hover:bg-white/[0.05]'}`}>
              {isEnabled ? "Active" : "Paused"}
            </button>
          </div>
        </div>

        {#if handlerType === "script"}
          <div class="space-y-2 pt-2 relative group/input">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Goja Script Source</label>
            <div class="relative">
                <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-2xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                <textarea bind:value={scriptSource} placeholder={"function handle(ctx) { ... }"} class="w-full h-64 p-6 bg-white/[0.02] hover:bg-white/[0.05] focus:bg-white/[0.05] border border-white/5 rounded-2xl text-purple-400 font-mono text-[13px] outline-none transition-colors resize-y scroller-no-scrollbar relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] leading-relaxed"></textarea>
            </div>
          </div>
        {:else if handlerType === "http"}
           <div class="grid grid-cols-4 gap-6 pt-2">
             <div class="col-span-3 space-y-2 relative group/input">
               <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Target URL</label>
               <div class="relative">
                  <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                  <input type="text" bind:value={httpUrl} placeholder="https://api.example.com" class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
               </div>
             </div>
             <div class="col-span-1 space-y-2 relative group/select">
               <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Method</label>
               <div class="relative">
                  <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                  <select bind:value={httpMethod} class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-bold text-sm outline-none transition-colors appearance-none relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer">
                    <option value="POST" class="bg-black">POST</option>
                    <option value="GET" class="bg-black">GET</option>
                    <option value="PUT" class="bg-black">PUT</option>
                  </select>
               </div>
             </div>
           </div>
           <div class="space-y-2 relative group/input">
             <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Headers JSON</label>
             <div class="relative">
                <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-2xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                <textarea bind:value={httpHeaders} placeholder={'{"Authorization": "Bearer..."}'} class="w-full h-32 p-5 bg-white/[0.02] hover:bg-white/[0.05] focus:bg-white/[0.05] border border-white/5 rounded-2xl text-purple-400 text-[13px] font-mono outline-none transition-colors resize-y scroller-no-scrollbar relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] leading-relaxed"></textarea>
             </div>
           </div>
           <div class="space-y-2 relative group/input">
             <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Body Template</label>
             <div class="relative">
                <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-2xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                <textarea bind:value={httpBodyTemplate} placeholder={'{"event": "{{.Event}}"}'} class="w-full h-32 p-5 bg-white/[0.02] hover:bg-white/[0.05] focus:bg-white/[0.05] border border-white/5 rounded-2xl text-purple-400 text-[13px] font-mono outline-none transition-colors resize-y scroller-no-scrollbar relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] leading-relaxed"></textarea>
             </div>
           </div>
        {:else if handlerType === "prompt"}
           <div class="space-y-2 pt-2 relative group/input">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Evaluation Prompt</label>
            <div class="relative">
                <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-2xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                <textarea bind:value={promptTemplate} placeholder="Evaluate this..." class="w-full h-40 p-5 bg-white/[0.02] hover:bg-white/[0.05] focus:bg-white/[0.05] border border-white/5 rounded-2xl text-purple-400 text-[13px] font-mono outline-none transition-colors resize-y scroller-no-scrollbar relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] leading-relaxed"></textarea>
            </div>
          </div>
           <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2 relative group/select">
                 <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Judge Model</label>
                 <div class="relative">
                    <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                    <select bind:value={promptModel} class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-bold text-sm outline-none transition-colors appearance-none relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer">
                      <option value="haiku" class="bg-black">haiku</option>
                      <option value="sonnet" class="bg-black">sonnet</option>
                      <option value="opus" class="bg-black">opus</option>
                    </select>
                 </div>
              </div>
              <div class="space-y-2 relative group/input">
                 <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Max Invocations</label>
                 <div class="relative">
                    <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
                    <input type="number" bind:value={maxInvocations} class="w-full h-11 px-4 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/5 rounded-xl text-purple-400 font-mono text-sm outline-none transition-colors relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]" />
                 </div>
              </div>
           </div>
        {/if}

      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md flex justify-end gap-4 relative z-10 rounded-b-3xl">
        <button onclick={() => onOpenChange(false)} class="px-6 h-10 rounded-xl border border-transparent text-white/50 hover:text-white hover:border-white/10 hover:bg-white/[0.05] transition-colors font-black text-[10px] uppercase tracking-widest">
          Cancel
        </button>
        <button onclick={handleSave} disabled={loading} class="relative group px-8 h-10 flex items-center justify-center gap-2 rounded-xl bg-purple-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-purple-400 transition-colors disabled:opacity-50 border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] overflow-hidden">
          <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
          {#if loading}
            <Loader2 class="h-4 w-4 animate-spin relative z-10" /> <span class="relative z-10">Deploying...</span>
          {:else}
            <Check class="h-4 w-4 relative z-10" strokeWidth={3} /> <span class="relative z-10">Deploy Binding</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
