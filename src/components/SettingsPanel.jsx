// src/components/SettingsPanel.jsx
import React, { useState, useEffect, useRef } from 'react';

function SettingsPanel({ providers, currentProvider, providerConfigs, onChangeProvider, onClose }) {
  const [provider, setProvider] = useState(currentProvider.provider);
  const [apiKey, setApiKey] = useState(currentProvider.apiKey || '');
  const [model, setModel] = useState(currentProvider.model || '');
  const [selectedIndex, setSelectedIndex] = useState(
    providers.findIndex(p => p.id === currentProvider.provider)
  );
  const [focusedElement, setFocusedElement] = useState('provider');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Update local state when provider changes
  useEffect(() => {
    const config = providerConfigs[provider];
    if (config) {
      setApiKey(config.apiKey || '');
      setModel(config.model || providers.find(p => p.id === provider)?.defaultModel || '');
    } else {
      // If no config exists for this provider, use defaults
      const defaultProvider = providers.find(p => p.id === provider);
      setApiKey('');
      setModel(defaultProvider?.defaultModel || '');
    }
  }, [provider, providerConfigs, providers]);

  const providerRef = useRef(null);
  const modelRef = useRef(null);
  const apiKeyRef = useRef(null);

  const selectedProvider = providers.find(p => p.id === provider) || providers[0];

  // Focus management
  useEffect(() => {
    switch (focusedElement) {
      case 'provider':
        providerRef.current?.focus();
        break;
      case 'model':
        modelRef.current?.focus();
        break;
      case 'apiKey':
        apiKeyRef.current?.focus();
        break;
    }
  }, [focusedElement]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!providers.length) return;

      console.log(e.ctrlKey, e.code)
      // Save changes shortcut
      if (e.ctrlKey && e.code === "ShiftRight") {
        e.preventDefault();
        if (apiKey) {
          handleSubmit(e);
        }
        return;
      }

      // Navigation between elements
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          // Navigate backwards
          setFocusedElement(prev => {
            switch (prev) {
              case 'apiKey': return 'model';
              case 'model': return 'provider';
              default: return 'apiKey';
            }
          });
        } else {
          // Navigate forwards
          setFocusedElement(prev => {
            switch (prev) {
              case 'provider': return 'model';
              case 'model': return 'apiKey';
              default: return 'provider';
            }
          });
        }
        setIsDropdownOpen(false);
        return;
      }

      // Handle dropdown navigation
      if (focusedElement === 'provider' || focusedElement === 'model') {
        switch(e.key) {
          case 'Enter':
          case ' ':
            e.preventDefault();
            setIsDropdownOpen(prev => !prev);
            break;
          case 'ArrowUp':
            e.preventDefault();
            if (isDropdownOpen) {
              if (focusedElement === 'provider') {
                setSelectedIndex((prev) => {
                  const newIndex = prev > 0 ? prev - 1 : providers.length - 1;
                  const newProvider = providers[newIndex].id;
                  setProvider(newProvider);
                  return newIndex;
                });
              } else {
                setModel(prev => {
                  const currentIndex = selectedProvider.models.indexOf(prev);
                  const newIndex = currentIndex > 0 ? currentIndex - 1 : selectedProvider.models.length - 1;
                  return selectedProvider.models[newIndex];
                });
              }
            }
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (isDropdownOpen) {
              if (focusedElement === 'provider') {
                setSelectedIndex((prev) => {
                  const newIndex = prev < providers.length - 1 ? prev + 1 : 0;
                  const newProvider = providers[newIndex].id;
                  setProvider(newProvider);
                  return newIndex;
                });
              } else {
                setModel(prev => {
                  const currentIndex = selectedProvider.models.indexOf(prev);
                  const newIndex = currentIndex < selectedProvider.models.length - 1 ? currentIndex + 1 : 0;
                  return selectedProvider.models[newIndex];
                });
              }
            }
            break;
          case 'Escape':
            if (isDropdownOpen) {
              e.preventDefault();
              setIsDropdownOpen(false);
            } else {
              e.preventDefault();
              onClose();
            }
            break;
        }
      } else if (e.key === 'Escape' && !isDropdownOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [providers, apiKey, onClose, focusedElement, isDropdownOpen, selectedProvider]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!apiKey) {
      alert('API key is required');
      return;
    }
    onChangeProvider(provider, apiKey, model);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700">
        <h3 className="text-xl font-bold mb-4">AI Provider Settings</h3>
        <p className="text-sm text-gray-400 mb-4">
          Tab to navigate • Space/Enter to open dropdown • ↑/↓ to select • Cmd + Right Shift to save • Esc to close
        </p>

        <form tabIndex={-1} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="ai-provider" className="block text-sm font-medium">
              Provider: {isDropdownOpen && focusedElement === 'provider' ? '(selecting...)' : ''}
            </label>
            <select
              ref={providerRef}
              id="ai-provider"
              value={provider}
              onChange={(e) => {
                const newProvider = e.target.value;
                setProvider(newProvider);
                setSelectedIndex(providers.findIndex(p => p.id === newProvider));
              }}
              onFocus={() => setFocusedElement('provider')}
              className={`w-full px-3 py-2 bg-gray-700 border ${focusedElement === 'provider' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-600'} rounded-md focus:outline-none transition-colors`}
            >
              {providers.map((p, index) => (
                <option 
                  key={p.id} 
                  value={p.id}
                  className={index === selectedIndex ? 'bg-blue-600' : ''}
                >
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="model" className="block text-sm font-medium">
              Model: {isDropdownOpen && focusedElement === 'model' ? '(selecting...)' : ''}
            </label>
            <select
              ref={modelRef}
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              onFocus={() => setFocusedElement('model')}
              className={`w-full px-3 py-2 bg-gray-700 border ${focusedElement === 'model' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-600'} rounded-md focus:outline-none transition-colors`}
            >
              {selectedProvider?.models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="api-key" className="block text-sm font-medium">
              API Key:
            </label>
            <input
              ref={apiKeyRef}
              type="password"
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onFocus={() => {
                setFocusedElement('apiKey');
                setIsDropdownOpen(false);
              }}
              placeholder="Enter API key"
              className={`w-full px-3 py-2 bg-gray-700 border ${focusedElement === 'apiKey' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-600'} rounded-md focus:outline-none transition-colors`}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
            >
              Cancel (Esc)
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md transition-colors"
            >
              Save Changes (Ctrl + Right ⇧)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsPanel;

