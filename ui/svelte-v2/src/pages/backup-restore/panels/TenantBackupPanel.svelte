<script lang="ts">
  import { Users, Download, Upload, AlertTriangle, Play } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { SseProgress } from "$lib/state/sse.svelte";
  import { useHttp } from "$lib/state/ws.svelte";
  import OperationProgress from "$lib/components/shared/OperationProgress.svelte";
  import ConfirmDialog from "$lib/components/shared/ConfirmDialog.svelte";
  import { authState } from "$lib/state/auth.svelte";
  import { toast } from "$lib/components/ui/toast/toast.svelte";

  const http = useHttp();
  const backupSse = new SseProgress(() => http.getAuthHeaders());
  const restoreSse = new SseProgress(() => http.getAuthHeaders());

  let tenantId = $state("");
  let file = $state<File | null>(null);
  let showRestoreConfirm = $state(false);

  let downloadUrl = $derived(backupSse.result?.download_url as string | undefined);
  let downloadName = $derived((backupSse.result?.file_name as string) ?? "tenant-backup.tar.gz");

  let activeOp = $derived(
    backupSse.status === "running" ? "backup" : 
    restoreSse.status === "running" ? "restore" : 
    null
  );

  function startBackup() {
    if (!tenantId) return;
    const url = `${window.location.origin}/v1/system/tenant/backup/${tenantId}?stream=true`;
    backupSse.startPost(url, new FormData());
  }

  async function downloadBackup() {
    if (!downloadUrl) return;
    try {
      const blob = await http.downloadBlob(downloadUrl);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = downloadName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error("Download failed");
    }
  }

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      file = input.files[0];
    }
  }

  function confirmRestore() {
    if (!tenantId || !file) return;
    const url = `${window.location.origin}/v1/system/tenant/restore/${tenantId}?stream=true`;
    const formData = new FormData();
    formData.append("archive", file);
    restoreSse.startPost(url, formData);
  }
</script>

<div class="space-y-8">
  <div>
    <h2 class="text-lg font-black tracking-widest uppercase text-white drop-shadow-md flex items-center gap-2">
      <Users class="h-5 w-5 text-indigo-400" />
      {$_("backup.tenantBackup.title")}
    </h2>
    <p class="text-[10px] text-white/50 uppercase tracking-widest mt-1">{$_("backup.tenantBackup.description")}</p>
  </div>

  <div class="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
    <label class="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3">
      {$_("backup.tenantBackup.tenantSelect")}
    </label>
    <select 
      bind:value={tenantId}
      disabled={activeOp !== null}
      class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
    >
      <option value="" disabled>Select a tenant...</option>
      {#each authState.availableTenants as t}
        <option value={t.id}>{t.name} ({t.slug})</option>
      {/each}
    </select>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    
    <!-- Backup Section -->
    <div class="bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
      <h3 class="text-xs font-bold tracking-widest uppercase text-indigo-400 mb-6 relative z-10 flex items-center gap-2">
        <Download class="h-4 w-4" />
        {$_("backup.tenantBackup.backupSection")}
      </h3>

      <div class="flex-1 flex flex-col justify-center relative z-10">
        {#if backupSse.error}
          <div class="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono uppercase tracking-widest break-words">
            <div class="font-bold mb-1 flex items-center gap-2">
              <XCircle class="h-4 w-4 shrink-0" />
              Error ({backupSse.error.phase}):
            </div>
            <div class="ml-6 opacity-80">{backupSse.error.detail}</div>
          </div>
        {/if}

        {#if backupSse.steps.length > 0}
          <OperationProgress steps={backupSse.steps} elapsed={backupSse.elapsed} class="mb-4" />
        {/if}

        {#if downloadUrl}
          <div class="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center">
            <span class="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Backup Ready</span>
            <button
              onclick={downloadBackup}
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer"
            >
              <Download class="h-3 w-3" /> Download
            </button>
          </div>
        {/if}

        <button
          onclick={startBackup}
          disabled={!tenantId || activeOp !== null}
          class="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all disabled:opacity-50 cursor-pointer mt-auto"
        >
          <Play class="h-4 w-4" />
          <span>{$_("backup.tenantBackup.startBackup")}</span>
        </button>
      </div>
    </div>

    <!-- Restore Section -->
    <div class="bg-black/20 border border-white/5 rounded-3xl p-6 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none"></div>
      <h3 class="text-xs font-bold tracking-widest uppercase text-rose-500 mb-6 relative z-10 flex items-center gap-2">
        <Upload class="h-4 w-4" />
        {$_("backup.tenantBackup.restoreSection")}
      </h3>

      <div class="flex-1 flex flex-col justify-center relative z-10">
        {#if restoreSse.error}
          <div class="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono uppercase tracking-widest break-words">
            <div class="font-bold mb-1 flex items-center gap-2">
              <XCircle class="h-4 w-4 shrink-0" />
              Error ({restoreSse.error.phase}):
            </div>
            <div class="ml-6 opacity-80">{restoreSse.error.detail}</div>
          </div>
        {/if}

        {#if restoreSse.steps.length > 0}
          <OperationProgress steps={restoreSse.steps} elapsed={restoreSse.elapsed} class="mb-4" />
        {/if}

        <label class="w-full mb-4 relative h-14 border-2 border-dashed border-white/20 hover:border-rose-500/50 rounded-xl flex items-center justify-center cursor-pointer transition-colors bg-black/40 group">
          <input 
            type="file" 
            accept=".tar.gz" 
            class="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onchange={handleFileChange}
            disabled={!tenantId || activeOp !== null}
          />
          <div class="flex items-center gap-3 text-white/50 group-hover:text-rose-400 transition-colors">
            <Upload class="h-4 w-4" />
            <span class="font-mono text-[10px] uppercase tracking-widest truncate max-w-[200px]">
              {file ? file.name : "Select Archive"}
            </span>
          </div>
        </label>

        <button
          onclick={() => showConfirm = true}
          disabled={!tenantId || !file || activeOp !== null}
          class="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-500/20 hover:border-rose-500/50 transition-all disabled:opacity-50 cursor-pointer mt-auto"
        >
          <AlertTriangle class="h-4 w-4" />
          <span>{$_("backup.tenantBackup.startRestore")}</span>
        </button>
      </div>
    </div>
  </div>

  <ConfirmDialog
    open={showRestoreConfirm}
    onOpenChange={(v) => showRestoreConfirm = v}
    title="Critical Restore"
    description={$_("backup.tenantBackup.confirmRestore")}
    confirmLabel="Overwrite Tenant Data"
    variant="destructive"
    onConfirm={confirmRestore}
  />
</div>
