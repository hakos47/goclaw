<script lang="ts">
  import { Shield, Zap, Wrench } from "lucide-svelte";
  import type { SubagentsConfig, ToolPolicyConfig } from "../../../../../lib/types/agent";
  import Combobox from "../../../../../lib/components/ui/Combobox.svelte";

  type Props = {
    subEnabled: boolean;
    sub: SubagentsConfig;
    toolsEnabled: boolean;
    tools: ToolPolicyConfig;
    onSubToggle: (v: boolean) => void;
    onSubChange: (v: SubagentsConfig) => void;
    onToolsToggle: (v: boolean) => void;
    onToolsChange: (v: ToolPolicyConfig) => void;
  };

  let {
    subEnabled, sub, toolsEnabled, tools,
    onSubToggle, onSubChange, onToolsToggle, onToolsChange
  }: Props = $props();

  function undefIfNaN(val: number): number | undefined {
    return isNaN(val) ? undefined : val;
  }

  let profileOptions = [
    { value: "full", label: "Full (All Unrestricted Tools)" },
    { value: "coding", label: "Coding (Files, Terminal, Git)" },
    { value: "messaging", label: "Messaging (Slack, Email)" },
    { value: "minimal", label: "Minimal (Search Only)" },
    { value: "custom", label: "Custom Definition" }
  ];
</script>

<div class="relative z-20 group p-6 rounded-3xl bg-gradient-to-br from-[#030014]/80 to-[#1a0033]/40 backdrop-blur-3xl border border-white/5 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_30px_rgba(16,185,129,0.1),0_0_40px_rgba(16,185,129,0.2)] hover:border-emerald-500/30 mt-6">
  <!-- Ambient Neon Corner Glows -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

  <!-- Animated cyber background grid mask -->
  <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none mix-blend-screen">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] opacity-80"></div>
  </div>

  <div class="relative z-10 flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
    <div class="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
      <Zap class="h-4 w-4 text-emerald-500 animate-[pulse_2s_ease-in-out_infinite]" />
    </div>
    <div>
      <h3 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm">Operational Capabilities</h3>
      <p class="text-[10px] text-white/40 mt-1">Configure recursive autonomy and tool execution policy.</p>
    </div>
  </div>

  <div class="space-y-6 relative z-10">
    <!-- Subagents Config -->
    <div class="border border-white/10 rounded-3xl p-6 bg-[#030014]/40 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] hover:border-emerald-500/30 transition-all duration-300">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h4 class="text-[10px] font-black text-white/70 uppercase tracking-widest flex items-center gap-2">
            Multi-Agent Orchestration
          </h4>
        </div>
        <button 
           onclick={() => { onSubToggle(!subEnabled); if(!subEnabled) onSubChange({}); }}
           class={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black ${subEnabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-[#030014] border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
         >
           <span class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${subEnabled ? 'translate-x-6' : 'translate-x-1'}`}></span>
         </button>
      </div>

      <div class={`grid grid-cols-1 sm:grid-cols-2 gap-6 transition-opacity ${!subEnabled ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
        <div class="space-y-1.5 group/input relative">
          <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Max Concurrent Subagents</label>
          <div class="relative">
            <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-emerald-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(16,185,129,0.3),0_0_15px_rgba(16,185,129,0.2)]"></div>
            <input
              type="number"
              value={sub.maxConcurrent}
              oninput={(e) => onSubChange({ ...sub, maxConcurrent: undefIfNaN(Number(e.currentTarget.value)) })}
              class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-emerald-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
            />
          </div>
        </div>
        <div class="space-y-1.5 group/input relative">
          <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Max Spawn Depth</label>
          <div class="relative">
            <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-emerald-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(16,185,129,0.3),0_0_15px_rgba(16,185,129,0.2)]"></div>
            <input
              type="number"
              value={sub.maxSpawnDepth}
              oninput={(e) => onSubChange({ ...sub, maxSpawnDepth: undefIfNaN(Number(e.currentTarget.value)) })}
              class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-emerald-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
            />
          </div>
        </div>
        <div class="space-y-1.5 group/input relative">
          <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Archive After (Minutes)</label>
          <div class="relative">
            <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-emerald-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(16,185,129,0.3),0_0_15px_rgba(16,185,129,0.2)]"></div>
            <input
              type="number"
              value={sub.archiveAfterMinutes}
              oninput={(e) => onSubChange({ ...sub, archiveAfterMinutes: undefIfNaN(Number(e.currentTarget.value)) })}
              class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-emerald-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
            />
          </div>
        </div>
        <div class="space-y-1.5 group/input relative">
          <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Subagent Custom Model</label>
          <div class="relative">
            <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-emerald-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(16,185,129,0.3),0_0_15px_rgba(16,185,129,0.2)]"></div>
            <input
              type="text"
              value={sub.model || ''}
              oninput={(e) => onSubChange({ ...sub, model: e.currentTarget.value })}
              placeholder="Inherit parent model"
              class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-emerald-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Tool Policy Config -->
    <div class="border border-white/10 rounded-3xl p-6 bg-[#030014]/40 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] hover:border-orange-500/30 transition-all duration-300 relative z-50">
      <div class="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h4 class="text-[10px] font-black text-white/70 uppercase tracking-widest flex items-center gap-2">
            Tool Execution Policy
          </h4>
        </div>
        <button 
           onclick={() => { onToolsToggle(!toolsEnabled); if(!toolsEnabled) onToolsChange({}); }}
           class={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black ${toolsEnabled ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-[#030014] border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
         >
           <span class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toolsEnabled ? 'translate-x-6' : 'translate-x-1'}`}></span>
         </button>
      </div>

      <div class={`transition-opacity space-y-6 relative z-10 ${!toolsEnabled ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
        <div class="space-y-1.5 group/select relative">
          <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Policy Profile</label>
          <div class="relative z-50">
            <Combobox
              value={tools.profile || "full"}
              onChange={(val) => onToolsChange({ ...tools, profile: val })}
              options={profileOptions}
              allowCustom={false}
            />
          </div>
        </div>

        {#if tools.profile === "custom"}
          <div class="space-y-1.5 group/input relative">
            <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Allowed Tools (Comma separated)</label>
            <div class="relative">
              <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-orange-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(249,115,22,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(249,115,22,0.3),0_0_15px_rgba(249,115,22,0.2)]"></div>
              <input
                type="text"
                value={(tools.allow || []).join(", ")}
                oninput={(e) => onToolsChange({ ...tools, allow: e.currentTarget.value.split(",").map(s => s.trim()).filter(Boolean) })}
                placeholder="e.g. read_file, grep_search"
                class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-orange-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
              />
            </div>
          </div>
          <div class="space-y-1.5 group/input relative">
            <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Denied Tools (Comma separated)</label>
            <div class="relative">
              <div class="absolute inset-0 border-2 border-transparent group-focus-within/input:border-red-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(239,68,68,0.3),0_0_15px_rgba(239,68,68,0.2)]"></div>
              <input
                type="text"
                value={(tools.deny || []).join(", ")}
                oninput={(e) => onToolsChange({ ...tools, deny: e.currentTarget.value.split(",").map(s => s.trim()).filter(Boolean) })}
                placeholder="e.g. run_command, delete_file"
                class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-red-400 font-mono text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
              />
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
