import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import fs from "fs";
import BaseAIStrategy from "./base.js";

class OpenAIStrategy extends BaseAIStrategy {
  constructor(apiKey, modelId = "gpt-4o") {
    super();
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  async initialize() {
    const openai = createOpenAI({
      apiKey: this.apiKey,
      compatibility: "strict",
    });

    this.model = openai(this.modelId);
  }

  async generateSolution(screenshot) {
    if (!this.model) await this.initialize();

    const imageBase64 = fs.readFileSync(screenshot).toString("base64");

    const { text } = await generateText({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert coding interview assistant. Provide clear, efficient solutions with detailed explanations.",
        },
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

export default OpenAIStrategy;
