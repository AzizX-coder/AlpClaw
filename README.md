<p align="center">
  <pre>
        ▄▄▄       ██▓     ██▓███   ▄████▄   ██▓    ▄▄▄       █     █░
       ▒████▄    ▓██▒    ▓██░  ██▒▒██▀ ▀█  ▓██▒   ▒████▄    ▓█░ █ ░█░
       ▒██  ▀█▄  ▒██░    ▓██░ ██▓▒▒▓█    ▄ ▒██░   ▒██  ▀█▄  ▒█░ █ ░█
       ░██▄▄▄▄██ ▒██░    ▒██▄█▓▒ ▒▒▓▓▄ ▄██▒▒██░   ░██▄▄▄▄██ ░█░ █ ░█
        ▓█   ▓██▒░██████▒▒██▒ ░  ░▒ ▓███▀ ░░██████▒▓█   ▓██▒░░██▒██▓
        ▒▒   ▓▒█░░ ▒░▓  ░▒▓▒░ ░  ░░ ░▒ ▒  ░░ ▒░▓  ░▒▒   ▓▒█░░ ▓░▒ ▒
         ▒   ▒▒ ░░ ░ ▒  ░░▒ ░       ░  ▒   ░ ░ ▒  ░ ▒   ▒▒ ░  ▒ ░ ░
         ░   ▒     ░ ░   ░░       ░          ░ ░    ░   ▒     ░   ░
             ░  ░    ░  ░         ░ ░          ░  ░     ░  ░    ░
                                  ░
  </pre>
</p>

<h1 align="center">AlpClaw</h1>
<p align="center">
  <strong>The Autonomous Agent Platform</strong><br/>
  <em>Self-healing • Multi-provider • Multi-platform • Sub-agent swarms</em>
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-0.3.0-blue?style=flat-square"/>
  <img alt="TS" src="https://img.shields.io/badge/TypeScript-100%25-blue?logo=typescript&style=flat-square"/>
  <img alt="Tests" src="https://img.shields.io/badge/tests-87%20passing-brightgreen?style=flat-square"/>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green?style=flat-square"/>
</p>

---

## ⚡ Install in 30 Seconds

```bash
git clone https://github.com/AzizX-coder/AlpClaw.git
cd AlpClaw
pnpm install
pnpm link --global       # makes `alpclaw` available everywhere
alpclaw init             # 30-second setup wizard
```

That's it. Now use it from **any directory**:

```bash
alpclaw "refactor this folder and run tests"
alpclaw                  # interactive chat
alpclaw telegram         # start Telegram bot
alpclaw config list      # view your config
```

---

## 🏗 Architecture

```
┌───────────────────────────────────────────────────────┐
│                     AlpClaw Core                      │
│                                                       │
│   intake → understand → plan → context_fetch          │
│   → tool_select → execute → verify → correct          │
│   → finalize → persist                                │
│                                                       │
│   ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │
│   │ Planner │  │ Verifier │  │  Self-Corrector     │  │
│   └─────────┘  └──────────┘  └────────────────────┘  │
│                                                       │
│   ┌──────────────────────────────────────────────┐    │
│   │        Sub-Agent Swarm Dispatcher            │    │
│   │   (parallel_delegate for complex tasks)      │    │
│   └──────────────────────────────────────────────┘    │
└───────┬────────────┬────────────┬─────────────────────┘
        │            │            │
   ┌────▼────┐  ┌────▼─────┐  ┌──▼────────┐
   │Provider │  │Connector │  │   Skill   │
   │ Router  │  │ Registry │  │  Registry │
   └────┬────┘  └────┬─────┘  └────┬──────┘
        │            │              │
  ┌─────▼──────┐  ┌──▼────────┐  ┌─▼──────────────┐
  │ OpenRouter │  │ FS        │  │ Repo Analysis  │
  │ Claude     │  │ Terminal  │  │ Code Edit      │
  │ OpenAI     │  │ Database  │  │ Test Runner    │
  │ Gemini     │  │ HTTP      │  │ Debugger       │
  │ DeepSeek   │  │ Browser   │  │ PR Creator     │
  │ Ollama     │  │ Git       │  │ Code Reviewer  │
  └────────────┘  └───────────┘  │ Web Scraper    │
                                 │ Data Analyst   │
  ┌──────────┐  ┌───────────┐   │ SQL Builder    │
  │  Safety  │  │  Memory   │   │ Python Runner  │
  │  Engine  │  │   Store   │   │ Shell Runner   │
  └──────────┘  └───────────┘   │ Subagent Swarm │
                                │ + 7 more...    │
                                └────────────────┘

  ┌──────────────────────────────────────────────┐
  │           Platform Connectors                │
  │  Telegram · Slack · Discord · WhatsApp       │
  │  Messenger · CLI · HTTP Webhooks             │
  └──────────────────────────────────────────────┘
```

