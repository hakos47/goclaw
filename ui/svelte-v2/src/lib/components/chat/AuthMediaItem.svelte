<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Image as ImageIcon, FileText, Download, Loader2 } from "lucide-svelte";
  import { useHttp } from "../../state/ws.svelte";

  let { item } = $props<{ item: any }>();
  const api = useHttp();

  let blobUrl = $state("");
  let loading = $state(true);
  let error = $state(false);

  function getMediaPath(path: string) {
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    
    let cleanPath = path.startsWith('/') ? path.substring(1) : path;
    if (!cleanPath.startsWith('v1/files/')) {
        cleanPath = `v1/files/${cleanPath}`;
    }
    return `/${cleanPath}`;
  }

  onMount(async () => {
    if (item.path.startsWith('http') || item.path.startsWith('blob:')) {
      blobUrl = item.path;
      loading = false;
      return;
    }

    try {
      const urlPath = getMediaPath(item.path);
      const blob = await api.fetchBlob(urlPath);
      blobUrl = URL.createObjectURL(blob);
    } catch (e) {
      console.error("Failed to load media:", e);
      error = true;
    } finally {
      loading = false;
    }
  });

  onDestroy(() => {
    if (blobUrl && !item.path.startsWith('http') && !item.path.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
  });
</script>

<div class="relative group/media overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-inner max-w-xs flex-shrink-0 isolate">
  <!-- Hover glow -->
  <div class="absolute inset-0 bg-goclaw-neon-purple/5 opacity-0 group-hover/media:opacity-100 transition-opacity z-10 pointer-events-none"></div>
  
  {#if item.mimeType?.startsWith('image/') || item.kind === 'image'}
    {#if loading}
      <div class="w-full h-48 flex items-center justify-center bg-black/20">
        <Loader2 class="w-6 h-6 animate-spin text-goclaw-neon-purple/50" />
      </div>
    {:else if error}
      <div class="w-full h-48 flex flex-col items-center justify-center bg-black/20 text-red-400 gap-2">
        <ImageIcon class="w-6 h-6 opacity-50" />
        <span class="text-[10px] uppercase font-mono tracking-widest">Image Error</span>
      </div>
    {:else}
      <a href={blobUrl} target="_blank" rel="noopener noreferrer" class="block relative z-20">
        <img 
          src={blobUrl} 
          alt={item.fileName || "Attached Image"} 
          class="w-full h-auto max-h-48 object-cover opacity-80 group-hover/media:opacity-100 transition-opacity"
        />
        <div class="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur border border-white/10 text-white/70 opacity-0 group-hover/media:opacity-100 transition-opacity">
            <ImageIcon class="w-3 h-3" />
        </div>
      </a>
    {/if}
  {:else}
    <a href={blobUrl || '#'} target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors relative z-20 w-full" download={item.fileName}>
      <div class="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 group-hover/media:text-goclaw-neon-purple transition-colors">
        {#if loading}
          <Loader2 class="w-4 h-4 animate-spin" />
        {:else}
          <FileText class="w-4 h-4" />
        {/if}
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
