<script lang="ts">
  import { Bot, Radio, Zap, Globe, Sparkles, PowerOff } from "lucide-svelte";
  import { cn } from "../../../lib/utils";

  let {
    provider,
    onChange
  }: {
    provider: string;
    onChange: (id: string) => void;
  } = $props();

  const PROVIDERS = [
    { id: "", name: "None (Disabled)", icon: PowerOff, color: "text-white/60", border: "border-white/20", bg: "bg-white/5", shadow: "shadow-none" },
    { id: "openai", name: "OpenAI", icon: Bot, color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", shadow: "shadow-[0_0_15px_rgba(16,185,129,0.2)]" },
    { id: "elevenlabs", name: "ElevenLabs", icon: Radio, color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10", shadow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]" },
    { id: "edge", name: "Edge TTS", icon: Globe, color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10", shadow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]" },
    { id: "minimax", name: "MiniMax", icon: Zap, color: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10", shadow: "shadow-[0_0_15px_rgba(244,63,94,0.2)]" },
    { id: "gemini", name: "Google Gemini", icon: Sparkles, color: "text-goclaw-neon-cyan", border: "border-goclaw-neon-cyan/30", bg: "bg-goclaw-neon-cyan/10", shadow: "shadow-[0_0_15px_rgba(6,182,212,0.2)]" },
  ];
</script>

<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
  {#each PROVIDERS as p}
    {@const isActive = provider === p.id}
    <button
      onclick={() => onChange(p.id)}
      class={cn(
        "relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden group",
        isActive ? `${p.border} ${p.bg} ${p.shadow} scale-105 z-10` : "border-white/10 bg-black/40 hover:bg-white/5 hover:border-white/20"
      )}
    >
      {#if isActive}
        <div class="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none"></div>
      {/if}
      <div class={cn(
        "p-3 rounded-xl transition-colors",
        isActive ? p.bg : "bg-white/5 group-hover:bg-white/10"
      )}>
        <p.icon class={cn("w-6 h-6", isActive ? p.color : "text-white/40 group-hover:text-white/70")} />
      </div>
      <span class={cn(
        "text-xs font-black uppercase tracking-widest transition-colors",
        isActive ? "text-white drop-shadow-md" : "text-white/50 group-hover:text-white/80"
      )}>
        {p.name}
      </span>
      
      <!-- Active indicator -->
      {#if isActive}
        <div class={cn("absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] rounded-t-full shadow-[0_0_10px_currentColor]", p.color)}></div>
      {/if}
    </button>
  {/each}
</div>
