# AlpClaw

**Autonomous Agent Platform** — a production-ready TypeScript framework for building autonomous agents with multi-provider support, composable skills, structured memory, and safety-first execution.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   AlpClaw Core                  │
│                                                 │
│  intake → understand → plan → context_fetch     │
│  → tool_select → execute → verify → correct     │
│  → finalize → persist                           │
│                                                 │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Planner │ │ Verifier │ │ Self-Corrector   │  │
│  └─────────┘ └──────────┘ └──────────────────┘  │
└────────┬──────────┬──────────┬──────────────────┘
         │          │          │
    ┌────▼───┐ ┌────▼────┐ ┌──▼──────┐
    │Provider│ │Connector│ │  Skill  │
    │ Router │ │Registry │ │Registry │
    └────┬───┘ └────┬────┘ └────┬────┘
         │          │           │
  ┌──────▼──────┐ ┌─▼────────┐ ┌▼────────────┐
  │ Claude      │ │ FS       │ │ Repo Analyze│
  │ OpenAI      │ │ Terminal │ │ Code Edit   │
  │ Gemini      │ │ GitHub   │ │ Test Runner │
  │ DeepSeek    │ │ Webhook  │ │ Debugger    │
  │ Local/OSS   │ │ Messaging│ │ PR Creator  │
  └─────────────┘ │ (Slack,  │ │ Deployer    │
                  │  Discord,│ │ Docs Gen    │
                  │  Telegram│ │ API Integr  │
                  │  Email)  │ │ Msg Drafter │
                  └──────────┘ │ Summarizer  │
                               └─────────────┘
   ┌─────────┐  ┌────────┐
   │  Safety  │  │ Memory │
   │  Engine  │  │  Store │
   └─────────┘  └────────┘
```

## Quick Start

```bash
# Clone and install
pnpm install

# Copy environment config
cp .env.example .env
# Add your API keys to .env

# Run the demo (no API key needed)
pnpm tsx examples/demo-standalone.ts

# Run the interactive CLI (requires an API key)
pnpm dev

# Run a single task
pnpm dev "analyze this repository"

# Run tests
pnpm test
```

## Packages

| Package | Description |
|---------|-------------|
| `@alpclaw/core` | Agent loop engine, task manager, planner, verifier, self-corrector |
| `@alpclaw/providers` | Multi-provider abstraction (Claude, OpenAI, Gemini, DeepSeek, local) |
| `@alpclaw/connectors` | Tool/service connectors (filesystem, terminal, GitHub, webhook, messaging) |
| `@alpclaw/skills` | 10 built-in skills: repo analysis, code edit, test runner, debugger, PR creator, deployer, docs generator, API integrator, message drafter, task summarizer |
| `@alpclaw/memory` | Structured memory store with file-based backend |
| `@alpclaw/safety` | Policy engine, input validators, risk assessment |
| `@alpclaw/config` | Environment and configuration loading |
| `@alpclaw/utils` | Shared types, Result monad, logger, ID generator, CLI theme |

## The Agent Loop

The core of AlpClaw is a 10-phase agentic loop:

1. **Intake** — Receive the task description
2. **Understand** — Clarify and distill the task using the LLM
3. **Plan** — Break the task into executable steps with the Planner
4. **Context Fetch** — Pull relevant memory and context for each step
5. **Tool Select** — Determine which connector or skill to use
6. **Execute** — Run the step through connectors, skills, or LLM
7. **Verify** — Check the output for correctness and safety
8. **Self-Correct** — If verification fails, diagnose and retry intelligently
9. **Finalize** — Aggregate results and produce a task summary
10. **Persist** — Save useful context to memory for future tasks

The loop handles multi-step tasks, nested sub-tasks, and self-healing retries automatically.

## Adding a Provider

Create a class implementing the `ModelProvider` interface:

```typescript
import type { ModelProvider, ProviderCapabilities } from "@alpclaw/providers";

class MyProvider implements ModelProvider {
  readonly name = "my-provider";

  isAvailable(): boolean { return true; }
  listModels(): string[] { return ["my-model-v1"]; }

  async complete(request: CompletionRequest): Promise<Result<CompletionResponse>> {
    // Call your model API here
  }

