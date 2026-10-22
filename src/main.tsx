import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './workspace.css';
import './i18n';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[App ErrorBoundary caught]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div dir="rtl" className="min-h-screen bg-[#F6F9F8] text-[#193B3A] p-8 flex flex-col items-center justify-center text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg border border-[#CDE5DF]">
            <h2 className="text-xl font-bold mb-3 text-[#126B68]">عين المستشفى</h2>
            <p className="text-sm text-[#6E8883] mb-5">حدث تحديث في مساحة العمل. اضغط أدناه للمتابعة.</p>
            <button
              onClick={() => { localStorage.removeItem('ain_theme_preference_v1'); window.location.reload(); }}
              className="px-6 py-2.5 bg-[#126B68] text-white font-bold rounded-xl hover:bg-[#0E5452] transition-colors cursor-pointer"
            >
              إعادة تحميل مساحة العمل
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
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
