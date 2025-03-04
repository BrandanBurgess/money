import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import fs from "fs";

import BaseAIStrategy from "./base.js";

class AnthropicStrategy extends BaseAIStrategy {
  constructor(apiKey, modelId = "claude-3-opus-20240229") {
    super();
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  async initialize() {
    const anthropic = createAnthropic({
      apiKey: this.apiKey,
    });

    this.model = anthropic(this.modelId);
  }

  async generateSolution(screenshot) {
    if (!this.model) await this.initialize();

    const imageBase64 = fs.readFileSync(screenshot).toString("base64");

    const { text } = await generateText({
      model: this.model,
      system:
        "You are an expert coding interview assistant. Provide clear, efficient solutions with detailed explanations.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `I'm going to share a screenshot of a coding problem. Please analyze it and provide:
              1. A clear explanation of your thought process
              2. An efficient solution with detailed code
              3. Time and space complexity analysis
              Please format your response in markdown.`,
            },
            {
              type: "image",
              image: `data:image/png;base64,${imageBase64}`,
            },
          ],
        },
      ],
    });

    return text;
  }
}

export default AnthropicStrategy;
