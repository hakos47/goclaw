<script lang="ts">
  import { Settings, Play, Shield, Globe, User, Terminal, Server, Sparkles, Webhook } from "lucide-svelte";
  import type { HookConfig } from "../../../../../../web/src/hooks/use-hooks";

  type Props = {
    hook: HookConfig;
    onClick: () => void;
    onToggle: (enabled: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
    onTest: () => void;
  };

  let { hook, onClick, onToggle, onEdit, onDelete, onTest }: Props = $props();

  function scopeIcon(scope: string) {
    if (scope === "global") return Globe;
    if (scope === "tenant") return Shield;
    if (scope === "agent") return User;
    return Settings;
  }

  function handlerIcon(type: string) {
    if (type === "http") return Server;
    if (type === "script") return Terminal;
    if (type === "prompt") return Sparkles;
    return Settings;
  }

  function formatRelativeTime(iso: string | null): string {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return "Just now";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const ScopeIcon = $derived(scopeIcon(hook.scope));
  const HandlerIcon = $derived(handlerIcon(hook.handler_type));
</script>

<div class="group relative bg-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] hover:bg-white/[0.02] hover:border-white/10 transition-all overflow-hidden cursor-pointer" onclick={onClick}>
  
  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent -translate-x-full group-hover:translate-x-full duration-[1.5s] ease-in-out pointer-events-none"></div>

  <!-- Left: Event & Name -->
  <div class="flex-1 min-w-0 flex items-start gap-4">
    <div class={`h-11 w-11 flex items-center justify-center rounded-xl shrink-0 border transition-colors ${
      hook.enabled ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-white/5 text-white/40 border-white/10'
    }`}>
      <Webhook class="h-5 w-5" />
    </div>
    <div class="min-w-0 flex flex-col justify-center">
      <h3 class={`text-sm font-bold truncate mb-1.5 ${hook.enabled ? 'text-white/90' : 'text-white/50'}`}>
        {hook.name || hook.event}
      </h3>
      <div class="flex items-center gap-2.5 flex-wrap mt-1">
        <!-- Event Badge -->
        <span class="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-purple-400 bg-black/60 px-2.5 py-1 rounded-md border border-purple-500/30 shadow-[inset_0_0_10px_rgba(168,85,247,0.15)] backdrop-blur-md">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)] animate-pulse"></span>
          {hook.event}
        </span>
        
        <!-- Handler Badge -->
        <span class="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)] backdrop-blur-md">
          <HandlerIcon class="h-3 w-3" />
          {hook.handler_type}
        </span>
        
        <!-- Scope Badge -->
        <span class="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/60 bg-white/5 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-md">
          <ScopeIcon class="h-3 w-3" />
          {hook.scope}
        </span>
        
        <!-- System Badge -->
        {#if hook.source === 'builtin'}
          <span class="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2),inset_0_0_10px_rgba(59,130,246,0.2)] backdrop-blur-md">
            <Shield class="h-3 w-3 text-blue-400" />
            System
          </span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Right: Actions & Toggle -->
  <div class="flex items-center gap-3 shrink-0" onclick={(e) => e.stopPropagation()}>
    <div class="flex items-center gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onclick={onTest}
        class="h-8 w-8 flex items-center justify-center rounded-lg border border-transparent text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
        title="Test Hook"
      >
        <Play class="h-3.5 w-3.5" />
      </button>
      <button 
        onclick={onEdit}
        class="h-8 px-3 flex items-center justify-center rounded-lg border border-transparent text-white/40 hover:text-white hover:bg-white/5 hover:border-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
      >
        Edit
      </button>
    </div>

    <!-- Toggle Switch -->
    <button 
      onclick={() => onToggle(!hook.enabled)}
      class={`relative w-12 h-6 rounded-full border transition-all duration-300 ease-in-out ${
        hook.enabled 
          ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
          : 'bg-black/50 border-white/20'
      }`}
    >
      <div class={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-transform duration-300 ease-in-out flex items-center justify-center ${
        hook.enabled ? 'translate-x-6 bg-emerald-400' : 'translate-x-0 bg-white/30'
      }`}></div>
    </button>
  </div>
</div>
