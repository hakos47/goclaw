<script lang="ts">
  import { ArrowLeft, Trash2, RotateCcw, Eye, Pencil, Check, X, History } from "lucide-svelte";
  import { untrack } from "svelte";
  import ConfirmDialog from "$lib/components/shared/ConfirmDialog.svelte";
  import ChatMessage from "$lib/components/chat/ChatMessage.svelte";
  import SystemMessageBlock from "./components/SystemMessageBlock.svelte";
  import SummaryBlock from "./components/SummaryBlock.svelte";
  import { Badge } from "$lib/components/ui/badge";
  import { formatTokens } from "$lib/format";
  
  import type { ChatMessage as ChatMessageType } from "$lib/types/chat";
  import { wsState } from "$lib/state/ws.svelte";

  let { session, onBack, onPreview, onDelete, onReset, onPatch } = $props<{
    session: any;
    onBack: () => void;
    onPreview: (key: string) => Promise<{ messages: any[]; summary?: string } | null>;
    onDelete: (key: string) => Promise<void>;
    onReset: (key: string) => Promise<void>;
    onPatch: (key: string, updates: { label?: string }) => Promise<void>;
  }>();

  let messages = $state<ChatMessageType[]>([]);
  let summary = $state<string | null>(null);
  let loading = $state(false);
  let lastLoadedKey = $state<string | null>(null);
  
  let confirmDelete = $state(false);
  let confirmReset = $state(false);
  
  let editingTitle = $state(false);
  let titleDraft = $state("");

  const checkIsSystemMessage = (msg: any): boolean => {
    const c = msg.content?.trimStart() ?? "";
    return c.startsWith("[System Message]") || c.startsWith("[System]");
  };
  
  const checkIsDisplayable = (msg: any): boolean => {
    if (msg.role === "tool") return false;
    if (msg.content?.trim()) return true;
    if (msg.role === "assistant") {
      return !!(msg.toolDetails?.length || msg.thinking?.trim());
    }
    return false;
  };

  const parseSessionKey = (key: string) => {
    const parts = key.split(':');
    return { scope: parts[0] || key, agentId: parts[1] || 'unknown' };
  };

  const messageToTimestamp = (m: any, i: number, len: number) => {
    if (m.created_at) return new Date(m.created_at).getTime();
    return Date.now() - (len - i) * 1000;
  };

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleString();
  };

  let parsed = $derived(parseSessionKey(session.key));
  let displayTitle = $derived(session.metadata?.chat_title || session.metadata?.display_name || session.label || parsed.scope);

  const loadMessages = async (key: string) => {
    if (loading || (lastLoadedKey === key && messages.length > 0)) return;
    loading = true;
    lastLoadedKey = key;
    messages = [];
    try {
      const preview = await onPreview(key);
      if (preview && untrack(() => lastLoadedKey) === key) {
        const allMsgs = preview.messages;
        const toolResultMap = new Map<string, any>();
        for (const m of allMsgs) {
          if (m.role === "tool" && m.tool_call_id) {
            toolResultMap.set(m.tool_call_id, m);
          }
        }
        
        messages = allMsgs.map((m, i) => {
          const chatMsg: ChatMessageType = {
            ...m,
            id: m.id || `msg-${i}`,
            timestamp: messageToTimestamp(m, i, allMsgs.length),
          };
          
          if (m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0) {
            chatMsg.toolDetails = m.tool_calls.map((tc: any) => {
              const toolMsg = toolResultMap.get(tc.id);
              return {
                toolCallId: tc.id,
                runId: "",
                name: tc.name,
                phase: (toolMsg ? "completed" : "calling"),
                startedAt: 0,
                updatedAt: 0,
                arguments: tc.arguments,
                result: toolMsg?.content,
              };
            });
          }
          return chatMsg;
        });
        summary = preview.summary ?? null;
      }
    } catch (err) {
      console.error(err);
    } finally {
      loading = false;
    }
  };

  $effect(() => {
    if (wsState.connected && session.key) {
      loadMessages(session.key);
    }
  });

  const doPatch = async () => {
    await onPatch(session.key, { label: titleDraft });
    editingTitle = false;
  };
</script>

