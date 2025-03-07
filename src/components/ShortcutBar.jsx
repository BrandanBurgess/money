import React from 'react';

function ShortcutBar() {
  return (
    <div className="py-2 px-4 bg-gray-800/70 rounded-b-lg border-t border-gray-700/30 text-xs text-gray-400 flex justify-center space-x-3">
      <span><span className="shortcut-key">Ctrl+B</span> Toggle window</span>
      <span><span className="shortcut-key">Ctrl+H</span> Screenshot</span>
      <span><span className="shortcut-key">Ctrl+Enter</span> Analyze</span>
      <span><span className="shortcut-key">Ctrl+S</span> Settings</span>
      <span><span className="shortcut-key">Ctrl+R</span> Reset</span>
      <span><span className="shortcut-key">Ctrl+Q</span> Quit</span>
    </div>
  );
}

export default ShortcutBar;

