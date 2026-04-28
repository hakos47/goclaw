<script lang="ts">
  import { X, Save, Server, Terminal, Shield, Play, Sliders } from "lucide-svelte";
  import { createCliCredential, updateCliCredential, cliCredentialsStore, type SecureCLIBinary, type CLICredentialInput } from "$lib/state/cli-credentials.svelte";

  type Props = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    credential?: SecureCLIBinary | null;
  };

  let { open, onOpenChange, credential = null }: Props = $props();

  let saving = $state(false);
  let errorMsg = $state("");

  let preset = $state("");
  let binaryName = $state(credential?.binary_name || "");
  let binaryPath = $state(credential?.binary_path || "");
  let description = $state(credential?.description || "");
  let isGlobal = $state(credential ? credential.is_global : true);
  let enabled = $state(credential ? credential.enabled : true);
  let timeoutSeconds = $state(credential?.timeout_seconds || 300);
  let tips = $state(credential?.tips || "");
  
  let denyArgsInput = $state(credential?.deny_args?.join(", ") || "");
  let denyVerboseInput = $state(credential?.deny_verbose?.join(", ") || "");

  // Minimal Env approach: allow specifying names and values. 
  // In Go backend, keys are kept, values are encrypted.
  let envs = $state(credential?.env_keys?.map(k => ({ key: k, value: "" })) || []);

  function addEnv() {
    envs = [...envs, { key: "", value: "" }];
  }
  function removeEnv(idx: number) {
    envs = envs.filter((_, i) => i !== idx);
  }

  function handlePresetChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    preset = val;
    const p = cliCredentialsStore.presets[val];
    if (p) {
      binaryName = p.binary_name;
      description = p.description;
      timeoutSeconds = p.timeout;
      tips = p.tips;
      denyArgsInput = p.deny_args?.join(", ") || "";
      denyVerboseInput = p.deny_verbose?.join(", ") || "";
      // For preset env vars, we populate the keys.
      envs = p.env_vars.map(ev => ({ key: ev.name, value: "" }));
    }
  }

  async function handleSubmit() {
    saving = true;
    errorMsg = "";
    try {
      const payload: CLICredentialInput = {
        binary_name: binaryName.trim(),
        binary_path: binaryPath.trim() || undefined,
        description: description.trim() || undefined,
        is_global: isGlobal,
        enabled: enabled,
        timeout_seconds: timeoutSeconds,
        tips: tips.trim() || undefined,
        deny_args: denyArgsInput.split(",").map(s => s.trim()).filter(Boolean),
        deny_verbose: denyVerboseInput.split(",").map(s => s.trim()).filter(Boolean),
      };

      if (preset) payload.preset = preset;

      const envDict: Record<string, string> = {};
      for (const e of envs) {
        if (e.key.trim()) {
          envDict[e.key.trim()] = e.value;
        }
      }
      if (Object.keys(envDict).length > 0) {
        payload.env = envDict;
      }

      if (credential) {
        await updateCliCredential(credential.id, payload);
      } else {
        await createCliCredential(payload);
      }
      onOpenChange(false);
    } catch (e: any) {
      errorMsg = e.message || "An error occurred";
    } finally {
      saving = false;
    }
  }
</script>

