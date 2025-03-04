import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import screenshotDesktop from "screenshot-desktop";
import AIStrategyFactory from "./src/(core)/ai/providerFactory.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let mainWindow;
let isVisible = true;
let lastScreenshot = null;
let aiStrategy = null;

// Initialize the AI strategy
async function initializeAI() {
  const provider = process.env.AI_PROVIDER || "anthropic";
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  const model = process.env[`${provider.toUpperCase()}_MODEL`];

  if (!apiKey) {
    console.error(`API key for ${provider} not found in environment variables`);
    return false;
  }

  try {
    aiStrategy = AIStrategyFactory.createStrategy(provider, apiKey, model);
    await aiStrategy.initialize();
    return true;
  } catch (error) {
    console.error("Failed to initialize AI strategy:", error);
    return false;
  }
}

async function createWindow() {
  // Initialize AI strategy
  if (!(await initializeAI())) {
    console.error("Failed to initialize AI. Exiting...");
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    frame: false,
    transparent: true,
    backgroundColor: "#ffffff",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    alwaysOnTop: true,
    type: "panel",
    hasShadow: false,
    titleBarStyle: "customButtonsOnHover",
    skipTaskbar: true,
    roundedCorners: false,
    visualEffectState: "active",
    opacity: 0.9,
    focusable: false,
    enableLargerThanScreen: true,
    paintWhenInitiallyHidden: true,
  });

  // Set specific window flags for WebRTC protection
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, "torn-off-menu", 1);
  mainWindow.setContentProtection(true);
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Additional protection flags
  if (process.platform === "darwin") {
    mainWindow.setHiddenInMissionControl(true);
    app.dock.hide();

    // Set window to highest safe level that avoids WebRTC capture
    mainWindow.setWindowButtonVisibility(false);
    mainWindow.setBackgroundColor("#00000000");
  }

  // Ensure window is properly layered
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.setAspectRatio(600 / 800);
  });

  mainWindow.loadFile("index.html");

  // For development:
  mainWindow.loadURL("http://localhost:5173");

  // For production:
  // mainWindow.loadFile('dist/index.html');

  // Register global shortcuts
  globalShortcut.register("CommandOrControl+B", () => {
    if (isVisible) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
    isVisible = !isVisible;
  });

  globalShortcut.register("CommandOrControl+H", async () => {
    try {
      lastScreenshot = await screenshot();
      mainWindow.webContents.send("screenshot-taken");
    } catch (error) {
      console.error("Screenshot error:", error);
    }
  });

  globalShortcut.register("CommandOrControl+Enter", async () => {
    if (!lastScreenshot) {
      mainWindow.webContents.send("error", "No screenshot available");
      return;
    }

    try {
      mainWindow.webContents.send("processing", true);
      const solution = await aiStrategy.generateSolution(lastScreenshot);
      mainWindow.webContents.send("solution", solution);
    } catch (error) {
      console.error("AI API error:", error);
      mainWindow.webContents.send(
        "error",
        `Failed to get solution: ${error.message}`,
      );
    } finally {
      mainWindow.webContents.send("processing", false);
    }
  });

  // Window movement shortcuts
  globalShortcut.register("CommandOrControl+Up", () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y - 10);
  });

  globalShortcut.register("CommandOrControl+Down", () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y + 10);
  });

  globalShortcut.register("CommandOrControl+Left", () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x - 10, y);
  });

  globalShortcut.register("CommandOrControl+Right", () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + 10, y);
  });

  globalShortcut.register("CommandOrControl+R", () => {
    lastScreenshot = null;
    mainWindow.webContents.send("reset");
  });

  globalShortcut.register("CommandOrControl+Q", () => {
    app.quit();
  });

  globalShortcut.register("CommandOrControl+S", () => {
    const supportedProviders = AIStrategyFactory.getSupportedProviders();
    mainWindow.webContents.send("show-settings", supportedProviders);
  });
}

ipcMain.on("change-ai-provider", async (event, { provider, apiKey, model }) => {
  try {
    aiStrategy = AIStrategyFactory.createStrategy(provider, apiKey, model);
    await aiStrategy.initialize();
    mainWindow.webContents.send("provider-changed", provider);
  } catch (error) {
    console.error("Failed to change AI provider:", error);
    mainWindow.webContents.send(
      "error",
      `Failed to change AI provider: ${error.message}`,
    );
  }
});

ipcMain.handle("get-current-provider", () => {
  return {
    provider: process.env.AI_PROVIDER || "anthropic",
    model:
      process.env[
        `${(process.env.AI_PROVIDER || "anthropic").toUpperCase()}_MODEL`
      ],
  };
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

