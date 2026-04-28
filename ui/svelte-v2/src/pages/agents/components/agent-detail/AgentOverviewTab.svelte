<script lang="ts">
  import { _ } from "svelte-i18n";
  import type { AgentData, MemoryConfig, SubagentsConfig, ToolPolicyConfig } from "../../../../lib/types/agent";
  import { Save, AlertCircle } from "lucide-svelte";
  
  // Importers for sections
  import PromptSettingsSection from "./overview-sections/PromptSettingsSection.svelte";
  import PersonalitySection from "./overview-sections/PersonalitySection.svelte";
  import ModelBudgetSection from "./overview-sections/ModelBudgetSection.svelte";
  import MemorySection from "./overview-sections/MemorySection.svelte";
  import CapabilitiesSection from "./overview-sections/CapabilitiesSection.svelte";
  import EvolutionTogglesSection from "./overview-sections/EvolutionTogglesSection.svelte";
  import SkillsSection from "./overview-sections/SkillsSection.svelte";
  import PinnedSkillsSection from "./overview-sections/PinnedSkillsSection.svelte";
  import HooksSummaryCard from "./overview-sections/HooksSummaryCard.svelte";
  import { readPromptMode } from "../../utils/agent-display";
  import type { PromptMode } from "../PromptModeCards.svelte";
  import { useV3Flags } from "../../hooks/use-v3-flags.svelte";

  type Props = {
    agent: AgentData;
    onUpdate: (data: Partial<AgentData>) => Promise<void>;
    onViewHooks: () => void;
    onAddHook: () => void;
  };

  let { agent, onUpdate, onViewHooks, onAddHook }: Props = $props();

  let loading = $state(false);
  let showSuccess = $state(false);
  
  // -- Personality --
  let emoji = $state(agent.emoji || "");
  let displayName = $state(agent.display_name || "");
  let frontmatter = $state(agent.frontmatter || "");
  let status = $state(agent.status || "active");
  let isDefault = $state(agent.is_default || false);
  
  // -- Architecture & TTS --
  let promptMode = $state<PromptMode>(readPromptMode(agent) as PromptMode);
  let otherConfig = agent.other_config || {};
  let ttsProvider = $state(typeof otherConfig.tts_provider === 'string' ? otherConfig.tts_provider : "");
  let ttsVoiceId = $state(typeof otherConfig.tts_voice_id === 'string' ? otherConfig.tts_voice_id : "");
  let ttsModelId = $state(typeof otherConfig.tts_model_id === 'string' ? otherConfig.tts_model_id : "");
  let hasTtsOverride = $state(!!(ttsProvider || ttsVoiceId || ttsModelId));
  
  // -- Model & Budget --
  let provider = $state(agent.provider || "");
  let model = $state(agent.model || "");
  let contextWindow = $state(agent.context_window || 200000);
  let maxToolIterations = $state(agent.max_tool_iterations || 20);
  let budgetDollars = $state(agent.budget_monthly_cents ? String(agent.budget_monthly_cents / 100) : "");

  // -- Evolution --
  let selfEvolve = $state(!!agent.self_evolve);
  let skillEvolve = $state(!!agent.skill_evolve);
  let skillNudgeInterval = $state(typeof agent.skill_nudge_interval === 'number' ? agent.skill_nudge_interval : 15);

  // -- Memory --
  let mem = $state<MemoryConfig>(agent.memory_config ?? {});

  // -- Capabilities --
  let subEnabled = $state(agent.subagents_config != null);
  let sub = $state<SubagentsConfig>(agent.subagents_config ?? {});
  let toolsEnabled = $state(agent.tools_config != null);
  let tools = $state<ToolPolicyConfig>(agent.tools_config ?? {});

  // -- V3 Flags --
  let flagsManager = useV3Flags(agent.id);

  $effect(() => {
    // Basic re-sync if the underlying agent prop changes fundamentally 
    // (though in Svelte 5 we often rely on initial values if we trust the mutations)
  });

  async function handleSave() {
    loading = true;
    showSuccess = false;
    try {
      const budgetCents = budgetDollars ? Math.round(parseFloat(budgetDollars) * 100) : null;
      
      const updates: Partial<AgentData> = {
        emoji: emoji.trim(),
        display_name: displayName,
        frontmatter: frontmatter || undefined,
        status,
        is_default: isDefault,
        
        provider,
        model,
        context_window: contextWindow,
        max_tool_iterations: maxToolIterations,
        budget_monthly_cents: budgetCents,
        
        self_evolve: selfEvolve,
        skill_evolve: skillEvolve,
        skill_nudge_interval: skillEvolve ? skillNudgeInterval : 15,
        
        memory_config: mem,
        subagents_config: subEnabled ? sub : null,
        tools_config: toolsEnabled ? { 
          profile: tools.profile, 
          allow: tools.allow, 
          deny: tools.deny, 
          alsoAllow: tools.alsoAllow, 
          byProvider: tools.byProvider 
        } : null,
        other_config: {
          ...(agent.other_config || {}),
          prompt_mode: promptMode,
          ...(hasTtsOverride && ttsProvider ? { tts_provider: ttsProvider } : { tts_provider: undefined }),
          ...(hasTtsOverride && ttsVoiceId ? { tts_voice_id: ttsVoiceId } : { tts_voice_id: undefined }),
          ...(hasTtsOverride && ttsModelId ? { tts_model_id: ttsModelId } : { tts_model_id: undefined })
        }
      };
      
      // Clean undefined keys
      if (updates.other_config) {
         if (updates.other_config.tts_provider === undefined) delete updates.other_config.tts_provider;
         if (updates.other_config.tts_voice_id === undefined) delete updates.other_config.tts_voice_id;
         if (updates.other_config.tts_model_id === undefined) delete updates.other_config.tts_model_id;
      }

      await onUpdate(updates);
      
      showSuccess = true;
      setTimeout(() => showSuccess = false, 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to update config");
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-6 pb-24 w-full">
  <PromptSettingsSection
    promptMode={promptMode}
    ttsProvider={ttsProvider}
    ttsVoiceId={ttsVoiceId}
    ttsModelId={ttsModelId}
    hasTtsOverride={hasTtsOverride}
    onPromptModeChange={v => promptMode = v}
    onTtsProviderChange={v => ttsProvider = v}
    onTtsVoiceIdChange={v => ttsVoiceId = v}
    onTtsModelIdChange={v => ttsModelId = v}
    onHasTtsOverrideChange={v => hasTtsOverride = v}
  />

  <PersonalitySection 
    agentKey={agent.agent_key}
    emoji={emoji}
    displayName={displayName}
    frontmatter={frontmatter}
    status={status}
    isDefault={isDefault}
    onEmojiChange={v => emoji = v}
    onDisplayNameChange={v => displayName = v}
    onFrontmatterChange={v => frontmatter = v}
    onStatusChange={v => status = v}
    onIsDefaultChange={v => isDefault = v}
  />

  <ModelBudgetSection
    provider={provider}
    model={model}
    contextWindow={contextWindow}
    maxToolIterations={maxToolIterations}
    budgetDollars={budgetDollars}
    onProviderChange={v => provider = v}
    onModelChange={v => model = v}
    onContextWindowChange={v => contextWindow = v}
    onMaxToolIterationsChange={v => maxToolIterations = v}
    onBudgetDollarsChange={v => budgetDollars = v}
  />

  {#if agent.agent_type === "predefined"}
    <EvolutionTogglesSection
      selfEvolve={selfEvolve}
      skillEvolve={skillEvolve}
      skillNudgeInterval={skillNudgeInterval}
      flags={flagsManager.flags}
      onSelfEvolveChange={v => selfEvolve = v}
      onSkillEvolveChange={v => skillEvolve = v}
      onSkillNudgeIntervalChange={v => skillNudgeInterval = v}
      onToggleFlag={(key, value) => flagsManager.toggleFlag(key, value)}
    />
  {/if}

  <MemorySection
    value={mem}
    onChange={v => mem = v}
  />

  <CapabilitiesSection
    subEnabled={subEnabled}
    sub={sub}
    toolsEnabled={toolsEnabled}
    tools={tools}
    onSubToggle={v => subEnabled = v}
    onSubChange={v => sub = v}
    onToolsToggle={v => toolsEnabled = v}
    onToolsChange={v => tools = v}
  />

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="space-y-6">
      <SkillsSection agentId={agent.id} />
      <PinnedSkillsSection agent={agent} onUpdate={onUpdate} />
    </div>
    <HooksSummaryCard 
      agentId={agent.id}
      onViewAll={onViewHooks}
      onAddHook={onAddHook}
    />
  </div>
</div>

<!-- Save Action Bar -->
<div class="fixed bottom-0 left-[264px] right-0 p-4 border-t border-white/10 bg-black/80 backdrop-blur-xl flex items-center justify-between z-40">
  <div class="flex items-center gap-3 px-2">
    {#if showSuccess}
       <span class="flex items-center gap-2 text-xs font-bold text-emerald-400">
           <AlertCircle class="h-4 w-4" /> Operations parameters synced successfully.
       </span>
    {/if}
  </div>
  <button 
    onclick={handleSave} 
    disabled={loading} 
    class="h-10 px-6 flex items-center gap-2 rounded-xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-white/80 transition-all disabled:opacity-50"
  >
    {#if loading}
      Synchronizing...
    {:else}
      <Save class="h-4 w-4" /> Save Configuration
    {/if}
  </button>
</div>
