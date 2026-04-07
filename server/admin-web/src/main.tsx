import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';

// Global reset styles
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #F7F1E6; color: #1A1A1A; line-height: 1.6; }
  a { color: inherit; }
  button { font-family: inherit; }
  input, select, textarea { font-family: inherit; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
