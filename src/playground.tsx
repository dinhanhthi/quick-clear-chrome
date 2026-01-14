import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n/config';
import { installMockChromeAPIs } from './utils/chrome-api-mock.ts';

// Install mock Chrome APIs BEFORE anything else
installMockChromeAPIs();

console.log(
  '%c🎮 Playground Mode Active',
  'background: #667eea; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 14px;'
);
console.log(
  '%cAll Chrome API calls will be mocked and logged to this console.',
  'color: #667eea; font-size: 12px;'
);

// Verify Chrome APIs are installed
if (!window.chrome?.storage?.local) {
  console.error('Failed to install mock Chrome APIs!');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