{#if open}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0 bg-black/80 backdrop-blur-xl" onclick={() => !saving && onOpenChange(false)}></div>

    <div class="relative bg-gradient-to-br from-[#030014]/95 to-[#1a0033]/90 border border-white/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8),inset_0_2px_20px_rgba(0,0,0,0.5)] flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden">
      
      <div class="absolute inset-0 pointer-events-none mix-blend-screen overflow-hidden rounded-3xl">
        <div class="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-80"></div>
      </div>

      <div class="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Terminal class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-xs font-black text-white/90 tracking-[0.3em] uppercase">{credential ? 'Edit Binary' : 'Register Binary'}</h2>
            <div class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Configure Executable Profile</div>
          </div>
        </div>
        <button onclick={() => !saving && onOpenChange(false)} disabled={saving} class="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors border border-white/5 disabled:opacity-50">
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-6 scroller-no-scrollbar relative z-10">
        
        {#if errorMsg}
          <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-black uppercase tracking-widest text-red-400">
            {errorMsg}
          </div>
        {/if}

        {#if !credential}
          <div class="space-y-3">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Apply Preset (Optional)</label>
            <select value={preset} onchange={handlePresetChange} class="w-full h-11 px-4 bg-[#0a0a0a] focus:bg-black/60 border border-white/5 rounded-xl text-cyan-400 font-bold text-sm outline-none transition-colors appearance-none cursor-pointer">
              <option value="" class="bg-black text-white">Custom Configuration</option>
              {#each Object.entries(cliCredentialsStore.presets) as [key, p]}
                <option value={key} class="bg-black text-white">{p.binary_name} ({key})</option>
              {/each}
            </select>
          </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Binary Name</label>
            <input type="text" bind:value={binaryName} placeholder="e.g. gcloud" class="w-full h-11 px-4 bg-black/40 border border-white/5 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors" />
            <p class="text-[9px] text-white/30 px-1 font-mono">The command typed in terminal</p>
          </div>
          <div class="space-y-3">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Absolute Path</label>
            <input type="text" bind:value={binaryPath} placeholder="e.g. /usr/local/bin/gcloud" class="w-full h-11 px-4 bg-black/40 border border-white/5 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors" />
            <p class="text-[9px] text-white/30 px-1 font-mono">Optional. Required if not in $PATH</p>
          </div>
        </div>

        <div class="space-y-3">
          <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Description</label>
          <input type="text" bind:value={description} placeholder="Google Cloud CLI" class="w-full h-11 px-4 bg-black/40 border border-white/5 rounded-xl text-white font-sans text-sm outline-none focus:border-cyan-500/50 transition-colors" />
        </div>

        <!-- Security / Execution settings -->
        <div class="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
          <h3 class="text-xs font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
            <Shield class="h-4 w-4 text-emerald-400" /> Security & Execution
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Deny Arguments</label>
              <input type="text" bind:value={denyArgsInput} placeholder="e.g. auth, delete, -f" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none focus:border-emerald-500/50 transition-colors" />
              <p class="text-[9px] text-white/30 px-1">Comma separated args strictly blocked</p>
            </div>
            <div class="space-y-3">
              <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Deny Verbose</label>
              <input type="text" bind:value={denyVerboseInput} placeholder="e.g. -v, --verbose" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-white font-mono text-sm outline-none focus:border-emerald-500/50 transition-colors" />
              <p class="text-[9px] text-white/30 px-1">Arguments blocked if command output is too large</p>
            </div>
          </div>

          <div class="space-y-3">
            <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Timeout (Seconds)</label>
            <input type="number" bind:value={timeoutSeconds} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/5 rounded-xl text-emerald-400 font-mono text-sm outline-none focus:border-emerald-500/50 transition-colors" />
          </div>
        </div>

        <!-- Environment Variables -->
        <div class="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
              <Sliders class="h-4 w-4 text-magenta-400" /> Environment Variables
            </h3>
            <button onclick={addEnv} class="text-[10px] font-black uppercase tracking-widest text-magenta-400 hover:text-magenta-300">
              + Add Env
            </button>
          </div>
          
          {#if envs.length === 0}
            <div class="text-[10px] font-mono text-white/30 p-2 text-center border border-white/5 border-dashed rounded-xl">No environment variables configured.</div>
          {:else}
            <div class="space-y-2">
              {#each envs as e, i}
                <div class="flex items-center gap-2">
                  <input type="text" bind:value={e.key} placeholder="VAR_NAME" class="flex-1 h-9 px-3 bg-[#0a0a0a] border border-white/5 rounded-lg text-white font-mono text-xs outline-none focus:border-magenta-500/50" />
                  <input type="text" bind:value={e.value} placeholder={credential ? '(Keep empty to preserve)' : 'Value...'} class="flex-1 h-9 px-3 bg-[#0a0a0a] border border-white/5 rounded-lg text-white font-mono text-xs outline-none focus:border-magenta-500/50" />
                  <button onclick={() => removeEnv(i)} class="p-2 text-white/30 hover:text-red-400"><X class="h-4 w-4" /></button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Toggles -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <div>
              <label class="text-xs font-bold text-white/90 uppercase tracking-widest">Global</label>
              <p class="text-[9px] text-white/40 mt-0.5">Available to all agents?</p>
            </div>
            <button onclick={() => isGlobal = !isGlobal} class={`relative w-10 h-5 rounded-full transition-colors ${isGlobal ? 'bg-cyan-500/50' : 'bg-black/50 border border-white/20'}`}>
              <div class={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-transform ${isGlobal ? 'translate-x-5 bg-cyan-400' : 'translate-x-0 bg-white/30'}`}></div>
            </button>
          </div>
          <div class="flex items-center justify-between bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <div>
              <label class="text-xs font-bold text-white/90 uppercase tracking-widest">Enabled</label>
              <p class="text-[9px] text-white/40 mt-0.5">Allow execution?</p>
            </div>
            <button onclick={() => enabled = !enabled} class={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-emerald-500/50' : 'bg-black/50 border border-white/20'}`}>
              <div class={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-transform ${enabled ? 'translate-x-5 bg-emerald-400' : 'translate-x-0 bg-white/30'}`}></div>
            </button>
          </div>
        </div>

      </div>

      <div class="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-4 relative z-10 rounded-b-3xl">
        <button onclick={() => onOpenChange(false)} disabled={saving} class="px-6 h-10 rounded-xl border border-transparent text-white/50 hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest">
          Cancel
        </button>
        <button onclick={handleSubmit} disabled={saving || !binaryName} class="relative px-8 h-10 flex items-center gap-2 rounded-xl bg-cyan-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:opacity-50">
          {#if saving}
            <Server class="h-4 w-4 animate-spin" /> Saving...
          {:else}
            <Save class="h-4 w-4" /> Save
          {/if}
        </button>
      </div>

    </div>
  </div>
{/if}
