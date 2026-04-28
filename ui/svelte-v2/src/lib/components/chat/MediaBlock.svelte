<script lang="ts">
  import type { MediaItem } from "../../types/chat";
  import { Image as ImageIcon, FileText, Download } from "lucide-svelte";
  import { cn } from "../../utils";

  let { items = [] } = $props<{ items: MediaItem[] }>();

  // A helper to get the full URL if needed, assuming path is relative or absolute
  function getMediaUrl(path: string) {
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    return `http://127.0.0.1:8081${path.startsWith('/') ? '' : '/'}${path}`;
  }
</script>

{#if items.length > 0}
  <div class="flex flex-wrap gap-2 mt-2 w-full">
    {#each items as item}
      <div class="relative group/media overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-inner max-w-xs flex-shrink-0 isolate">
        
        <!-- Hover glow -->
        <div class="absolute inset-0 bg-goclaw-neon-purple/5 opacity-0 group-hover/media:opacity-100 transition-opacity z-10 pointer-events-none"></div>
        
        {#if item.mimeType?.startsWith('image/') || item.kind === 'image'}
          <a href={getMediaUrl(item.path)} target="_blank" rel="noopener noreferrer" class="block relative z-20">
            <img 
              src={getMediaUrl(item.path)} 
              alt={item.fileName || "Attached Image"} 
              class="w-full h-auto max-h-48 object-cover opacity-80 group-hover/media:opacity-100 transition-opacity"
            />
            <div class="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur border border-white/10 text-white/70 opacity-0 group-hover/media:opacity-100 transition-opacity">
                <ImageIcon class="w-3 h-3" />
            </div>
          </a>
        {:else}
          <a href={getMediaUrl(item.path)} target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors relative z-20 w-full">
            <div class="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 group-hover/media:text-goclaw-neon-purple transition-colors">
              <FileText class="w-4 h-4" />
            </div>
            <div class="flex flex-col min-w-0 flex-1">
              <span class="text-xs font-bold text-white/80 truncate group-hover/media:text-white transition-colors">
                {item.fileName || item.path.split('/').pop() || 'Attachment'}
              </span>
              {#if item.size}
                <span class="text-[10px] text-white/40 font-mono">{(item.size / 1024).toFixed(1)} KB</span>
              {/if}
            </div>
            <Download class="w-4 h-4 text-white/20 group-hover/media:text-goclaw-neon-purple/80 transition-colors shrink-0" />
          </a>
        {/if}
      </div>
    {/each}
  </div>
{/if}
