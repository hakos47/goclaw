<script lang="ts">
  import { 
    Globe, Clock, Settings2, User, Check, Building2, 
    KeyRound, Info, LogOut, Target, LifeBuoy, Briefcase, TrendingUp, Menu
  } from "lucide-svelte";
  import { uiState, setTimezone, TIMEZONE_OPTIONS, toggleMobileMenu } from "../state/ui.svelte";
  import { wsState, useWsCall } from "../state/ws.svelte";
  import { authState, logout } from "../state/auth.svelte";
  import { locale, _ } from "svelte-i18n";
  import { onMount } from "svelte";

  type Props = {
    onOpenSettings: () => void;
  };

  let { onOpenSettings }: Props = $props();

  let isHovered = $state(false);
  let activeSubmenu = $state<string | null>(null);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "vi", name: "Tiếng Việt" },
    { code: "zh", name: "中文" }
  ];

  function setLanguage(code: string) {
    $locale = code;
    localStorage.setItem("goclaw:language", code);
    activeSubmenu = null;
  }

  function handleSetTimezone(tz: string) {
    setTimezone(tz);
    activeSubmenu = null;
  }

  function handleSwitchTenant(slug: string) {
    localStorage.setItem("goclaw:tenant_id", slug);
    if (!authState.isOwner) {
      localStorage.setItem("goclaw:tenant_hint", slug);
    }
    window.location.reload();
  }

  let currentLangName = $derived(languages.find(l => l.code === $locale)?.name || "English");
  let currentTzLabel = $derived(TIMEZONE_OPTIONS.find(t => t.value === uiState.timezone)?.label || "Auto");
  
  let tenantLabel = $derived(authState.tenantName || "");
  let isMultiTenant = $derived(authState.availableTenants.length > 1 || authState.isOwner);

  // --- Sessions Polling & Submenu Logic ---
  const summaryCall = useWsCall<{ categories: Record<string, number> }>("sessions.summary");
  
  $effect(() => {
    if (wsState.connected) {
      summaryCall.call({});
    }
  });

  $effect(() => {
    if (!wsState.connected) return;
    const interval = setInterval(() => summaryCall.call({}), 30_000);
    return () => clearInterval(interval);
  });

  let summary = $derived(summaryCall.data?.categories ?? {});

  let sessionCategories = $derived([
    { name: $_('sidebar.nav.sessionsInbound', { default: "Inbound Leads" }), count: summary.inbound ?? 0, type: "inbound", icon: Target, color: "text-goclaw-neon-cyan" },
    { name: $_('sidebar.nav.sessionsSupport', { default: "Active Support" }), count: summary.support ?? 0, type: "support", icon: LifeBuoy, color: "text-goclaw-neon-purple" },
    { name: $_('sidebar.nav.sessionsOps', { default: "Ops Operations" }), count: summary.ops ?? 0, type: "ops", icon: Briefcase, color: "text-orange-500" },
    { name: $_('sidebar.nav.sessionsEvolution', { default: "Agent Evolution" }), count: summary.evolution ?? 0, type: "evolution", icon: TrendingUp, color: "text-goclaw-neon-magenta" }
  ]);

  let topbarItems = $derived([
    { id: 'settings', icon: Settings2, label: $_('topbar.systemSettings', { default: 'System Settings' }), action: onOpenSettings, color: 'text-emerald-400' },
    { id: 'lang', icon: Globe, label: currentLangName, action: () => activeSubmenu = activeSubmenu === 'lang' ? null : 'lang', color: 'text-blue-400' },
    { id: 'tz', icon: Clock, label: currentTzLabel, action: () => activeSubmenu = activeSubmenu === 'tz' ? null : 'tz', color: 'text-amber-400' },
    ...(isMultiTenant ? [{ id: 'tenant', icon: Building2, label: tenantLabel || 'Tenants', action: () => activeSubmenu = activeSubmenu === 'tenant' ? null : 'tenant', color: 'text-goclaw-neon-cyan' }] : []),
    { id: 'apikeys', icon: KeyRound, label: 'API Keys', action: () => window.location.href = '/api-keys', color: 'text-goclaw-neon-purple' },
    { id: 'logout', icon: LogOut, label: 'Logout', action: logout, color: 'text-red-400' }
  ]);

  function getRadialStyle(index: number, total: number, isHovered: boolean) {
    let R = 140; // Spread radius
    let startAngle = 270; // Down
    let endAngle = 180; // Left
    let angleSpan = startAngle - endAngle;
    let angleDeg = startAngle - (index / Math.max(1, total - 1)) * angleSpan;
    let angleRad = angleDeg * (Math.PI / 180);

    let currentR = isHovered ? R : 0;
    let X = currentR * Math.cos(angleRad);
    let Y = -currentR * Math.sin(angleRad);

    return `transform: translate(calc(-50% + ${X}px), calc(-50% + ${Y}px)) scale(${isHovered ? 1 : 0.3}); opacity: ${isHovered ? 1 : 0}; transition-delay: ${isHovered ? index * 30 : 0}ms; pointer-events: ${isHovered ? 'auto' : 'none'};`;
  }

