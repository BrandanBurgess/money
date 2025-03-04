# LeetCode Assistant

An AI-powered assistant for solving LeetCode problems using Claude 3.7. This tool helps you capture and analyze coding problems, then provides detailed solutions with explanations.

## Features

- Take screenshots of LeetCode problems
- Get AI-powered solutions with detailed explanations
- Clean, translucent UI that stays out of your way
- Keyboard shortcuts for all operations
- Screen sharing protection

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up your Claude API key:
```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

## Usage

Start the application:
```bash
npm start
```

### Keyboard Shortcuts

- ⌘ + B: Hide/show the Interview Coder window
- ⌘ + H: Take a screenshot of the current problem
- ⌘ + Enter: Generate solution for the captured screenshot
- ⌘ + Arrow keys: Move the window around
- ⌘ + R: Reset everything
- ⌘ + Q: Quit the application

## Building

To create a standalone application:
```bash
npm run build
```

## Notes

- The application window is protected from screen sharing for privacy
- Solutions include:
  - Thought process explanation
  - Efficient code solution
  - Time and space complexity analysis
- The UI is designed to be minimal and non-intrusive

## Requirements

- Node.js 14+
- Anthropic API key
- macOS (for some screenshot features)
