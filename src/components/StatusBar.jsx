import React from 'react';

function StatusBar({ status, screenshotStatus, provider, model }) {
  return (
    <div className="status-bar">
      <div className="flex items-center space-x-4">
        <span>{status}</span>
        <span className="text-gray-400">|</span>
        <span>{screenshotStatus}</span>
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-400">
        <span>{provider}</span>
        <span>•</span>
        <span>{model}</span>
      </div>
    </div>
  );
}

export default StatusBar;

