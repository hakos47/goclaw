<script lang="ts">
  import { onMount } from "svelte";
  import { authState, saveCredentials } from "$lib/state/auth.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent } from "$lib/components/ui/card";
  import { Fingerprint, KeySquare, ChevronRight, Hash, Shield, ScanFace } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { authenticateWebAuthn, isWebAuthnSupported, hasPlatformAuthenticator } from "$lib/utils/webauthn";
  import QRCode from "qrcode";

  let mode = $state<"token" | "pairing" | "biometric">("token");
  let webauthnSupported = $state(false);
  let platformAuth = $state(false);
  let qrCodeData = $state("");
  
  onMount(async () => {
    webauthnSupported = await isWebAuthnSupported();
    platformAuth = await hasPlatformAuthenticator();
    
    if (!platformAuth) {
      // Create a URL for mobile login. Using current origin.
      const url = new URL(window.location.href);
      url.searchParams.set('cross_device', '1');
      qrCodeData = await QRCode.toDataURL(url.toString(), {
        color: { dark: '#4ade80', light: '#00000000' },
        width: 160,
        margin: 1
      });
    }
  });

  // Token mode state
  let userId = $state("system");
  let token = $state("");
  
  // Pairing mode state
  let pin = $state("");
  let pinUserId = $state("");

  let error = $state("");
  let loading = $state(false);

  async function handleBiometricLogin() {
    loading = true;
    error = "";
    try {
        const res = await authenticateWebAuthn();
        console.log("WebAuthn verification response:", res);
        if (res && res.token) {
            saveCredentials(res.token, res.user_id);
            window.location.href = "/overview";
        } else {
            error = "Biometric authentication returned no token.";
        }
    } catch (e: any) {
        if (e.name === 'NotAllowedError') {
            error = "Biometric authentication cancelled.";
        } else {
            error = e.message || "Biometric authentication failed.";
        }
    } finally {
        loading = false;
    }
  }

  function handleTokenSubmit(e: Event) {
    e.preventDefault();
    if (!token) {
        error = $_('login.token.errorInvalidCredentials', { default: "Token is required" });
        return;
    }
    saveCredentials(token, userId);
    window.location.href = "/overview";
  }

  async function handlePairingSubmit(e: Event) {
    e.preventDefault();
    if (pin.length !== 6) {
        error = $_('login.pairing.errorInvalidPin', { default: "PIN must be 6 digits" });
        return;
    }
    if (!pinUserId) {
        error = $_('login.token.errorInvalidCredentials', { default: "User ID is required" });
        return;
    }
    
    loading = true;
    error = "";
    try {
        const res = await fetch('/v1/pairing/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin, user_id: pinUserId })
        });
        
        if (!res.ok) throw new Error(await res.text());
        
        const data = await res.json();
        if (data.token) {
            saveCredentials(data.token, pinUserId);
            window.location.href = "/overview";
        } else {
            error = "Pairing successful, but no token returned. Use token login.";
            setTimeout(() => { mode = "token"; }, 2000);
        }
    } catch (e: any) {
        error = e.message || "Pairing failed. Invalid or expired PIN.";
    } finally {
        loading = false;
    }
  }
</script>

