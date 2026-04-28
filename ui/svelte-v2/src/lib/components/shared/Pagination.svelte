<script lang="ts">
  import { ChevronLeft, ChevronRight } from "lucide-svelte";

  let {
    page = 1,
    pageSize = 50,
    total = 0,
    totalPages = 1,
    onPageChange,
    onPageSizeChange
  }: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
  } = $props();

  let sizes = [10, 20, 50, 100];
</script>

<div class="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.01]">
  <div class="flex flex-1 justify-between sm:hidden">
    <button
      class="relative inline-flex items-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none transition-colors"
      disabled={page <= 1}
      onclick={() => onPageChange(page - 1)}
    >
      Previous
    </button>
    <button
      class="relative ml-3 inline-flex items-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none transition-colors"
      disabled={page >= totalPages}
      onclick={() => onPageChange(page + 1)}
    >
      Next
    </button>
  </div>
  <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
    <div class="flex items-center gap-4">
      <p class="text-sm text-white/60">
        Showing
        <span class="font-medium text-white/90">{(page - 1) * pageSize + 1}</span>
        to
        <span class="font-medium text-white/90">{Math.min(page * pageSize, total)}</span>
        of
        <span class="font-medium text-white/90">{total}</span>
        results
      </p>
      <div class="flex items-center gap-2">
        <span class="text-sm text-white/60">Rows per page:</span>
        <select
          class="h-8 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-white/90 focus:border-goclaw-neon-purple focus:outline-none focus:ring-1 focus:ring-goclaw-neon-purple"
          value={pageSize}
          onchange={(e) => onPageSizeChange(parseInt(e.currentTarget.value))}
        >
          {#each sizes as size}
            <option value={size} class="bg-[#0f1115] text-white">{size}</option>
          {/each}
        </select>
      </div>
    </div>
    <div>
      <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
        <button
          class="relative inline-flex items-center rounded-l-md px-2 py-2 text-white/60 ring-1 ring-inset ring-white/10 hover:bg-white/5 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          disabled={page <= 1}
          onclick={() => onPageChange(page - 1)}
        >
          <span class="sr-only">Previous</span>
          <ChevronLeft class="h-4 w-4" />
        </button>
        <div class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10">
          {page} / {totalPages}
        </div>
        <button
          class="relative inline-flex items-center rounded-r-md px-2 py-2 text-white/60 ring-1 ring-inset ring-white/10 hover:bg-white/5 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          disabled={page >= totalPages}
          onclick={() => onPageChange(page + 1)}
        >
          <span class="sr-only">Next</span>
          <ChevronRight class="h-4 w-4" />
        </button>
      </nav>
    </div>
  </div>
</div>
