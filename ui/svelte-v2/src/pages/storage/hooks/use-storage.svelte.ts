import { useHttp } from "$lib/state/ws.svelte";

export interface StorageFile {
  path: string;
  name: string;
  isDir: boolean;
  size: number;
  hasChildren?: boolean;
  protected: boolean;
}

export interface StorageListResponse {
  files: StorageFile[];
  baseDir: string;
}

export interface StorageFileContent {
  content: string;
  path: string;
  size: number;
}

export const storageState = $state({
  files: [] as StorageFile[],
  baseDir: "",
  loading: false,
  error: null as string | null,
});

export const storageSizeState = $state({
  totalSize: 0,
  fileCount: 0,
  loading: false,
  cached: false,
  abortController: null as AbortController | null,
});

export function useStorage() {
  const http = useHttp();

  const listFiles = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) storageState.loading = true;
    storageState.error = null;
    try {
      const res = await http.get<StorageListResponse>("/v1/storage/files");
      storageState.files = res.files ?? [];
      storageState.baseDir = res.baseDir ?? "";
    } catch (err: any) {
      console.error("Failed to load files", err);
      storageState.error = err.message || "Failed to load files";
    } finally {
      if (!opts?.silent) storageState.loading = false;
    }
  };

  const loadSubtree = async (path: string): Promise<StorageFile[]> => {
    try {
      const res = await http.get<StorageListResponse>("/v1/storage/files", { path });
      return res.files ?? [];
    } catch (err) {
      console.error(`Failed to load subtree for path: ${path}`, err);
      return [];
    }
  };

  const readFile = async (path: string): Promise<StorageFileContent> => {
    return http.get<StorageFileContent>(`/v1/storage/files/${encodeURIComponent(path)}`);
  };

  const deleteFile = async (path: string) => {
    await http.delete<{ status: string }>(`/v1/storage/files/${encodeURIComponent(path)}`);
  };

  const fetchRawBlob = async (path: string, download?: boolean): Promise<Blob> => {
    const params: Record<string, string> = { raw: "true" };
    if (download) params.download = "true";
    return http.fetchBlob(`/v1/storage/files/${encodeURIComponent(path)}`, params);
  };

  const moveFile = async (fromPath: string, toPath: string) => {
    await http.put(`/v1/storage/move?from=${encodeURIComponent(fromPath)}&to=${encodeURIComponent(toPath)}`);
  };

  const uploadFile = async (file: File, folder: string = "") => {
    const params: Record<string, string> = {};
    if (folder) params["path"] = folder;
    const fd = new FormData();
    fd.append("file", file);
    await http.upload(`/v1/storage/files?` + new URLSearchParams(params).toString(), fd);
  };

  const appendFiles = (newFiles: StorageFile[]) => {
    storageState.files = [...storageState.files, ...newFiles];
  };

  return {
    get files() { return storageState.files; },
    get baseDir() { return storageState.baseDir; },
    get loading() { return storageState.loading; },
    get error() { return storageState.error; },
    listFiles,
    loadSubtree,
    readFile,
    deleteFile,
    fetchRawBlob,
    moveFile,
    uploadFile,
    appendFiles,
  };
}

export function useStorageSize() {
  const http = useHttp();

  const fetchSize = async () => {
    if (storageSizeState.abortController) {
      storageSizeState.abortController.abort();
    }
    const controller = new AbortController();
    storageSizeState.abortController = controller;

    storageSizeState.loading = true;
    storageSizeState.totalSize = 0;
    storageSizeState.fileCount = 0;

    try {
      const res = await http.streamFetch("/v1/storage/size", controller.signal);
      if (!res.body) {
        storageSizeState.loading = false;
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) {
              storageSizeState.totalSize = data.total;
              storageSizeState.fileCount = data.files;
              storageSizeState.loading = false;
              storageSizeState.cached = !!data.cached;
            } else {
              storageSizeState.totalSize = data.current;
              storageSizeState.fileCount = data.files;
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      storageSizeState.loading = false;
    }
  };

  const cleanup = () => {
    if (storageSizeState.abortController) {
      storageSizeState.abortController.abort();
      storageSizeState.abortController = null;
    }
  };

  return {
    get totalSize() { return storageSizeState.totalSize; },
    get fileCount() { return storageSizeState.fileCount; },
    get loading() { return storageSizeState.loading; },
    get cached() { return storageSizeState.cached; },
    refreshSize: fetchSize,
    cleanup,
  };
}