<div class="flex h-full w-full flex-col bg-[#0a0a0a] rounded-2xl border border-white/5 shadow-2xl relative z-10">
  <!-- Header -->
  <div class="flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md p-4 shrink-0 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
    <div class="flex items-center gap-3">
      <button 
        class="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur cursor-pointer"
        onclick={onBack}
      >
        <ArrowLeft size={16} />
      </button>
      <div>
        {#if editingTitle}
          <div class="flex items-center gap-2">
            <input
              type="text"
              class="h-8 w-64 rounded-md border border-white/20 bg-black/50 px-3 text-sm font-medium text-white outline-none focus:border-goclaw-neon-purple focus:ring-1 focus:ring-goclaw-neon-purple"
              bind:value={titleDraft}
              onkeydown={(e) => {
                if (e.key === 'Enter') doPatch();
                if (e.key === 'Escape') editingTitle = false;
              }}
              autofocus
            />
            <button class="p-1.5 rounded bg-goclaw-neon-cyan/20 text-goclaw-neon-cyan hover:bg-cyan-500 hover:text-white transition-all cursor-pointer" onclick={doPatch}>
              <Check size={14} />
            </button>
            <button class="p-1.5 rounded bg-white/5 text-white/40 hover:bg-red-500 hover:text-white transition-all cursor-pointer" onclick={() => editingTitle = false}>
              <X size={14} />
            </button>
          </div>
        {:else}
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <h3
            class="group flex cursor-pointer items-center gap-2 font-bold text-white hover:text-goclaw-neon-purple transition-all text-lg"
            onclick={() => {
              titleDraft = displayTitle;
              editingTitle = true;
            }}
          >
            {displayTitle}
            <Pencil size={12} class="opacity-0 transition-opacity group-hover:opacity-100" />
          </h3>
        {/if}
        <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/50 font-mono tracking-tight uppercase">
          <Badge variant="outline" class="border-white/10 text-white/70 bg-white/5">{session.agentName || parsed.agentId}</Badge>
          <span class="px-2 border-l border-white/10">{session.messageCount || 0} Messages</span>
          <span class="px-2 border-l border-white/10">{formatDate(session.updated)}</span>
          {#if session.inputTokens != null}
            <span class="px-2 border-l border-white/10 text-emerald-400">
              {formatTokens(session.inputTokens)} IN / {formatTokens(session.outputTokens ?? 0)} OUT
            </span>
          {/if}
        </div>
      </div>
    </div>
    
    <div class="flex gap-2">
      <button 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] cursor-pointer"
        onclick={() => confirmReset = true}
      >
        <RotateCcw size={12} /> Reset
      </button>
      <button 
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs font-semibold text-red-400 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10 cursor-pointer"
        onclick={() => confirmDelete = true}
      >
        <Trash2 size={12} /> Delete
      </button>
    </div>
  </div>

  {#if summary}
    <SummaryBlock text={summary} />
  {/if}

  <div class="flex-1 overflow-y-auto px-6 py-6 bg-black/40 custom-scrollbar relative">
    {#if loading}
      <div class="flex h-full items-center justify-center">
        <div class="h-10 w-10 animate-spin rounded-full border-2 border-goclaw-neon-purple border-t-transparent shadow-[0_0_15px_rgba(217,70,239,0.5)]"></div>
      </div>
    {:else if messages.length === 0}
      <div class="flex h-full flex-col items-center justify-center text-center text-sm font-mono text-white/30 uppercase tracking-widest gap-4">
        <div class="p-6 rounded-full bg-white/5 border border-white/10">
          <History size={32} class="opacity-50" />
        </div>
        No messages recorded
      </div>
    {:else}
      <div class="mx-auto max-w-4xl space-y-6 pb-20">
        {#each messages.filter(checkIsDisplayable) as msg, i (msg.id || i)}
          {#if checkIsSystemMessage(msg)}
            <SystemMessageBlock content={msg.content} />
          {:else}
            <ChatMessage message={msg} />
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <ConfirmDialog
    open={confirmDelete}
    onOpenChange={(v) => confirmDelete = v}
    title="Delete Session"
    description="This action cannot be undone."
    confirmLabel="Delete Permanently"
    variant="destructive"
    onConfirm={async () => {
      await onDelete(session.key);
      confirmDelete = false;
      onBack();
    }}
  />

  <ConfirmDialog
    open={confirmReset}
    onOpenChange={(v) => confirmReset = v}
    title="Reset Session Memory"
    description="Clear history?"
    confirmLabel="Reset Memory"
    onConfirm={async () => {
      await onReset(session.key);
      confirmReset = false;
      messages = [];
      await loadMessages(session.key);
    }}
  />
</div>
