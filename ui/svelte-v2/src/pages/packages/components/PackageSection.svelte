<script lang="ts">
  import { Download, Loader2, Trash2, Package as PkgIcon } from "lucide-svelte";
  import type { PackageInfo } from "$lib/state/packages.svelte";
  import { fade } from "svelte/transition";

  type Props = {
    title: string;
    placeholder: string;
    packages: PackageInfo[] | null | undefined;
    loading: boolean;
    onInstall: (pkg: string) => Promise<void>;
    onUninstall: (pkg: string) => Promise<void>;
    iconColor?: string; // e.g. 'text-blue-400'
  };

  let { title, placeholder, packages, loading, onInstall, onUninstall, iconColor = "text-indigo-400" }: Props = $props();

  let input = $state("");
  let installStatus = $state<"idle" | "loading" | "error">("idle");
  let actionStatuses = $state<Record<string, "idle" | "loading" | "error">>({});
  let errorMsg = $state("");

  async function handleInstall() {
    const pkg = input.trim();
    if (!pkg) return;
    installStatus = "loading";
    errorMsg = "";
    try {
      await onInstall(pkg);
      input = "";
    } catch (e: any) {
      errorMsg = e.message;
    } finally {
      installStatus = "idle";
    }
  }

  async function handleUninstall(name: string) {
    actionStatuses[name] = "loading";
    try {
      await onUninstall(name);
    } catch (e: any) {
      console.error(e);
      actionStatuses[name] = "error";
    } finally {
      if (actionStatuses[name] !== "error") {
        delete actionStatuses[name];
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInstall();
    }
  }
</script>

<div class="flex flex-col relative overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#050510]/80 backdrop-blur-md transition-all duration-300 p-6">
  
  <div class="flex items-center gap-3 mb-5">
    <div class="h-10 w-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner">
      <PkgIcon class={`h-5 w-5 ${iconColor}`} />
    </div>
    <h2 class="text-sm font-black text-white tracking-[0.2em] uppercase drop-shadow-md">{title}</h2>
  </div>

  {#if errorMsg}
    <div class="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-[10px] font-black uppercase tracking-widest text-red-400">
      {errorMsg}
    </div>
  {/if}

  <!-- Installer Input -->
  <div class="flex gap-2 mb-6">
    <input
      type="text"
      bind:value={input}
      onkeydown={handleKeydown}
      disabled={installStatus === "loading"}
      placeholder={placeholder}
      class="flex-1 h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-white font-mono text-sm outline-none focus:border-indigo-500/50 transition-colors"
    />
    <button
      onclick={handleInstall}
      disabled={!input.trim() || installStatus === "loading"}
      class="h-11 px-5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
    >
      {#if installStatus === "loading"}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <Download class="h-4 w-4" />
      {/if}
      Install
    </button>
  </div>

  <!-- Package Grid -->
  <div class="flex-1 overflow-y-auto scroller-no-scrollbar">
    {#if loading && !packages}
      <div class="flex justify-center p-8">
        <Loader2 class="h-6 w-6 animate-spin text-white/30" />
      </div>
    {:else if !packages?.length}
      <div class="text-center p-8 border border-white/5 border-dashed rounded-xl text-[10px] font-mono text-white/30 uppercase">
        No packages installed in this ecosystem.
      </div>
    {:else}
      <div class="flex flex-wrap gap-2">
        {#each packages as pkg (pkg.name)}
          {@const status = actionStatuses[pkg.name] || "idle"}
          <div class="flex items-center gap-2 pl-3 pr-1 py-1 bg-black/40 border border-white/10 rounded-lg group hover:border-white/20 transition-colors">
            <div class="flex flex-col">
              <span class="text-xs font-mono font-bold text-white/90">{pkg.name}</span>
              <span class="text-[9px] font-mono text-white/40">{pkg.version}</span>
            </div>
            
            <button
              onclick={() => handleUninstall(pkg.name)}
              disabled={status === "loading"}
              class={`p-1.5 rounded-md transition-all ${status === 'error' ? 'text-red-500' : 'text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100'}`}
              title="Uninstall Package"
            >
              {#if status === "loading"}
                <Loader2 class="h-3.5 w-3.5 animate-spin text-red-400" />
              {:else}
                <Trash2 class="h-3.5 w-3.5" />
              {/if}
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
