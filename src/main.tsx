import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './workspace.css';
import './i18n';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Progressive Web App Service Worker for Push Notifications and background alerts
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Ain Al-Mustashfa] Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Ain Al-Mustashfa] Service Worker registration failed:', err);
      });
  });
}
