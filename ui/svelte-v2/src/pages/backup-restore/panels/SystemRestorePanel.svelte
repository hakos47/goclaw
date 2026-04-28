<script lang="ts">
  import { ServerCrash, Upload, AlertTriangle } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { SseProgress } from "$lib/state/sse.svelte";
  import { useHttp } from "$lib/state/ws.svelte";
  import OperationProgress from "$lib/components/shared/OperationProgress.svelte";
  import ConfirmDialog from "$lib/components/shared/ConfirmDialog.svelte";
  import Switch from "$lib/components/shared/Switch.svelte";

  const http = useHttp();
  const sse = new SseProgress(() => http.getAuthHeaders());

  let file = $state<File | null>(null);
  let skipDb = $state(false);
  let skipFiles = $state(false);
  let dryRun = $state(false);
  let showConfirm = $state(false);

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      file = input.files[0];
    }
  }

  function confirmRestore() {
    if (!file) return;
    
    const params = new URLSearchParams({ stream: "true" });
    if (skipDb) params.set("skip_db", "true");
    if (skipFiles) params.set("skip_files", "true");
    if (dryRun) params.set("dry_run", "true");

    const url = `${window.location.origin}/v1/system/restore?${params}`;
    const formData = new FormData();
    formData.append("archive", file);

    sse.startPost(url, formData);
  }
</script>

<div class="space-y-6">
  <div class="mb-4">
    <h2 class="text-lg font-black tracking-widest uppercase text-white drop-shadow-md flex items-center gap-2">
      <ServerCrash class="h-5 w-5 text-rose-500" />
      {$_("backup.systemRestore.title")}
    </h2>
    <p class="text-[10px] text-white/50 uppercase tracking-widest mt-1">{$_("backup.systemRestore.description")}</p>
  </div>

  <div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-4 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
    <AlertTriangle class="h-6 w-6 text-rose-500 shrink-0" />
    <p class="text-xs font-mono text-rose-400 leading-relaxed uppercase tracking-widest">
      {$_("backup.systemRestore.warning")}
    </p>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <div class="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
      <Switch bind:checked={dryRun} disabled={sse.status === "running"} />
      <span class="text-[10px] font-bold text-white/70 uppercase tracking-widest">{$_("backup.systemRestore.dryRun")}</span>
    </div>
    
    <div class="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
      <Switch bind:checked={skipDb} disabled={sse.status === "running"} />
      <span class="text-[10px] font-bold text-white/70 uppercase tracking-widest">{$_("backup.systemRestore.skipDb")}</span>
    </div>
    
    <div class="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
      <Switch bind:checked={skipFiles} disabled={sse.status === "running"} />
      <span class="text-[10px] font-bold text-white/70 uppercase tracking-widest">{$_("backup.systemRestore.skipFiles")}</span>
    </div>
  </div>

  <div class="flex flex-col sm:flex-row items-center gap-4">
    <label class="flex-1 relative w-full sm:w-auto h-14 border-2 border-dashed border-white/20 hover:border-rose-500/50 rounded-xl flex items-center justify-center cursor-pointer transition-colors bg-black/20 group">
      <input 
        type="file" 
        accept=".tar.gz" 
        class="absolute inset-0 opacity-0 cursor-pointer"
        onchange={handleFileChange}
        disabled={sse.status === "running"}
      />
      <div class="flex items-center gap-3 text-white/50 group-hover:text-rose-400 transition-colors">
        <Upload class="h-4 w-4" />
        <span class="font-mono text-[10px] uppercase tracking-widest truncate max-w-xs">
          {file ? file.name : $_("backup.systemRestore.selectFile")}
        </span>
      </div>
    </label>

    <button
      onclick={() => showConfirm = true}
      disabled={!file || sse.status === "running"}
      class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 h-14 rounded-xl bg-rose-500/10 border border-rose-500/50 text-rose-400 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-500/20 hover:border-rose-500 transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.2)]"
    >
      <ServerCrash class="h-4 w-4" />
      <span>{sse.status === "running" ? $_("backup.systemRestore.restoring") : $_("backup.systemRestore.startRestore")}</span>
    </button>
  </div>

  {#if sse.steps.length > 0}
    <div class="mt-8">
      <OperationProgress steps={sse.steps} elapsed={sse.elapsed} />
    </div>
  {/if}

  <ConfirmDialog
    open={showConfirm}
    onOpenChange={(v) => showConfirm = v}
    title={$_("backup.systemRestore.confirmTitle")}
    description={$_("backup.systemRestore.confirmDesc")}
    confirmLabel={$_("backup.systemRestore.startRestore")}
    variant="destructive"
    onConfirm={confirmRestore}
  />
</div>
