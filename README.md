<p align="center">
  <img src="_statics/goclaw.png" alt="GoClaw" height="200" />
</p>

<p align="center"><strong>The Enterprise-Grade AI Agent Orchestrator</strong></p>

<p align="center">
Multi-agent AI gateway built in Go. 25+ LLM providers. Hyper-modern Svelte 5 UI.<br/>
High-performance Multi-tenant PostgreSQL (pgvector). Single binary architecture.<br/>
Agents that don't just talk, but <strong>orchestrate</strong> your entire workflow.
</p>

<p align="center">
  <a href="https://docs.goclaw.sh">Documentation</a> •
  <a href="https://docs.goclaw.sh/#quick-start">Quick Start</a> •
  <a href="https://x.com/nlb_io">Twitter / X</a>
</p>

<p align="center">
  <a href="https://go.dev/"><img src="https://img.shields.io/badge/Go_1.26-00ADD8?style=flat-square&logo=go&logoColor=white" alt="Go" /></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL_18-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="https://svelte.dev/"><img src="https://img.shields.io/badge/Svelte_5-FF3E00?style=flat-square&logo=svelte&logoColor=white" alt="Svelte 5" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="https://opentelemetry.io/"><img src="https://img.shields.io/badge/OpenTelemetry-000000?style=flat-square&logo=opentelemetry&logoColor=white" alt="OpenTelemetry" /></a>
  <img src="https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey?style=flat-square" alt="License: CC BY-NC 4.0" />
</p>

🌐 **Languages:**
[🇨🇳 简体中文](_readmes/README.zh-CN.md) ·
[🇪🇸 Español](_readmes/README.es.md) ·
[🇻🇳 Tiếng Việt](_readmes/README.vi.md) ·
[🇧🇷 Português](_readmes/README.pt.md) ·
[🇮🇹 Italiano](_readmes/README.it.md) ·
[🇫🇷 Français](_readmes/README.fr.md)

## 🚀 2026 Core Innovations

- **Hyper-Modern Svelte 5 UI** — Glassmorphism aesthetic, real-time WebSocket state management (Runes), and Markdown-native rendering O(1).
- **8-Stage Military Pipeline** — Standardized execution: Context → History → Prompt → Think → Act → Observe → Memory → Summarize.
- **Advanced Browser Automation** — Native Chromium integration with headless/headed modes, screenshot-to-vision pipeline, and anti-bot bypass.
- **3-Tier Neural Memory** — Working (L0) → Episodic (L1 Summaries) → Semantic (L2 Knowledge Graph). Semantic search powered by **pgvector**.
- **Agent Swarms & Teams** — Distributed task boards, inter-agent delegation (sync/async), and multi-agent coordination under NIX-0 protocol.
- **Multi-Tenant Security (AAA)** — Row-Level Security (RLS) in PostgreSQL, encrypted API keys (AES-256-GCM), and sandboxed execution environments.
- **Native Dependency Adapter** — OS-agnostic dependency resolution (Nix Flakes / Brew / Apt) for agent-level tools and skills.
- **25+ LLM Providers** — Native support for MiniMax (V2 pipeline), Anthropic (Prompt Caching), OpenAI (GPT-4o), Gemini 2.0, DeepSeek, and more.
- **Universal Messaging** — WhatsApp (Multi-modal), Telegram, Discord, Slack, Zalo, and high-performance WebSockets.

## 💻 Desktop Edition (GoClaw Lite)

A native desktop app for local AI agents — no Docker, no PostgreSQL, no infrastructure.

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/nextlevelbuilder/goclaw/main/scripts/install-lite.sh | bash
```

## 🏗️ Architecture

<p align="center">
  <img src="_statics/Multi-Tenant Architecture.jpg" alt="Multi-Tenant Architecture" width="800" />
</p>

- **Backend:** Go 1.26 (Standard Library focused), zero-dependency core binary.
- **Frontend:** Svelte 5.55.0 + Vite 8.0, Ultra-fast AI-driven UI design.
- **Storage:** PostgreSQL 18 + pgvector for high-density semantic retrieval.
- **Orchestration:** Typed Event Bus for asynchronous workers and background "dreaming" (L2 memory extraction).

## 🛠️ Built-in Tools (The Arsenal)

| Category | Tools | Description |
|----------|-------|-------------|
| **Automation** | `browser` | Native Chromium automation, clicks, forms, and screenshots. |
| **Investigation** | `web_search`, `web_fetch` | Real-time deep research with Brave/Tavily/Exa. |
| **Filesystem** | `read_file`, `write_file` | Virtualized FS routing with `ws/` path masking. |
| **Intelligence** | `knowledge_graph` | Multi-hop entity traversal and temporal fact tracking. |
| **Communication** | `whatsapp`, `telegram` | Full control over external messaging channels. |

## 🏁 Quick Start

**Prerequisites:** Docker & Docker Compose (V2)

```bash
# 1. Clone and Prepare
git clone https://github.com/nextlevelbuilder/goclaw.git && cd goclaw
./prepare-env.sh

# 2. Add your API Keys to .env, then Deploy
make up

# 3. Access the Nexus
# Dashboard: http://localhost:18790
```

`make up` automatically builds the binary with the **Svelte V2 embedded UI**, runs PostgreSQL migrations, and activates the Gateway.

## 🛡️ Origen y Buenas Prácticas

Este proyecto es un **fork oficial y mejorado** de [GoClaw Gateway](https://github.com/nextlevelbuilder/goclaw). Se mantiene bajo los estándares de transparencia y colaboración de la comunidad, integrando innovaciones propietarias bajo el protocolo NIX-0.

- **Repositorio de Origen:** [github.com/nextlevelbuilder/goclaw](https://github.com/nextlevelbuilder/goclaw)
- **Atribución:** Agradecimientos al equipo original de NLB por la arquitectura base de orquestación de agentes.
- **Contribuciones:** Todas las mejoras de estabilidad (Latencia Zero), virtualización de media y el stack Svelte 5 son contribuciones específicas de esta rama de desarrollo.

## 🛡️ NIX-0 Protocol Compliance

This project is maintained under the **NIX-0 Protocol v6.6**. Every modification follows strict **non-destructive** standards, ensuring neural integrity and historical logic preservation across the agent swarm.

## 📄 License

[CC BY-NC 4.0](LICENSE) — Creative Commons Attribution-NonCommercial 4.0 International

---
*Developed by NLB. Built for the era of Agentic Intelligence.*
