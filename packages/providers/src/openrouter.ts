import { OpenAIProvider } from "./openai.js";
import { type ProviderCapabilities } from "./provider.js";

/**
 * OpenRouter Provider uses the OpenAI API format but routes to https://openrouter.ai.
 * This unlocks massive arrays of models like:
 * - qwen/qwen-2.5-72b-instruct (Alibaba/Qwen)
 * - deepseek/deepseek-chat (DeepSeek)
 * - zhipu/glm-4 (Zhipu AI)
 * - anthropic/claude-3-opus
 */
export class OpenRouterProvider extends OpenAIProvider {
  override readonly name = "openrouter";

  constructor(apiKey?: string) {
    // OpenRouter uses the exact same interface as OpenAI
    super(apiKey || process.env.OPENROUTER_API_KEY, "https://openrouter.ai/api/v1");
  }

  override listModels(): string[] {
    return [
      "qwen/qwen-2.5-72b-instruct",
      "qwen/qwen-2.5-coder-32b-instruct",
      "deepseek/deepseek-chat",
      "zhipu/glm-4",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "x-ai/grok-beta",
    ];
  }

  static override capabilities(): ProviderCapabilities {
    return {
      name: "openrouter",
      supportsTools: true,
      supportsStreaming: true,
      supportsVision: true,
      maxContextTokens: 128000,
      costTier: "moderate",
      strengthProfile: {
        reasoning: 9,
        coding: 9,
        creativity: 8,
        speed: 7,
        accuracy: 9,
      },
    };
  }
}
