import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import { BRAND } from './brand';
import './index.css';

// Build marker — bump the suffix to force fresh asset hashes on deploy
// (sidesteps any stale GitHub Pages CDN 404 cached against an old asset path).
const PORTAL_BUILD = 'karuna-portal-2';
console.info(`${BRAND.wordmark} Coach Portal · ${PORTAL_BUILD}`);

// Apply the tenant accent + document title before first paint.
document.documentElement.style.setProperty('--brand-accent-rgb', BRAND.accentRgb);
document.title = `${BRAND.wordmark} · ${BRAND.subtitle}`;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/training-grounds-app">
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
