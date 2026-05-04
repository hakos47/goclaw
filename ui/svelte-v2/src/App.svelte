<script lang="ts">
  import "$lib/i18n";
  import { waitLocale, locale } from "svelte-i18n";
  import DynamicBackground from "./lib/components/DynamicBackground.svelte";
  import Sidebar from "./lib/components/Sidebar.svelte";
  import Topbar from "./lib/components/Topbar.svelte";
  import SystemSettingsModal from "./lib/components/layout/SystemSettingsModal.svelte";
  import Overview from "./pages/Overview.svelte";
  import Login from "./pages/Login.svelte";
  import Setup from "./pages/Setup.svelte";
  import Sessions from "./pages/Sessions.svelte";
  import Chat from "./pages/Chat.svelte";
  import Teams from "./pages/Teams.svelte";
  import Tenants from "./pages/tenants/Tenants.svelte";
  import TenantDetail from "./pages/tenants/TenantDetail.svelte";
  import CliCredentials from "./pages/cli-credentials/CliCredentials.svelte";
  import ApiKeys from "./pages/api-keys/ApiKeys.svelte";
  import Agents from "./pages/Agents.svelte";
  import PendingMessages from "./pages/pending-messages/PendingMessages.svelte";
  import Channels from "./pages/Channels.svelte";
  import Contacts from "./pages/contacts/Contacts.svelte";
  import ImportExport from "./pages/import-export/ImportExport.svelte";
  import Hooks from "./pages/hooks/Hooks.svelte";
  import Providers from "./pages/providers/Providers.svelte";
  import Packages from "./pages/packages/Packages.svelte";
  import Nodes from "./pages/nodes/Nodes.svelte";
  import Config from "./pages/config/Config.svelte";
  import Approvals from "./pages/approvals/Approvals.svelte";
  import BackupRestore from "./pages/backup-restore/BackupRestore.svelte";
  import Skills from "./pages/skills/Skills.svelte";
  import BuiltinTools from "./pages/builtin-tools/BuiltinTools.svelte";
  import MCP from "./pages/mcp/MCP.svelte";
  import TTS from "./pages/tts/TTS.svelte";
  import Cron from "./pages/cron/Cron.svelte";
  import Memory from "./pages/memory/Memory.svelte";
  import Vault from "./pages/vault/Vault.svelte";
  import KnowledgeGraph from "./pages/knowledge-graph/KnowledgeGraph.svelte";
  import Traces from "./pages/traces/Traces.svelte";
  import StoragePage from "./pages/storage/Storage.svelte";
  import Events from "./pages/events/Events.svelte";
  import ActivityPage from "./pages/activity/Activity.svelte";
  import Logs from "./pages/logs/Logs.svelte";
  import Styleguide from "./pages/Styleguide.svelte";
  import Toaster from "$lib/components/ui/toast/Toaster.svelte";
  import DisconnectedOverlay from "./lib/components/shared/DisconnectedOverlay.svelte";
  
  import { onMount } from "svelte";
  import { authState, initAuth } from "./lib/state/auth.svelte";
  import { wsState, useWs } from "./lib/state/ws.svelte";
  import { handleAgentEvent } from "./lib/state/chat.svelte";
  import { teamEventStore } from "./lib/state/team-event-store.svelte";
  import { logsStore } from "./lib/state/logs.svelte";
  import { TEAM_RELATED_EVENTS } from "./lib/api/protocol";

  let i18nReady = $state(false);
  let showSettings = $state(false);

  // Re-subscribe to logs tail if reconnected
  let prevConnected = $state(false);
  $effect(() => {
    if (wsState.connected && !prevConnected && logsStore.tailing) {
      logsStore.startTail(logsStore.level);
    }
    prevConnected = wsState.connected;
  });

  onMount(async () => {
    try {
      await waitLocale();
    } catch (e) {
      console.error("i18n failed to initialize", e);
    }
    i18nReady = true;
    initAuth();

    // Wire up chat events
    const ws = useWs();
    ws.on("agent", (payload) => {
      handleAgentEvent(payload as any);
    });

    // Wire up terminal logs
    ws.on("log", (payload: any) => {
      logsStore.appendLog(payload);
    });

    // Wire up telemetry/team events for the /events dashboard
    teamEventStore.bind(ws);
    
    const handlePopState = () => {
      wsState.currentPath = window.location.pathname;
      wsState.currentSearch = window.location.search;
    };
    
    const handleClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a');
      if (a && a.href && a.host === window.location.host) {
        e.preventDefault();
        window.history.pushState({}, '', a.href);
        wsState.currentPath = window.location.pathname;
        wsState.currentSearch = window.location.search;
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleClick);

    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.remove();
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick);
    };
  });
