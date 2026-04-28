<script lang="ts">
  import { onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import type { AgentData } from "../../../lib/types/agent";
  import PromptModeCards from "./PromptModeCards.svelte";
  import { Bot, Info, ShieldAlert, X } from "lucide-svelte";
  import type { PromptMode } from "./PromptModeCards.svelte";

  type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (data: Partial<AgentData>) => Promise<unknown>;
  };

  let { open, onOpenChange, onCreate }: Props = $props();

  let loading = $state(false);
  let submitError = $state("");

  // Form
  let emoji = $state("");
  let displayName = $state("");
  let agentKey = $state("");
  let provider = $state("");
  let model = $state("");
  let agentType = $state<"open"|"predefined">("predefined");
  let description = $state("");
  let selfEvolve = $state(false);
  let promptMode = $state<PromptMode>("full");

  $effect(() => {
    if (!open) {
      emoji = "";
      displayName = "";
      agentKey = "";
      provider = "";
      model = "";
      agentType = "predefined";
      description = "";
      selfEvolve = false;
      promptMode = "full";
      submitError = "";
    }
  });

  async function handleSubmit() {
    loading = true;
    submitError = "";
    try {
      const otherConfig: Record<string, unknown> = {};
      if (promptMode && promptMode !== "full") {
        otherConfig.prompt_mode = promptMode;
      }
      await onCreate({
        agent_key: agentKey,
        display_name: displayName || undefined,
        provider: provider,
        model: model,
        agent_type: agentType,
        emoji: emoji?.trim() || null,
        agent_description: description?.trim() || null,
        self_evolve: selfEvolve || false,
        ...(Object.keys(otherConfig).length > 0 && { other_config: otherConfig }),
      });
      onOpenChange(false);
    } catch (err: any) {
      submitError = err.message || $_('agents.create.failedToCreate', {default: "Failed to create agent"});
    } finally {
      loading = false;
    }
  }

  let canCreate = $derived(!!agentKey && !!displayName && !!provider && !!model && !!description?.trim());
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 z-[100] flex items-center justify-center bg-[#030014]/80 backdrop-blur-3xl p-4 animate-in fade-in duration-500"
    onclick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
  >
    <div class="relative w-full max-w-4xl max-h-[95vh] flex flex-col bg-[#050505]/90 border border-white/5 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,1),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden animate-in zoom-in-95 duration-300">
      
      <!-- Scanlines & Background Effects -->
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
      <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/5 rounded-full blur-[100px] pointer-events-none"></div>

      <!-- Header -->
      <div class="relative z-10 flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md">
        <div class="flex items-center gap-4">
           <div class="h-14 w-14 rounded-2xl bg-[#030014] border border-white/10 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_20px_rgba(139,92,246,0.2)] overflow-hidden relative">
             <div class="absolute inset-0 bg-goclaw-neon-purple/10"></div>
             <Bot class="h-7 w-7 text-goclaw-neon-purple drop-shadow-[0_0_10px_rgba(217,70,239,0.5)] relative z-10" />
           </div>
           <div>
             <h2 class="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">{$_('agents.create.title', {default: "Create Agent"})}</h2>
             <p class="text-[10px] text-goclaw-neon-cyan font-bold uppercase tracking-[0.4em] mt-1 ml-0.5 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">DEPLOY NEW INTELLIGENCE</p>
           </div>
        </div>
        <button onclick={() => onOpenChange(false)} class="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#030014]/50 border border-white/5 hover:bg-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all duration-300 shadow-inner">
          <X class="h-6 w-6 group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <!-- Identity Section -->
        <section class="space-y-6">
          <h3 class="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-4 border-b border-white/5 pb-2">{$_('agents.detail.profile.title', {default: "Agent Profiling"})}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div class="space-y-2">
                <label class="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">{$_('agents.agentName', {default: "Agent Name"})}</label>
                <input type="text" bind:value={displayName} class="w-full h-12 px-5 rounded-2xl bg-[#030014]/80 border border-white/10 text-white font-mono text-sm focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner" />
             </div>
             <div class="space-y-2">
                <label class="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">{$_('agents.agentKey', {default: "Agent Key"})}</label>
                <input type="text" bind:value={agentKey} class="w-full h-12 px-5 rounded-2xl bg-[#030014]/80 border border-white/10 text-white font-mono text-sm focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner" />
             </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div class="space-y-2">
                <label class="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] relative">
                    {$_('agents.provider', {default: "Provider"})}
                </label>
                <input type="text" bind:value={provider} placeholder="openai" class="w-full h-12 px-5 rounded-2xl bg-[#030014]/80 border border-white/10 text-white font-mono text-sm focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner" />
             </div>
             <div class="space-y-2">
                <label class="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] relative">
                    {$_('agents.model', {default: "Model"})}
                </label>
                <input type="text" bind:value={model} placeholder="gpt-4o" class="w-full h-12 px-5 rounded-2xl bg-[#030014]/80 border border-white/10 text-white font-mono text-sm focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all shadow-inner" />
             </div>
          </div>
        </section>

        <!-- Description Section -->
        <section class="space-y-6">
          <h3 class="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-4 border-b border-white/5 pb-2">{$_('agents.detail.profile.description', {default: "Core Description"})}</h3>
          <textarea bind:value={description} class="w-full h-32 p-5 rounded-2xl bg-[#030014]/80 border border-white/10 text-white font-mono text-sm focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple outline-none transition-all resize-none shadow-inner"></textarea>
        </section>

        <!-- Prompt Mode Section -->
        <section class="space-y-6">
          <div class="space-y-1.5 mb-4">
             <label class="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">{$_('agents.detail.prompt.title', {default: "Prompt Construct Mode"})}</label>
          </div>
          <PromptModeCards
            value={promptMode}
            onChange={(m) => promptMode = m}
            compact={true}
          />
        </section>

        {#if submitError}
          <div class="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono flex gap-3 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)]">
             <ShieldAlert class="h-5 w-5 shrink-0" />
             {submitError}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="relative z-10 p-6 border-t border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-end gap-4">
        <button onclick={() => onOpenChange(false)} disabled={loading} class="px-6 py-3 rounded-2xl border border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 hover:bg-white/5 hover:text-white transition-all disabled:opacity-10 bg-[#030014]/50 shadow-inner">
            {$_('agents.create.cancel', {default: "Cancel"})}
        </button>
        <button onclick={handleSubmit} disabled={!canCreate || loading} class="relative overflow-hidden group px-8 py-3 rounded-2xl bg-goclaw-neon-purple hover:bg-goclaw-neon-purple/80 text-white transition-all duration-500 disabled:opacity-30 disabled:shadow-none hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] shadow-[0_0_30px_rgba(139,92,246,0.4)]">
          <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite] opacity-50"></div>
          <span class="relative z-10 font-black uppercase tracking-[0.2em] text-[11px] drop-shadow-md">
            {#if loading}
              ...
            {:else}
              {$_('agents.create.create', {default: "Deploy"})}
            {/if}
          </span>
        </button>
      </div>

    </div>
  </div>
{/if}
