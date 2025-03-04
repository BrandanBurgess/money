// src/App.jsx
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import StatusBar from './components/StatusBar';
import ShortcutBar from './components/ShortcutBar';
import SettingsPanel from './components/SettingsPanel';

const { ipcRenderer } = window.require('electron');

const DEFAULT_PROVIDER_CONFIGS = {
  openai: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    apiKey: ''
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    apiKey: ''
  }
};

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
  
  // Load all provider configs from localStorage
  const [providerConfigs, setProviderConfigs] = useState(() => {
    const saved = localStorage.getItem('providerConfigs');
    if (saved) {
      return JSON.parse(saved);
    }
    return DEFAULT_PROVIDER_CONFIGS;
  });

  // Current active provider
  const [currentProvider, setCurrentProvider] = useState(() => {
    const saved = localStorage.getItem('currentProvider');
    const providerId = saved || 'openai';
    
    // Get the config for this provider
    const configs = JSON.parse(localStorage.getItem('providerConfigs')) || DEFAULT_PROVIDER_CONFIGS;
    return configs[providerId];
  });

  // Save provider configs whenever they change
  useEffect(() => {
    localStorage.setItem('providerConfigs', JSON.stringify(providerConfigs));
  }, [providerConfigs]);

  // Save current provider whenever it changes
  useEffect(() => {
    localStorage.setItem('currentProvider', currentProvider.provider);
    // Initialize AI with saved settings
    ipcRenderer.send('initialize-with-settings', currentProvider);
  }, [currentProvider]);

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

    ipcRenderer.on('provider-changed', (event, { provider, model }) => {
      setCurrentProvider(prev => ({ ...prev, provider, model }));
      setShowSettings(false);
      setStatus(`Provider changed to ${provider} (${model})`);
    });

    ipcRenderer.on('ai-initialized', (event, { success, error }) => {
      if (!success) {
        setError(error);
      }
    });

    // Initialize provider info
    ipcRenderer.invoke('get-current-provider').then(info => {
      if (info) {
        setCurrentProvider(prev => ({
          ...prev,
          provider: info.provider,
          model: info.model
        }));
      }
    }).catch(err => {
      console.error('Failed to get current provider:', err);
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
      ipcRenderer.removeAllListeners('ai-initialized');
    };
  }, []);

  const handleChangeProvider = (provider, apiKey, model) => {
    // Update the config for this provider
    setProviderConfigs(prev => ({
      ...prev,
      [provider]: { provider, apiKey, model }
    }));

    // Set as current provider
    setCurrentProvider({ provider, apiKey, model });
    ipcRenderer.send('change-ai-provider', { provider, apiKey, model });
  };

  return (
    <div className="app-container p-4 flex flex-col h-screen">
      <StatusBar 
        status={status} 
        screenshotStatus={screenshotStatus} 
        provider={currentProvider.provider}
        model={currentProvider.model}
      />

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
          providerConfigs={providerConfigs}
          onChangeProvider={handleChangeProvider}
          onClose={() => setShowSettings(false)}
        />
      )}

      <ShortcutBar />
    </div>
  );
}

export default App;