</script>

<div class="relative h-screen w-full overflow-hidden flex font-sans selection:bg-goclaw-neon-purple/30 text-white">
  {#if i18nReady}
    <!-- Dynamic WebGL/Canvas Background -->
    <DynamicBackground />

    {#if !wsState.connected && wsState.currentPath !== '/login' && wsState.currentPath !== '/setup' && authState.token}
      <DisconnectedOverlay />
    {/if}

    {#if wsState.currentPath !== '/login' && wsState.currentPath !== '/setup' && wsState.connected}
      <!-- Refractive Glassmorphism Sidebar -->
      <Sidebar />
    {/if}

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col relative z-10 overflow-hidden">
      {#if wsState.currentPath === '/login'}
          <Login />
      {:else if wsState.currentPath === '/setup'}
          <Setup />
      {:else}
          <Topbar onOpenSettings={() => showSettings = true} />
          <main class="flex-1 flex flex-col overflow-hidden relative pt-[90px]">
              {#if wsState.currentPath === '/overview' || wsState.currentPath === '/'}
                <Overview />
              {:else if wsState.currentPath.startsWith('/sessions')}
                <Sessions />
              {:else if wsState.currentPath.startsWith('/chat')}
                <Chat />
              {:else if wsState.currentPath.startsWith('/teams')}
                <Teams />
              {:else if wsState.currentPath.startsWith('/tenants')}
                {#if wsState.currentPath.match(/^\/tenants\/([^/]+)$/)}
                  <TenantDetail tenantId={wsState.currentPath.split('/')[2]} />
                {:else}
                  <Tenants />
                {/if}
              {:else if wsState.currentPath.startsWith('/cli-credentials')}
                <CliCredentials />
              {:else if wsState.currentPath.startsWith('/api-keys')}
                <ApiKeys />
              {:else if wsState.currentPath.startsWith('/agents')}
                <Agents path={wsState.currentPath} />
              {:else if wsState.currentPath.startsWith('/channels')}
                <Channels />
              {:else if wsState.currentPath === '/pending-messages'}
                <PendingMessages />
              {:else if wsState.currentPath.startsWith('/contacts')}
                <Contacts />
              {:else if wsState.currentPath.startsWith('/import-export')}
                <ImportExport />
              {:else if wsState.currentPath.startsWith('/api-keys')}
                <ApiKeys />
              {:else if wsState.currentPath.startsWith('/hooks')}
                <Hooks />
              {:else if wsState.currentPath.startsWith('/providers')}
                <Providers />
              {:else if wsState.currentPath.startsWith('/packages')}
                <Packages />
              {:else if wsState.currentPath.startsWith('/config')}
                <Config />
              {:else if wsState.currentPath.startsWith('/approvals')}
                <Approvals />
              {:else if wsState.currentPath.startsWith('/backup-restore')}
                <BackupRestore />
              {:else if wsState.currentPath.startsWith('/nodes')}
                <Nodes />
              {:else if wsState.currentPath.startsWith('/skills')}
                <Skills />
              {:else if wsState.currentPath.startsWith('/builtin-tools')}
                <BuiltinTools />
              {:else if wsState.currentPath.startsWith('/mcp')}
                <MCP />
              {:else if wsState.currentPath.startsWith('/tts')}
                <TTS />
              {:else if wsState.currentPath.startsWith('/cron')}
                <Cron />
              {:else if wsState.currentPath.startsWith('/memory')}
                <Memory />
              {:else if wsState.currentPath.startsWith('/vault')}
                <Vault />
              {:else if wsState.currentPath.startsWith('/knowledge-graph')}
                <KnowledgeGraph />
              {:else if wsState.currentPath.startsWith('/storage')}
                <StoragePage />
              {:else if wsState.currentPath.startsWith('/traces')}
                <Traces />
              {:else if wsState.currentPath.startsWith('/events')}
                <Events />
              {:else if wsState.currentPath.startsWith('/activity')}
                <ActivityPage />
              {:else if wsState.currentPath.startsWith('/logs')}
                <Logs />
              {:else if wsState.currentPath === '/styleguide'}
                <Styleguide />
              {:else}
                <Overview />
              {/if}
          </main>
      {/if}
    </div>

    <!-- Modals -->
    <SystemSettingsModal open={showSettings} onClose={() => showSettings = false} />
    <Toaster />

  {:else}
    <!-- Basic loader while i18n initializes -->
    <div class="absolute inset-0 bg-[#050505] flex items-center justify-center">
        <div class="h-10 w-10 border-2 border-goclaw-neon-purple border-t-transparent rounded-full animate-spin"></div>
    </div>
  {/if}
</div>