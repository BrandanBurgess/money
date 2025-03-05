import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import screenshotDesktop from "screenshot-desktop";
import AIStrategyFactory from "./src/(core)/ai/providerFactory.js";
import dotenv from "dotenv";
import { execFile } from "child_process";
import path from "path";

function setWindowDisplayAffinity(windowHandle, affinity) {
  return new Promise((resolve, reject) => {
    // Path to the compiled C++ executable
    const executablePath = path.join(__dirname, "SetWindowAffinity.exe");

    // Call the executable with the window handle and affinity value
    execFile(executablePath, [windowHandle, affinity], (error, stdout, stderr) => {
      if (error) {
        console.error("Error setting window display affinity:", stderr);
        reject(error);
      } else {
        console.log("SetWindowDisplayAffinity result:", stdout);
        resolve(stdout.trim() === "Success");
      }
    });
  });
}

// Load environment variables
dotenv.config();

let mainWindow;
let isVisible = true;
let lastScreenshot = null;
let aiStrategy = null;
let isSettingsOpen = false;

function applyScreenCaptureProtection(window) {
  if (process.platform === "win32") {
    try {
      // Get the native window handle as a Buffer
      const hwndBuffer = window.getNativeWindowHandle();

      // Convert the Buffer to a string representation of the HWND
      const hwnd = hwndBuffer.readUInt32LE(0); // Read the first 4 bytes (32-bit HWND)

      setWindowDisplayAffinity(hwnd, 0x00000011) // WDA_EXCLUDEFROMCAPTURE
        .then((result) => {
          console.log("Screen capture protection applied:", result);
        })
        .catch((error) => {
          console.error("Failed to apply screen capture protection:", error);
        });
    } catch (error) {
      console.error("Error applying screen capture protection:", error);
    }
  }
}

// Function to take a screenshot
async function screenshot() {
  try {
    return await screenshotDesktop();
  } catch (error) {
    console.error("Screenshot error:", error);
    throw error;
  }
}

// Initialize the AI strategy
async function initializeAI(settings) {
  const provider = settings?.provider || process.env.AI_PROVIDER || "openai";
  const apiKey =
    settings?.apiKey || process.env[`${provider.toUpperCase()}_API_KEY`];
  const model =
    settings?.model || process.env[`${provider.toUpperCase()}_MODEL`];

  if (!apiKey) {
    console.error(
      `API key for ${provider} not found in environment variables or settings`,
    );
    // return false;
  }

  try {
    aiStrategy = AIStrategyFactory.createStrategy(provider, apiKey, model);
    await aiStrategy.initialize();
    // Store the current settings
    global.currentSettings = {
      provider,
      model,
      apiKey,
    };
    return true;
  } catch (error) {
    console.error("Failed to initialize AI strategy:", error);
    return false;
  }
}

// app.disableHardwareAcceleration();

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
    backgroundColor: "#000000000",
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
    enableLargerThanScreen: true,
    paintWhenInitiallyHidden: true,
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  mainWindow.setContentProtection(true);

  function updateMouseInteraction() {
    mainWindow.setIgnoreMouseEvents(!isSettingsOpen, { forward: true });
  }

  updateMouseInteraction();

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
    
    // Apply screen capture protection after the window is shown
    if (process.platform === 'win32') {
      applyScreenCaptureProtection(mainWindow);
    }
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
      // Re-apply protection when showing the window
      if (process.platform === 'win32') {
        applyScreenCaptureProtection(mainWindow);
      }
    }
    isVisible = !isVisible;
  });

  globalShortcut.register("CommandOrControl+H", async () => {
    try {
      // Temporarily disable protection to take screenshot
      if (process.platform === 'win32') {
        const hwnd = Buffer.from(mainWindow.getNativeWindowHandle());
        user32.SetWindowDisplayAffinity(hwnd, WDA_NONE);
      }
      
      lastScreenshot = await screenshot();
      mainWindow.webContents.send("screenshot-taken");
      
      // Re-enable protection after screenshot
      if (process.platform === 'win32') {
        applyScreenCaptureProtection(mainWindow);
      }
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

  // Add settings shortcut
  globalShortcut.register("CommandOrControl+M", () => {
    isSettingsOpen = !isSettingsOpen;
    updateMouseInteraction();
    mainWindow.webContents.send("toggle-settings");
  });

  // Add IPC handlers for settings
  ipcMain.on("settings-opened", () => {
    isSettingsOpen = true;
    updateMouseInteraction();
  });

  ipcMain.on("settings-closed", () => {
    isSettingsOpen = false;
    updateMouseInteraction();
  });

  // Register IPC handlers
  ipcMain.on("initialize-with-settings", async (event, settings) => {
    if (await initializeAI(settings)) {
      event.reply("ai-initialized", { success: true });
    } else {
      event.reply("ai-initialized", {
        success: false,
        error: "Failed to initialize AI with saved settings",
      });
    }
  });

  ipcMain.on(
    "change-ai-provider",
    async (event, { provider, apiKey, model }) => {
      try {
        aiStrategy = AIStrategyFactory.createStrategy(provider, apiKey, model);
        await aiStrategy.initialize();
        // Update current settings
        global.currentSettings = {
          provider,
          model,
          apiKey,
        };
        mainWindow.webContents.send("provider-changed", { provider, model });
      } catch (error) {
        console.error("Failed to change AI provider:", error);
        mainWindow.webContents.send(
          "error",
          `Failed to change AI provider: ${error.message}`,
        );
      }
    },
  );

  ipcMain.handle("get-current-provider", () => {
    if (!global.currentSettings) {
      return {
        provider: process.env.AI_PROVIDER || "openai",
        model: process.env.OPENAI_MODEL || "gpt=4o",
      };
    }
    return {
      provider: global.currentSettings.provider,
      model: global.currentSettings.model,
    };
  });

  // Add IPC handler to toggle screen capture protection
  ipcMain.on("toggle-screen-protection", (event, enable) => {
    if (process.platform === 'win32') {
      const hwnd = Buffer.from(mainWindow.getNativeWindowHandle());
      const result = user32.SetWindowDisplayAffinity(
        hwnd, 
        enable ? (WDA_EXCLUDEFROMCAPTURE || WDA_MONITOR) : WDA_NONE
      );
      event.reply("protection-toggled", result);
    } else {
      event.reply("protection-toggled", false);
    }
  });
}

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
