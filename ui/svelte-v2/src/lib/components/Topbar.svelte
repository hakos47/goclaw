<script lang="ts">
  import { 
    Menu, PanelLeftClose, PanelLeftOpen, Globe, Clock, Settings2, Moon, Sun, 
    User, Check, Target, LifeBuoy, Briefcase, TrendingUp, LogOut, Building2, 
    ChevronDown, KeyRound, Info 
  } from "lucide-svelte";
  import { globalState, toggleSidebar } from "../state/global.svelte";
  import { uiState, setTimezone, TIMEZONE_OPTIONS } from "../state/ui.svelte";
  import { wsState, useWsCall } from "../state/ws.svelte";
  import { authState, logout } from "../state/auth.svelte";
  import { locale, _ } from "svelte-i18n";
  import { onMount } from "svelte";

  type Props = {
    onOpenSettings: () => void;
  };

  let { onOpenSettings }: Props = $props();

  let langMenuOpen = $state(false);
  let tzMenuOpen = $state(false);
  let userMenuOpen = $state(false);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "vi", name: "Tiếng Việt" },
    { code: "zh", name: "中文" }
  ];

  function setLanguage(code: string) {
    $locale = code;
    localStorage.setItem("goclaw:language", code);
    langMenuOpen = false;
  }

  function handleSetTimezone(tz: string) {
    setTimezone(tz);
    tzMenuOpen = false;
  }

  function handleSwitchTenant(slug: string) {
    localStorage.setItem("goclaw:tenant_id", slug);
    if (!authState.isOwner) {
      localStorage.setItem("goclaw:tenant_hint", slug);
    }
    window.location.reload();
  }

  // Close menus on click outside
  onMount(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (langMenuOpen && !target.closest('.lang-dropdown')) {
        langMenuOpen = false;
      }
      if (tzMenuOpen && !target.closest('.tz-dropdown')) {
        tzMenuOpen = false;
      }
      if (userMenuOpen && !target.closest('.user-dropdown')) {
        userMenuOpen = false;
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  });

  let currentLangName = $derived(languages.find(l => l.code === $locale)?.name || "English");
  let currentTzLabel = $derived(TIMEZONE_OPTIONS.find(t => t.value === uiState.timezone)?.label || "Auto (Local)");
  
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
</script>

