const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const { Anthropic } = require('@anthropic-ai/sdk');

let mainWindow;
let isVisible = true;
let lastScreenshot = null;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    frame: false,
    transparent: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    alwaysOnTop: true,
    type: 'panel',
    hasShadow: false,
    titleBarStyle: 'customButtonsOnHover',
    skipTaskbar: true,
    roundedCorners: false,
    visualEffectState: 'active',
    opacity: 0.9,
    focusable: false,
    enableLargerThanScreen: true,
    paintWhenInitiallyHidden: true
  });

  // Set specific window flags for WebRTC protection
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(true, 'torn-off-menu', 1);
  mainWindow.setContentProtection(true);
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  
  // Additional protection flags
  if (process.platform === 'darwin') {
    mainWindow.setHiddenInMissionControl(true);
    app.dock.hide();
    
    // Set window to highest safe level that avoids WebRTC capture
    mainWindow.setWindowButtonVisibility(false);
    mainWindow.setBackgroundColor('#00000000');
  }

  // Ensure window is properly layered
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.setAspectRatio(600/800);
  });

  mainWindow.loadFile('index.html');

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+B', () => {
    if (isVisible) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
    isVisible = !isVisible;
  });

  globalShortcut.register('CommandOrControl+H', async () => {
    try {
      lastScreenshot = await screenshot();
      mainWindow.webContents.send('screenshot-taken');
    } catch (error) {
      console.error('Screenshot error:', error);
    }
  });

  globalShortcut.register('CommandOrControl+Enter', async () => {
    if (!lastScreenshot) {
      mainWindow.webContents.send('error', 'No screenshot available');
      return;
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `I'm going to share a screenshot of a coding problem. Please analyze it and provide:
          1. A clear explanation of your thought process
          2. An efficient solution with detailed code
          3. Time and space complexity analysis
          Please format your response in markdown.`
        }],
        system: "You are an expert coding interview assistant. Provide clear, efficient solutions with detailed explanations."
      });

      mainWindow.webContents.send('solution', response.content);
    } catch (error) {
      console.error('Claude API error:', error);
      mainWindow.webContents.send('error', 'Failed to get solution from Claude');
    }
  });

  // Window movement shortcuts
  globalShortcut.register('CommandOrControl+Up', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y - 10);
  });

  globalShortcut.register('CommandOrControl+Down', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x, y + 10);
  });

  globalShortcut.register('CommandOrControl+Left', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x - 10, y);
  });

  globalShortcut.register('CommandOrControl+Right', () => {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + 10, y);
  });

  globalShortcut.register('CommandOrControl+R', () => {
    lastScreenshot = null;
    mainWindow.webContents.send('reset');
  });

  globalShortcut.register('CommandOrControl+Q', () => {
    app.quit();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
}); 