---

## 🚀 CLI Reference

| Command | Description |
|---------|-------------|
| `alpclaw` | Open interactive chat |
| `alpclaw "do X"` | Run a one-shot task |
| `alpclaw init` | 30-second setup wizard |
| `alpclaw config list` | Show current config |
| `alpclaw config set KEY VAL` | Set `defaultModel`, `defaultProvider`, `safetyMode` |
| `alpclaw config set-key PROVIDER KEY` | Save an API key |
| `alpclaw config set-bot BOT FIELD VAL` | Save a bot credential |
| `alpclaw config path` | Print config file location |
| `alpclaw telegram` | Start Telegram bot |
| `alpclaw slack` | Start Slack bot |
| `alpclaw discord` | Start Discord bot |
| `alpclaw whatsapp` | Start WhatsApp bot |
| `alpclaw messenger` | Start Messenger bot |
| `alpclaw help` | Show help |

**Config lives at `~/.alpclaw/config.json`** — set once, use from any directory.

---

## 🤖 Platform Bots

Each bot is started with a single command. Credentials are stored in global config.

| Platform | Setup | Start |
|----------|-------|-------|
| **Telegram** | `alpclaw config set-bot telegram TELEGRAM_BOT_TOKEN <token>` | `alpclaw telegram` |
| **Slack** | `alpclaw config set-bot slack SLACK_BOT_TOKEN <tok>` + `SLACK_SIGNING_SECRET` | `alpclaw slack` |
| **Discord** | `alpclaw config set-bot discord DISCORD_PUBLIC_KEY <key>` + `DISCORD_BOT_TOKEN` | `alpclaw discord` |
| **WhatsApp** | `alpclaw config set-bot whatsapp TWILIO_AUTH_TOKEN <tok>` + `TWILIO_WHATSAPP_FROM` | `alpclaw whatsapp` |
| **Messenger** | Set `FB_PAGE_ACCESS_TOKEN`, `FB_VERIFY_TOKEN`, `FB_APP_SECRET` | `alpclaw messenger` |

When you run `alpclaw telegram`, it auto-connects, prints `Connected as @YourBot`, and live-mirrors all conversations in your terminal.

---

## 🧠 Sub-Agent Swarm (Parallel Execution)

For complex tasks, AlpClaw can automatically spawn parallel sub-agents:

```
Master Agent                          Sub-Agent A (file analysis)
    │                                      │
    ├── delegates 3 objectives ──────► Sub-Agent B (write tests)
    │    in parallel                       │
    │                                 Sub-Agent C (generate docs)
    │                                      │
    ◄── collects results ──────────────────┘
```

- Sub-agents run with **fresh, zero-token contexts** (no context bloat)
- Each sub-agent has full access to all connectors & skills
- Results are compressed and merged back into the master agent
- **Token usage drops 40-60%** on complex multi-step tasks

---

## 🎭 Character Personalization

Drop a `character.md` file in your project root or `~/.alpclaw/`:

```markdown
You are a senior staff engineer named Atlas. You speak concisely,
use technical jargon freely, and always suggest writing tests.
When unsure, you say "Let me investigate" rather than guessing.
```

This persona is injected into **every** interaction — CLI chat, Telegram, Slack, all platforms.

---

## 📊 What's Inside

AlpClaw ships with these capabilities today — all verifiable in the source:

