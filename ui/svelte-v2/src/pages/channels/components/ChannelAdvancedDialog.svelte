<script lang="ts">
  import { X, Save, Settings, Loader2, Globe, Activity, MessageSquare, Zap, ShieldCheck } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import type { ChannelInstanceData } from "$lib/types/channel";
  import { configSchema } from "../channel-schemas";
  import ChannelFields from "./ChannelFields.svelte";

  type Props = {
    open: boolean;
    onClose: () => void;
    instance: ChannelInstanceData;
    onSave: (config: Record<string, any>) => Promise<void>;
  };

  let { open, onClose, instance, onSave }: Props = $props();

  const ESSENTIAL_CONFIG_KEYS = new Set(["dm_policy", "group_policy", "require_mention", "mention_mode", "owner_jid", "owner_user_id", "authority_code"]);
  const NETWORK_KEYS = new Set(["api_server", "proxy", "domain", "connection_mode", "webhook_port", "webhook_path", "webhook_url"]);
  const LIMITS_KEYS = new Set(["history_limit", "media_max_mb", "text_chunk_limit"]);
  const STREAMING_KEYS = new Set(["dm_stream", "group_stream", "draft_transport", "reasoning_stream", "native_stream", "debounce_delay", "thread_ttl"]);
  const BEHAVIOR_KEYS = new Set(["reaction_level", "link_preview", "block_reply", "render_mode", "topic_session_mode"]);
  const ACCESS_KEYS = new Set(["allow_from", "group_allow_from", "verification_code"]);

  let values = $state<Record<string, any>>({});
  let saving = $state(false);

  $effect(() => {
    if (open && instance) {
      const config = (instance.config ?? {}) as Record<string, any>;
      // Only keep advanced keys (exclude essential + groups)
      values = Object.fromEntries(
        Object.entries(config).filter(([k]) => !ESSENTIAL_CONFIG_KEYS.has(k) && k !== "groups")
      );
    }
  });

  function getGroups(channelType: string) {
    const allFields = configSchema[channelType] ?? [];
    const advanced = allFields.filter((f) => !ESSENTIAL_CONFIG_KEYS.has(f.key));
    return {
      network: advanced.filter((f) => NETWORK_KEYS.has(f.key)),
      limits: advanced.filter((f) => LIMITS_KEYS.has(f.key)),
      streaming: advanced.filter((f) => STREAMING_KEYS.has(f.key)),
      behavior: advanced.filter((f) => BEHAVIOR_KEYS.has(f.key)),
      access: advanced.filter((f) => ACCESS_KEYS.has(f.key)),
    };
  }

  let groups = $derived(getGroups(instance.channel_type));
  let hasAnyGroup = $derived(Object.values(groups).some((g) => g.length > 0));

  async function handleSave() {
    saving = true;
    try {
      const existingConfig = (instance.config ?? {}) as Record<string, any>;
      const merged: Record<string, any> = { ...existingConfig };
      
      // Update all changed values
      Object.assign(merged, values);
      
      // Clean undefined/empty
      const cleanConfig = Object.fromEntries(
        Object.entries(merged).filter(([, v]) => v !== undefined && v !== null && v !== "")
      );
      
      await onSave(cleanConfig);
      onClose();
    } catch (e) {
      console.error("Failed to save advanced config", e);
    } finally {
      saving = false;
    }
  }

  function handleChange(key: string, val: any) {
    values[key] = val;
  }
</script>

{#if open}
  <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
    <button 
      onclick={onClose}
      class="absolute inset-0 bg-[#030014]/90 backdrop-blur-2xl transition-all duration-500 pointer-events-auto"
      aria-label="Close dialog"
    ></button>

    <div class="relative w-full max-w-3xl bg-[#030014]/95 border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
      <!-- Glow Effects -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <!-- Header -->
      <div class="relative px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Settings class="w-6 h-6 text-goclaw-neon-purple" />
          </div>
          <div>
            <h2 class="text-xl font-bold tracking-tight text-white uppercase tracking-tighter">Advanced Engine Settings</h2>
            <p class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Deep tuning for communication protocols</p>
          </div>
        </div>
        <button 
          onclick={onClose}
          class="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="px-8 py-8 space-y-10 overflow-y-auto custom-scrollbar flex-1">
        {#if !hasAnyGroup}
          <div class="py-12 text-center">
             <p class="text-xs text-white/20 uppercase tracking-widest">No advanced settings available for this channel type.</p>
          </div>
        {/if}

        {#if groups.network.length > 0}
          <div class="space-y-6">
            <div class="flex items-center gap-3">
               <Globe class="w-4 h-4 text-sky-400" />
               <h4 class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Network & Connectivity</h4>
            </div>
            <div class="pl-7">
              <ChannelFields
                fields={groups.network}
                values={values}
                onChange={handleChange}
                idPrefix="adv-net"
                contextValues={values}
              />
            </div>
          </div>
        {/if}

        {#if groups.limits.length > 0}
          <div class="space-y-6">
            <div class="flex items-center gap-3">
               <Activity class="w-4 h-4 text-emerald-400" />
               <h4 class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Resource Limits</h4>
            </div>
            <div class="pl-7">
              <ChannelFields
                fields={groups.limits}
                values={values}
                onChange={handleChange}
                idPrefix="adv-lim"
              />
            </div>
          </div>
        {/if}

        {#if groups.streaming.length > 0}
          <div class="space-y-6">
            <div class="flex items-center gap-3">
               <Zap class="w-4 h-4 text-amber-400" />
               <h4 class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Streaming & Feedback</h4>
            </div>
            <div class="pl-7">
              <ChannelFields
                fields={groups.streaming}
                values={values}
                onChange={handleChange}
                idPrefix="adv-str"
              />
            </div>
          </div>
        {/if}

        {#if groups.behavior.length > 0}
          <div class="space-y-6">
            <div class="flex items-center gap-3">
               <MessageSquare class="w-4 h-4 text-purple-400" />
               <h4 class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Interaction Behavior</h4>
            </div>
            <div class="pl-7">
              <ChannelFields
                fields={groups.behavior}
                values={values}
                onChange={handleChange}
                idPrefix="adv-beh"
              />
            </div>
          </div>
        {/if}

        {#if groups.access.length > 0}
          <div class="space-y-6 pb-4">
            <div class="flex items-center gap-3">
               <ShieldCheck class="w-4 h-4 text-red-400" />
               <h4 class="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Access Control</h4>
            </div>
            <div class="pl-7">
              <ChannelFields
                fields={groups.access}
                values={values}
                onChange={handleChange}
                idPrefix="adv-acc"
              />
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-end gap-4 shrink-0">
        <button 
          onclick={onClose}
          disabled={saving}
          class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all disabled:opacity-30"
        >
          Cancel
        </button>
        <button 
          onclick={handleSave}
          disabled={saving}
          class="relative flex items-center gap-2 px-10 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl overflow-hidden group shadow-[0_0_30px_rgba(217,70,239,0.3)] disabled:opacity-50"
        >
          <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/60 to-goclaw-neon-purple/20 border border-goclaw-neon-purple/50 rounded-xl transition-all group-hover:scale-105"></div>
          {#if saving}
            <Loader2 class="w-3.5 h-3.5 relative z-10 animate-spin text-white" />
          {:else}
            <Save class="w-3.5 h-3.5 relative z-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          {/if}
          <span class="relative z-10 text-white drop-shadow-md">Apply Configuration</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(217, 70, 239, 0.2);
  }
</style>
