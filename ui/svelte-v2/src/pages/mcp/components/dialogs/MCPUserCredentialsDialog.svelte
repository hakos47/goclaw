<script lang="ts">
  import { onMount } from "svelte";
  import { KeyRound, Loader2, ShieldAlert, Plus, Trash2, CheckCircle2 } from "lucide-svelte";
  import { wsState } from "../../../../lib/state/ws.svelte";
  import { useMCP, type MCPServerData, type MCPUserCredentialStatus, type MCPUserCredentialInput } from "../../hooks/use-mcp.svelte";
  import { authState } from "../../../../lib/state/auth.svelte";
  
  let {
    open,
    onOpenChange,
    server
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    server: MCPServerData;
  } = $props();

  const { getUserCredentials, setUserCredentials, deleteUserCredentials } = useMCP();

  // Replace with actual role checking logic based on the app's auth
  let role = $derived(authState.role);
  let currentUserId = $derived(authState.userId);
  
  let canManageUsers = $derived(role === "admin" || role === "owner");
  
  let selectedUserId = $state(currentUserId);
  let status = $state<MCPUserCredentialStatus | null>(null);
  let loadingStatus = $state(false);
  let saving = $state(false);
  let deleting = $state(false);
  let error = $state("");

  // Form State
  let apiKey = $state("");
  let headersKV = $state<{key: string, value: string, id: string}[]>([]);
  let envKV = $state<{key: string, value: string, id: string}[]>([]);

  const SENSITIVE_HEADER_RE = /^(authorization|bearer)|(key|secret|token|password|credential)/i;
  const isSensitiveHeader = (key: string) => SENSITIVE_HEADER_RE.test(key.trim());
  const SENSITIVE_ENV_RE = /^.*(key|secret|token|password|credential).*$/i;
  const isSensitiveEnv = (key: string) => SENSITIVE_ENV_RE.test(key.trim());

  onMount(() => {
    if (open) {
      apiKey = "";
      headersKV = [];
      envKV = [];
    }
  });

  $effect(() => {
    if (open && wsState.connected) {
      loadStatus();
    }
  });

  async function loadStatus() {
    loadingStatus = true;
    error = "";
    try {
      const targetUser = canManageUsers ? selectedUserId : undefined;
      status = await getUserCredentials(server.id, targetUser);
    } catch (err: any) {
      error = err.message || "Failed to load credentials status.";
    } finally {
      loadingStatus = false;
    }
  }

  async function handleSave() {
    saving = true;
    error = "";
    try {
      const creds: MCPUserCredentialInput = {};
      if (apiKey.trim()) creds.api_key = apiKey.trim();
      
      const headers: Record<string, string> = {};
      for (const h of headersKV) if (h.key.trim()) headers[h.key.trim()] = h.value;
      if (Object.keys(headers).length > 0) creds.headers = headers;

      const env: Record<string, string> = {};
      for (const e of envKV) if (e.key.trim()) env[e.key.trim()] = e.value;
      if (Object.keys(env).length > 0) creds.env = env;

      const targetUser = canManageUsers ? selectedUserId : undefined;
      await setUserCredentials(server.id, creds, targetUser);
      onOpenChange(false);
    } catch (err: any) {
      error = err.message || "Failed to save credentials.";
    } finally {
      saving = false;
    }
  }

  async function handleDelete() {
    deleting = true;
    error = "";
    try {
      const targetUser = canManageUsers ? selectedUserId : undefined;
      await deleteUserCredentials(server.id, targetUser);
      onOpenChange(false);
    } catch (err: any) {
      error = err.message || "Failed to delete credentials.";
    } finally {
      deleting = false;
    }
  }
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
  <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick={() => !saving && !deleting && onOpenChange(false)}></div>
  
  <div class="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-[#030014] border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden">
    <!-- Header -->
    <div class="shrink-0 p-6 border-b border-white/5 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[60px] pointer-events-none"></div>
      <div class="flex items-center gap-3">
        <div class="p-2 bg-white/5 rounded-xl border border-white/10">
          <KeyRound class="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 class="text-xl font-black uppercase tracking-[0.2em] text-white">User Credentials</h2>
          <p class="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
            Override connection secrets for {server.display_name || server.name}
          </p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 relative">
      {#if error}
        <div class="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-inner">
          <ShieldAlert class="h-4 w-4 shrink-0" />
          {error}
        </div>
      {/if}

      {#if loadingStatus}
        <div class="flex flex-col items-center justify-center py-10">
          <Loader2 class="h-6 w-6 animate-spin text-white/20 mb-2" />
          <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Loading Status...</span>
        </div>
      {:else}
        {#if status}
          <div class="flex flex-wrap gap-2">
            {#if !status.has_credentials}
              <span class="text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-white/40 px-2.5 py-1 rounded-md">
                No active credentials overrides
              </span>
            {:else}
              <span class="text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 class="h-3 w-3" /> Credentials Active
              </span>
              {#if status.has_api_key}
                <span class="text-[9px] font-mono text-white/60 bg-white/10 px-2 py-1 rounded-md">API Key</span>
              {/if}
              {#if status.has_headers}
                <span class="text-[9px] font-mono text-white/60 bg-white/10 px-2 py-1 rounded-md">Headers</span>
              {/if}
              {#if status.has_env}
                <span class="text-[9px] font-mono text-white/60 bg-white/10 px-2 py-1 rounded-md">ENV</span>
              {/if}
            {/if}
          </div>
        {/if}

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Bearer API Key</label>
            <input 
              type="password" 
              bind:value={apiKey}
              placeholder="sk-..."
              class="w-full h-10 bg-black/60 border border-white/10 rounded-xl px-4 text-xs font-mono text-white placeholder-white/20 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all"
            />
          </div>

          <!-- HTTP Headers Override -->
          {#if server.transport !== 'stdio'}
            <div class="space-y-2">
              <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">HTTP Headers</label>
              <div class="space-y-2">
                {#each headersKV as kv, i (kv.id)}
                  <div class="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Header" 
                      bind:value={kv.key} 
                      class="flex-1 h-9 bg-black/40 border border-white/10 rounded-lg px-3 text-[10px] font-mono text-white outline-none focus:border-white/30"
                    />
                    <input 
                      type={isSensitiveHeader(kv.key) ? "password" : "text"} 
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
          {/if}

          <!-- Environment Variables Override -->
          <div class="space-y-2">
            <label class="text-[9px] font-bold uppercase tracking-widest text-white/40">Environment Variables</label>
            <div class="space-y-2">
              {#each envKV as kv, i (kv.id)}
                <div class="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="ENV_KEY" 
                    bind:value={kv.key} 
                    class="flex-1 h-9 bg-black/40 border border-white/10 rounded-lg px-3 text-[10px] font-mono text-white outline-none focus:border-white/30 uppercase"
                  />
                  <input 
                    type={isSensitiveEnv(kv.key) ? "password" : "text"} 
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
                <span class="text-[9px] font-bold uppercase tracking-widest">Add Env Var</span>
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="shrink-0 p-6 border-t border-white/5 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3 w-full sm:w-auto">
        {#if status?.has_credentials}
          <button 
            type="button"
            onclick={handleDelete}
            disabled={deleting || saving}
            class="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {#if deleting}
              <Loader2 class="h-3.5 w-3.5 animate-spin" />
            {:else}
              <Trash2 class="h-3.5 w-3.5" /> Delete All Overrides
            {/if}
          </button>
        {/if}
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <button 
          type="button"
          onclick={() => onOpenChange(false)}
          disabled={saving || deleting}
          class="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          type="button"
          onclick={handleSave}
          disabled={saving || deleting || loadingStatus}
          class="flex-1 sm:flex-none px-8 py-2.5 rounded-xl bg-amber-400/20 border border-amber-400/50 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 hover:bg-amber-400/30 transition-all shadow-[0_0_15px_rgba(251,191,36,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {#if saving}
            <Loader2 class="h-4 w-4 animate-spin" /> Saving...
          {:else}
            Save Credentials
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
