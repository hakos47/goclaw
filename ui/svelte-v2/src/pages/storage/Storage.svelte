<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { HardDrive, Upload, RefreshCw, Info } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import { formatSize, buildTree, mergeSubtree, setNodeLoading, isTextFile } from "$lib/file-helpers";
  import FileBrowser from "$lib/components/shared/file-browser/FileBrowser.svelte";
  import FileUploadDialog from "$lib/components/shared/FileUploadDialog.svelte";
  import ConfirmDialog from "$lib/components/shared/ConfirmDialog.svelte";
  import PageHeader from "$lib/components/shared/PageHeader.svelte";
  import { useStorage, useStorageSize, type StorageFileContent } from "./hooks/use-storage.svelte";

  let storage = useStorage();
  let sizeStore = useStorageSize();

  let tree = $derived(buildTree(storage.files));
  let activePath = $state<string | null>(null);
  let fileContent = $state<StorageFileContent | null>(null);
  let contentLoading = $state(false);

  let deleteTarget = $state<{ path: string; isDir: boolean } | null>(null);
  let deleting = $state(false);
  let uploadOpen = $state(false);
  let uploadFolder = $state("");

  onMount(() => {
    storage.listFiles();
    sizeStore.refreshSize();
  });

  onDestroy(() => {
    sizeStore.cleanup();
  });

  async function handleLoadMore(path: string) {
    const children = await storage.loadSubtree(path);
    const existingPaths = new Set(storage.files.map(f => f.path));
    const newFiles = children.filter(c => !existingPaths.has(c.path));
    storage.appendFiles(newFiles);
  }

  const fileSizeMap = $derived(
    new Map(storage.files.filter((f) => !f.isDir).map((f) => [f.path, f.size]))
  );

  async function handleSelect(path: string) {
    activePath = path;
    if (isTextFile(path)) {
      contentLoading = true;
      try {
        const res = await storage.readFile(path);
        fileContent = res;
      } catch {
        fileContent = null;
      } finally {
        contentLoading = false;
      }
    } else {
      const size = fileSizeMap.get(path) ?? 0;
      fileContent = { content: "", path, size };
    }
  }

  function handleDeleteRequest(path: string, isDir: boolean) {
    deleteTarget = { path, isDir };
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleting = true;
    try {
      await storage.deleteFile(deleteTarget.path);
      if (activePath === deleteTarget.path || (deleteTarget.isDir && activePath?.startsWith(deleteTarget.path + "/"))) {
        activePath = null;
        fileContent = null;
      }
      await storage.listFiles({ silent: true });
      sizeStore.refreshSize();
    } finally {
      deleting = false;
      deleteTarget = null;
    }
  }

  async function handleDownload(path: string) {
    try {
      const blob = await storage.fetchRawBlob(path, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = path.split("/").pop() ?? "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    }
  }

  function handleFetchBlob(path: string) {
    return storage.fetchRawBlob(path, false);
  }

  function handleRefresh() {
    storage.listFiles();
    sizeStore.refreshSize();
  }

  const activeFolder = $derived.by(() => {
    if (!activePath) return "";
    const idx = activePath.lastIndexOf("/");
    return idx > 0 ? activePath.slice(0, idx) : "";
  });

  async function handleUploadFile(file: File) {
    await storage.uploadFile(file, uploadFolder);
    handleRefresh();
  }

  async function handleMove(fromPath: string, toFolder: string) {
    const fileName = fromPath.split("/").pop() ?? fromPath;
    const newPath = toFolder ? `${toFolder}/${fileName}` : fileName;
    if (fromPath === newPath) return;
    try {
      await storage.moveFile(fromPath, toFolder);
      if (activePath === fromPath || activePath?.startsWith(fromPath + "/")) {
        activePath = null;
        fileContent = null;
      }
      storage.listFiles({ silent: true });
    } catch {
      console.error("Move failed");
    }
  }

  let sizeDescription = $derived.by(() => {
    if (!storage.baseDir) return $_('storage.description', {default: "Manage your agent data"});
    const sizeStr = sizeStore.loading ? `${formatSize(sizeStore.totalSize)}...` : formatSize(sizeStore.totalSize);
    return `${storage.baseDir} (${sizeStr})`;
  });

</script>

<div class="h-full flex flex-col p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
  <!-- Bento Header -->
  <div class="flex items-center justify-between mb-8 bg-[#050510]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.05)] relative overflow-hidden">
    <div class="absolute -top-24 -left-24 w-64 h-64 bg-goclaw-neon-purple/20 blur-[80px] pointer-events-none rounded-full"></div>
    <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full"></div>

    <div class="flex items-center gap-5 relative z-10">
      <div class="h-14 w-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden group">
        <div class="absolute inset-0 bg-goclaw-neon-purple/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <HardDrive class="h-6 w-6 text-white group-hover:text-goclaw-neon-purple transition-colors drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
      </div>
      <div>
        <h1 class="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">
          {$_('storage.title', {default: "Storage"})}
        </h1>
        <div class="flex items-center gap-2 mt-1">
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
            {sizeDescription}
          </p>
          {#if sizeStore.cached}
            <Info class="h-3 w-3 text-white/30" title="Size might be cached" />
          {/if}
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3 relative z-10">
      <button 
        onclick={() => { uploadFolder = activeFolder; uploadOpen = true; }}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
      >
        <Upload class="h-4 w-4 text-emerald-400 group-hover:drop-shadow-[0_0_5px_rgba(16,185,129,0.8)] transition-all" />
        <span class="text-[10px] font-black uppercase tracking-widest text-white">Upload</span>
      </button>

      <button 
        onclick={handleRefresh} 
        disabled={storage.loading}
        class="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] disabled:opacity-50"
      >
        <RefreshCw class="h-4 w-4 text-white/70 group-hover:text-white transition-all {storage.loading ? 'animate-spin' : ''}" />
        <span class="text-[10px] font-black uppercase tracking-widest text-white/80">Refresh</span>
      </button>
    </div>
  </div>

  <!-- Browser Area -->
  <div class="flex-1 min-h-0 relative z-10">
    <FileBrowser
      {tree}
      filesLoading={storage.loading}
      {activePath}
      onSelect={handleSelect}
      {contentLoading}
      {fileContent}
      onDelete={handleDeleteRequest}
      onLoadMore={handleLoadMore}
      onMove={handleMove}
      onDownload={handleDownload}
      fetchBlob={handleFetchBlob}
      showSize={true}
    />
  </div>
</div>

<FileUploadDialog
  open={uploadOpen}
  onClose={() => uploadOpen = false}
  onUpload={handleUploadFile}
  title={$_('storage.upload.title', {default: "Upload File"})}
  description={uploadFolder ? `Target: ${uploadFolder}/` : 'Root Directory'}
/>

{#if deleteTarget}
  <ConfirmDialog
    open={true}
    title={deleteTarget.isDir ? $_('storage.delete.folderTitle', {default: "Delete Folder"}) : $_('storage.delete.fileTitle', {default: "Delete File"})}
    description={`Are you sure you want to delete ${deleteTarget.path.split('/').pop()}? This action cannot be undone.`}
    confirmText={deleting ? $_('storage.delete.deleting', {default: "Deleting..."}) : $_('storage.delete.confirmLabel', {default: "Delete"})}
    cancelText={$_('common.cancel', {default: "Cancel"})}
    variant="destructive"
    onConfirm={handleDeleteConfirm}
    onCancel={() => { if (!deleting) deleteTarget = null; }}
  />
{/if}
