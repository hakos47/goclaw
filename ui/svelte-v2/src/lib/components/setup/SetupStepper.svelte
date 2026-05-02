<script lang="ts">
  import { Check } from "lucide-svelte";
  import { _ } from "svelte-i18n";

  let { currentStep = 1 } = $props<{ currentStep?: number }>();

  const steps = [
    { id: 1, name: "Provider" },
    { id: 2, name: "Model" },
    { id: 3, name: "Agent" },
    { id: 4, name: "Channel" },
  ];
</script>

<div class="w-full flex items-center justify-between relative mb-12">
  <!-- Progress Line Background -->
  <div class="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -translate-y-1/2 z-0"></div>
  
  <!-- Active Progress Line -->
  <div 
    class="absolute top-1/2 left-0 h-[1px] bg-goclaw-neon-purple shadow-[0_0_10px_rgba(139,92,246,0.8)] -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
    style="width: {((currentStep - 1) / (steps.length - 1)) * 100}%"
  ></div>

  <!-- Steps -->
  {#each steps as step}
    <div class="relative z-10 flex flex-col items-center gap-2">
      <!-- Step Circle -->
      <div 
        class="w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm border transition-all duration-300
        {step.id < currentStep ? 'bg-goclaw-neon-purple/20 border-goclaw-neon-purple text-goclaw-neon-purple' : 
         step.id === currentStep ? 'bg-goclaw-neon-purple border-goclaw-neon-purple text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 
         'bg-[#030014]/80 backdrop-blur-md border-white/10 text-white/30'}"
      >
        {#if step.id < currentStep}
          <Check class="w-5 h-5" />
        {:else}
          {step.id}
        {/if}
      </div>
      
      <!-- Step Label -->
      <span class="absolute -bottom-6 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em]
        {step.id <= currentStep ? 'text-white' : 'text-white/30'}">
        {$_(`setup.steps.${step.name.toLowerCase()}`, { default: step.name })}
      </span>
    </div>
  {/each}
</div>