<header class="flex h-16 items-center justify-between border-b border-white/5 bg-[#030014]/50 backdrop-blur-2xl px-6 relative z-40 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
  <div class="flex items-center gap-4 pl-32">
    {#if wsState.currentPath.startsWith('/sessions')}
      <!-- Contextual Sessions HUD -->
      <div class="hidden sm:flex items-center gap-2 animate-in slide-in-from-left-4 fade-in duration-300">
        {#each sessionCategories as cat}
          {@const isActive = wsState.currentSearch?.includes(`category=${cat.type}`)}
          {@const SubIcon = cat.icon}
          <a 
            href={`/sessions?category=${cat.type}`}
            class={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-300 group overflow-hidden ${isActive ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-black/20 border-transparent hover:bg-white/[0.05]'}`}
          >
            {#if isActive}
              <!-- Bottom glow line -->
              <div class={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] rounded-t-full shadow-[0_0_10px_currentColor] ${cat.color}`}></div>
              <div class={`absolute inset-0 opacity-20 blur-md ${cat.color} bg-current`}></div>
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
      <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono uppercase tracking-widest text-white/40">
        <div class="w-1.5 h-1.5 rounded-full bg-goclaw-neon-purple shadow-[0_0_8px_rgba(217,70,239,0.8)] animate-pulse-slow"></div>
        System Normal (Locale: {$locale})
      </div>
    {/if}
  </div>

  <div class="flex items-center gap-2 sm:gap-3">
    <!-- Utility Group (Pill Container) -->
    <div class="flex items-center p-1 rounded-2xl bg-[#0a0a0a]/50 border border-white/5 shadow-inner">
      
      <!-- Language Dropdown -->
      <div class="relative lang-dropdown">
        <button 
          onclick={() => langMenuOpen = !langMenuOpen}
          class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold tracking-wide text-white/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <Globe class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">{currentLangName}</span>
        </button>

        {#if langMenuOpen}
          <div class="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div class="px-3 py-2 text-[9px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">
              {$_('topbar.language', { default: 'Language' })}
            </div>
            {#each languages as lang}
              <button
                onclick={() => setLanguage(lang.code)}
                class="w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl hover:bg-white/5 transition-colors group"
              >
                <span class={lang.code === $locale ? "text-goclaw-neon-purple font-bold" : "text-white/70 group-hover:text-white font-medium"}>
                  {lang.name}
                </span>
                {#if lang.code === $locale}
                  <Check class="h-4 w-4 text-goclaw-neon-purple" />
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="w-[1px] h-4 bg-white/10 mx-1"></div>

      <!-- Timezone Dropdown -->
      <div class="relative tz-dropdown">
        <button 
          onclick={() => tzMenuOpen = !tzMenuOpen}
          class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold tracking-wide text-white/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <Clock class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">{currentTzLabel}</span>
        </button>

        {#if tzMenuOpen}
          <div class="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 max-h-80 overflow-y-auto scroller-no-scrollbar">
            <div class="px-3 py-2 text-[9px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 mb-1 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-md z-10">
              {$_('topbar.timezone', { default: 'Timezone' })}
            </div>
            {#each TIMEZONE_OPTIONS as tz}
              <button
                onclick={() => handleSetTimezone(tz.value)}
                class="w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl hover:bg-white/5 transition-colors group text-left"
              >
                <span class={tz.value === uiState.timezone ? "text-goclaw-neon-cyan font-bold" : "text-white/70 group-hover:text-white font-medium"}>
                  {tz.label}
                </span>
                {#if tz.value === uiState.timezone}
                  <Check class="h-4 w-4 text-goclaw-neon-cyan" />
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="w-[1px] h-4 bg-white/10 mx-1"></div>

      <!-- Settings Button -->
      <button 
        onclick={onOpenSettings}
        class="relative cursor-pointer rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white transition-all"
        title={$_('topbar.systemSettings', { default: 'System Settings' })}
      >
        <Settings2 class="h-4 w-4" />
        <span class="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
      </button>
    </div>

    <!-- User Menu Identity -->
    <div class="relative user-dropdown">
      <button 
        onclick={() => userMenuOpen = !userMenuOpen}
        class="flex items-center gap-3 rounded-2xl p-1.5 pr-4 bg-[#050505]/60 border border-white/5 hover:border-white/10 hover:bg-[#0a0a0a] transition-all ml-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] cursor-pointer"
      >
        <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-goclaw-neon-purple/10 border border-goclaw-neon-purple/30 text-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,0.2)]">
          <User class="h-4 w-4" />
        </div>
        <div class="hidden sm:flex flex-col items-start leading-tight">
          <span class="text-xs font-bold tracking-wide text-white">{authState.userId || 'system'}</span>
          <span class="text-[9px] font-mono text-goclaw-neon-cyan uppercase tracking-widest">
            {authState.tenantName || (authState.isOwner ? 'Master' : 'Guest')}
          </span>
        </div>
        <ChevronDown class="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
      </button>

      {#if userMenuOpen}
        <div class="absolute right-0 mt-3 w-64 rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <!-- Tenant Header -->
          {#if tenantLabel}
            <div class="px-3 py-2 text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/5 mb-2">
              {tenantLabel}
            </div>
          {/if}

          <!-- Tenant Switcher -->
          {#if isMultiTenant}
            <div class="px-3 py-1 text-[9px] font-bold text-goclaw-neon-purple uppercase tracking-widest mb-1">
              {$_('tenants.currentTenant', { default: 'Switch Tenant' })}
            </div>
            <div class="space-y-1 mb-2">
              {#each authState.availableTenants as tenant}
                <button
                  onclick={() => handleSwitchTenant(tenant.slug)}
                  class="w-full flex items-center gap-3 px-3 py-2 text-xs rounded-xl hover:bg-white/5 transition-all group"
                >
                  <Building2 class="h-3.5 w-3.5 text-white/30 group-hover:text-goclaw-neon-purple" />
                  <span class="flex-1 truncate text-left text-white/70 group-hover:text-white">
                    {tenant.name}
                  </span>
                  {#if tenant.id === authState.tenantId}
                    <Check class="h-3.5 w-3.5 text-goclaw-neon-purple" />
                  {/if}
                </button>
              {/each}
            </div>
            <div class="h-[1px] bg-white/5 my-2"></div>
          {/if}

          <!-- Menu Links -->
          <div class="space-y-1">
            {#if isMultiTenant}
              <a href="/tenants" class="flex items-center gap-3 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                <Building2 class="h-3.5 w-3.5 text-white/30" />
                <span>{$_('tenants.title', { default: 'Tenants' })}</span>
              </a>
            {/if}
            
            <a href="/api-keys" class="flex items-center gap-3 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <KeyRound class="h-3.5 w-3.5 text-white/30" />
              <span>{$_('topbar.apiKeys', { default: 'API Keys' })}</span>
            </a>

            <button class="w-full flex items-center gap-3 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left">
              <Info class="h-3.5 w-3.5 text-white/30" />
              <span>{$_('topbar.about.menuItem', { default: 'About' })}</span>
            </button>
          </div>

          <div class="h-[1px] bg-white/5 my-2"></div>

          <!-- Logout -->
          <button
            onclick={logout}
            class="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all text-left"
          >
            <LogOut class="h-3.5 w-3.5" />
            <span>{$_('topbar.logout', { default: 'Logout' })}</span>
          </button>
        </div>
      {/if}
    </div>
  </div>
</header>