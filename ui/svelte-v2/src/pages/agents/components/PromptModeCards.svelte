<script context="module" lang="ts">
  export const PROMPT_MODES = ["full", "task", "minimal", "none"] as const;
  export type PromptMode = (typeof PROMPT_MODES)[number];
</script>

<script lang="ts">
  import { Zap, Wrench, Package, CircleOff } from "lucide-svelte";
  import { _ } from "svelte-i18n";

  const MODE_ICONS: Record<PromptMode, any> = {
    full: Zap,
    task: Wrench,
    minimal: Package,
    none: CircleOff,
  };

  const MODE_SECTIONS: Record<PromptMode, string[]> = {
    full: ["persona", "tools", "execBias", "callStyle", "safety", "skills", "mcp", "memory", "sandbox", "evolution", "channelHints"],
    task: ["styleEcho", "tools", "execBias", "safetySm", "skillsHybrid", "mcpSearch", "memorySm"],
    minimal: ["tools", "pinnedSkills", "memoryMin", "domainCtx"],
    none: ["tools", "toolNotes", "pinnedSkills", "mcpSearch", "workspace"],
  };

  const MODE_TOKENS: Record<PromptMode, string> = {
    full: "~4.8K",
    task: "~1.3K",
    minimal: "~570",
    none: "~640",
  };

  type Props = {
    value: PromptMode;
    onChange: (mode: PromptMode) => void;
    compact?: boolean;
  };

  let { value, onChange, compact = false }: Props = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {#each PROMPT_MODES as m}
    {@const Icon = MODE_ICONS[m]}
    {@const selected = value === m}
    {@const sections = MODE_SECTIONS[m]}
    {@const tokens = MODE_TOKENS[m]}
    
    {@const styles = {
      full: {
        border: 'border-purple-500/50',
        bgLine: 'bg-purple-500',
        bgGlow: 'bg-purple-500',
        badgeBg: 'bg-purple-500/20',
        badgeText: 'text-purple-500',
        badgeBorder: 'border-purple-500/30',
        tagBg: 'bg-purple-500/10',
        tagBorder: 'border-purple-500/20',
        hex: '168,85,247'
      },
      task: {
        border: 'border-cyan-500/50',
        bgLine: 'bg-cyan-500',
        bgGlow: 'bg-cyan-500',
        badgeBg: 'bg-cyan-500/20',
        badgeText: 'text-cyan-500',
        badgeBorder: 'border-cyan-500/30',
        tagBg: 'bg-cyan-500/10',
        tagBorder: 'border-cyan-500/20',
        hex: '6,182,212'
      },
      minimal: {
        border: 'border-emerald-500/50',
        bgLine: 'bg-emerald-500',
        bgGlow: 'bg-emerald-500',
        badgeBg: 'bg-emerald-500/20',
        badgeText: 'text-emerald-500',
        badgeBorder: 'border-emerald-500/30',
        tagBg: 'bg-emerald-500/10',
        tagBorder: 'border-emerald-500/20',
        hex: '16,185,129'
      },
      none: {
        border: 'border-slate-400/50',
        bgLine: 'bg-slate-400',
        bgGlow: 'bg-slate-400',
        badgeBg: 'bg-slate-400/20',
        badgeText: 'text-slate-400',
        badgeBorder: 'border-slate-400/30',
        tagBg: 'bg-slate-400/10',
        tagBorder: 'border-slate-400/20',
        hex: '148,163,184'
      }
    }[m]}
    
    <button
      type="button"
      onclick={() => onChange(m)}
      class={`relative flex flex-col gap-2 rounded-2xl p-4 text-left cursor-pointer transition-all duration-300 overflow-hidden group outline-none ${
        selected
          ? `border ${styles.border} shadow-[0_0_20px_rgba(${styles.hex},0.2)]`
          : "border border-white/5 hover:border-white/10 bg-[#030014]/40 hover:bg-[#030014]/60 backdrop-blur-md"
      }`}
      style={selected ? `background: linear-gradient(to top, rgba(${styles.hex}, 0.2), transparent);` : ''}
    >
      {#if selected}
        <div class={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] ${styles.bgLine} shadow-[0_0_15px_rgba(${styles.hex},1)] rounded-t-full`}></div>
        <div class={`absolute inset-0 opacity-20 blur-xl ${styles.bgGlow} pointer-events-none`}></div>
        <!-- Shimmer effect -->
        <div class={`absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(${styles.hex},0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] pointer-events-none`}></div>
      {/if}
      
      <!-- Header Row -->
      <div class="flex items-center justify-between w-full relative z-10">
        <div class="flex items-center gap-2.5">
          <Icon class={`h-4 w-4 transition-colors ${selected ? `text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]` : 'text-white/40 group-hover:text-white/60'}`} />
          <span class={`text-[11px] font-black uppercase tracking-widest ${selected ? 'text-white drop-shadow-md' : 'text-white/60 group-hover:text-white/80'}`}>
            {$_(`agents:detail.prompt.mode.${m}`, {default: m})}
          </span>
        </div>
        <span class={`text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded-md border ${selected ? `${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder} shadow-[inset_0_0_5px_rgba(${styles.hex},0.2)]` : 'bg-white/5 text-white/30 border-white/10'}`}>
          {tokens}
        </span>
      </div>

      <!-- Description -->
      <p class={`text-[10px] leading-relaxed relative z-10 ${selected ? 'text-white/80' : 'text-white/40'}`}>
        {$_(`agents:detail.prompt.mode.${m}Desc`, {default: "This mode configures the agent's context and capabilities for specific workloads."})}
      </p>

      <!-- Sections (Tags) -->
      {#if !compact && sections.length > 0}
        <div class="flex flex-wrap gap-1.5 mt-1 relative z-10">
          {#each sections as s}
            <span class={`inline-block rounded-md px-1.5 py-0.5 text-[8px] uppercase tracking-wider ${selected ? `${styles.tagBg} text-white/60 border ${styles.tagBorder}` : 'bg-white/5 text-white/30 border border-white/5'}`}>
              {$_(`agents:detail.prompt.section.${s}`, {default: s})}
            </span>
          {/each}
        </div>
      {/if}
    </button>
  {/each}
</div>
