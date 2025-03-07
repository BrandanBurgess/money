class BaseAIStrategy {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async initialize() {}

  async generateSolution(screenshot) {
    throw new Error("Method generateSolution must be implemented by subclass");
  }
}

export default BaseAIStrategy;
