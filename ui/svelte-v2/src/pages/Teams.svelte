<script lang="ts">
  import { onMount } from "svelte";
  import { teamsState, loadTeams, deleteTeam } from "../lib/state/teams.svelte";
  import { agentsState, loadAgents } from "../lib/state/agents.svelte";
  import { wsState } from "../lib/state/ws.svelte";
  import { Users, Link2, Plus, Search, LayoutGrid, List, Loader2, MoreVertical, Trash2, Settings, ExternalLink, ShieldCheck, Users2 } from "lucide-svelte";
  import { cn } from "../lib/utils";
  import { _ } from "svelte-i18n";
  import PageHeader from "../lib/components/shared/PageHeader.svelte";
  import TeamsListTab from "./teams/TeamsListTab.svelte";
  import TeamLinksTab from "./teams/TeamLinksTab.svelte";
  import TeamCreateDialog from "./teams/TeamCreateDialog.svelte";

  type TabId = "teams" | "links";

  let activeTab = $state<TabId>("teams");
  let detailId = $derived(wsState.currentPath.split('/teams/')[1] || "");
  let createOpen = $state(false);

  onMount(() => {
    if (wsState.connected) {
        loadTeams();
        loadAgents();
    }
  });

  $effect(() => {
    if (wsState.connected) {
        loadTeams();
        loadAgents();
    }
  });
</script>

<div class="h-full flex flex-col space-y-6">
  {#if detailId}
    <!-- Team Detail View (EPIC 5.1) -->
    <div class="flex-1 flex items-center justify-center opacity-20">
        <div class="text-center space-y-4">
            <ShieldCheck class="h-20 w-20 mx-auto stroke-1" />
            <p class="text-sm font-black uppercase tracking-[0.3em]">Team Detail Protocol Pending</p>
        </div>
    </div>
  {:else}
    <PageHeader 
        title={$_('teams.title', { default: 'Teams' })} 
        description={$_('teams.description', { default: 'Orchestrate multiple agents to solve complex tasks.' })}
    >
        {#snippet actions()}
            <button 
                onclick={() => createOpen = true}
                class="h-10 px-5 rounded-xl bg-goclaw-neon-purple text-white text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] flex items-center gap-2"
            >
                <Plus class="h-4 w-4" />
                {$_('teams.createTeam', { default: 'Deploy New Team' })}
            </button>
        {/snippet}
    </PageHeader>

    <!-- Tab Bar -->
    <div class="flex items-center gap-8 border-b border-white/5 px-2">
        <button 
            onclick={() => activeTab = 'teams'}
            class={cn(
                "pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative",
                activeTab === 'teams' ? "text-goclaw-neon-purple" : "text-white/20 hover:text-white/40"
            )}
        >
            <div class="flex items-center gap-2">
                <Users2 class="h-3.5 w-3.5" />
                {$_('teams.tabs.teams', { default: 'Active Units' })}
            </div>
            {#if activeTab === 'teams'}
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-goclaw-neon-purple shadow-[0_0_10px_#d946ef]"></div>
            {/if}
        </button>
        <button 
            onclick={() => activeTab = 'links'}
            class={cn(
                "pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative",
                activeTab === 'links' ? "text-goclaw-neon-cyan" : "text-white/20 hover:text-white/40"
            )}
        >
            <div class="flex items-center gap-2">
                <Link2 class="h-3.5 w-3.5" />
                {$_('teams.tabs.links', { default: 'Neural Links' })}
            </div>
            {#if activeTab === 'links'}
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-goclaw-neon-cyan shadow-[0_0_10px_#22d3ee]"></div>
            {/if}
        </button>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 min-h-0">
        {#if activeTab === 'teams'}
            <TeamsListTab />
        {:else}
            <TeamLinksTab />
        {/if}
    </div>
  {/if}
</div>

<TeamCreateDialog open={createOpen} onClose={() => createOpen = false} />
