<script lang="ts">
   import { useAgentInstances, type UserInstance } from "./hooks/use-agent-instances.svelte";
   import { Users, FileText, Loader2, Save } from "lucide-svelte";
   import { _ } from "svelte-i18n";
   import UserPickerCombobox from "./UserPickerCombobox.svelte";

   type Props = {
       agentId: string;
   };

   let { agentId }: Props = $props();

   let insts = $derived(useAgentInstances(agentId));
   let selected = $state<string | null>(null);
   let content = $state("");
   let originalContent = $state("");
   let loadingFiles = $state(false);
   let addUserId = $state("");

   // Derived existing IDS for easy lookup
   let existingIDs = $derived(new Set(insts.instances.map(i => i.user_id)));

   $effect(() => {
       if (selected) {
           let cancelled = false;
           loadingFiles = true;
           insts.getFiles(selected).then(files => {
               if (cancelled) return;
               const userFile = files.find(f => f.file_name === "USER.md");
               const c = userFile?.content ?? "";
               content = c;
               originalContent = c;
           }).catch(err => {
               console.error(err);
           }).finally(() => {
               if (!cancelled) loadingFiles = false;
           });

           return () => { cancelled = true; };
       }
   });

   async function handleSave() {
       if (!selected) return;
       try {
           await insts.setFile(selected, "USER.md", content);
           originalContent = content;
       } catch (err) {
           console.error(err);
       }
   }

   function handleAddUser(val: string) {
       addUserId = val;
       if (val && !existingIDs.has(val)) {
           selected = val;
           content = "";
           originalContent = "";
       } else if (val && existingIDs.has(val)) {
           selected = val;
       }
   }

   let isDirty = $derived(content !== originalContent);

   function getDisplayName(i: UserInstance): string {
       return i.metadata?.display_name || i.metadata?.chat_title || i.user_id;
   }

   function formatRelative(iso: string | undefined): string {
       if (!iso) return "";
       const d = new Date(iso);
       const now = Date.now();
       const diff = now - d.getTime();
       if (diff < 60_000) return "just now";
       if (diff < 3_600_000) return Math.floor(diff / 60_000) + "m ago";
       if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + "h ago";
       if (diff < 604_800_000) return Math.floor(diff / 86_400_000) + "d ago";
       return d.toLocaleDateString();
   }
</script>

