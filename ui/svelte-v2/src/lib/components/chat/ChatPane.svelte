<script lang="ts">
  import { chatState } from "../../state/chat.svelte";
  import ChatMessageComponent from "./ChatMessage.svelte";
  import { tick } from "svelte";

  let inputValue = $state("");
  let messagesContainer = $state<HTMLDivElement>();

  async function scrollToBottom() {
    await tick();
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function sendMessage() {
    if (!inputValue.trim() || !chatState.activeSessionId) return;

    chatState.messages = [
      ...chatState.messages,
      { id: Date.now().toString(), role: "user", content: inputValue }
    ];
    
    // Mock assistant response streaming simulation
    chatState.isStreaming = true;
    const responseId = (Date.now() + 1).toString();
    chatState.messages = [
      ...chatState.messages,
      { id: responseId, role: "assistant", content: "" }
    ];

    const responseContent = "This is a simulated **Markdown** response.\n\n- It supports *lists*\n- And `code` blocks too.";
    let currentIndex = 0;

    const streamInterval = setInterval(() => {
      if (currentIndex < responseContent.length) {
        const char = responseContent[currentIndex];
        const lastMsgIndex = chatState.messages.length - 1;
        chatState.messages[lastMsgIndex].content += char;
        currentIndex++;
        scrollToBottom();
      } else {
        clearInterval(streamInterval);
        chatState.isStreaming = false;
      }
    }, 20);

    inputValue = "";
    scrollToBottom();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Automatically scroll down when messages change
  $effect(() => {
    if (chatState.messages.length > 0) {
      scrollToBottom();
    }
  });
</script>

<div class="flex flex-col h-full flex-1 bg-black/30 rounded-2xl border border-white/5 backdrop-blur-md relative overflow-hidden">
  {#if chatState.activeSessionId}
    <div class="flex-1 overflow-y-auto p-6 space-y-4" bind:this={messagesContainer}>
      {#if chatState.messages.length === 0}
        <div class="h-full flex items-center justify-center text-white/30 italic">
          Start a new conversation...
        </div>
      {:else}
        {#each chatState.messages as msg (msg.id)}
          <ChatMessageComponent message={msg} />
        {/each}
      {/if}
      
      {#if chatState.isStreaming}
        <div class="text-xs text-goclaw-neon-purple animate-pulse ml-4">
          Receiving transmission...
        </div>
      {/if}
    </div>

    <div class="p-4 bg-black/40 border-t border-white/10 backdrop-blur-lg">
      <div class="relative max-w-4xl mx-auto flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-goclaw-neon-purple/50 focus-within:ring-1 focus-within:ring-goclaw-neon-purple/50 transition-all p-2">
        <textarea
          bind:value={inputValue}
          onkeydown={handleKeydown}
          placeholder="Enter prompt... (Shift+Enter for newline)"
          class="w-full bg-transparent text-white placeholder-white/30 resize-none outline-none py-2 px-3 max-h-48 min-h-[44px]"
          rows="1"
        ></textarea>
        
        <button
          onclick={sendMessage}
          disabled={!inputValue.trim() || chatState.isStreaming}
          class="p-2 rounded-lg bg-goclaw-neon-purple text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-goclaw-neon-purple/80 transition-colors mb-1 mr-1 shadow-[0_0_15px_rgba(217,70,239,0.3)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  {:else}
    <div class="h-full flex flex-col items-center justify-center text-white/40">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      <p class="text-lg">Select a session from the sidebar or start a new one.</p>
    </div>
  {/if}
</div>