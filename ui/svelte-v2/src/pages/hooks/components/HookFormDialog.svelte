<script lang="ts">
  import { X, Save, Server, Terminal, Sparkles, Plus, AlertCircle, Settings, Webhook } from "lucide-svelte";
  import { authState } from "$lib/state/auth.svelte";
  import type { HookConfig } from "../../../../../../web/src/hooks/use-hooks";
  // import { useAgents } from "../../../agents/hooks/use-agents.svelte"; // Placeholder if needed

  type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
    initial?: HookConfig | null;
  };

  let { open, onOpenChange, onSubmit, initial }: Props = $props();

  let saving = $state(false);
  let errorMsg = $state("");

  const HOOK_EVENTS = [
    "session_start", "user_prompt_submit", "pre_tool_use",
    "post_tool_use", "stop", "subagent_start", "subagent_stop",
  ];

  // Form State
  let name = $state("");
  let event = $state("pre_tool_use");
  let scope = $state("tenant");
  let handler_type = $state<"script" | "http" | "prompt">("script");
  let agent_ids = $state<string[]>([]);
  let matcher = $state("");
  let if_expr = $state("");
  
  let timeout_ms = $state(5000);
  let on_timeout = $state<"allow" | "block">("block");
  let priority = $state(100);
  let enabled = $state(true);

  // HTTP
  let url = $state("");
  let method = $state("POST");
  let body_template = $state("");
  let headers = $state("");

  // Script
  let script_source = $state("");

  // Prompt
  let prompt_template = $state("");
  let model = $state("haiku");
  let max_invocations = $state(5);

  let isBuiltin = $state(false);

  // Initialize
  $effect(() => {
    if (open) {
      errorMsg = "";
      saving = false;
      if (initial) {
        isBuiltin = initial.source === "builtin";
        const cfg = (initial.config || {}) as Record<string, any>;
        name = initial.name || "";
        event = initial.event || "pre_tool_use";
        scope = initial.scope || "tenant";
        handler_type = initial.handler_type === "command" ? "http" : (initial.handler_type as any) || "script";
        agent_ids = initial.agent_ids || [];
        matcher = initial.matcher || "";
        if_expr = initial.if_expr || "";
        timeout_ms = initial.timeout_ms ?? 5000;
        on_timeout = initial.on_timeout || "block";
        priority = initial.priority ?? 100;
        enabled = initial.enabled ?? true;

        url = cfg.url || "";
        method = cfg.method || "POST";
        body_template = cfg.body_template || "";
        headers = cfg.headers ? JSON.stringify(cfg.headers, null, 2) : "";

        script_source = cfg.source || "";

        prompt_template = cfg.prompt_template || "";
        model = cfg.model || "haiku";
        max_invocations = cfg.max_invocations_per_turn ?? 5;
      } else {
        isBuiltin = false;
        name = "";
        event = "pre_tool_use";
        scope = "tenant";
        handler_type = "script";
        agent_ids = [];
        matcher = "";
        if_expr = "";
        timeout_ms = 5000;
        on_timeout = "block";
        priority = 100;
        enabled = true;
        url = "";
        method = "POST";
        body_template = "";
        headers = "";
        script_source = "";
        prompt_template = "";
        model = "haiku";
        max_invocations = 5;
      }
    }
  });

  async function handleSubmit() {
    saving = true;
    errorMsg = "";

    try {
      const data: any = {
        name: name.trim(),
        event,
        scope,
        handler_type,
        agent_ids,
        matcher: matcher || undefined,
        if_expr: if_expr || undefined,
        timeout_ms,
        on_timeout,
        priority,
        enabled
      };

      if (handler_type === "http") {
        let parsedHeaders = {};
        if (headers.trim()) {
          try {
            parsedHeaders = JSON.parse(headers);
          } catch (e) {
            throw new Error("Headers must be valid JSON");
          }
        }
        data.url = url;
        data.method = method;
        data.body_template = body_template;
        data.headers = JSON.stringify(parsedHeaders);
      } else if (handler_type === "script") {
        data.script_source = script_source;
      } else if (handler_type === "prompt") {
        data.prompt_template = prompt_template;
        data.model = model;
        data.max_invocations_per_turn = max_invocations;
      }

      await onSubmit(data);
    } catch (e: any) {
      errorMsg = e.message || "An error occurred";
      saving = false;
    }
  }

  const HandlerOptions = [
    { id: "script", label: "Server Script", icon: Terminal, color: "text-emerald-400", border: "border-emerald-500/50", bg: "bg-emerald-500/10", glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]", grad: "from-emerald-500/20" },
    { id: "http", label: "HTTP Webhook", icon: Server, color: "text-blue-400", border: "border-blue-500/50", bg: "bg-blue-500/10", glow: "shadow-[0_0_30px_rgba(59,130,246,0.15)]", grad: "from-blue-500/20" },
    { id: "prompt", label: "LLM Prompt", icon: Sparkles, color: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-500/10", glow: "shadow-[0_0_30px_rgba(168,85,247,0.15)]", grad: "from-purple-500/20" }
  ] as const;

</script>

{#if open}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-[#030014]/90 backdrop-blur-xl z-[100] transition-all duration-300 flex items-center justify-center p-4 sm:p-6"
    onclick={() => !saving && onOpenChange(false)}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Escape' && !saving && onOpenChange(false)}
  >
    <!-- Modal Content -->
    <div 
      class="bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] w-full max-w-5xl max-h-[95vh] shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col md:flex-row relative cursor-default"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Atmospheric Glows -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none mix-blend-screen"></div>

      <!-- Left Sidebar (Steps/Info) -->
      <div class="w-full md:w-1/3 bg-black/40 border-r border-white/5 p-8 flex flex-col relative z-10 shrink-0">
        <div class="flex items-center gap-4 mb-8">
          <div class="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Webhook class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-2xl font-black text-white tracking-tight">{initial ? 'Edit Hook' : 'Create Hook'}</h2>
            <p class="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1">Event Interceptor</p>
          </div>
        </div>

        <p class="text-sm text-white/50 leading-relaxed mb-8">
          Hooks intercept core lifecycle events dynamically, allowing you to inject logic, validate inputs, or trigger external actions before and after tools execute.
        </p>

        {#if isBuiltin}
          <div class="mt-auto p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-col gap-3 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <div class="flex items-center gap-2 text-blue-400">
              <AlertCircle class="h-5 w-5" />
              <span class="text-xs font-black uppercase tracking-[0.2em]">System Hook</span>
            </div>
            <p class="text-xs text-blue-300/80 font-medium">This is a built-in system hook. Its configuration is read-only. You may only toggle its enabled state.</p>
          </div>
        {/if}

        <div class="space-y-6 mt-auto">
          <div class="flex items-center gap-4 text-white/40">
            <Terminal class="w-5 h-5 shrink-0" />
            <div class="text-xs">
              <span class="text-white/80 font-bold block mb-0.5">Server Scripts</span>
              Execute high-performance Goja JavaScript directly on the backend.
            </div>
          </div>
          <div class="flex items-center gap-4 text-white/40">
            <Server class="w-5 h-5 shrink-0" />
            <div class="text-xs">
              <span class="text-white/80 font-bold block mb-0.5">HTTP Webhooks</span>
              Relay event payloads to external APIs for processing.
            </div>
          </div>
        </div>
      </div>

      <!-- Right Form Body -->
      <div class="w-full md:w-2/3 flex flex-col relative z-10 min-h-0">
        <!-- Header Actions -->
        <div class="absolute top-4 right-4 z-20">
          <button 
            type="button"
            onclick={() => !saving && onOpenChange(false)}
            class="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable Form Body -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8 pt-12 relative">
          
          {#if errorMsg}
            <div class="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-black uppercase tracking-widest text-red-400">
              {errorMsg}
            </div>
          {/if}

          <div class="space-y-8">
            
            <!-- Basics -->
            <div class="space-y-5">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Core Configuration
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Hook Name</label>
                  <input 
                    type="text" 
                    bind:value={name} 
                    disabled={isBuiltin}
                    placeholder="e.g. Audit Logger" 
                    class="w-full bg-[#030014]/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:border-purple-500 outline-none transition-all focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] focus:bg-[#030014] disabled:opacity-50" 
                  />
                </div>
                
                <div class="space-y-2 relative">
                  <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Target Event</label>
                  <select 
                    bind:value={event} 
                    disabled={isBuiltin}
                    class="w-full appearance-none bg-[#030014]/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-purple-400 focus:border-purple-500 outline-none transition-all focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] focus:bg-[#030014] disabled:opacity-50"
                  >
                    {#each HOOK_EVENTS as e}
                      <option value={e} class="bg-[#030014]">{e}</option>
                    {/each}
                  </select>
                </div>
              </div>
            </div>

            <!-- Execution Type -->
            <div class="space-y-5">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-white/50"></span> Handler Engine
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                {#each HandlerOptions as opt}
                  {@const isSelected = handler_type === opt.id}
                  <button 
                    type="button"
                    onclick={() => !isBuiltin && (handler_type = opt.id as any)}
                    disabled={isBuiltin}
                    class={`p-5 rounded-3xl border transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-4 relative overflow-hidden group ${
                      isSelected 
                        ? `${opt.bg} ${opt.border} ${opt.glow} scale-[1.02]` 
                        : 'bg-black/40 border-white/5 hover:bg-white/[0.03] hover:border-white/20 hover:scale-[1.01]'
                    }`}
                  >
                    {#if isSelected}
                       <div class={`absolute inset-0 bg-gradient-to-br ${opt.grad} to-transparent pointer-events-none opacity-50`}></div>
                       <div class={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${opt.bg} blur-2xl pointer-events-none`}></div>
                    {/if}
                    
                    <div class={`p-3 rounded-2xl border transition-colors duration-500 relative z-10 ${isSelected ? `${opt.bg} ${opt.border}` : 'bg-white/5 border-white/10 group-hover:bg-white/10 group-hover:border-white/20'}`}>
                      <opt.icon class={`h-6 w-6 transition-colors duration-500 ${isSelected ? opt.color : 'text-white/30 group-hover:text-white/70'}`} />
                    </div>
                    
                    <span class={`text-[10px] font-black uppercase tracking-[0.2em] relative z-10 transition-colors duration-500 ${isSelected ? opt.color : 'text-white/50 group-hover:text-white/90'}`}>
                      {opt.label}
                    </span>
                  </button>
                {/each}
              </div>
            </div>

            <!-- Matchers -->
            <div class="space-y-5">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span> Filters & Matchers
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Matcher (Regex)</label>
                  <input 
                    type="text" 
                    bind:value={matcher} 
                    disabled={isBuiltin}
                    placeholder="^bash$" 
                    class="w-full bg-[#030014]/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-emerald-400 focus:border-purple-500 outline-none transition-all focus:bg-[#030014] disabled:opacity-50" 
                  />
                  <p class="text-[10px] text-white/30 ml-1">Regex to match tool name or target.</p>
                </div>
                
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">If Expression (JS)</label>
                  <input 
                    type="text" 
                    bind:value={if_expr} 
                    disabled={isBuiltin}
                    placeholder='tool_input.path.startsWith("/etc")' 
                    class="w-full bg-[#030014]/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-orange-400 focus:border-purple-500 outline-none transition-all focus:bg-[#030014] disabled:opacity-50" 
                  />
                  <p class="text-[10px] text-white/30 ml-1">JS expression that must return true.</p>
                </div>
              </div>
            </div>

            <!-- Dynamic Configuration Panel -->
            <div class="space-y-5">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Payload Configuration
              </h3>

              <div class="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                {#if handler_type === 'script'}
                  <div class="space-y-3">
                    <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Script Source (Goja JS)</label>
                    <textarea 
                      bind:value={script_source}
                      disabled={isBuiltin}
                      rows={12}
                      placeholder={'// function execute(event) {\n//   console.log(event.name);\n// }'}
                      class="w-full p-5 bg-[#030014]/80 border border-white/10 rounded-2xl text-emerald-400 font-mono text-sm leading-relaxed outline-none focus:border-purple-500 focus:bg-[#030014] transition-all custom-scrollbar disabled:opacity-50"
                    ></textarea>
                  </div>
                {:else if handler_type === 'http'}
                  <div class="space-y-5">
                    <div class="flex flex-col md:flex-row gap-5">
                      <div class="space-y-2 shrink-0">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Method</label>
                        <select 
                          bind:value={method} 
                          disabled={isBuiltin}
                          class="w-full md:w-32 h-[52px] px-5 bg-[#030014]/80 border border-white/10 rounded-2xl text-white font-mono text-sm outline-none appearance-none disabled:opacity-50 focus:border-purple-500"
                        >
                          {#each ["GET", "POST", "PUT", "PATCH", "DELETE"] as m}
                            <option value={m}>{m}</option>
                          {/each}
                        </select>
                      </div>
                      <div class="space-y-2 flex-1">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Webhook URL</label>
                        <input 
                          type="text" 
                          bind:value={url}
                          disabled={isBuiltin}
                          placeholder="https://api.example.com/webhook"
                          class="w-full h-[52px] px-5 bg-[#030014]/80 border border-white/10 rounded-2xl text-blue-400 font-mono text-sm outline-none disabled:opacity-50 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Headers (JSON)</label>
                        <textarea 
                          bind:value={headers}
                          disabled={isBuiltin}
                          rows={6}
                          placeholder={'{"Authorization": "Bearer token"}'}
                          class="w-full p-5 bg-[#030014]/80 border border-white/10 rounded-2xl text-orange-400 font-mono text-sm outline-none disabled:opacity-50 focus:border-purple-500 custom-scrollbar"
                        ></textarea>
                      </div>
                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Body Template</label>
                        <textarea 
                          bind:value={body_template}
                          disabled={isBuiltin}
                          rows={6}
                          placeholder={'{"event": "{{.Event}}"}'}
                          class="w-full p-5 bg-[#030014]/80 border border-white/10 rounded-2xl text-emerald-400 font-mono text-sm outline-none disabled:opacity-50 focus:border-purple-500 custom-scrollbar"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                {:else if handler_type === 'prompt'}
                  <div class="space-y-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Target Model</label>
                        <select 
                          bind:value={model} 
                          disabled={isBuiltin}
                          class="w-full h-[52px] px-5 bg-[#030014]/80 border border-white/10 rounded-2xl text-white font-mono text-sm outline-none appearance-none disabled:opacity-50 focus:border-purple-500"
                        >
                          {#each ["haiku", "sonnet", "opus"] as m}
                            <option value={m}>{m}</option>
                          {/each}
                        </select>
                      </div>
                      <div class="space-y-2">
                        <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Max Invocations</label>
                        <input 
                          type="number" 
                          bind:value={max_invocations}
                          min={1} max={20}
                          disabled={isBuiltin}
                          class="w-full h-[52px] px-5 bg-[#030014]/80 border border-white/10 rounded-2xl text-white font-mono text-sm outline-none disabled:opacity-50 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div class="space-y-2">
                      <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Prompt Template</label>
                      <textarea 
                        bind:value={prompt_template}
                        disabled={isBuiltin}
                        rows={6}
                        placeholder="Evaluate the tool call..."
                        class="w-full p-5 bg-[#030014]/80 border border-white/10 rounded-2xl text-purple-300 font-mono text-sm leading-relaxed outline-none disabled:opacity-50 focus:border-purple-500 custom-scrollbar"
                      ></textarea>
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Execution Constraints -->
            <div class="space-y-5 pb-6">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Constraints
              </h3>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/[0.02] p-5 rounded-3xl border border-white/5">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Timeout (ms)</label>
                  <input type="number" bind:value={timeout_ms} disabled={isBuiltin} class="w-full h-11 bg-[#030014]/80 border border-white/10 rounded-xl px-3 text-sm font-mono text-white focus:border-purple-500 outline-none disabled:opacity-50 transition-colors" />
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">On Timeout</label>
                  <select bind:value={on_timeout} disabled={isBuiltin} class="w-full h-11 bg-[#030014]/80 border border-white/10 rounded-xl px-3 text-sm font-mono text-white focus:border-purple-500 outline-none disabled:opacity-50 transition-colors appearance-none">
                    <option value="block">BLOCK</option>
                    <option value="allow">ALLOW</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Priority</label>
                  <input type="number" bind:value={priority} disabled={isBuiltin} class="w-full h-11 bg-[#030014]/80 border border-white/10 rounded-xl px-3 text-sm font-mono text-white focus:border-purple-500 outline-none disabled:opacity-50 transition-colors" />
                </div>
                <div class="space-y-2 flex flex-col justify-between">
                  <label class="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Enabled</label>
                  <button 
                    type="button"
                    onclick={() => enabled = !enabled}
                    class={`relative w-12 h-6 mt-2.5 rounded-full transition-all duration-300 ease-in-out focus:outline-none ${
                      enabled 
                        ? 'bg-emerald-500/30 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                        : 'bg-black/50 border border-white/20'
                    }`}
                  >
                    <div class={`absolute top-[1px] left-[1px] h-5 w-5 rounded-full transition-transform duration-300 ease-in-out ${
                      enabled ? 'translate-x-6 bg-emerald-400' : 'translate-x-0 bg-white/30'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer Actions -->
        <div class="shrink-0 p-6 border-t border-white/10 bg-[#030014]/80 flex justify-between gap-4 relative z-20">
          <button 
            type="button"
            onclick={() => onOpenChange(false)} 
            disabled={saving}
            class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"
          >
            Discard
          </button>
          <button 
            type="button"
            onclick={handleSubmit} 
            disabled={saving} 
            class="relative flex items-center justify-center gap-2 px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-purple-400 hover:text-white shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:-translate-y-0 border border-purple-500/50"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-500/5 transition-all group-hover:opacity-80"></div>
            {#if saving}
              <Server class="h-4 w-4 animate-spin relative z-10" /> <span class="relative z-10 drop-shadow-md">Deploying...</span>
            {:else}
              <Save class="h-4 w-4 relative z-10" /> <span class="relative z-10 drop-shadow-md">{isBuiltin ? 'Save Status' : 'Deploy Hook'}</span>
            {/if}
          </button>
        </div>

      </div>
    </div>
  </div>
{/if}
