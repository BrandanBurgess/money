import React from 'react';

function StatusBar({ status, screenshotStatus }) {
  return (
    <div className="flex justify-between items-center py-2 px-4 bg-gray-800/70 rounded-t-lg border-b border-gray-700/30">
      <div className="flex items-center">
        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
        <span className="text-sm font-medium">{status}</span>
      </div>
      <span className="text-xs text-gray-400">{screenshotStatus}</span>
    </div>
  );
}

export default StatusBar;

