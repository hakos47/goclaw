<script lang="ts">
  import { Network, Link2, ChevronDown, CheckCircle2 } from "lucide-svelte";
  import type { ChatGPTOAuthRoutingConfig } from "../../../../../../web/src/types/agent";

  type Props = {
    providerName: string;
    managedByOwnerName: string | undefined;
    managedByProviderDisplayName: string | undefined;
    managedMemberCount: number;
    canEditPoolRouting: boolean;
    poolRouting: ChatGPTOAuthRoutingConfig;
    onPoolRoutingChange: (v: ChatGPTOAuthRoutingConfig) => void;
  };

  let {
    providerName,
    managedByOwnerName,
    managedByProviderDisplayName,
    managedMemberCount,
    canEditPoolRouting,
    poolRouting,
    onPoolRoutingChange
  }: Props = $props();

</script>

<section class="p-6 rounded-3xl bg-black/40 border border-white/5 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] relative overflow-hidden">
  <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
  
  <h3 class="text-xs font-black uppercase tracking-widest text-white/80 mb-6 flex items-center gap-2">
    <Network class="h-4 w-4 text-purple-400" /> OAuth Pool Topology
  </h3>

  <div class="space-y-6">
    <!-- Ownership Badge -->
    <div class="p-4 rounded-xl border bg-[#0a0a0a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-white/5">
       <div>
         <h4 class="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Node Status</h4>
         <div class="flex items-center gap-2">
           {#if managedByOwnerName}
             <div class="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
             <span class="text-sm font-bold text-white">Member Node</span>
           {:else if managedMemberCount > 0}
             <div class="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
             <span class="text-sm font-bold text-white">Primary Node</span>
             <span class="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded ml-2">
               {managedMemberCount} member{managedMemberCount === 1 ? '' : 's'}
             </span>
           {:else}
             <div class="h-2 w-2 rounded-full bg-white/30"></div>
             <span class="text-sm font-bold text-white/70">Standalone Node</span>
           {/if}
         </div>
       </div>

       {#if managedByOwnerName}
         <div class="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-mono text-blue-400">
           <Link2 class="h-3 w-3" /> Managed by: {managedByProviderDisplayName || managedByOwnerName}
         </div>
       {/if}
    </div>

    <!-- Routing Strategy -->
    {#if canEditPoolRouting}
      <div class="space-y-3 relative group/select">
        <label class="text-[10px] font-bold text-white/60 uppercase tracking-widest pl-1">Load Balancing Strategy</label>
        <div class="relative">
            <div class="absolute inset-0 border-2 border-transparent group-focus-within/select:border-purple-500/50 rounded-xl pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]"></div>
            <select 
              value={poolRouting.strategy}
              onchange={(e) => onPoolRoutingChange({ ...poolRouting, strategy: e.currentTarget.value as any })}
              disabled={managedMemberCount === 0}
              class="w-full h-11 px-4 pr-10 bg-[#0a0a0a] border border-white/5 rounded-xl text-purple-400 font-bold text-sm outline-none transition-colors appearance-none relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] cursor-pointer focus:bg-black/60 focus:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="primary_first" class="bg-black text-white">Primary First (Fallback to members)</option>
              <option value="round_robin" class="bg-black text-white">Round Robin (Distribute evenly)</option>
              <option value="least_used" class="bg-black text-white">Least Used (Avoid rate limits)</option>
            </select>
            <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none z-20 opacity-50">
              <ChevronDown class="h-4 w-4 text-white/30" />
            </div>
        </div>
        <p class="text-[10px] text-white/30 px-1">
          {#if managedMemberCount === 0}
            Link other accounts to this one to enable load balancing.
          {:else}
            How requests should be distributed across the pool.
          {/if}
        </p>
      </div>

      {#if managedMemberCount > 0}
        <div class="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <p class="text-[10px] uppercase tracking-widest text-purple-300 flex items-center gap-2 leading-relaxed">
             <CheckCircle2 class="h-4 w-4" /> Routing configured for {managedMemberCount + 1} total endpoints. 
             If the primary token hits rate limits, requests will automatically flow through linked members using the selected strategy.
          </p>
        </div>
      {/if}
    {/if}

  </div>
</section>
