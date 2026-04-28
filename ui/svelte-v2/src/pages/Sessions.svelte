<script lang="ts">
  import { History, Target, LifeBuoy, Briefcase, TrendingUp } from "lucide-svelte";
  import PageHeader from "$lib/components/shared/PageHeader.svelte";
  import SearchInput from "$lib/components/shared/SearchInput.svelte";
  import EmptyState from "$lib/components/shared/EmptyState.svelte";
  import TableSkeleton from "$lib/components/shared/TableSkeleton.svelte";
  import Pagination from "$lib/components/shared/Pagination.svelte";
  import SessionRow from "./sessions/components/SessionRow.svelte";
  import SessionDetail from "./sessions/SessionDetail.svelte";
  import { useWsCall, wsState } from "$lib/state/ws.svelte";
  import { useSessions } from "./sessions/hooks/use-sessions.svelte";

  // Reactively derive category from current URL search params
  let category = $derived.by(() => {
    const params = new URLSearchParams(wsState.currentSearch);
    return params.get("category") || undefined;
  });
  
  let search = $state("");
  let page = $state(1);
  let pageSize = $state(50);

  // Parse detail key from URL path (/sessions/{key})
  let detailKey = $derived.by(() => {
    const parts = wsState.currentPath.split('/');
    if (parts.length > 2 && parts[1] === 'sessions') {
      return decodeURIComponent(parts.slice(2).join('/'));
    }
    return null;
  });

  // Sticky category: remember the last category so navigating into detail doesn't lose it
  let lastCategory = $state<string | undefined>(undefined);
  $effect(() => {
    if (!detailKey && category !== undefined) {
      lastCategory = category;
    }
  });
  // Effective category is the URL one when on list, or the remembered one when on detail
  let effectiveCategory = $derived(detailKey ? lastCategory : category);

  const sessionsCall = useWsCall<any>("sessions.list");
  const { preview, deleteSession, resetSession, patchSession } = useSessions();

  // Re-fetch whenever category, page, pageSize or connection state changes
  $effect(() => {
    const connected = wsState.connected;
    const cat = effectiveCategory;
    const p = page;
    const ps = pageSize;
    if (!connected) return;
    sessionsCall.call({
      category: cat,
      limit: ps,
      offset: (p - 1) * ps
    });
  });

  // Helper for manual re-fetches after mutations
  const fetchSessions = () => {
    sessionsCall.call({
      category: effectiveCategory,
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
  };

  let sessions = $derived(sessionsCall.data?.items || sessionsCall.data?.sessions || []);
  let total = $derived(sessionsCall.data?.total || 0);
  let loading = $derived(sessionsCall.loading);

  let totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));

  let categoryLabel = $derived(
    effectiveCategory 
      ? effectiveCategory.charAt(0).toUpperCase() + effectiveCategory.slice(1) + " Sessions" 
      : "Sessions"
  );
  
  let CategoryIcon = $derived(
    effectiveCategory === "inbound" ? Target : 
    effectiveCategory === "support" ? LifeBuoy :
    effectiveCategory === "ops" ? Briefcase :
    effectiveCategory === "evolution" ? TrendingUp : History
  );

  let filtered = $derived(
    sessions.filter((s: any) => {
      const q = search.toLowerCase();
      const meta = s.metadata;
      return (
        s.key.toLowerCase().includes(q) ||
        (s.label ?? "").toLowerCase().includes(q) ||
        (meta?.display_name ?? "").toLowerCase().includes(q) ||
        (meta?.username ?? "").toLowerCase().includes(q) ||
        (meta?.chat_title ?? "").toLowerCase().includes(q)
      );
    })
  );

  let detailSession = $derived.by(() => {
    if (!detailKey) return null;
    const found = sessions.find((s: any) => s.key === detailKey);
    if (found) return found;
    // Fallback: create a placeholder session if we have the key but it's not in the current list page
    // Use a stable object as much as possible to avoid infinite reactive loops
    return { key: detailKey, metadata: {}, messageCount: 0, updated: "2026-01-01T00:00:00Z" };
  });

  const navigateToSession = (key: string) => {
    // Preserve category in URL as search param so navigateBack can restore it
    const categoryParam = effectiveCategory ? `?category=${effectiveCategory}` : '';
    window.history.pushState({}, '', `/sessions/${encodeURIComponent(key)}${categoryParam}`);
    wsState.currentPath = window.location.pathname;
    wsState.currentSearch = window.location.search;
  };

  const navigateBack = () => {
    const url = effectiveCategory ? `/sessions?category=${effectiveCategory}` : "/sessions";
    window.history.pushState({}, '', url);
    wsState.currentPath = window.location.pathname;
    wsState.currentSearch = window.location.search;
  };
</script>

{#if detailKey && detailSession}
  <div class="w-full h-full p-4 sm:p-6 pb-10 overflow-hidden">
    <SessionDetail
      session={detailSession}
      onBack={navigateBack}
      onPreview={preview}
      onDelete={async (key) => {
        await deleteSession(key);
        fetchSessions();
      }}
      onReset={async (key) => {
        await resetSession(key);
        fetchSessions();
      }}
      onPatch={async (key, updates) => {
        await patchSession(key, updates);
        fetchSessions(); // Refresh list to catch updated labels
      }}
    />
  </div>
{:else}
  <div class="h-full overflow-y-auto p-4 sm:p-6 pb-10 w-full relative z-10 custom-scrollbar">
    <PageHeader 
      title={categoryLabel} 
      description={category ? `Manage ${categoryLabel.toLowerCase()} and conversations.` : "System forensics and active conversation streams."} 
      icon={CategoryIcon}
    />

    <div class="mt-8">
      <SearchInput
        bind:value={search}
        placeholder="Search sessions by key, user, or title..."
        class="max-w-sm"
      />
    </div>

    <div class="mt-6">
      {#if loading && sessions.length === 0}
        <TableSkeleton rows={8} />
      {:else if filtered.length === 0}
        <EmptyState
          icon={History}
          title={search ? "No sessions match" : "No sessions found"}
          description={search ? "Try adjusting your search query." : "There are no active sessions to display."}
        />
      {:else}
        <div class="rounded-xl border border-white/10 overflow-hidden bg-black/40 backdrop-blur-md shadow-2xl">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[750px] border-collapse">
              <thead>
                <tr class="border-b border-white/5 bg-white/[0.02]">
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/50">Session</th>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/50">Agent</th>
                  <th class="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-white/50">Context</th>
                  <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-white/50">Messages</th>
                  <th class="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-white/50">Updated</th>
                </tr>
              </thead>
              <tbody>
                {#each filtered as session (session.key)}
                  <SessionRow
                    {session}
                    onClick={() => navigateToSession(session.key)}
                  />
                {/each}
              </tbody>
            </table>
          </div>
          <div class="bg-black/20">
            <Pagination
              {page}
              {pageSize}
              {total}
              {totalPages}
              onPageChange={(p: number) => page = p}
              onPageSizeChange={(s: number) => { pageSize = s; page = 1; }}
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
