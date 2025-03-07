import OpenAIStrategy from "./providers/openai.js";
import AnthropicStrategy from "./providers/anthropic.js";

class AIStrategyFactory {
  static createStrategy(provider, apiKey, model) {
    switch (provider.toLowerCase()) {
      case "openai":
        return new OpenAIStrategy(apiKey, model);
      case "anthropic":
        return new AnthropicStrategy(apiKey, model);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  static getSupportedProviders() {
    return [
      {
        id: "anthropic",
        name: "Anthropic (Claude)",
        defaultModel: "claude-3-sonnet-20240229",
        models: ["claude-3-sonnet-20240229"],
      },
      {
        id: "openai",
        name: "OpenAI",
        defaultModel: "gpt-4o",
        models: ["gpt-4o", "o3-mini"],
      },
    ];
  }
}

export default AIStrategyFactory;
