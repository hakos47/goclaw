<script lang="ts">
  import { fade } from "svelte/transition";
  import { onMount } from "svelte";
  import SetupStepper from "$lib/components/setup/SetupStepper.svelte";
  import StepProvider from "$lib/components/setup/StepProvider.svelte";
  import StepModel from "$lib/components/setup/StepModel.svelte";
  import StepAgent from "$lib/components/setup/StepAgent.svelte";
  import StepChannel from "$lib/components/setup/StepChannel.svelte";
  import { authState } from "$lib/state/auth.svelte";
  import { _ } from "svelte-i18n";

  let step = $state(1);
  let showComplete = $state(false);
  let loadingBootstrap = $state(true);

  // Payload for Bootstrap API
  let setupData = $state({
    provider: null as any,
    model: null as string | null,
    agent: null as any,
    channel: null as any
  });

  onMount(async () => {
    if (!authState.token) {
        window.location.hash = "#/login";
        return;
    }
    
    // Check bootstrap status
    try {
      const [providersRes, agentsRes] = await Promise.all([
        fetch('/v1/providers', { headers: { 'Authorization': `Bearer ${authState.token}` } }),
        fetch('/v1/agents', { headers: { 'Authorization': `Bearer ${authState.token}` } })
      ]);

      const providersData = await providersRes.json();
      const agentsData = await agentsRes.json();

      const hasProvider = providersData.providers && providersData.providers.length > 0;
      const hasAgent = agentsData.agents && agentsData.agents.length > 0;

      if (hasProvider && hasAgent) {
        // System is already bootstrapped
        window.location.hash = "#/overview";
        return;
      }
    } catch (e) {
      console.error("Failed to check bootstrap status", e);
    } finally {
      loadingBootstrap = false;
    }
  });

  async function handleProviderComplete(provider: any) {
    try {
      const res = await fetch('/v1/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.token}` },
        body: JSON.stringify(provider)
      });
      if (!res.ok) throw new Error(await res.text());
      setupData.provider = await res.json();
      step = 2;
    } catch (e) {
      console.error(e);
      alert("Failed to create provider: " + e);
    }
  }

  function handleModelComplete(model: string) {
    setupData.model = model;
    step = 3;
  }

  async function handleAgentComplete(agent: any) {
    try {
      const res = await fetch('/v1/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.token}` },
        body: JSON.stringify(agent)
      });
      if (!res.ok) throw new Error(await res.text());
      setupData.agent = await res.json();
      step = 4;
    } catch (e) {
      console.error(e);
      alert("Failed to create agent: " + e);
    }
  }

  async function handleChannelComplete(channel: any) {
    try {
      // In a real scenario we'd create the channel, but for now we finish setup
      const res = await fetch('/v1/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.token}` },
        body: JSON.stringify(channel)
      });
      if (res.ok) {
        setupData.channel = await res.json();
      }
    } catch (e) {
      console.error(e);
    }
    finishSetup();
  }

  function finishSetup() {
    showComplete = true;
    setTimeout(() => {
      window.location.hash = "#/overview"; // Navigate to dashboard
    }, 2500);
  }

  function skipSetup() {
    window.location.hash = "#/overview";
  }

</script>

<div class="min-h-screen w-full bg-transparent text-white flex flex-col items-center justify-center p-4 relative overflow-x-hidden overflow-y-auto">
  
  <!-- Aesthetic Overlays -->
  <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
  <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none"></div>

  <div class="w-full max-w-4xl relative z-10">
    <SetupStepper currentStep={step} />

    <div class="mt-8 bg-[#030014]/80 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] rounded-[2rem] p-8 md:p-12 relative overflow-hidden min-h-[400px] flex flex-col justify-center">
      <!-- Grid Background Pattern -->
      <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50"></div>

      {#if step === 1}
        <div in:fade={{ duration: 300 }}>
          <StepProvider onComplete={handleProviderComplete} />
        </div>
      {:else if step === 2}
        <div in:fade={{ duration: 300 }}>
          <StepModel 
            provider={setupData.provider} 
            onBack={() => step = 1} 
            onComplete={handleModelComplete} 
          />
        </div>
      {:else if step === 3}
        <div in:fade={{ duration: 300 }}>
          <StepAgent 
            provider={setupData.provider} 
            model={setupData.model!} 
            onBack={() => step = 2} 
            onComplete={handleAgentComplete} 
          />
        </div>
      {:else if step === 4}
        <div in:fade={{ duration: 300 }}>
          <StepChannel 
            agent={setupData.agent} 
            onBack={() => step = 3} 
            onComplete={handleChannelComplete} 
            onSkip={finishSetup}
          />
        </div>
      {/if}
    </div>

    <!-- Footer Actions -->
    <div class="mt-8 flex justify-center">
      <button 
        onclick={skipSetup}
        class="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 hover:text-white transition-colors underline underline-offset-4"
      >
        Skip Bootstrap Sequence
      </button>
    </div>
  </div>

  <!-- Setup Complete Overlay -->
  {#if showComplete}
    <div class="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center" in:fade={{ duration: 500 }}>
      <div class="w-24 h-24 rounded-full border-2 border-goclaw-neon-purple flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_50px_rgba(139,92,246,0.5)] mb-8">
        <img src="/goclaw-nix.png" alt="GoClaw Logo" class="w-12 h-12" />
      </div>
      <h2 class="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 mb-4">SYSTEM INITIALIZED</h2>
      <p class="text-white/50 font-mono text-sm tracking-widest uppercase animate-pulse">Routing to tactical dashboard...</p>
    </div>
  {/if}
</div>
