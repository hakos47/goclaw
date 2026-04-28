<script lang="ts">
  import { globalState, toggleSidebar } from "../state/global.svelte";
  import { 
    LayoutDashboard, MessageSquare, Bot, History, Zap, Clock, Activity, Radio, Radar, 
    Terminal, Settings, ShieldCheck, Users, Link, Package, Blocks, Plug, Volume2, Cpu, 
    ClipboardList, HardDrive, Inbox, Brain, Network, Contact, KeyRound, Building2, 
    ArrowLeftRight, FileArchive, DatabaseBackup, Webhook, Target, LifeBuoy, Briefcase, 
    TrendingUp, LogOut, Hexagon, User 
  } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { authState } from "../state/auth.svelte";
  import { wsState, useWsCall } from "../state/ws.svelte";

  let navGroups = $derived([
    {
      title: $_('sidebar.groups.core', { default: "Core Infrastructure" }),
      items: [
        { to: "/overview", icon: LayoutDashboard, label: $_('sidebar.nav.overview', { default: "Overview" }), color: "group-hover:text-goclaw-neon-cyan group-hover:neon-text-cyan" },
        { to: "/chat", icon: MessageSquare, label: $_('sidebar.nav.chat', { default: "Chat" }), color: "group-hover:text-goclaw-neon-purple group-hover:neon-text-purple" },
        { to: "/agents", icon: Bot, label: $_('sidebar.nav.agents', { default: "Agents" }), color: "group-hover:text-goclaw-neon-magenta group-hover:neon-text-magenta" },
        { to: "/teams", icon: Users, label: $_('sidebar.nav.agentTeams', { default: "Agent Teams" }), color: "group-hover:text-amber-400" },
        { to: "/tenants", icon: Building2, label: $_('sidebar.nav.tenants', { default: "Tenants" }), color: "group-hover:text-blue-500" },
      ]
    },
    {
      title: $_('sidebar.groups.conversations', { default: "Conversations" }),
      items: [
        { to: "/sessions", icon: History, label: $_('sidebar.nav.sessions', { default: "Log Sessions" }), color: "group-hover:text-white" },
        // ... dynamically render sessionCategories underneath if open
        { to: "/pending-messages", icon: Inbox, label: $_('sidebar.nav.pendingMessages', { default: "Pending Messages" }), color: "group-hover:text-emerald-400" },
        { to: "/contacts", icon: Contact, label: $_('sidebar.nav.contacts', { default: "Contacts" }), color: "group-hover:text-blue-400" },
      ]
    },
    {
      title: $_('sidebar.groups.connectivity', { default: "Connectivity" }),
      items: [
        { to: "/channels", icon: Radio, label: $_('sidebar.nav.channels', { default: "Channels" }), color: "group-hover:text-teal-400" },
        { to: "/nodes", icon: Link, label: $_('sidebar.nav.nodes', { default: "Network Nodes" }), color: "group-hover:text-indigo-400" }
      ]
    },
    {
      title: $_('sidebar.groups.capabilities', { default: "Capabilities" }),
      items: [
        { to: "/skills", icon: Zap, label: $_('sidebar.nav.skills', { default: "Skills" }), color: "group-hover:text-yellow-400" },
        { to: "/builtin-tools", icon: Package, label: $_('sidebar.nav.builtinTools', { default: "Builtin Tools" }), color: "group-hover:text-orange-400" },
        { to: "/mcp", icon: Plug, label: $_('sidebar.nav.mcpServers', { default: "MCP Servers" }), color: "group-hover:text-pink-400" },
        { to: "/tts", icon: Volume2, label: $_('sidebar.nav.tts', { default: "TTS Engine" }), color: "group-hover:text-cyan-400" },
        { to: "/cron", icon: Clock, label: $_('sidebar.nav.cron', { default: "Cron Jobs" }), color: "group-hover:text-lime-400" },
        { to: "/hooks", icon: Webhook, label: $_('sidebar.nav.hooks', { default: "Webhooks" }), color: "group-hover:text-rose-400" },
      ]
    },
    {
      title: $_('sidebar.groups.data', { default: "Data Streams" }),
      items: [
        { to: "/memory", icon: Brain, label: $_('sidebar.nav.memory', { default: "Memory Cores" }), color: "group-hover:text-purple-400" },
        { to: "/vault", icon: FileArchive, label: $_('sidebar.nav.vault', { default: "The Vault" }), color: "group-hover:text-amber-500" },
        { to: "/knowledge-graph", icon: Network, label: $_('sidebar.nav.knowledgeGraph', { default: "Knowledge Graph" }), color: "group-hover:text-cyan-500" },
        { to: "/storage", icon: HardDrive, label: $_('sidebar.nav.storage', { default: "Storage Volumes" }), color: "group-hover:text-slate-400" },
      ]
    },
    {
      title: $_('sidebar.groups.monitoring', { default: "Telemetry & Logs" }),
      items: [
        { to: "/traces", icon: Activity, label: $_('sidebar.nav.traces', { default: "Traces" }), color: "group-hover:text-red-500" },
        { to: "/events", icon: Radar, label: $_('sidebar.nav.realtimeEvents', { default: "Realtime Events" }), color: "group-hover:text-green-500" },
        { to: "/activity", icon: ClipboardList, label: $_('sidebar.nav.activity', { default: "Activity Logs" }), color: "group-hover:text-yellow-500" },
        { to: "/logs", icon: Terminal, label: $_('sidebar.nav.logs', { default: "Terminal Logs" }), color: "group-hover:text-emerald-500" },
      ]
    },
    {
      title: $_('sidebar.groups.system', { default: "System Management" }),
      items: [
        { to: "/tenants", icon: Building2, label: $_('sidebar.nav.tenants', { default: "Tenants" }), color: "group-hover:text-blue-500" },
        { to: "/providers", icon: Cpu, label: $_('sidebar.nav.providers', { default: "AI Providers" }), color: "group-hover:text-purple-500" },
        { to: "/cli-credentials", icon: KeyRound, label: $_('sidebar.nav.cliCredentials', { default: "CLI Credentials" }), color: "group-hover:text-amber-400" },
        { to: "/api-keys", icon: KeyRound, label: $_('sidebar.nav.apiKeys', { default: "API Keys" }), color: "group-hover:text-yellow-400" },
        { to: "/packages", icon: Blocks, label: $_('sidebar.nav.packages', { default: "Packages" }), color: "group-hover:text-indigo-500" },
        { to: "/config", icon: Settings, label: $_('sidebar.nav.config', { default: "Platform Config" }), color: "group-hover:text-slate-300" },
        { to: "/approvals", icon: ShieldCheck, label: $_('sidebar.nav.approvals', { default: "Approvals" }), color: "group-hover:text-emerald-400" },
        { to: "/import-export", icon: ArrowLeftRight, label: $_('sidebar.nav.importExport', { default: "Import / Export" }), color: "group-hover:text-cyan-400" },
        { to: "/backup-restore", icon: DatabaseBackup, label: $_('sidebar.nav.backupRestore', { default: "Backup & Restore" }), color: "group-hover:text-rose-500" },
      ]
    }
  ]);

  let isHovered = $state(false);

  // Flatten nav items for the grid
  let allNavItems = $derived(navGroups.flatMap(g => g.items));

  function getItemStyle(index: number, total: number, isHovered: boolean) {
    const innerCount = 10;
    const outerCount = total - innerCount;

    let isInner = index < innerCount;
    let count = isInner ? innerCount : outerCount;
    let i = isInner ? index : index - innerCount;
    let R = isInner ? 180 : 280;

    let startAngle = 175;
    let endAngle = 5;
    let angleSpan = startAngle - endAngle;
    
    let angleDeg = startAngle - (i / (count - 1)) * angleSpan;
    let angleRad = angleDeg * (Math.PI / 180);

    let currentR = isHovered ? R : 0;
    let X = currentR * Math.cos(angleRad);
    let Y = -currentR * Math.sin(angleRad);

    return `transform: translate(calc(-50% + ${X}px), calc(-50% + ${Y}px)) scale(${isHovered ? 1 : 0.3}); opacity: ${isHovered ? 1 : 0}; transition-delay: ${isHovered ? index * 10 : 0}ms;`;
  }

