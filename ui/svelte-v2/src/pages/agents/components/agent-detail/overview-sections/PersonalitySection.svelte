<script lang="ts">
  import { Bot, Check, Copy } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import Combobox from "../../../../../lib/components/ui/Combobox.svelte";

  type Props = {
    agentKey: string;
    emoji: string;
    displayName: string;
    frontmatter: string;
    status: string;
    isDefault: boolean;
    onEmojiChange: (v: string) => void;
    onDisplayNameChange: (v: string) => void;
    onFrontmatterChange: (v: string) => void;
    onStatusChange: (v: string) => void;
    onIsDefaultChange: (v: boolean) => void;
  };

  let {
    agentKey, emoji, displayName, frontmatter, status, isDefault,
    onEmojiChange, onDisplayNameChange, onFrontmatterChange,
    onStatusChange, onIsDefaultChange
  }: Props = $props();

  let copied = $state(false);
  let emojiEditing = $state(false);

  function extractSingleEmoji(str: string): string {
    const match = str.match(/\p{Emoji_Presentation}(\u200D\p{Emoji_Presentation})*/u)
      ?? str.match(/\p{Extended_Pictographic}(\uFE0F?\u200D\p{Extended_Pictographic})*/u);
    return match?.[0] ?? "";
  }

  async function copyAgentKey() {
    await navigator.clipboard.writeText(agentKey);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  let statusOptions = $derived.by(() => {
    let opts = [
      { value: "active", label: "Active (Online)" },
      { value: "inactive", label: "Inactive (Offline)" }
    ];
    if (status === "summon_failed") {
      opts.push({ value: "summon_failed", label: "Summon Failed" });
    }
    return opts;
  });
</script>

<div class="relative z-40 group p-6 rounded-3xl bg-gradient-to-br from-[#030014]/80 to-[#1a0033]/40 backdrop-blur-3xl border border-white/5 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_30px_rgba(168,85,247,0.1),0_0_40px_rgba(168,85,247,0.2)] hover:border-purple-500/30 mt-6">
  <!-- Ambient Neon Corner Glows -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

  <!-- Animated cyber background grid mask -->
  <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none mix-blend-screen">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] opacity-80"></div>
  </div>

  <div class="relative z-10 flex items-center gap-3 mb-8">
    <div class="h-8 w-8 rounded-xl bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.2)]">
      <Bot class="h-4 w-4 text-goclaw-neon-purple animate-pulse" />
    </div>
    <h3 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm">Identity & Personality</h3>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 relative z-10">
    <!-- Emoji Block -->
    <div class="flex flex-col items-center gap-2">
      <button
        type="button"
        onclick={() => emojiEditing = true}
        class="flex h-16 w-16 items-center justify-center rounded-2xl bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/20 text-goclaw-neon-purple hover:bg-goclaw-neon-purple/20 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)]"
        title="Change identity avatar"
      >
        {#if emoji}
          <span class="text-3xl leading-none">{emoji}</span>
        {:else}
          <Bot class="h-8 w-8 text-white/30" />
        {/if}
      </button>
      
      {#if emojiEditing}
        <div class="relative group/emoji">
          <div class="absolute inset-x-0 bottom-0 top-0 border-2 border-transparent group-focus-within/emoji:border-goclaw-neon-purple/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[0_0_15px_rgba(139,92,246,0.3)]"></div>
          <input
            type="text"
            value={emoji}
            oninput={(e) => onEmojiChange(extractSingleEmoji(e.currentTarget.value))}
            onblur={() => emojiEditing = false}
            placeholder="🤖"
            class="w-16 h-11 text-center bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 rounded-xl text-white/90 text-lg outline-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10 transition-all"
            autofocus
          />
        </div>
      {:else}
        <span class="text-[10px] uppercase font-bold tracking-widest text-white/30">Emoji</span>
      {/if}
    </div>

    <!-- Core Fields -->
    <div class="space-y-6">
      <div class="space-y-1.5 group/input relative">
        <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Display Name</label>
        <div class="absolute inset-x-0 bottom-0 top-[22px] border-2 border-transparent group-focus-within/input:border-goclaw-neon-cyan/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(6,182,212,0.3),0_0_15px_rgba(6,182,212,0.2)]"></div>
        <input
          type="text"
          value={displayName}
          oninput={(e) => onDisplayNameChange(e.currentTarget.value)}
          placeholder="e.g. System Admin"
          class="w-full h-11 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-white/90 font-bold text-sm focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
        />
      </div>

      <div class="space-y-1.5 group/input relative">
        <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Expertise Summary (Frontmatter)</label>
        <div class="absolute inset-x-0 bottom-0 top-[22px] border-2 border-transparent group-focus-within/input:border-goclaw-neon-cyan/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] group-focus-within/input:shadow-[inset_0_0_20px_rgba(6,182,212,0.3),0_0_15px_rgba(6,182,212,0.2)]"></div>
        <textarea
          value={frontmatter}
          oninput={(e) => onFrontmatterChange(e.currentTarget.value)}
          placeholder="You are an expert in software architecture..."
          class="w-full h-24 p-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.05] border border-white/10 text-white/90 placeholder-white/30 font-mono text-[13px] focus:outline-none resize-none transition-all scrollbar-thin shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative z-10"
        ></textarea>
        {#if frontmatter}
          <p class="text-[10px] text-white/30 italic px-1 truncate mt-1">LLM sees: "{frontmatter}"</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-6 relative z-50">
    <!-- Status -->
    <div class="space-y-1.5 relative group/select">
      <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">System Status</label>
      <div class="relative z-10">
        <Combobox
          value={status}
          onChange={onStatusChange}
          options={statusOptions}
          allowCustom={false}
        />
      </div>
    </div>

    <!-- Default Toggle -->
    <div class="flex items-center gap-3 pt-6 px-4">
       <button 
         onclick={() => onIsDefaultChange(!isDefault)}
         class={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:ring-2 focus:ring-goclaw-neon-purple focus:ring-offset-2 focus:ring-offset-black ${isDefault ? 'bg-goclaw-neon-purple shadow-[0_0_10px_rgba(217,70,239,0.5)]' : 'bg-[#030014] border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
       >
         <span class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDefault ? 'translate-x-6' : 'translate-x-1'}`}></span>
       </button>
       <span class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Default Agent</span>
    </div>
  </div>

  <!-- Agent Key (Read-only) -->
  <div class="pt-6 mt-6 border-t border-white/10 space-y-1.5 relative group/key">
    <label class="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Internal Reference Key</label>
    <div class="absolute inset-x-0 bottom-0 top-[22px] border-2 border-transparent group-hover/key:border-emerald-500/30 rounded-xl pointer-events-none transition-colors z-20 shadow-[0_0_15px_rgba(16,185,129,0.0)] group-hover/key:shadow-[0_0_15px_rgba(16,185,129,0.2)]"></div>
    <div class="flex items-center gap-2 relative z-10">
      <div class="flex-1 h-11 px-4 rounded-xl bg-[#030014]/90 border border-white/10 flex items-center shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] overflow-hidden">
        <span class="font-mono text-[12px] font-bold text-emerald-400/80 truncate">{agentKey}</span>
      </div>
      <button 
        onclick={copyAgentKey}
        class="h-11 w-11 flex shrink-0 items-center justify-center rounded-xl bg-[#030014]/90 border border-white/10 text-emerald-500/50 hover:text-emerald-400 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all outline-none"
        title="Copy Key"
      >
        {#if copied}
          <Check class="h-4 w-4 text-emerald-400" />
        {:else}
          <Copy class="h-4 w-4" />
        {/if}
      </button>
    </div>
  </div>
</div>
