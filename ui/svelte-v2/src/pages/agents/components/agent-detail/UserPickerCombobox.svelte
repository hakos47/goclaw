<script lang="ts">
   import { useUserPicker } from "./hooks/use-user-picker.svelte";
   import { Loader2, Search, X } from "lucide-svelte";
   import { fade, slide } from "svelte/transition";
   import { onMount } from "svelte";

   type Props = {
       value: string;
       onChange?: (value: string) => void;
       placeholder?: string;
       className?: string;
       peerKind?: "direct" | "group";
       source?: "contact" | "tenant_user";
       valueMode?: "user_id" | "uuid";
   };

   let { 
       value = $bindable(), 
       onChange, 
       placeholder = "Search...", 
       className = "",
       peerKind,
       source,
       valueMode = "user_id"
   }: Props = $props();

   // Initialize picker once. It will react to peerKind/source changes internally.
   const picker = useUserPicker("", peerKind, source, valueMode);
   
   let isOpen = $state(false);
   let menuRef = $state<HTMLElement | null>(null);

   // Sync initial value to search term if provided
   onMount(() => {
       if (value) {
           picker.search = value;
       }
   });

   function handleSelect(optionValue: string, label: string) {
       value = optionValue;
       onChange?.(optionValue);
       picker.search = optionValue; // Sync the picker search to the selected value/ID
       isOpen = false;
   }

   function handleInput(e: Event) {
       const target = e.target as HTMLInputElement;
       picker.search = target.value;
       // Value is NOT updated here, only searchTerm (picker.search)
       isOpen = true;
   }

   function handleClear() {
       picker.search = "";
       value = "";
       onChange?.("");
       isOpen = true;
   }
</script>

<div class={`relative ${className}`} bind:this={menuRef}>
   <div class="relative flex items-center">
       <Search class="absolute left-3 h-4 w-4 text-white/30 pointer-events-none" />
       <input 
           type="text" 
           value={picker.search}
           oninput={handleInput}
           onfocus={() => isOpen = true}
           {placeholder}
           class="w-full h-9 pl-9 pr-8 rounded-lg bg-black/50 border border-white/10 text-sm text-white placeholder-white/30 focus:border-goclaw-neon-purple outline-none transition-colors shadow-inner" 
       />
       {#if picker.search}
           <button 
               onclick={handleClear} 
               class="absolute right-2.5 h-4 w-4 text-white/30 hover:text-white transition-colors"
           >
               <X class="h-3 w-3" />
           </button>
       {/if}
   </div>

   {#if isOpen}
       <div 
           transition:slide={{ duration: 150, axis: 'y' }}
           class="absolute top-10 left-0 w-[300px] max-w-[100vw] z-50 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
       >
           <div class="max-h-[300px] overflow-y-auto scroller-no-scrollbar py-2">
               {#if picker.loading && picker.options.length === 0}
                    <div class="flex items-center justify-center py-6 text-white/30">
                        <Loader2 class="h-4 w-4 animate-spin" />
                    </div>
               {:else if picker.options.length === 0}
                    <div class="px-4 py-3 text-xs text-white/30 text-center">
                        Sin resultados.
                    </div>
               {:else}
                    {#each picker.options as opt}
                        <button 
                            onclick={() => handleSelect(opt.value, opt.label)}
                            class="w-full text-left px-4 py-2 text-sm text-white hover:bg-goclaw-neon-purple/20 hover:text-goclaw-neon-purple transition-colors truncate border-l-2 border-transparent hover:border-goclaw-neon-purple"
                        >
                            {opt.label}
                        </button>
                    {/each}
               {/if}
           </div>
       </div>
   {/if}
</div>
