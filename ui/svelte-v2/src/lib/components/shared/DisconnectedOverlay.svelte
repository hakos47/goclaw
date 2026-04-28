<script lang="ts">
  import { WifiOff, Loader2 } from "lucide-svelte";
  import { _ } from "svelte-i18n";
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/80 backdrop-blur-xl animate-in fade-in duration-500">
  <div class="glass-panel p-10 flex flex-col items-center text-center max-w-sm border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
    <div class="mb-6 rounded-2xl bg-white/5 p-4 border border-white/10 shadow-inner">
      <WifiOff class="h-12 w-12 text-white/40" />
    </div>
    
    <h2 class="text-xl font-bold tracking-tight text-white mb-2">
      {$_('common.serverUnreachable', { default: "Server Unreachable" })}
    </h2>
    
    <p class="text-sm text-white/40 mb-8 leading-relaxed">
      {$_('common.serverUnreachableDesc', { default: "Cannot connect to the gateway server. Please check that the server is running." })}
    </p>
    
    <div class="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
      <Loader2 class="h-3 w-3 animate-spin text-goclaw-neon-purple" />
      <span>{$_('common.reconnecting', { default: "Reconnecting..." })}</span>
    </div>
  </div>
</div>