  static capabilities(): ProviderCapabilities {
    return {
      name: "my-provider",
      supportsTools: true,
      supportsStreaming: false,
      supportsVision: false,
      maxContextTokens: 32000,
      costTier: "low",
      strengthProfile: { reasoning: 7, coding: 6, creativity: 5, speed: 9, accuracy: 7 },
    };
  }
}
```

Register it with the router:

```typescript
const alpclaw = AlpClaw.create();
alpclaw.router.register(new MyProvider(), MyProvider.capabilities());
```

The router uses `strengthProfile` and `costTier` to automatically select the best provider based on task type.

## Adding a Connector

Implement the `Connector` interface:

```typescript
import type { Connector, ConnectorAction, Result, ToolDefinition } from "@alpclaw/connectors";

class MyConnector implements Connector {
  readonly name = "myservice";
  readonly category = "api";
  readonly description = "Connect to My Service";

  listActions(): ConnectorAction[] {
    return [{ name: "fetch_data", description: "...", parameters: {...}, riskLevel: "safe" }];
  }

  toToolDefinitions(): ToolDefinition[] {
    return this.listActions().map(a => ({
      name: `${this.name}.${a.name}`, description: a.description, parameters: a.parameters,
    }));
  }

  async execute(action: string, args: Record<string, unknown>): Promise<Result<unknown>> {
    // Handle your action here
  }

  async isAvailable(): Promise<boolean> { return true; }
}
```

Register it:

```typescript
alpclaw.connectors.register(new MyConnector());
```

All connector actions are automatically exposed as LLM tools.

## Adding a Skill

Skills are higher-level operations that combine connectors and LLM calls:

```typescript
import type { Skill, SkillContext } from "@alpclaw/skills";

class MySkill implements Skill {
  readonly manifest = {
    name: "my-skill",
    description: "Does something useful",
    version: "1.0.0",
    tags: ["custom"],
    requiredConnectors: ["fs"],
    parameters: { type: "object", properties: { input: { type: "string" } }, required: ["input"] },
  };

  async execute(params: Record<string, unknown>, ctx: SkillContext): Promise<Result<SkillResult>> {
    // Use ctx.runConnector() for tools
    // Use ctx.complete() for LLM calls
    // Use ctx.log() for logging
    return ok({ success: true, output: "result", summary: "Done" });
  }
}
```

## Built-in Skills

| Skill | Description |
|-------|-------------|
| `repo-analysis` | Analyze repository structure, tech stack, git history |
| `code-edit` | Search-and-replace, insert, or rewrite files |
| `test-runner` | Detect test framework and run project tests |
| `debugger` | Diagnose errors using stack traces and source code |
| `pr-creator` | Create GitHub PRs with LLM-generated descriptions |
| `deployer` | Build → test → deploy pipeline with pre-flight checks |
| `docs-generator` | Generate README, API docs, tutorials from source |
| `api-integrator` | HTTP requests to registered external APIs |
| `message-drafter` | Draft emails, social posts, Slack messages, outreach |
| `task-summarizer` | Summarize task results or documents |

## Memory System

Memory is structured into categories: `project`, `user`, `task`, `decision`, `failure`, `context`.

```typescript
const memory = alpclaw.memory;

// Store context
await memory.remember("project", "stack", "TypeScript monorepo");
await memory.remember("user", "preference", "concise output");

// Recall by category
const projectMemory = await memory.recall("project");

// Search across all memory
const results = await memory.search("TypeScript");

// Get context relevant to a query (used by the agent loop)
const context = await memory.getRelevantContext("build system");

// Record decisions and failures for learning
await memory.recordDecision("task_123", "Use Claude", "Best for reasoning");
await memory.recordFailure("task_123", "API timeout", "Called external service");
```

Memory is backed by a `MemoryStore` interface. The default `FileMemoryStore` persists to disk. Swap in any backend (Redis, SQLite, etc.) by implementing the interface.

## Safety System

Safety is built into every layer:

- **Policy Engine** — Pattern-based rules that evaluate actions against risk levels
- **Input Validators** — Prevent injection attacks and path traversal
- **Secret Detection** — Catches `.env` files, API keys, SSH keys, `.pem` files, credentials
- **Three safety modes:**
  - `strict` — Blocks moderate+ risk, requires confirmation for moderate
  - `standard` — Blocks destructive, requires confirmation for dangerous
  - `permissive` — Allows everything except destructive (requires confirmation)

```typescript
const safety = new SafetyEngine("standard");