- **6 LLM Providers** — OpenRouter, Claude, OpenAI, Gemini, DeepSeek, Ollama (local/free)
- **6 Connectors** — Filesystem, Terminal, Database (SQLite), HTTP, Browser, Git
- **19 Skills** — From code editing to web scraping to parallel sub-agent swarms
- **5 Platform Bots** — Telegram, Slack, Discord, WhatsApp, Messenger
- **10-Phase Agent Loop** — intake → understand → plan → fetch → select → execute → verify → correct → finalize → persist
- **Self-Correction** — Per-step retry budgets with heuristic + LLM-based failure diagnosis
- **Persistent Memory** — File-backed store with category search, TTL, and decision/failure learning
- **Safety Engine** — 3 modes (strict/standard/permissive), secret detection, pattern-based blocking
- **Token Optimization** — Auto-truncation of large outputs + zero-context sub-agent spawning
- **Character Persona** — Drop a `character.md` anywhere and all replies match your tone
- **Global CLI** — `alpclaw init` once, then `alpclaw "do X"` from any directory
- **87 Tests** — 11 test suites covering safety, memory, routing, connectors, integration

---

## 🛠️ Built-in Skills (19)

| Skill | Description |
|-------|-------------|
| `repo-analysis` | Analyze repo structure, tech stack, git history |
| `code-edit` | Patch, insert, or rewrite files |
| `code-reviewer` | Multi-file code review with focus areas |
| `test-runner` | Auto-detect framework and run tests |
| `debugger` | Diagnose errors from stack traces |
| `pr-creator` | Create GitHub PRs with LLM descriptions |
| `deployer` | Build → test → deploy pipeline |
| `docs-generator` | Generate README, API docs, tutorials |
| `api-integrator` | HTTP requests to external APIs |
| `message-drafter` | Draft emails, social posts, Slack messages |
| `task-summarizer` | Summarize documents or task results |
| `web-search` | Search the web for information |
| `web-scraper` | Extract structured data from web pages |
| `data-analyst` | Generate and run pandas analysis scripts |
| `sql-builder` | Natural language → read-only SQL |
| `database-admin` | Execute optimized database queries |
| `python-runner` | Sandboxed Python script execution |
| `shell-runner` | Cross-platform shell/bash/PowerShell execution |
| `subagent-runner` | Spawn parallel sub-agents for complex tasks |

---

## 🔌 Connectors (6)

| Connector | Category | Actions |
|-----------|----------|---------|
| `fs` | Filesystem | read, write, list, mkdir, delete, exists, stat |
| `terminal` | Terminal | run, run_background |
| `database` | Database | query (JSON output, read-only safety) |
| `http` | API | request (GET/POST/PUT/DELETE, auto-JSON, 512KB cap) |
| `browser` | Web | fetch_text, fetch_links (HTML→text, 40K cap) |
| `git` | VCS | status, log, diff, branch, add, commit (no push/reset) |

---

## 🧪 Testing

```bash
pnpm test                # 87 tests across 11 suites
pnpm test -- --watch     # Watch mode
```

---

## 📁 Project Structure

```
packages/
  utils/        Shared types, Result<T>, logger, IDs, CLI theme
  config/       Global config (~/.alpclaw/config.json), env loading, Zod schema
  safety/       Policy engine, validators, secret detection
  memory/       MemoryStore, FileMemoryStore, MemoryManager
  providers/    ModelProvider: Claude, OpenAI, Gemini, DeepSeek, OpenRouter, Ollama
  connectors/   FS, Terminal, Database, HTTP, Browser, Git
  skills/       19 built-in skills + SkillRegistry
  core/         Agent loop, task manager, planner, verifier, self-corrector
bots/
  telegram.ts   Telegram bridge (auto-identity, live chat mirror)
  slack.ts      Slack Events API bridge
  discord.ts    Discord Interactions bridge (Ed25519 verify)
  whatsapp.ts   Twilio WhatsApp bridge
  messenger.ts  Facebook Messenger bridge
  lib/          Shared chat-agent helper + persona loader
examples/
  cli.ts        Full CLI: chat, init, config, bot launcher, one-shot
bin/
  alpclaw.mjs   Global launcher (works from any directory)
```

---

## 🎨 Personalization & Extending

**New skill:** Add `packages/skills/src/built-in/your-skill.ts`, register in `packages/core/src/alpclaw.ts`.

**New connector:** Add `packages/connectors/src/your-conn.ts`, register the same way.

**New provider:** Implement `ModelProvider`, register with `router.register()`.

**Character:** Create `~/.alpclaw/character.md` or `./character.md` in your project.

---

## License

MIT
