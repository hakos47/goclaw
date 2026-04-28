<script lang="ts">
  import { onMount } from "svelte";
  import { authState, saveCredentials } from "$lib/state/auth.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card";
  import { _ } from "svelte-i18n";

  let userId = $state("system");
  let token = $state("");
  let error = $state("");

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!token) {
        error = $_('login.token.errorInvalidCredentials', { default: "Token is required" });
        return;
    }
    saveCredentials(token, userId);
    window.location.href = "/overview";
  }
</script>

<div class="h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
  <!-- Aesthetic Overlays -->
  <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
  <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none"></div>

  <Card class="w-full max-w-md relative z-10 border-white/10 shadow-2xl bg-black/40 backdrop-blur-2xl">
    <CardHeader class="space-y-2 text-center pb-8 border-b border-white/5">
      <div class="mx-auto mb-6 h-20 w-20 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.3)] group cursor-pointer hover:border-goclaw-neon-purple/50 transition-all duration-500">
        <img src="/goclaw-nix.png" alt="GoClaw" class="h-12 w-12 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
      </div>
      <CardTitle class="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">GoClaw</CardTitle>
      <CardDescription class="text-sm font-mono text-white/50 tracking-widest uppercase">
        {$_('login.subtitle', { default: "Sign in to the gateway dashboard" })}
      </CardDescription>
    </CardHeader>
    <CardContent class="pt-8 space-y-6">
      <form onsubmit={handleSubmit} class="space-y-4">
        <div class="space-y-2">
          <label for="userId" class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">{$_('login.token.userId', { default: "User ID" })}</label>
          <input
            id="userId"
            bind:value={userId}
            class="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple transition-all shadow-inner"
            placeholder={$_('login.token.userIdPlaceholder', { default: "system" })}
          />
          <p class="text-[10px] text-white/20 ml-1 italic">{$_('login.token.userIdHint', { default: "Use 'system' for full system access" })}</p>
        </div>

        <div class="space-y-2">
          <label for="token" class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">{$_('login.token.gatewayToken', { default: "Gateway Token" })}</label>
          <input
            id="token"
            type="password"
            bind:value={token}
            class="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple transition-all shadow-inner"
            placeholder={$_('login.token.tokenPlaceholder', { default: "Paste your token here..." })}
          />
        </div>

        {#if error}
          <p class="text-xs text-red-500 font-medium ml-1 animate-pulse">{error}</p>
        {/if}

        <Button type="submit" class="w-full mt-6 h-12 bg-goclaw-neon-purple text-white font-bold tracking-[0.2em] uppercase hover:bg-goclaw-neon-purple/80 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300">
          {$_('login.token.connect', { default: "Connect" })}
        </Button>
      </form>

      <div class="text-center">
        <button class="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors underline underline-offset-8">
          {$_('login.pairing.noTokenNeeded', { default: "Need a pairing code?" })}
        </button>
      </div>
    </CardContent>
  </Card>
</div>