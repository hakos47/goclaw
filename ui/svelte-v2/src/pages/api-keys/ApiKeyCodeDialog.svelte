<script lang="ts">
  import { X, Code2, Copy, Check, Terminal } from "lucide-svelte";

  type Tab = "curl" | "typescript" | "go";

  type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };

  let { open, onOpenChange }: Props = $props();

  let activeTab = $state<Tab>("curl");
  let copied = $state(false);

  const baseUrl = "https://YOUR-GOCLAW-BACKEND";
  const placeholder = "YOUR-GOCLAW-API-KEY";

  function buildCurl() {
    return `# Chat Completions
curl -X POST ${baseUrl}/v1/chat/completions \\
  -H "Authorization: Bearer ${placeholder}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent": "your-agent-key",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# List Agents
curl ${baseUrl}/v1/agents \\
  -H "Authorization: Bearer ${placeholder}"

# List Sessions
curl ${baseUrl}/v1/sessions \\
  -H "Authorization: Bearer ${placeholder}"`;
  }

  function buildTypescript() {
    return `const BASE_URL = "${baseUrl}";
const API_KEY = "${placeholder}";

// Chat Completions
const res = await fetch(\`\${BASE_URL}/v1/chat/completions\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    agent: "your-agent-key",
    messages: [{ role: "user", content: "Hello!" }],
  }),
});

const data = await res.json();
console.log(data.choices[0].message.content);

// List Agents
const agents = await fetch(\`\${BASE_URL}/v1/agents\`, {
  headers: { "Authorization": \`Bearer \${API_KEY}\` },
}).then(r => r.json());`;
  }

  function buildGo() {
    return `package main

import (
\t"bytes"
\t"encoding/json"
\t"fmt"
\t"io"
\t"net/http"
)

func main() {
\tbaseURL := "${baseUrl}"
\tapiKey := "${placeholder}"

\t// Chat Completions
\tbody, _ := json.Marshal(map[string]any{
\t\t"agent":    "your-agent-key",
\t\t"messages": []map[string]string{
\t\t\t{"role": "user", "content": "Hello!"},
\t\t},
\t})

\treq, _ := http.NewRequest("POST",
\t\tbaseURL+"/v1/chat/completions",
\t\tbytes.NewReader(body))
\treq.Header.Set("Authorization", "Bearer "+apiKey)
\treq.Header.Set("Content-Type", "application/json")

\tresp, err := http.DefaultClient.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer resp.Body.Close()

\tdata, _ := io.ReadAll(resp.Body)
\tfmt.Println(string(data))
}`;
  }

  const snippets = $derived({
    curl: buildCurl(),
    typescript: buildTypescript(),
    go: buildGo()
  });

  async function handleCopy() {
    await navigator.clipboard.writeText(snippets[activeTab]);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  // Very basic syntax highlighting for rendering
  function highlight(code: string, lang: Tab) {
    let html = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (lang === 'curl') {
      html = html.replace(/^(#.*)$/gm, '<span class="text-emerald-400">$1</span>');
      html = html.replace(/"(.*?)"/g, '<span class="text-amber-400">"$1"</span>');
      html = html.replace(/'(.*?)'/gs, '<span class="text-amber-400">\'$1\'</span>');
      html = html.replace(/(curl|-X|-H|-d|POST)/g, '<span class="text-purple-400 font-bold">$1</span>');
    } else if (lang === 'typescript') {
      html = html.replace(/^(\/\/.*)$/gm, '<span class="text-emerald-400">$1</span>');
      html = html.replace(/(const|let|await|async|new|return|fetch)/g, '<span class="text-purple-400 font-bold">$1</span>');
      html = html.replace(/(['"`].*?['"`])/g, '<span class="text-amber-400">$1</span>');
    } else if (lang === 'go') {
      html = html.replace(/^(\/\/.*)$/gm, '<span class="text-emerald-400">$1</span>');
      html = html.replace(/\b(package|import|func|var|const|defer|if|nil|map|string|any|byte|panic)\b/g, '<span class="text-purple-400 font-bold">$1</span>');
      html = html.replace(/"(.*?)"/g, '<span class="text-amber-400">"$1"</span>');
    }

    return html;
  }
</script>

{#if open}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div 
      class="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
      onclick={() => onOpenChange(false)}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Escape' && onOpenChange(false)}
      aria-label="Close dialog"
    ></div>

    <div class="relative bg-gradient-to-br from-[#030014]/95 to-[#1a0033]/90 border border-white/10 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.8),inset_0_2px_20px_rgba(0,0,0,0.5)] flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden">
      
      <!-- Cyber Grid Background -->
      <div class="absolute inset-0 pointer-events-none mix-blend-screen overflow-hidden rounded-3xl">
        <div class="absolute inset-0 bg-[linear-gradient(rgba(168,85,247,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-80"></div>
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Code2 class="h-5 w-5" />
          </div>
          <div>
            <h2 class="text-xs font-black text-white/90 tracking-[0.3em] uppercase">Integration Code</h2>
            <div class="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Snippets for common languages</div>
          </div>
        </div>

        <button 
          onclick={() => onOpenChange(false)} 
          class="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors border border-white/5"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Tab bar -->
      <div class="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/5 relative z-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
        <div class="flex gap-2">
          {#each ["curl", "typescript", "go"] as t}
            <button
              onclick={() => { activeTab = t as Tab; copied = false; }}
              class={`px-4 h-9 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === t
                  ? "bg-purple-500 text-black shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400"
                  : "text-white/50 bg-white/[0.02] hover:bg-white/[0.05] hover:text-white border border-transparent hover:border-white/10"
              }`}
            >
              {t}
            </button>
          {/each}
        </div>
        
        <button 
          onclick={handleCopy} 
          class="h-9 px-4 rounded-lg bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.1] border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
        >
          {#if copied}
            <Check class="h-3 w-3 text-emerald-400" /> <span class="text-emerald-400">Copied</span>
          {:else}
            <Copy class="h-3 w-3" /> Copy Snippet
          {/if}
        </button>
      </div>

      <!-- Code Content -->
      <div class="flex-1 min-h-0 overflow-y-auto p-6 bg-black/60 relative z-10 custom-scrollbar shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)]">
        <pre class="font-mono text-xs leading-relaxed text-white/80 whitespace-pre">
          {@html highlight(snippets[activeTab], activeTab)}
        </pre>
      </div>

    </div>
  </div>
{/if}