<div class="h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-transparent z-10">

  <!-- Floating Logo with Prominence (No Container) -->
  <div class="mb-12 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div class="relative group">
      <!-- Glow effect behind the logo -->
      <div class="absolute inset-0 bg-goclaw-neon-purple/30 blur-[40px] rounded-full group-hover:bg-goclaw-neon-purple/50 transition-all duration-700"></div>
      <img src="/goclaw-nix.png" alt="GoClaw" class="relative z-10 h-28 w-28 object-contain drop-shadow-[0_0_20px_rgba(217,70,239,0.8)] animate-pulse" />
    </div>
    <h1 class="mt-6 text-4xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50 drop-shadow-lg uppercase">
      GoClaw
    </h1>
    <p class="mt-2 text-xs font-mono text-white/50 tracking-[0.3em] uppercase">Tactical Gateway</p>
  </div>

  <Card class="w-full max-w-md relative z-10 bg-[#030014]/80 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] rounded-[2rem] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
    <!-- Grid Background inside Card -->
    <div class="absolute top-0 right-0 w-64 h-64 bg-goclaw-neon-purple/20 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-64 h-64 bg-goclaw-neon-cyan/10 rounded-full blur-[80px] pointer-events-none"></div>
    <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50"></div>
    
    <CardContent class="p-8 relative z-10">
      <!-- Mode Switcher Tabs (Pill Style from Agents) -->
      <div class="flex items-center gap-2 p-1.5 mb-8 rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
        <!-- Token Tab -->
        <button 
          onclick={() => { mode = 'token'; error = ""; }}
          class={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[9px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-500 overflow-hidden group whitespace-nowrap ${mode === 'token' ? 'text-white' : 'text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-[1.02]'}`}
        >
          {#if mode === 'token'}
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
            <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-purple pointer-events-none"></div>
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
          {:else}
            <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          {/if}
          <KeySquare class={`h-3.5 w-3.5 relative z-10 transition-colors duration-500 ${mode === 'token' ? 'text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'text-white/30 group-hover:text-white/70'}`} />
          <span class="relative z-10 drop-shadow-md">Token</span>
        </button>

        <!-- Biometrics Tab -->
        {#if webauthnSupported}
        <button 
          onclick={() => { mode = 'biometric'; error = ""; }}
          class={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[9px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-500 overflow-hidden group whitespace-nowrap ${mode === 'biometric' ? 'text-white' : 'text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-[1.02]'}`}
        >
          {#if mode === 'biometric'}
            <div class="absolute inset-0 bg-gradient-to-t from-green-500/30 to-transparent border border-green-500/50 rounded-xl"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-green-500 shadow-[0_0_15px_rgba(34,197,94,1)] rounded-t-full"></div>
            <div class="absolute inset-0 opacity-40 blur-xl bg-green-500 pointer-events-none"></div>
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
          {:else}
            <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          {/if}
          <ScanFace class={`h-3.5 w-3.5 relative z-10 transition-colors duration-500 ${mode === 'biometric' ? 'text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'text-white/30 group-hover:text-white/70'}`} />
          <span class="relative z-10 drop-shadow-md">Bio</span>
        </button>
        {/if}

        <!-- Pairing Tab -->
        <button 
          onclick={() => { mode = 'pairing'; error = ""; }}
          class={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 text-[9px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-500 overflow-hidden group whitespace-nowrap ${mode === 'pairing' ? 'text-white' : 'text-white/40 hover:text-white/90 hover:bg-white/5 hover:scale-[1.02]'}`}
        >
          {#if mode === 'pairing'}
            <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-cyan/30 to-transparent border border-goclaw-neon-cyan/50 rounded-xl"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-cyan shadow-[0_0_15px_rgba(6,182,212,1)] rounded-t-full"></div>
            <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-cyan pointer-events-none"></div>
            <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
          {:else}
            <div class="absolute inset-0 bg-white/[0.01] border border-transparent rounded-xl transition-all"></div>
          {/if}
          <Fingerprint class={`h-3.5 w-3.5 relative z-10 transition-colors duration-500 ${mode === 'pairing' ? 'text-goclaw-neon-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-white/30 group-hover:text-white/70'}`} />
          <span class="relative z-10 drop-shadow-md">Pair</span>
        </button>
      </div>
      {#if mode === "token"}
        <div class="animate-in fade-in slide-in-from-left-4 duration-300">
          <form onsubmit={handleTokenSubmit} class="space-y-5">
            <div class="space-y-2">
              <label for="userId" class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1 flex items-center gap-2">
                <Shield class="w-3 h-3" />
                Operator ID
              </label>
              <input
                id="userId"
                bind:value={userId}
                class="w-full h-12 px-4 rounded-xl bg-black/60 border border-[#d946ef]/20 text-white font-mono text-sm focus:outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-white/20"
                placeholder="system"
              />
            </div>

            <div class="space-y-2">
              <label for="token" class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1 flex items-center gap-2">
                <KeySquare class="w-3 h-3 text-goclaw-neon-purple" />
                Access Token
              </label>
              <input
                id="token"
                type="password"
                bind:value={token}
                class="w-full h-12 px-4 rounded-xl bg-black/60 border border-[#d946ef]/20 text-white font-mono text-sm focus:outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-white/20"
                placeholder="Paste gateway token..."
              />
            </div>

            {#if error}
              <p class="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1 animate-pulse border-l-2 border-red-500 pl-2">{error}</p>
            {/if}

            <button type="submit" class="w-full mt-6 h-14 relative flex items-center justify-center gap-2 px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 overflow-hidden group text-white hover:scale-[1.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5">
              <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-purple/30 to-transparent border border-goclaw-neon-purple/50 rounded-xl"></div>
              <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-purple shadow-[0_0_15px_rgba(217,70,239,1)] rounded-t-full"></div>
              <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-purple pointer-events-none group-hover:opacity-70 transition-opacity"></div>
              <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>
              
              <span class="relative z-10 drop-shadow-md">Initialize Link</span>
              <ChevronRight class="h-4 w-4 relative z-10 text-goclaw-neon-purple drop-shadow-[0_0_8px_rgba(217,70,239,0.8)] transition-all duration-500 group-hover:translate-x-1.5" strokeWidth={3} />
            </button>
          </form>
        </div>
      {:else if mode === "biometric"}
        <div class="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col items-center py-4">
          {#if platformAuth}
            <div class="h-24 w-24 rounded-full border border-green-400/30 bg-green-400/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                <ScanFace class="w-12 h-12 text-green-400 animate-pulse" />
            </div>
            
            <p class="text-center text-[10px] text-white/50 tracking-widest uppercase mb-8 leading-relaxed">
              Use your device's biometric sensor to securely access the gateway.
            </p>

            {#if error}
                <p class="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-4 border-l-2 border-red-500 pl-2 text-center">{error}</p>
            {/if}

            <button 
              onclick={handleBiometricLogin} 
              disabled={loading} 
              class="w-full h-14 relative flex items-center justify-center gap-2 px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 hover:scale-[1.02] group overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-t from-green-500/30 to-transparent border border-green-500/50 rounded-xl"></div>
              <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-green-500 shadow-[0_0_15px_rgba(34,197,94,1)] rounded-t-full"></div>
              <div class="absolute inset-0 opacity-40 blur-xl bg-green-500 pointer-events-none group-hover:opacity-70 transition-opacity"></div>
              <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>

              <span class="relative z-10 drop-shadow-md">{loading ? "Waiting for sensor..." : "Authenticate"}</span>
              {#if !loading}
                <ScanFace class="h-4 w-4 relative z-10 text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)] transition-all duration-500 group-hover:scale-110" strokeWidth={2} />
              {/if}
            </button>
          {:else}
            <!-- No local sensor detected: Show QR -->
            <div class="p-2 rounded-[2rem] bg-black/60 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1),inset_0_1px_2px_rgba(255,255,255,0.1)] mb-6">
                {#if qrCodeData}
                  <img src={qrCodeData} alt="Cross-device Login QR" class="w-40 h-40 rounded-2xl mix-blend-screen opacity-90 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                {:else}
                  <div class="w-40 h-40 flex items-center justify-center border border-dashed border-green-500/20 rounded-2xl">
                      <div class="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                {/if}
            </div>

            <p class="text-center text-[10px] text-white/50 tracking-widest uppercase mb-6 leading-relaxed px-4">
              No local sensor detected.<br/>
              <span class="text-green-400 font-bold">Scan this QR</span> with a trusted mobile device to log in via Cross-Device Passkey.
            </p>

            {#if error}
                <p class="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-4 border-l-2 border-red-500 pl-2 text-center">{error}</p>
            {/if}
            
            <button 
              onclick={handleBiometricLogin} 
              disabled={loading} 
              class="w-full h-12 relative flex items-center justify-center gap-2 px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5 hover:bg-white/5"
            >
               <span>{loading ? "Waiting..." : "Force USB / Bluetooth"}</span>
            </button>
          {/if}
        </div>
      {:else}
        <div class="animate-in fade-in slide-in-from-right-4 duration-300">
          <form onsubmit={handlePairingSubmit} class="space-y-5">
            <div class="space-y-2">
              <label for="pin" class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1 flex items-center gap-2">
                <Hash class="w-3 h-3" />
                Pairing PIN
              </label>
              <input
                id="pin"
                bind:value={pin}
                maxlength="6"
                class="w-full h-16 text-center tracking-[1em] text-3xl rounded-xl bg-black/60 border border-cyan-400/30 text-cyan-400 font-mono focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all shadow-[inset_0_2px_15px_rgba(0,0,0,0.6),0_0_15px_rgba(6,182,212,0.1)] placeholder:text-white/10"
                placeholder="------"
              />
              <p class="text-[10px] text-white/30 text-center uppercase tracking-widest mt-2">Enter 6-digit code shown on device</p>
            </div>

            <div class="space-y-2 mt-2">
              <label for="pinUserId" class="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 ml-1">
                Target Operator ID
              </label>
              <input
                id="pinUserId"
                bind:value={pinUserId}
                class="w-full h-12 px-4 rounded-xl bg-black/60 border border-cyan-400/20 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] placeholder:text-white/20"
                placeholder="e.g. tablet-alpha"
              />
            </div>

            {#if error}
              <p class="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-1 animate-pulse border-l-2 border-red-500 pl-2">{error}</p>
            {/if}

            <button type="submit" disabled={loading} class="w-full mt-6 h-14 relative flex items-center justify-center gap-2 px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl transition-all duration-500 overflow-hidden group text-white hover:scale-[1.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/5">
              <div class="absolute inset-0 bg-gradient-to-t from-goclaw-neon-cyan/30 to-transparent border border-goclaw-neon-cyan/50 rounded-xl"></div>
              <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-goclaw-neon-cyan shadow-[0_0_15px_rgba(6,182,212,1)] rounded-t-full"></div>
              <div class="absolute inset-0 opacity-40 blur-xl bg-goclaw-neon-cyan pointer-events-none group-hover:opacity-70 transition-opacity"></div>
              <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-50"></div>

              <span class="relative z-10 drop-shadow-md">{loading ? "Authorizing..." : "Approve Pairing"}</span>
              {#if !loading}
                <Fingerprint class="h-4 w-4 relative z-10 text-goclaw-neon-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-500 group-hover:scale-110" strokeWidth={2} />
              {/if}
            </button>
          </form>
        </div>
      {/if}
    </CardContent>
  </Card>

  <!-- Tenant/Options Footer Mock -->
  <div class="absolute bottom-8 flex gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
    <span class="hover:text-white cursor-pointer transition-colors">Server Node: Localhost</span>
    <span class="hover:text-white cursor-pointer transition-colors">Locale: EN-US</span>
  </div>
</div>