</script>

<!-- The Main Trigger Pill (Bottom Center) -->
<div 
  class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] group/nav flex flex-col items-center gap-1.5"
  onmouseenter={() => isHovered = true}
  onmouseleave={() => isHovered = false}
>
  
  <!-- Invisible Hover Bridge to prevent mouse-off collapsing -->
  {#if isHovered}
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-t-[350px] bg-transparent z-0"></div>
  {/if}

  <button class="relative flex items-center justify-center w-14 h-14 transition-all duration-500 z-50">
    <!-- Glow effect only visible when hovered -->
    <div class={`absolute inset-0 bg-goclaw-neon-purple/60 blur-[25px] animate-pulse-slow rounded-full transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
    
    <img 
      src="/goclaw-nix.png" 
      alt="GoClaw" 
      class={`w-10 h-10 relative z-10 transition-all duration-500 ${isHovered ? 'drop-shadow-[0_0_15px_rgba(217,70,239,1)] scale-110' : 'drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)] opacity-80'}`} 
    />
  </button>
  
  <span class={`text-[10px] font-bold tracking-[0.3em] uppercase text-white/50 transition-all duration-300 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isHovered ? 'opacity-0 scale-90 translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
    {$_('common.menu', { default: 'MENU' })}
  </span>

  <!-- The Radial Semicircle Menus -->
  <div class={`absolute top-1/2 left-1/2 w-0 h-0 transition-all duration-500 z-20 ${isHovered ? 'pointer-events-auto' : 'pointer-events-none'}`}>
    
    <!-- Very subtle background glow -->
    <div class={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-[500px] h-[250px] bg-goclaw-neon-purple/5 blur-[80px] transition-all duration-700 rounded-t-full pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>

    {#each allNavItems as item, index}
      {@const Icon = item.icon}
      {@const isActive = wsState.currentPath === item.to || wsState.currentPath.startsWith(item.to + '/')}
      
      <a 
        href={item.to} 
        style={getItemStyle(index, allNavItems.length, isHovered)}
        class="absolute top-0 left-0 flex items-center justify-center w-12 h-12 transition-all duration-300 group z-20"
      >
        <Icon size={24} class={`transition-all duration-300 ${isActive ? 'text-goclaw-neon-cyan drop-shadow-[0_0_15px_rgba(6,182,212,1)] scale-125' : `text-white/80 drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)] group-hover:scale-125 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] ${item.color || 'group-hover:text-white'}`}`} />
        
        <!-- Radial Hover Tooltip (Appears above the icon) -->
        <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
          <div class="px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.5)] whitespace-nowrap">
            <span class="text-[11px] font-bold tracking-widest uppercase text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{item.label}</span>
          </div>
        </div>
      </a>
    {/each}

  </div>
</div>

<!-- Floating Operator Badge -->
<div class="fixed bottom-6 left-6 z-[100]">
  <button class="relative flex items-center gap-3 px-2 py-2 rounded-full border border-white/5 bg-[#070514]/60 backdrop-blur-xl hover:bg-[#070514]/90 hover:border-white/10 transition-all duration-500 group overflow-hidden">
    <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-black border border-white/10 group-hover:border-goclaw-neon-purple/50 transition-colors shadow-inner">
      <User class="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
      <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#070514] shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
    </div>
    
    <!-- Revealing text on hover of the operator badge -->
    <div class="flex flex-col items-start overflow-hidden w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 group-hover:pr-4 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
      <span class="text-[12px] font-bold text-white whitespace-nowrap">operator_123</span>
      <span class="text-[9px] text-goclaw-neon-purple font-mono tracking-widest uppercase whitespace-nowrap">AUTH: ROOT</span>
    </div>

    <!-- Terminate Session Button (Appears inside the expanding pill) -->
    <div class="w-0 opacity-0 overflow-hidden group-hover:w-10 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
      <div class="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all" title="Terminate Session">
        <LogOut size={16} strokeWidth={2.5} />
      </div>
    </div>
  </button>
</div>