</script>

<!-- Contextual HUD / Breadcrumb (Floating Top Left) -->
<div class="fixed top-6 left-6 z-[60] flex items-center gap-4">
  <!-- Mobile Menu Toggle -->
  <button 
    onclick={toggleMobileMenu}
    class="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-black/60 backdrop-blur-xl border border-[#d946ef]/30 shadow-[0_0_15px_rgba(217,70,239,0.2)] text-white/80 hover:text-white transition-all active:scale-95"
  >
    <Menu size={20} class="text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
  </button>
  {#if wsState.currentPath.startsWith('/sessions')}
    <!-- Contextual Sessions HUD -->
    <div class="hidden sm:flex items-center gap-2 animate-in slide-in-from-left-4 fade-in duration-300">
      {#each sessionCategories as cat}
        {@const isActive = wsState.currentSearch?.includes(`category=${cat.type}`)}
        {@const SubIcon = cat.icon}
        <a 
          href={`/sessions?category=${cat.type}`}
          class={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-300 group overflow-hidden ${isActive ? 'bg-black/80 border-[#d946ef]/50 shadow-[0_0_15px_rgba(217,70,239,0.2)]' : 'bg-black/40 border-[#d946ef]/10 hover:bg-black/60 hover:border-[#d946ef]/30'}`}
        >
          {#if isActive}
            <div class={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] rounded-t-full shadow-[0_0_10px_currentColor] ${cat.color}`}></div>
            <div class={`absolute inset-0 opacity-10 blur-md ${cat.color} bg-current`}></div>
          {/if}

          <SubIcon size={14} class={`relative z-10 transition-colors ${isActive ? cat.color : 'text-white/40 group-hover:text-white/80'}`} />
          
          <span class={`relative z-10 text-[11px] font-bold tracking-wider uppercase transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/90'}`}>
            {cat.name}
          </span>
          
          <div class={`relative z-10 ml-1 px-1.5 py-0.5 rounded-md bg-black/60 border border-white/10 shadow-inner flex items-center justify-center min-w-[20px]`}>
            <span class={`text-[9px] font-mono font-bold ${isActive ? cat.color : 'text-white/60'}`}>{cat.count}</span>
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <!-- Global Breadcrumb -->
    <div class="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-3xl border border-[#d946ef]/20 shadow-[0_0_20px_rgba(217,70,239,0.1)] text-[10px] font-mono uppercase tracking-widest text-white/50">
      <div class="w-2 h-2 rounded-full bg-goclaw-neon-purple shadow-[0_0_8px_rgba(217,70,239,0.8)] animate-pulse-slow"></div>
      System Normal <span class="opacity-30 mx-1">|</span> Loc: {$locale} <span class="opacity-30 mx-1">|</span> Tz: {currentTzLabel}
    </div>
  {/if}
</div>

<!-- Radial User Orb (Top Right) -->
<div 
  class="fixed top-6 right-6 z-[100] flex items-center justify-center w-16 h-16 group/userorb"
  onmouseenter={() => isHovered = true}
  onmouseleave={() => { isHovered = false; activeSubmenu = null; }}
>
  <!-- Invisible hover bridge -->
  {#if isHovered}
    <div class="absolute top-0 right-0 w-[300px] h-[300px] rounded-bl-full bg-transparent z-0"></div>
  {/if}

  <!-- Main Orb Button -->
  <button class="relative flex items-center justify-center w-14 h-14 rounded-full border border-[#d946ef]/30 bg-black/80 backdrop-blur-3xl z-50 transition-all duration-500 shadow-[0_0_20px_rgba(217,70,239,0.2)] group-hover/userorb:border-[#d946ef] group-hover/userorb:shadow-[0_0_30px_rgba(217,70,239,0.4)] group-hover/userorb:scale-110">
    <div class="absolute inset-0 bg-goclaw-neon-purple/20 blur-[15px] animate-pulse-slow rounded-full opacity-0 group-hover/userorb:opacity-100 transition-opacity duration-500"></div>
    <User class="w-6 h-6 text-goclaw-neon-purple relative z-10 transition-transform duration-500 group-hover/userorb:scale-110" />
    <div class="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black shadow-[0_0_10px_rgba(16,185,129,0.8)] z-20"></div>
  </button>

  <!-- Reveal Auth Info on Hover -->
  <div class="absolute right-20 top-1/2 -translate-y-1/2 flex flex-col items-end opacity-0 group-hover/userorb:opacity-100 group-hover/userorb:-translate-x-2 transition-all duration-500 pointer-events-none">
    <span class="text-[14px] font-black text-white uppercase tracking-wider drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{authState.userId || 'system'}</span>
    <span class="text-[10px] font-mono text-goclaw-neon-cyan uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded-full border border-[#06b6d4]/30 mt-1">{authState.tenantName || (authState.isOwner ? 'Master' : 'Guest')}</span>
  </div>

  <!-- Radial Menu Items -->
  <div class={`absolute top-1/2 left-1/2 w-0 h-0 transition-all duration-500 z-20 ${isHovered ? 'pointer-events-auto' : 'pointer-events-none'}`}>
    {#each topbarItems as item, index}
      {@const Icon = item.icon}
      {@const isActive = activeSubmenu === item.id}
      <button 
        onclick={item.action}
        style={getRadialStyle(index, topbarItems.length, isHovered)}
        class={`absolute top-0 left-0 flex items-center justify-center w-12 h-12 rounded-full border bg-black/80 backdrop-blur-xl transition-all duration-300 z-30 shadow-[0_0_15px_rgba(0,0,0,0.8)] ${isActive ? 'border-[#d946ef] scale-110 shadow-[0_0_20px_rgba(217,70,239,0.3)]' : 'border-white/10 hover:border-[#d946ef]/50 hover:scale-110'}`}
        title={item.label}
      >
        <Icon size={20} class={`transition-colors duration-300 ${isActive ? 'text-goclaw-neon-purple drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]' : `text-white/50 hover:text-white ${item.color.replace('text-', 'hover:text-')}`}`} />
        
        <!-- Tooltip for Radial Item -->
        {#if !isActive && !activeSubmenu}
          <div class="absolute top-full mt-2 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
            <div class="px-2 py-1 rounded bg-black/80 border border-white/10 text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap">
              {item.label}
            </div>
          </div>
        {/if}
      </button>

      <!-- Submenus -->
      {#if isActive && isHovered}
        <!-- Language Submenu -->
        {#if item.id === 'lang'}
          <div 
            style={getRadialStyle(index, topbarItems.length, true)}
            class="absolute top-14 left-0 -translate-x-1/2 w-48 rounded-2xl bg-black/90 backdrop-blur-3xl border border-[#d946ef]/30 shadow-[0_10px_40px_rgba(217,70,239,0.2)] p-2 z-[100] animate-in fade-in zoom-in-95"
          >
            <div class="px-3 py-2 text-[9px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 mb-2">
              {$_('topbar.language', { default: 'Language' })}
            </div>
            <div class="space-y-1">
              {#each languages as lang}
                <button
                  onclick={(e) => { e.stopPropagation(); setLanguage(lang.code); }}
                  class="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-white/10 transition-colors group"
                >
                  <span class={lang.code === $locale ? "text-goclaw-neon-purple font-bold" : "text-white/70 group-hover:text-white font-medium"}>
                    {lang.name}
                  </span>
                  {#if lang.code === $locale}
                    <Check class="h-3.5 w-3.5 text-goclaw-neon-purple" />
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Timezone Submenu -->
        {#if item.id === 'tz'}
          <div 
            style={getRadialStyle(index, topbarItems.length, true)}
            class="absolute top-14 left-0 -translate-x-1/2 w-56 rounded-2xl bg-black/90 backdrop-blur-3xl border border-[#d946ef]/30 shadow-[0_10px_40px_rgba(217,70,239,0.2)] p-2 z-[100] animate-in fade-in zoom-in-95"
          >
            <div class="px-3 py-2 text-[9px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 mb-2">
              {$_('topbar.timezone', { default: 'Timezone' })}
            </div>
            <div class="max-h-64 overflow-y-auto custom-scrollbar space-y-1 pr-1">
              {#each TIMEZONE_OPTIONS as tz}
                <button
                  onclick={(e) => { e.stopPropagation(); handleSetTimezone(tz.value); }}
                  class="w-full flex items-center justify-between px-3 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-xl hover:bg-white/10 transition-colors group text-left"
                >
                  <span class={tz.value === uiState.timezone ? "text-goclaw-neon-cyan" : "text-white/50 group-hover:text-white"}>
                    {tz.label}
                  </span>
                  {#if tz.value === uiState.timezone}
                    <Check class="h-3.5 w-3.5 text-goclaw-neon-cyan" />
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Tenant Submenu -->
        {#if item.id === 'tenant'}
          <div 
            style={getRadialStyle(index, topbarItems.length, true)}
            class="absolute top-14 left-0 -translate-x-1/2 w-56 rounded-2xl bg-black/90 backdrop-blur-3xl border border-[#d946ef]/30 shadow-[0_10px_40px_rgba(217,70,239,0.2)] p-2 z-[100] animate-in fade-in zoom-in-95"
          >
            <div class="px-3 py-2 text-[9px] font-bold text-goclaw-neon-cyan uppercase tracking-widest border-b border-white/5 mb-2">
              Switch Tenant
            </div>
            <div class="space-y-1">
              {#each authState.availableTenants as tenant}
                <button
                  onclick={(e) => { e.stopPropagation(); handleSwitchTenant(tenant.slug); }}
                  class="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl hover:bg-white/10 transition-all group"
                >
                  <Building2 class="h-3.5 w-3.5 text-white/30 group-hover:text-goclaw-neon-cyan" />
                  <span class="flex-1 truncate text-left font-bold text-white/70 group-hover:text-white uppercase tracking-wider text-[10px]">
                    {tenant.name}
                  </span>
                  {#if tenant.id === authState.tenantId}
                    <Check class="h-3.5 w-3.5 text-goclaw-neon-cyan" />
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      {/if}

    {/each}
  </div>
</div>
