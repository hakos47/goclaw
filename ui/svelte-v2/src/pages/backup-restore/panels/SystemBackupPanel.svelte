<script lang="ts">
  import { DatabaseBackup, Download, UploadCloud, History, XCircle } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { SseProgress } from "$lib/state/sse.svelte";
  import { useHttp } from "$lib/state/ws.svelte";
  import { configStore, fetchConfig } from "$lib/state/config.svelte";
  import OperationProgress from "$lib/components/shared/OperationProgress.svelte";
  import BackupPreflightPanel from "./BackupPreflightPanel.svelte";
  import { toast } from "$lib/components/ui/toast/toast.svelte";
  import { onMount } from "svelte";

  interface S3BackupEntry {
    key: string;
    size: number;
    last_modified: string;
  }

  const http = useHttp();
  const sse = new SseProgress(() => http.getAuthHeaders());

  let downloadUrl = $derived(sse.result?.download_url as string | undefined);
  let downloadName = $derived((sse.result?.file_name as string) ?? "backup.tar.gz");
  let backupToken = $derived(downloadUrl ? downloadUrl.split("/").pop() : null);

  let destination = $state<"local" | "s3">("local");
  let s3Configured = $derived(!!configStore.config?.s3?.configured);
  
  let hasCritical = $state(true);

  let s3History = $state<S3BackupEntry[]>([]);
  let loadingHistory = $state(false);

  async function loadHistory() {
    if (!s3Configured) return;
    loadingHistory = true;
    try {
      const res = await http.get<{ backups: S3BackupEntry[] }>("/v1/system/backup/s3/list");
      s3History = res.backups || [];
    } catch (err) {
      console.error(err);
    } finally {
      loadingHistory = false;
    }
  }

  onMount(() => {
    fetchConfig().then(loadHistory);
  });

  function startBackup(toS3 = false) {
    const endpoint = toS3 ? "/v1/system/backup/s3/backup" : "/v1/system/backup";
    const url = `${window.location.origin}${endpoint}?stream=true`;
    sse.startPost(url, new FormData());
  }

  async function downloadArchive() {
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

  function uploadToS3() {
    if (!backupToken) return;
    const url = `${window.location.origin}/v1/system/backup/s3/upload?stream=true&backup_token=${backupToken}`;
    sse.startPost(url, new FormData());
  }
</script>

<div class="space-y-6">
  <div class="mb-6">
    <h2 class="text-lg font-black tracking-widest uppercase text-white drop-shadow-md">{$_("backup.systemBackup.title")}</h2>
    <p class="text-[10px] text-white/50 uppercase tracking-widest mt-1">{$_("backup.systemBackup.description")}</p>
  </div>

  <BackupPreflightPanel bind:hasCritical />

  {#if s3Configured}
    <div class="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
      <label class="text-[10px] font-bold text-white/70 uppercase tracking-widest">
        Destination
      </label>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer group">
          <div class="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center group-hover:border-indigo-400 transition-colors">
            {#if destination === "local"}
              <div class="w-2 h-2 rounded-full bg-indigo-400"></div>
            {/if}
          </div>
          <input type="radio" name="dest" value="local" bind:group={destination} class="hidden" />
          <span class="text-[10px] font-mono uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">Local (Download)</span>
        </label>
        
        <label class="flex items-center gap-2 cursor-pointer group">
          <div class="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center group-hover:border-purple-400 transition-colors">
            {#if destination === "s3"}
              <div class="w-2 h-2 rounded-full bg-purple-400"></div>
            {/if}
          </div>
          <input type="radio" name="dest" value="s3" bind:group={destination} class="hidden" />
          <span class="text-[10px] font-mono uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">S3 Bucket</span>
        </label>
      </div>
    </div>
  {/if}

  <div class="flex flex-wrap gap-4">
    <button
      onclick={() => startBackup(destination === "s3")}
      disabled={sse.status === "running" || hasCritical}
      class="flex items-center justify-center gap-2 px-6 py-4 w-full sm:w-auto rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.2)]"
    >
      {#if destination === "s3"}
        <UploadCloud class="h-4 w-4" />
      {:else}
        <DatabaseBackup class="h-4 w-4" />
      {/if}
      <span>{sse.status === "running" && !backupToken ? $_("backup.systemBackup.generating") : $_("backup.systemBackup.start")}</span>
    </button>
  </div>

  {#if sse.error}
    <div class="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono uppercase tracking-widest break-words">
      <div class="font-bold mb-1 flex items-center gap-2">
        <XCircle class="h-4 w-4 shrink-0" />
        Error ({sse.error.phase}):
      </div>
      <div class="ml-6 opacity-80">{sse.error.detail}</div>
    </div>
  {/if}

  {#if sse.steps.length > 0}
    <div class="mt-6">
      <OperationProgress steps={sse.steps} elapsed={sse.elapsed} />
    </div>
  {/if}

  {#if downloadUrl}
    <div class="mt-8 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
      
      <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-sm font-bold tracking-widest uppercase text-emerald-400 mb-1">
            {$_("backup.systemBackup.downloadReady")}
          </h3>
          {#if sse.result?.file_size}
            <p class="text-[10px] font-mono text-emerald-400/50 uppercase tracking-widest">
              {$_("backup.systemBackup.downloadSize", { values: { size: (sse.result.file_size / 1024 / 1024).toFixed(2) } })}
            </p>
          {/if}
        </div>

        <div class="flex gap-3 w-full sm:w-auto">
          <button
            onclick={downloadArchive}
            class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition-all font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Download class="h-4 w-4" />
            <span>{$_("backup.systemBackup.downloadBtn")}</span>
          </button>
          
          <button
            onclick={uploadToS3}
            disabled={sse.status === "running"}
            class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30 transition-all disabled:opacity-50 font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <UploadCloud class="h-4 w-4" />
            <span>{sse.status === "running" ? $_("backup.systemBackup.uploading") : $_("backup.systemBackup.uploadS3Btn")}</span>
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if s3Configured && s3History.length > 0}
    <div class="mt-8 pt-6 border-t border-white/5 space-y-4">
      <h3 class="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
        <History class="h-4 w-4" />
        S3 Backup History
      </h3>
      
      <div class="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
        <table class="w-full text-left">
          <thead class="bg-white/[0.02] border-b border-white/5 text-[10px] font-bold text-white/50 uppercase tracking-widest">
            <tr>
              <th class="px-4 py-3">File Name</th>
              <th class="px-4 py-3">Size</th>
              <th class="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            {#each s3History as b}
              <tr class="hover:bg-white/[0.02] transition-colors">
                <td class="px-4 py-3 text-[10px] font-mono text-white/80">{b.key.split("/").pop()}</td>
                <td class="px-4 py-3 text-[10px] font-mono text-white/50">{(b.size / 1024 / 1024).toFixed(2)} MB</td>
                <td class="px-4 py-3 text-[10px] font-mono text-white/50">{new Date(b.last_modified).toLocaleString()}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