// Evaluate any action
const verdict = safety.evaluate("rm -rf /data");
// → { allowed: false, riskLevel: "destructive", reason: "Blocked: destructive-file-ops" }

safety.evaluate("cat ~/.ssh/id_rsa");
// → { allowed: true, requiresConfirmation: true, riskLevel: "dangerous" }

// Add custom blocked patterns
const engine = new SafetyEngine("standard", ["prod-deploy", "DROP\\s+DATABASE"]);

// Add runtime policies
safety.addPolicy({ name: "custom", patterns: [/danger/], riskLevel: "dangerous", ... });
```

All tool calls in the agent loop pass through safety evaluation before execution.

## Self-Correction

When a step fails, the self-corrector:

1. Analyzes the failure using quick heuristics first (retryable errors, timeouts)
2. Falls back to LLM-based diagnosis for complex failures
3. Chooses a strategy: `retry`, `adjust_params`, `use_different_tool`, `ask_user`, or `abort`
4. Respects the max retry limit to prevent infinite loops
5. Records failures in memory for future learning

## Provider Routing

The router selects the best provider based on:

- **Task type** — `reasoning`, `coding`, `creative`, `fast`, `cheap`
- **Hard requirements** — tool support, vision, cost ceiling
- **Provider scores** — Each provider declares a strength profile (0-10) for reasoning, coding, creativity, speed, accuracy

```typescript
// Route to best provider for reasoning
const result = await router.route(request, { taskType: "reasoning" });

// Prefer a specific provider
const result = await router.route(request, { preferProvider: "claude" });

// Constrain by cost
const result = await router.route(request, { maxCostTier: "low" });
```

## Configuration

All config loads from environment variables with sensible defaults:

```env
ANTHROPIC_API_KEY=sk-...       # Claude
OPENAI_API_KEY=sk-...          # OpenAI
GOOGLE_API_KEY=...             # Gemini
DEEPSEEK_API_KEY=...           # DeepSeek
ALPCLAW_DEFAULT_PROVIDER=claude
ALPCLAW_SAFETY_MODE=standard   # strict | standard | permissive
ALPCLAW_LOG_LEVEL=info         # debug | info | warn | error
ALPCLAW_MAX_RETRIES=3
ALPCLAW_MEMORY_PATH=.alpclaw/memory
```

Or pass overrides programmatically:

```typescript
const alpclaw = AlpClaw.create({
  providers: { default: "openai" },
  safety: { mode: "strict" },
  agent: { maxRetries: 5 },
});
```

## Testing

```bash
pnpm test           # Run all tests
pnpm test -- --watch  # Watch mode
```

76 tests across 8 test suites covering:
- Safety engine (17 tests) — all modes, custom patterns, mode switching
- Input validators (11 tests) — injection, path traversal, tool args
- Memory store (9 tests) — CRUD, search, pruning, TTL
- Task manager (9 tests) — lifecycle, steps, retries, parent-child
- Verifier (8 tests) — tool output checks, task completion
- Filesystem connector (7 tests) — read/write/list/mkdir/delete/security
- Provider router (9 tests) — selection, routing, fallback, cost/capability filtering
- Integration (6 tests) — full system wiring, cross-package functionality

## Project Structure

```
packages/
  utils/           Shared types, Result<T>, logger, IDs, CLI theme
  config/          Env loading, Zod schema validation
  safety/          Policy engine, validators, secret detection
  memory/          MemoryStore interface, FileMemoryStore, MemoryManager
  providers/       ModelProvider interface, Claude, OpenAI, Gemini, router
  connectors/      Connector interface, FS, terminal, GitHub, webhook, messaging
  skills/          Skill interface, registry, 10 built-in skills
  core/            Agent loop, task manager, planner, verifier, self-corrector
examples/
  cli.ts           Interactive CLI with task runner
  demo-standalone.ts  Standalone demo showing each subsystem
tests/
  integration.test.ts  Cross-package integration tests
```

## Extending for Future Products

AlpClaw is designed as the agent core for multiple products:

- **Relay** — Register webhook connectors + messaging channels
- **Aluma** — Add custom skills + domain-specific connectors
- **Kira** — Use the provider router for multi-model orchestration
- **Flowa** — Chain skills into workflows using the task manager
- **AlpHub** — Central registry for shared skills and connectors

Each product imports the packages it needs — no monolith, no coupling.

## License

MIT