<div class="relative z-20 group h-full flex flex-col p-6 rounded-3xl bg-gradient-to-br from-[#030014]/80 to-[#1a0033]/40 backdrop-blur-3xl border border-white/5 space-y-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 hover:shadow-[inset_0_2px_30px_rgba(16,185,129,0.1),0_0_40px_rgba(16,185,129,0.2)] hover:border-emerald-500/30 mt-6">
  <!-- Ambient Neon Corner Glows -->
  <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
  <div class="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>

  <!-- Animated cyber background grid mask -->
  <div class="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none mix-blend-screen">
    <div class="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,#000_80%,transparent_100%)] opacity-80"></div>
  </div>

  <div class="relative z-10 flex items-center justify-between border-b border-white/10 pb-6 mb-6">
      <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Users class="h-4 w-4 text-emerald-500 animate-[pulse_3s_ease-in-out_infinite]" />
          </div>
          <div>
              <h3 class="text-xs font-black text-white/80 uppercase tracking-[0.3em] text-shadow-sm">Instances</h3>
              <p class="text-[10px] text-white/40 mt-1">Configure individual user context and variables (USER.md).</p>
          </div>
      </div>
  </div>

  <div class="relative z-10 flex-1">
      {#if insts.loading}
          <div class="flex items-center justify-center py-20">
              <Loader2 class="h-6 w-6 animate-spin text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </div>
      {:else}
           <div class="flex h-[600px] gap-6 mt-2">
               <!-- Instance List Sidebar -->
               <div class="w-64 shrink-0 flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                   <div class="p-4 border-b border-white/5 bg-white/[0.02]">
                       <UserPickerCombobox 
                           bind:value={addUserId}
                           onChange={handleAddUser}
                           placeholder="Select Contact..."
                       />
                   </div>
                   
                   <div class="flex-1 overflow-y-auto scroller-no-scrollbar p-2 space-y-1">
                       {#if insts.instances.length === 0}
                           <div class="flex flex-col items-center justify-center py-10 text-center gap-2">
                               <Users class="h-6 w-6 text-white/20" />
                               <p class="text-[10px] font-bold uppercase tracking-widest text-white/30">No active instances yet.</p>
                           </div>
                       {/if}

                       {#each insts.instances as inst}
                           <button 
                               onclick={() => selected = inst.user_id}
                               class={`w-full flex flex-col items-start px-4 py-3 rounded-xl text-left transition-all duration-300 ${selected === inst.user_id ? 'bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'}`}
                           >
                               <span class={`text-[13px] font-bold truncate w-full transition-colors ${selected === inst.user_id ? 'text-emerald-400' : 'text-white/80'}`}>{getDisplayName(inst)}</span>
                               {#if getDisplayName(inst) !== inst.user_id}
                                   <span class="text-[9px] font-mono text-white/30 truncate w-full">{inst.user_id}</span>
                               {/if}
                               <div class="flex items-center gap-2 mt-2">
                                   {#if inst.file_count > 0}
                                       <span class={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${selected === inst.user_id ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10 text-white/50 border border-white/10'}`}>{inst.file_count} file(s)</span>
                                   {/if}
                                   {#if inst.last_seen_at}
                                       <span class="text-[9px] text-white/40 flex items-center gap-1 font-bold">{formatRelative(inst.last_seen_at)}</span>
                                   {/if}
                               </div>
                           </button>
                       {/each}
                   </div>
               </div>

               <!-- Editor Area -->
               <div class="flex-1 flex flex-col rounded-2xl border border-white/10 bg-[#030014]/90 overflow-hidden relative shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)]">
                   {#if !selected}
                       <div class="flex-1 flex flex-col items-center justify-center text-white/30 text-[10px] font-bold uppercase tracking-widest gap-4">
                           <div class="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
                              <FileText class="h-6 w-6 opacity-50" />
                           </div>
                           Select an instance from the sidebar to view or edit USER.md
                       </div>
                   {:else}
                       <div class="h-14 border-b border-white/10 bg-black/60 flex items-center justify-between px-5">
                           <div class="flex items-center gap-3">
                               <FileText class="h-4 w-4 text-emerald-400" />
                               <span class="text-sm font-bold text-white tracking-wide">USER.md</span>
                               <span class="text-xs text-white/40 font-mono">— {selected}</span>
                               {#if isDirty}
                                   <span class="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" title="Unsaved changes"></span>
                               {/if}
                           </div>
                           <button 
                               onclick={handleSave}
                               disabled={!isDirty || insts.saving}
                               class="relative group h-9 px-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-400 ml-2 overflow-hidden"
                           >
                               <div class="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite] opacity-60"></div>
                               {#if insts.saving}
                                   <Loader2 class="h-4 w-4 animate-spin relative z-10" />
                               {:else}
                                   <Save class="h-4 w-4 relative z-10" strokeWidth={2.5} />
                               {/if}
                               <span class="relative z-10">Save Edit</span>
                           </button>
                       </div>
                       <div class="flex-1 relative group">
                           {#if loadingFiles}
                               <div class="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm">
                                   <Loader2 class="h-8 w-8 animate-spin text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                               </div>
                           {/if}
                           <div class="absolute inset-0 border-2 border-transparent group-focus-within:border-emerald-500/50 pointer-events-none transition-colors z-20 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] group-focus-within:shadow-[inset_0_0_20px_rgba(16,185,129,0.3),0_0_15px_rgba(16,185,129,0.2)]"></div>
                           <textarea 
                               bind:value={content}
                               spellcheck="false"
                               placeholder="(empty)"
                               class="absolute inset-0 w-full h-full resize-none bg-transparent p-5 font-mono text-[13px] text-emerald-400 outline-none leading-relaxed scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent z-10 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"
                           ></textarea>
                       </div>
                   {/if}
               </div>
           </div>
      {/if}
  </div>
</div>
