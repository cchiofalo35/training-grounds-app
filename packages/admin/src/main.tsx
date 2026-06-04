import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import { BRAND } from './brand';
import './index.css';

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
