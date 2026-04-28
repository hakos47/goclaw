<script lang="ts">
  import { X, Clock, CalendarDays, Bot, MessageSquare, ChevronDown, Hash } from "lucide-svelte";
  import { useCron, type CronSchedule } from "../hooks/use-cron.svelte";
  import { scale, fade } from "svelte/transition";
  import { agentsState, loadAgents } from "../../agents/hooks/use-agents.svelte";
  import { useChannels } from "../../channels/hooks/use-channels.svelte";

  let { open, onClose }: { open: boolean, onClose: () => void } = $props();

  const cron = useCron();
  const channels = useChannels();
  let saving = $state(false);

  // Form State
  let name = $state("");
  let agentId = $state("");
  let message = $state("");
  let scheduleKind = $state<"at" | "every" | "cron">("every");
  
  let everySeconds = $state(3600); // 1 hour default
  let atDate = $state("");
  let atTime = $state("");
  let cronExpr = $state("0 * * * *");
  let cronTz = $state("UTC");

  let deliver = $state(true);
  let channel = $state("");
  let deliverTo = $state("");

  $effect(() => {
    if (open) {
      // Reset form
      name = "";
      agentId = "";
      message = "";
      scheduleKind = "every";
      everySeconds = 3600;
      atDate = new Date().toISOString().split('T')[0];
      atTime = "12:00";
      cronExpr = "0 * * * *";
      cronTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      deliver = true;
      channel = "";
      deliverTo = "";

      // Fetch dependencies
      loadAgents();
      channels.loadInstances({ limit: 100 });
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    saving = true;

    try {
      const schedule: CronSchedule = { kind: scheduleKind };
      if (scheduleKind === "every") {
        schedule.everyMs = everySeconds * 1000;
      } else if (scheduleKind === "at") {
        const d = new Date(`${atDate}T${atTime}:00`);
        schedule.atMs = d.getTime();
      } else if (scheduleKind === "cron") {
        schedule.expr = cronExpr;
        schedule.tz = cronTz;
      }

      await cron.createJob({
        name,
        agentId: agentId || undefined,
        message,
        schedule,
        deliver,
        channel: channel || undefined,
        to: deliverTo || undefined
      });

      onClose();
    } catch (err: any) {
      alert("Failed to create job: " + err.message);
    } finally {
      saving = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-[#030014]/90 backdrop-blur-xl z-[100] transition-all duration-300 flex items-center justify-center p-4 sm:p-6"
    transition:fade={{ duration: 300 }}
    onclick={onClose}
  >
    <!-- Modal Content -->
    <div 
      class="bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[95vh] shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col md:flex-row relative"
      onclick={(e) => e.stopPropagation()}
      transition:scale={{ duration: 400, start: 0.95, opacity: 0, opacity: 0 }}
    >
      <!-- Atmospheric Glows -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-goclaw-neon-purple/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-goclaw-neon-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none mix-blend-screen"></div>

      <!-- Left Sidebar (Steps/Info) -->
      <div class="w-full md:w-1/3 bg-black/40 border-r border-white/5 p-8 flex flex-col relative z-10 shrink-0">
        <div class="flex items-center gap-4 mb-8">
          <div class="p-3 bg-goclaw-neon-purple/20 text-goclaw-neon-purple rounded-2xl border border-goclaw-neon-purple/30 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
            <Clock class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-2xl font-black text-white tracking-tight">New Job</h2>
            <p class="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1">Cron Automation</p>
          </div>
        </div>

        <p class="text-sm text-white/50 leading-relaxed mb-8">
          Scheduled jobs allow you to execute background tasks, trigger agents, or send automated messages at precise intervals or absolute times.
        </p>

        <div class="space-y-6 mt-auto">
          <div class="flex items-center gap-4 text-white/40">
            <Bot class="w-5 h-5 shrink-0" />
            <div class="text-xs">
              <span class="text-white/80 font-bold block mb-0.5">Target Specific Agents</span>
              Bind a job to a specific agent to execute tasks using their tools and context.
            </div>
          </div>
          <div class="flex items-center gap-4 text-white/40">
            <Hash class="w-5 h-5 shrink-0" />
            <div class="text-xs">
              <span class="text-white/80 font-bold block mb-0.5">Target Specific Channels</span>
              Force output delivery to a specific connected channel.
            </div>
          </div>
          <div class="flex items-center gap-4 text-white/40">
            <CalendarDays class="w-5 h-5 shrink-0" />
            <div class="text-xs">
              <span class="text-white/80 font-bold block mb-0.5">Flexible Scheduling</span>
              Use Intervals, Absolute Date/Time, or standard Cron Expressions.
            </div>
          </div>
        </div>
      </div>

      <!-- Right Form Body -->
      <div class="w-full md:w-2/3 flex flex-col relative z-10 min-h-0">
        <!-- Header Actions -->
        <div class="absolute top-4 right-4 z-20">
          <button 
            type="button"
            onclick={onClose}
            class="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all hover:scale-105"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable Form Body -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8 pt-12 relative">
          <form id="cron-form" onsubmit={handleSubmit} class="space-y-8">
            
            <!-- Basics -->
            <div class="space-y-5">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-goclaw-neon-purple"></span> Basics
              </h3>
              
              <div class="space-y-2">
                <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Job Name *</label>
                <input 
                  type="text" 
                  bind:value={name}
                  required
                  placeholder="e.g. Daily Standup Report"
                  class="w-full bg-[#030014]/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:border-goclaw-neon-purple outline-none transition-all focus:shadow-[0_0_15px_rgba(217,70,239,0.15)] focus:bg-[#030014]"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-2 relative">
                  <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Target Agent</label>
                  <div class="relative">
                    <select 
                      bind:value={agentId}
                      class="w-full appearance-none bg-[#030014]/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:border-goclaw-neon-purple outline-none transition-all focus:shadow-[0_0_15px_rgba(217,70,239,0.15)] focus:bg-[#030014] text-white/90"
                    >
                      <option value="" class="bg-[#030014]">-- Global System Task --</option>
                      {#each agentsState.agents as agent}
                        <option value={agent.id} class="bg-[#030014]">
                          {agent.display_name || agent.id} ({agent.model})
                        </option>
                      {/each}
                    </select>
                    <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40">
                      <ChevronDown class="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div class="space-y-2 relative">
                  <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Delivery Channel (Optional)</label>
                  <div class="relative">
                    <select 
                      bind:value={channel}
                      class="w-full appearance-none bg-[#030014]/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:border-goclaw-neon-purple outline-none transition-all focus:shadow-[0_0_15px_rgba(217,70,239,0.15)] focus:bg-[#030014] text-white/90"
                    >
                      <option value="" class="bg-[#030014]">-- Default Channel --</option>
                      {#each channels.instances as ch}
                        <option value={ch.id} class="bg-[#030014]">
                          {ch.provider} - {ch.name}
                        </option>
                      {/each}
                    </select>
                    <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40">
                      <ChevronDown class="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Schedule -->
            <div class="space-y-5">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-goclaw-neon-cyan"></span> Schedule Config
              </h3>
              
              <div class="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                {#each ["every", "at", "cron"] as kind}
                  <button 
                    type="button"
                    onclick={() => scheduleKind = kind as any}
                    class="flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all {scheduleKind === kind ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/70'}"
                  >
                    {kind}
                  </button>
                {/each}
              </div>

              <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                {#if scheduleKind === "every"}
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Interval in Seconds *</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      bind:value={everySeconds}
                      class="w-full bg-[#030014]/80 border border-white/10 rounded-xl px-5 py-4 text-sm font-mono focus:border-goclaw-neon-cyan outline-none transition-colors"
                    />
                  </div>
                {:else if scheduleKind === "at"}
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Date *</label>
                      <input 
                        type="date" 
                        required
                        bind:value={atDate}
                        class="w-full bg-[#030014]/80 border border-white/10 rounded-xl px-5 py-4 text-sm font-mono focus:border-goclaw-neon-cyan outline-none transition-colors"
                      />
                    </div>
                    <div class="space-y-2">
                      <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Time *</label>
                      <input 
                        type="time" 
                        required
                        bind:value={atTime}
                        class="w-full bg-[#030014]/80 border border-white/10 rounded-xl px-5 py-4 text-sm font-mono focus:border-goclaw-neon-cyan outline-none transition-colors"
                      />
                    </div>
                  </div>
                {:else if scheduleKind === "cron"}
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Cron Expression *</label>
                      <input 
                        type="text" 
                        required
                        bind:value={cronExpr}
                        placeholder="0 * * * *"
                        class="w-full bg-[#030014]/80 border border-white/10 rounded-xl px-5 py-4 text-sm font-mono focus:border-goclaw-neon-cyan outline-none transition-colors"
                      />
                    </div>
                    <div class="space-y-2">
                      <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Timezone *</label>
                      <input 
                        type="text" 
                        required
                        bind:value={cronTz}
                        placeholder="UTC"
                        class="w-full bg-[#030014]/80 border border-white/10 rounded-xl px-5 py-4 text-sm font-mono focus:border-goclaw-neon-cyan outline-none transition-colors"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Payload -->
            <div class="space-y-5">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Execution Payload
              </h3>
              
              <div class="space-y-2">
                <label class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Message Content *</label>
                <textarea 
                  bind:value={message}
                  required
                  rows="4"
                  placeholder="Enter the prompt or message to be sent to the agent..."
                  class="w-full bg-[#030014]/60 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:border-emerald-400 outline-none transition-all resize-none custom-scrollbar focus:shadow-[0_0_15px_rgba(52,211,153,0.15)] focus:bg-[#030014]"
                ></textarea>
              </div>
            </div>

            <!-- Options -->
            <div class="space-y-5 pb-6">
              <h3 class="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/10 pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-white/50"></span> Advanced Options
              </h3>

              <div class="flex items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 cursor-pointer hover:bg-white/[0.05] transition-colors" onclick={() => deliver = !deliver}>
                <button 
                  type="button"
                  class="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none {deliver ? 'bg-goclaw-neon-purple/40 border border-goclaw-neon-purple/50' : 'bg-black/40 border border-white/20'}"
                >
                  <div class="absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300 {deliver ? 'translate-x-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'opacity-50'}"></div>
                </button>
                <div>
                  <div class="text-sm font-bold text-white/90 mb-1">Deliver Output Response</div>
                  <div class="text-xs text-white/40">Whether to dispatch the agent's textual output to the channel automatically upon completion.</div>
                </div>
              </div>
            </div>

          </form>
        </div>

        <!-- Footer Actions -->
        <div class="shrink-0 p-6 border-t border-white/10 bg-[#030014]/80 flex justify-between gap-4 relative z-20">
          <button 
            type="button"
            onclick={onClose}
            disabled={saving}
            class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            Discard
          </button>
          <button 
            type="submit"
            form="cron-form"
            disabled={saving}
            class="relative flex items-center justify-center gap-2 px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-500 overflow-hidden group text-goclaw-neon-purple hover:text-white shadow-[0_0_20px_rgba(217,70,239,0.15)] hover:shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:-translate-y-0"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-goclaw-neon-purple/20 to-goclaw-neon-purple/5 border border-goclaw-neon-purple/50 rounded-xl transition-all group-hover:opacity-80"></div>
            <span class="relative z-10 drop-shadow-md">{saving ? 'Deploying...' : 'Deploy Job'}</span>
          </button>
        </div>

      </div>
    </div>
  </div>
{/if}
