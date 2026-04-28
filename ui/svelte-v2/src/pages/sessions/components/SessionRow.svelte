<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import ContextUsageBar from "./ContextUsageBar.svelte";

  let { session, onClick }: { session: any; onClick: () => void } = $props();

  const parseSessionKey = (key: string) => {
    const parts = key.split(':');
    return { scope: parts[0] || key, agentId: parts[1] || 'unknown' };
  };

  const formatRelativeTime = (isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = date.getTime() - Date.now();
    const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
    if (Math.abs(diffDays) < 1) {
      const diffHours = Math.round(diff / (1000 * 60 * 60));
      if (Math.abs(diffHours) < 1) {
        const diffMins = Math.round(diff / (1000 * 60));
        return rtf.format(diffMins, 'minute');
      }
      return rtf.format(diffHours, 'hour');
    }
    return rtf.format(diffDays, 'day');
  };

  let parsed = $derived(parseSessionKey(session.key));
</script>

<tr
  class="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.02]"
  onclick={onClick}
>
  <td class="px-4 py-3">
    <div class="text-sm font-medium text-white/90">
      {session.metadata?.chat_title || session.metadata?.display_name || session.label || parsed.scope}
    </div>
    <div class="flex items-center gap-1.5 text-xs text-white/50">
      {session.metadata?.username ? `@${session.metadata.username}` : session.key}
      {#if session.channel && session.channel !== "ws"}
        <Badge variant="secondary" class="text-[10px] px-1.5 py-0 h-4 leading-none bg-white/10 text-white/70 border-white/10">{session.channel}</Badge>
      {/if}
    </div>
  </td>
  <td class="px-4 py-3">
    <Badge variant="outline" class="border-white/10 text-white/70 bg-white/5">{session.agentName || parsed.agentId}</Badge>
  </td>
  <td class="px-4 py-3">
    <ContextUsageBar
      estimatedTokens={session.estimatedTokens ?? 0}
      contextWindow={session.contextWindow ?? 0}
      compactionCount={session.compactionCount ?? 0}
    />
  </td>
  <td class="px-4 py-3 text-right text-sm font-mono text-white/70">{session.messageCount || 0}</td>
  <td class="px-4 py-3 text-right text-sm text-white/50 whitespace-nowrap">
    {formatRelativeTime(session.updated)}
  </td>
</tr>
