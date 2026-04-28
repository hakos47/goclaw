<script lang="ts">
  import { Blocks, RefreshCw, Server, AlertTriangle, CheckCircle2, XCircle } from "lucide-svelte";
  import { packagesStore, fetchPackages, fetchRuntimes, installPackage, uninstallPackage, installGithubBinary } from "$lib/state/packages.svelte";
  import { wsState } from "$lib/state/ws.svelte";
  import { fade } from "svelte/transition";
  import PackageSection from "./components/PackageSection.svelte";

  let hasFetched = false;
  $effect(() => {
    if (wsState.connected && !hasFetched) {
      hasFetched = true;
      fetchPackages();
      fetchRuntimes();
    }
  });

  function handleRefresh() {
    fetchPackages();
    fetchRuntimes();
  }

  // Github installation requires different endpoint, so we wrap it
  async function handleGithubInstall(pkg: string) {
    await installGithubBinary(pkg, "");
  }

  // Wrapper for system
  async function handleSystemInstall(pkg: string) {
    await installPackage(pkg);
  }
  async function handleSystemUninstall(pkg: string) {
    await uninstallPackage(pkg);
  }

  // Wrapper for pip
  async function handlePipInstall(pkg: string) {
    await installPackage(`pip:${pkg}`);
  }
  async function handlePipUninstall(pkg: string) {
    await uninstallPackage(`pip:${pkg}`);
  }

  // Wrapper for npm
  async function handleNpmInstall(pkg: string) {
    await installPackage(`npm:${pkg}`);
  }
  async function handleNpmUninstall(pkg: string) {
    await uninstallPackage(`npm:${pkg}`);
  }

</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 w-full overflow-y-auto scroller-no-scrollbar">

  <!-- Bento Header -->
  <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-6 shrink-0 z-20">
    <div class="absolute inset-0 bg-[#050010]/80 backdrop-blur-3xl border border-indigo-500/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(99,102,241,0.05)] overflow-hidden pointer-events-none -z-10">
      <div class="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full"></div>
      <div class="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full"></div>
    </div>

    <div class="flex items-center gap-5 relative z-10 mb-4 sm:mb-0">
      <div class="h-14 w-14 rounded-2xl bg-black/60 border border-indigo-500/20 flex items-center justify-center shadow-inner relative overflow-hidden group">
        <div class="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <Blocks class="h-6 w-6 text-indigo-400 transition-transform group-hover:scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
      </div>
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
            Package Manager
          </h1>
        </div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
          System, PIP, NPM & Binaries
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 relative z-10">
      <button 
        onclick={handleRefresh} 
        disabled={packagesStore.loadingPackages || packagesStore.loadingRuntimes}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] disabled:opacity-50"
      >
        <RefreshCw class={`h-4 w-4 text-white/50 group-hover:text-white ${packagesStore.loadingPackages ? 'animate-spin' : ''}`} />
        <span class="text-[10px] font-black uppercase tracking-widest text-white/70">Refresh</span>
      </button>
    </div>
  </div>

  <!-- Container Runtimes Status -->
  <div class="mb-8">
    <h2 class="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-3 ml-2 flex items-center gap-2">
      <Server class="h-4 w-4" /> Container Runtimes
    </h2>
    
    {#if packagesStore.loadingRuntimes && !packagesStore.runtimes}
      <div class="flex justify-center p-4"><RefreshCw class="h-5 w-5 animate-spin text-white/30" /></div>
    {:else if packagesStore.runtimes}
      {@const hasMissing = packagesStore.runtimes.runtimes.some(r => !r.available)}
      {#if hasMissing}
        <div class="mb-4 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 flex gap-3 items-start">
          <AlertTriangle class="h-5 w-5 text-sky-400 shrink-0" />
          <div>
            <h3 class="text-[10px] font-black uppercase tracking-widest text-sky-300">Minimal Container Warning</h3>
            <p class="text-xs text-sky-200/70 mt-1">Some execution runtimes are missing. To run agents that require these languages, you must rebuild your Claw agent container with a heavier base image.</p>
          </div>
        </div>
      {/if}

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {#each packagesStore.runtimes.runtimes as rt}
          <div class={`rounded-xl border p-4 flex flex-col gap-2 transition-all ${rt.available ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[inset_0_1px_5px_rgba(16,185,129,0.05)]' : 'bg-red-500/5 border-red-500/10 opacity-70 grayscale-[0.5]'}`}>
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-white">{rt.name}</span>
              {#if rt.available}
                <CheckCircle2 class="h-4 w-4 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
              {:else}
                <XCircle class="h-4 w-4 text-red-500" />
              {/if}
            </div>
            <span class="text-[10px] font-mono text-white/50 truncate">
              {rt.version || (rt.available ? "Installed" : "Missing from container")}
            </span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Package Ecosystems Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <PackageSection
      title="System Packages"
      placeholder="e.g. nmap, jq, curl"
      packages={packagesStore.packages?.system}
      loading={packagesStore.loadingPackages}
      onInstall={handleSystemInstall}
      onUninstall={handleSystemUninstall}
      iconColor="text-blue-400"
    />

    <PackageSection
      title="PIP Packages (Python)"
      placeholder="e.g. requests, beautifulsoup4"
      packages={packagesStore.packages?.pip}
      loading={packagesStore.loadingPackages}
      onInstall={handlePipInstall}
      onUninstall={handlePipUninstall}
      iconColor="text-yellow-400"
    />

    <PackageSection
      title="NPM Packages (Node)"
      placeholder="e.g. axios, lodash"
      packages={packagesStore.packages?.npm}
      loading={packagesStore.loadingPackages}
      onInstall={handleNpmInstall}
      onUninstall={handleNpmUninstall}
      iconColor="text-emerald-400"
    />

    <PackageSection
      title="GitHub Binaries"
      placeholder="e.g. jqlang/jq"
      packages={packagesStore.packages?.github}
      loading={packagesStore.loadingPackages}
      onInstall={handleGithubInstall}
      onUninstall={handleSystemUninstall}
      iconColor="text-purple-400"
    />
  </div>

</div>
