<script lang="ts">
  import { Hammer, Terminal, ShieldAlert, Save, Loader2 } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import FormGroup from "../components/FormGroup.svelte";
  import { patchConfig, configStore } from "$lib/state/config.svelte";

  let saving = $derived(configStore.saving);
  let config = $derived(configStore.config?.tools || {});

  // Profile config
  let profile = $state("");
  let rateLimitPerHour = $state(0);
  let allowStr = $state("");
  let denyStr = $state("");
  let alsoAllowStr = $state("");

  // Exec config
  let execSecurity = $state("full");
  let execAsk = $state("off");
  let execAllowlistStr = $state("");

  $effect(() => {
    if (configStore.config && !saving) {
      profile = config.profile || "minimal";
      rateLimitPerHour = config.rate_limit_per_hour || 0;
      allowStr = (config.allow || []).join(", ");
      denyStr = (config.deny || []).join(", ");
      alsoAllowStr = (config.alsoAllow || []).join(", ");

      const exec = config.execApproval || {};
      execSecurity = exec.security || "full";
      execAsk = exec.ask || "off";
      execAllowlistStr = (exec.allowlist || []).join("\n");
    }
  });

  function parseArray(str: string): string[] {
    return str.split(",").map(s => s.trim()).filter(Boolean);
  }

  function parseLines(str: string): string[] {
    return str.split("\n").map(s => s.trim()).filter(Boolean);
  }

  async function handleSave() {
    await patchConfig({
      tools: {
        profile,
        rate_limit_per_hour: rateLimitPerHour,
        allow: parseArray(allowStr),
        deny: parseArray(denyStr),
        alsoAllow: parseArray(alsoAllowStr),
        execApproval: {
          security: execSecurity,
          ask: execAsk,
          allowlist: parseLines(execAllowlistStr)
        }
      }
    });
  }
</script>

<div class="space-y-6 animate-in fade-in duration-500">
  
  <div class="flex items-center justify-between mb-4">
    <div>
      <h2 class="text-lg font-black text-white uppercase tracking-widest">{$_("config.tools.title")}</h2>
      <p class="text-[10px] text-cyan-500/70 uppercase tracking-widest mt-1">{$_("config.tools.description")}</p>
    </div>
    <button onclick={handleSave} disabled={saving} class="group relative h-10 px-6 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all flex items-center gap-2 shadow-[inset_0_1px_5px_rgba(6,182,212,0.1),0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[inset_0_1px_5px_rgba(6,182,212,0.2),0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-50 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
      <span class="relative z-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400">
        {#if saving}
          <Loader2 class="h-4 w-4 animate-spin" /> {$_("config.saving")}
        {:else}
          <Save class="h-4 w-4" /> {$_("config.saveConfig")}
        {/if}
      </span>
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <FormGroup title={$_("config.tools.profile")} description="Predefined capability sets" icon={Hammer}>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.tools.profile")}</label>
          <select bind:value={profile} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors appearance-none">
            <option value="minimal">Minimal</option>
            <option value="coding">Coding</option>
            <option value="messaging">Messaging</option>
            <option value="full">Full</option>
          </select>
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.tools.profileTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.tools.rateLimitPerHour")}</label>
          <input type="number" bind:value={rateLimitPerHour} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.tools.rateLimitPerHourTip")}</p>
        </div>
      </div>

      <div class="space-y-4 pt-2 border-t border-white/5">
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.tools.allow")}</label>
          <input type="text" bind:value={allowStr} placeholder="tool_name_1, tool_name_2" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.tools.allowTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.tools.deny")}</label>
          <input type="text" bind:value={denyStr} placeholder="tool_name_3" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.tools.denyTip")}</p>
        </div>
        <div>
          <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.tools.alsoAllow")}</label>
          <input type="text" bind:value={alsoAllowStr} placeholder="tool_name_4" class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors" />
          <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.tools.alsoAllowTip")}</p>
        </div>
      </div>
    </FormGroup>

    <div class="space-y-6">
      <FormGroup title={$_("config.tools.execApproval")} description="Shell & Execution Security" icon={Terminal}>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.tools.execSecurity")}</label>
            <select bind:value={execSecurity} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors appearance-none">
              <option value="deny">Deny All</option>
              <option value="allowlist">Allowlist</option>
              <option value="full">Full (Allow All)</option>
            </select>
            <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.tools.execSecurityTip")}</p>
          </div>
          <div>
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.tools.execAskMode")}</label>
            <select bind:value={execAsk} class="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-cyan-500/50 transition-colors appearance-none">
              <option value="off">Off</option>
              <option value="on-miss">On Miss</option>
              <option value="always">Always</option>
            </select>
            <p class="text-[9px] text-white/30 mt-1 ml-1 leading-relaxed">{$_("config.tools.execAskModeTip")}</p>
          </div>
        </div>

        {#if execSecurity === "allowlist"}
          <div class="animate-in fade-in slide-in-from-top-2">
            <label class="block text-[9px] text-white/40 uppercase tracking-widest mb-2 ml-1">{$_("config.tools.execAllowlistLabel")}</label>
            <textarea 
              bind:value={execAllowlistStr} 
              rows="4"
              class="w-full p-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-xs outline-none focus:border-cyan-500/50 transition-colors resize-none"
              placeholder="git *&#10;npm *&#10;ls *"
            ></textarea>
          </div>
        {/if}
      </FormGroup>

      <div class="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex flex-col justify-center">
        <ShieldAlert class="h-8 w-8 text-cyan-500 mb-4 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
        <h3 class="text-sm font-black text-white uppercase tracking-widest mb-2">Zero-Trust Warning</h3>
        <p class="text-[10px] text-white/50 uppercase leading-relaxed tracking-widest">
          Granting agents "Full" command execution privileges outside of a sandbox is extremely dangerous. Always prefer "Allowlist" mode.
        </p>
      </div>
    </div>
  </div>
</div>
