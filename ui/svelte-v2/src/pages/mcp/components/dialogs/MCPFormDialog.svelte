<script lang="ts">
  import { Loader2, Plus, Trash2, ShieldAlert, CheckCircle2, XCircle } from "lucide-svelte";
  import type { MCPServerData, MCPServerInput } from "../../hooks/use-mcp.svelte";
  import { useMCP } from "../../hooks/use-mcp.svelte";

  let {
    open,
    onOpenChange,
    server
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    server: MCPServerData | null;
  } = $props();

  const { createServer, updateServer, testConnection } = useMCP();

  let loading = $state(false);
  let testing = $state(false);
  let error = $state("");
  let testResult = $state<{ success: boolean; tool_count?: number; error?: string } | null>(null);

  // Form State
  let name = $state(server?.name ?? "");
  let displayName = $state(server?.display_name ?? "");
  let transport = $state(server?.transport ?? "stdio");
  let command = $state(server?.command ?? "");
  let args = $state(Array.isArray(server?.args) ? server.args.join(", ") : "");
  let url = $state(server?.url ?? "");
  let toolPrefix = $state(server?.tool_prefix ?? "");
  let timeout = $state(server?.timeout_sec ?? 60);
  let enabled = $state(server?.enabled ?? true);
  let requireUserCreds = $state(server?.settings?.require_user_credentials ?? false);

  // Key Value Stores
  let envKV = $state(Object.entries(server?.env ?? {}).map(([k, v]) => ({ key: k, value: v, id: crypto.randomUUID() })));
  let headersKV = $state(Object.entries(server?.headers ?? {}).map(([k, v]) => ({ key: k, value: v, id: crypto.randomUUID() })));

  const SENSITIVE_RE = /^(authorization|x-api-key|api-key|bearer|token|secret|password|credential)/i;
  const isSensitive = (key: string) => SENSITIVE_RE.test(key.trim());
  const ENV_SENSITIVE_RE = /^.*(key|secret|token|password|credential).*$/i;
  const isEnvSensitive = (key: string) => ENV_SENSITIVE_RE.test(key.trim());

  function buildHeaders() {
    const h: Record<string, string> = {};
    for (const item of headersKV) {
      if (item.key.trim()) h[item.key.trim()] = item.value;
    }
    return h;
  }

  function buildEnv() {
    const e: Record<string, string> = {};
    for (const item of envKV) {
      if (item.key.trim()) e[item.key.trim()] = item.value;
    }
    return e;
  }

  function splitShellTokens(input: string): string[] {
    const tokens: string[] = [];
    const re = /"([^"]*)"|'([^']*)'|[^\s,]+/g;
    let m;
    while ((m = re.exec(input)) !== null) {
      tokens.push(m[1] ?? m[2] ?? m[0]);
    }
    return tokens.filter(Boolean);
  }

  function buildConnectionData() {
    let parsedArgs: string[] | undefined = undefined;
    let resolvedCommand = command.trim();

    if (transport === "stdio") {
      const cmdTokens = splitShellTokens(resolvedCommand);
      if (cmdTokens.length > 1) {
        resolvedCommand = cmdTokens[0]!;
        const extraArgs = cmdTokens.slice(1);
        const userArgs = args.trim() ? splitShellTokens(args) : [];
        parsedArgs = [...extraArgs, ...userArgs];
      } else if (args.trim()) {
        parsedArgs = splitShellTokens(args);
      }
    }

    const env = buildEnv();
    const headers = buildHeaders();

    return {
      transport,
      command: transport === "stdio" ? resolvedCommand : undefined,
      args: parsedArgs,
      url: transport !== "stdio" ? url.trim() : undefined,
      headers: transport !== "stdio" && Object.keys(headers).length > 0 ? headers : undefined,
      env: Object.keys(env).length > 0 ? env : undefined,
    };
  }

  async function handleTest() {
    if (transport === "stdio" && !command.trim()) { error = "Command is required for STDIO transport"; return; }
    if (transport !== "stdio" && !url.trim()) { error = "URL is required for SSE transport"; return; }
    
    testing = true;
    error = "";
    testResult = null;
    
    try {
      testResult = await testConnection(buildConnectionData());
    } catch (err: any) {
      testResult = { success: false, error: err.message || "Connection failed" };
    } finally {
      testing = false;
    }
  }

  async function handleSubmit() {
    if (!name.trim()) { error = "Internal Name is required"; return; }
    if (!/^[a-z0-9-]+$/.test(name.trim())) { error = "Internal Name must be a lowercase slug (a-z, 0-9, -)"; return; }
    if (transport === "stdio" && !command.trim()) { error = "Command is required for STDIO"; return; }
    if (transport !== "stdio" && !url.trim()) { error = "URL is required for SSE"; return; }

    loading = true;
    error = "";
    try {
      const data: MCPServerInput = {
        name: name.trim(),
        display_name: displayName.trim() || undefined,
        ...buildConnectionData(),
        tool_prefix: toolPrefix.trim() || undefined,
        timeout_sec: timeout,
        settings: { require_user_credentials: requireUserCreds },
        enabled
      };

      if (server) {
        await updateServer(server.id, data);
      } else {
        await createServer(data);
      }
      onOpenChange(false);
    } catch (err: any) {
      error = err.message || "Failed to save MCP server";
    } finally {
      loading = false;
    }
  }

  function handleNameInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    name = val.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  }
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick={() => !loading && onOpenChange(false)}></div>
  
  <div class="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#030014] border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 p-6 border-b border-white/5 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-goclaw-neon-cyan/5 rounded-full blur-[60px] pointer-events-none"></div>
      <h2 class="text-xl font-black uppercase tracking-[0.2em] text-white">
        {server ? 'Edit MCP Server' : 'Create MCP Server'}
      </h2>
      <p class="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">
        Configure transport and credentials.
      </p>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 relative">
      {#if error}
        <div class="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-inner">
          <ShieldAlert class="h-4 w-4" />
          {error}
        </div>
      {/if}

      <!-- General Info -->
      <div class="space-y-4">
        <h3 class="text-[10px] font-black text-goclaw-neon-cyan uppercase tracking-[0.3em]">Identity</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Internal Name (Slug)</label>
            <input 
              type="text" 
              bind:value={name}
              oninput={handleNameInput}
              placeholder="my-mcp-server"
              class="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-4 text-xs font-mono text-white placeholder-white/20 focus:border-goclaw-neon-cyan focus:ring-1 focus:ring-goclaw-neon-cyan outline-none transition-all"
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Display Name</label>
            <input 
              type="text" 
              bind:value={displayName}
              placeholder="My MCP Server"
              class="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-4 text-xs font-bold text-white placeholder-white/20 focus:border-goclaw-neon-cyan focus:ring-1 focus:ring-goclaw-neon-cyan outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Transport -->
      <div class="space-y-4">
        <h3 class="text-[10px] font-black text-goclaw-neon-cyan uppercase tracking-[0.3em]">Connection Protocol</h3>
        
        <div class="flex gap-2">
          {#each ["stdio", "sse", "streamable-http"] as t}
            <button 
              type="button"
              onclick={() => transport = t}
              class="px-5 py-2.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest {transport === t ? 'bg-goclaw-neon-cyan/20 border-goclaw-neon-cyan/50 text-goclaw-neon-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-black/40 border-white/10 text-white/40 hover:text-white hover:border-white/30'}"
            >
              {t}
            </button>
          {/each}
        </div>

        {#if transport === "stdio"}
          <div class="space-y-4 p-5 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-white/10 transition-colors"></div>
            
            <div class="space-y-2">
              <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Executable Command</label>
              <input 
                type="text" 
                bind:value={command}
                placeholder="npx"
                class="w-full h-10 bg-black/60 border border-white/10 rounded-xl px-4 text-xs font-mono text-white focus:border-goclaw-neon-cyan focus:ring-1 focus:ring-goclaw-neon-cyan outline-none transition-all"
              />
            </div>
            
            <div class="space-y-2">
              <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Arguments</label>
              <input 
                type="text" 
                bind:value={args}
                placeholder="-y @modelcontextprotocol/server-postgres postgresql://..."
                class="w-full h-10 bg-black/60 border border-white/10 rounded-xl px-4 text-xs font-mono text-white focus:border-goclaw-neon-cyan focus:ring-1 focus:ring-goclaw-neon-cyan outline-none transition-all"
              />
            </div>
          </div>
        {:else}
          <div class="space-y-4 p-5 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-white/10 transition-colors"></div>
            
            <div class="space-y-2">
              <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Endpoint URL</label>
              <input 
                type="url" 
                bind:value={url}
                placeholder="http://localhost:3001/sse"
                class="w-full h-10 bg-black/60 border border-white/10 rounded-xl px-4 text-xs font-mono text-white focus:border-goclaw-neon-cyan focus:ring-1 focus:ring-goclaw-neon-cyan outline-none transition-all"
              />
            </div>
            
            <div class="space-y-2">
              <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">HTTP Headers</label>
              <div class="space-y-2">
                {#each headersKV as kv, i (kv.id)}
                  <div class="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Header Key" 
                      bind:value={kv.key} 
                      class="flex-1 h-9 bg-black/40 border border-white/10 rounded-lg px-3 text-[10px] font-mono text-white outline-none focus:border-white/30"
                    />
                    <input 
                      type={isSensitive(kv.key) ? "password" : "text"} 
                      placeholder="Value" 
                      bind:value={kv.value} 
                      class="flex-1 h-9 bg-black/40 border border-white/10 rounded-lg px-3 text-[10px] font-mono text-white outline-none focus:border-white/30"
                    />
                    <button 
                      type="button"
                      onclick={() => headersKV = headersKV.filter(x => x.id !== kv.id)}
                      class="h-9 w-9 flex items-center justify-center shrink-0 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </button>
                  </div>
                {/each}
                <button 
                  type="button"
                  onclick={() => headersKV = [...headersKV, { key: "", value: "", id: crypto.randomUUID() }]}
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20 text-white/40 hover:text-white transition-colors"
                >
                  <Plus class="h-3 w-3" />
                  <span class="text-[9px] font-bold uppercase tracking-widest">Add Header</span>
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Settings & Environment -->
      <div class="space-y-4">
        <h3 class="text-[10px] font-black text-goclaw-neon-cyan uppercase tracking-[0.3em]">Environment & Settings</h3>
        
        <div class="space-y-4 p-5 rounded-2xl bg-white/5 border border-white/10">
          <div class="space-y-2">
            <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Environment Variables</label>
            <div class="space-y-2">
              {#each envKV as kv, i (kv.id)}
                <div class="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="ENV_VAR_NAME" 
                    bind:value={kv.key} 
                    class="flex-1 h-9 bg-black/40 border border-white/10 rounded-lg px-3 text-[10px] font-mono text-white outline-none focus:border-white/30 uppercase"
                  />
                  <input 
                    type={isEnvSensitive(kv.key) ? "password" : "text"} 
                    placeholder="Value" 
                    bind:value={kv.value} 
                    class="flex-1 h-9 bg-black/40 border border-white/10 rounded-lg px-3 text-[10px] font-mono text-white outline-none focus:border-white/30"
                  />
                  <button 
                    type="button"
                    onclick={() => envKV = envKV.filter(x => x.id !== kv.id)}
                    class="h-9 w-9 flex items-center justify-center shrink-0 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              {/each}
              <button 
                type="button"
                onclick={() => envKV = [...envKV, { key: "", value: "", id: crypto.randomUUID() }]}
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20 text-white/40 hover:text-white transition-colors"
              >
                <Plus class="h-3 w-3" />
                <span class="text-[9px] font-bold uppercase tracking-widest">Add Variable</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-4">
            <div class="space-y-2">
              <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Tool Prefix</label>
              <div class="flex">
                <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-white/10 bg-black/60 text-white/30 text-xs font-mono">mcp_</span>
                <input 
                  type="text" 
                  bind:value={toolPrefix}
                  oninput={(e) => toolPrefix = (e.target as HTMLInputElement).value.replace(/[^a-z0-9_]/g, "")}
                  placeholder={name.replace(/-/g, "_") || "auto"}
                  class="flex-1 h-10 bg-black/40 border border-white/10 rounded-r-lg px-3 text-xs font-mono text-white focus:border-goclaw-neon-cyan focus:ring-1 focus:ring-goclaw-neon-cyan outline-none transition-all"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Timeout (Seconds)</label>
              <input 
                type="number" 
                min="1"
                bind:value={timeout}
                class="w-full h-10 bg-black/40 border border-white/10 rounded-lg px-4 text-xs font-mono text-white focus:border-goclaw-neon-cyan focus:ring-1 focus:ring-goclaw-neon-cyan outline-none transition-all"
              />
            </div>
          </div>

          <div class="pt-4 border-t border-white/5 mt-4 flex flex-col gap-4">
            <label class="flex items-center justify-between cursor-pointer group">
              <span class="text-[11px] font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">Enabled</span>
              <div class="relative inline-flex h-5 w-9 items-center rounded-full border-2 border-transparent transition-colors duration-200 {enabled ? 'bg-goclaw-neon-cyan' : 'bg-[#1a1a1a]'}">
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 {enabled ? 'translate-x-4' : 'translate-x-0'}"></span>
              </div>
            </label>

            <label class="flex items-center justify-between cursor-pointer group">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors block">Require User Credentials</span>
                <span class="text-[9px] text-white/30 uppercase tracking-widest mt-0.5 block">Users must provide their own env vars/headers via their profile</span>
              </div>
              <div class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 {requireUserCreds ? 'bg-amber-400' : 'bg-[#1a1a1a]'}">
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 {requireUserCreds ? 'translate-x-4' : 'translate-x-0'}"></span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="shrink-0 p-6 border-t border-white/5 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <button 
          type="button" 
          onclick={handleTest} 
          disabled={loading || testing}
          class="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {#if testing}
            <Loader2 class="h-3 w-3 animate-spin" />
            Testing...
          {:else}
            Test Connection
          {/if}
        </button>

        {#if testResult}
          <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg {testResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}">
            {#if testResult.success}
              <CheckCircle2 class="h-3.5 w-3.5" />
              {testResult.tool_count} Tools Found
            {:else}
              <XCircle class="h-3.5 w-3.5" />
              Failed
            {/if}
          </div>
        {/if}
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <button 
          type="button"
          onclick={() => onOpenChange(false)}
          disabled={loading}
          class="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          type="button"
          onclick={handleSubmit}
          disabled={loading}
          class="flex-1 sm:flex-none px-8 py-2.5 rounded-xl bg-goclaw-neon-cyan/20 border border-goclaw-neon-cyan/50 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-goclaw-neon-cyan/30 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] disabled:opacity-50 flex items-center justify-center"
        >
          {#if loading}
            <Loader2 class="h-4 w-4 animate-spin" />
          {:else}
            {server ? 'Save Changes' : 'Create Server'}
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
