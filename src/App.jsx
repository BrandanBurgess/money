// src/App.jsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import StatusBar from './components/StatusBar';
import ShortcutBar from './components/ShortcutBar';
import SettingsPanel from './components/SettingsPanel';

const { ipcRenderer } = window.require('electron');

function App() {
  const [status, setStatus] = useState('Ready');
  const [screenshotStatus, setScreenshotStatus] = useState('No screenshot taken');
  const [solution, setSolution] = useState(
    'Welcome to LeetCode Assistant!\n\nUse **Ctrl+H** to take a screenshot of your problem, then **Ctrl+Enter** to get a solution.'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [providers, setProviders] = useState([]);
  const [currentProvider, setCurrentProvider] = useState({
    provider: 'openai',
    model: 'gpt-4o'
  });

  useEffect(() => {
    // Listen for IPC events
    ipcRenderer.on('screenshot-taken', () => {
      setScreenshotStatus('Screenshot captured');
      setStatus('Ready for analysis');
    });

    ipcRenderer.on('solution', (event, solutionText) => {
      setSolution(solutionText);
      setStatus('Solution ready');
      setIsProcessing(false);
    });

    ipcRenderer.on('error', (event, message) => {
      setError(message);
      setIsProcessing(false);
    });

    ipcRenderer.on('reset', () => {
      setSolution('Welcome to LeetCode Assistant!\n\nUse **Ctrl+H** to take a screenshot of your problem, then **Ctrl+Enter** to get a solution.');
      setStatus('Ready');
      setScreenshotStatus('No screenshot taken');
      setError(null);
    });

    ipcRenderer.on('processing', (event, processing) => {
      setIsProcessing(processing);
      if (processing) {
        setStatus('Processing...');
      }
    });

    ipcRenderer.on('show-settings', (event, supportedProviders) => {
      setProviders(supportedProviders);
      setShowSettings(true);
    });

    ipcRenderer.on('provider-changed', (event, provider) => {
      setCurrentProvider(prev => ({ ...prev, provider }));
      setShowSettings(false);
      setStatus(`Provider changed to ${provider}`);
    });

    // Get current provider info
    ipcRenderer.invoke('get-current-provider').then(info => {
      setCurrentProvider(info);
    });

    // Cleanup
    return () => {
      ipcRenderer.removeAllListeners('screenshot-taken');
      ipcRenderer.removeAllListeners('solution');
      ipcRenderer.removeAllListeners('error');
      ipcRenderer.removeAllListeners('reset');
      ipcRenderer.removeAllListeners('processing');
      ipcRenderer.removeAllListeners('show-settings');
      ipcRenderer.removeAllListeners('provider-changed');
    };
  }, []);

  const handleChangeProvider = (provider, apiKey, model) => {
    ipcRenderer.send('change-ai-provider', { provider, apiKey, model });
  };

  return (
    <div className="app-container p-4 flex flex-col h-screen">
      <StatusBar status={status} screenshotStatus={screenshotStatus} />

      <main className="flex-grow overflow-auto p-4 my-2">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Analyzing problem and generating solution...</p>
          </div>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown>{solution}</ReactMarkdown>
          </div>
        )}
      </main>

      {showSettings && (
        <SettingsPanel
          providers={providers}
          currentProvider={currentProvider}
          onChangeProvider={handleChangeProvider}
          onClose={() => setShowSettings(false)}
        />
      )}

      <ShortcutBar />
    </div>
  );
}

export default App;

