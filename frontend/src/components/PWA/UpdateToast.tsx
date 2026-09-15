import React, { useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Registers the service worker (registerType: 'prompt' in vite.config.ts means this is the
 * ONLY place it gets registered — see the comment there) and surfaces two toasts:
 * "update available" when a new build has been precached, and a brief "ready offline"
 * confirmation the very first time the app shell finishes caching.
 */
export const UpdateToast: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Vite's dev server has no build to check for updates against
      if (!registration || import.meta.env.DEV) return;
      setInterval(() => registration.update(), HOUR_MS);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 4000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  if (needRefresh) {
    return (
      <div
        className="fixed left-3 right-3 z-[45] max-w-sm mx-auto animate-in fade-in"
        style={{ top: 'calc(var(--safe-top) + 3.75rem)' }}
        role="status"
      >
        <div className="liquid-glass-card rounded-2xl p-4 shadow-xl flex items-center gap-3">
          <div className="p-2 rounded-xl bg-growth-teal/15 text-growth-teal shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900 dark:text-white">Update available</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">A new version of SmartFinance is ready.</p>
          </div>
          <button
            onClick={() => updateServiceWorker(true)}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-brand-600 active:bg-brand-700 text-white text-xs font-semibold shadow-sm"
          >
            Reload
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            aria-label="Dismiss"
            className="shrink-0 p-1 -m-1 text-gray-400 dark:text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div
        className="fixed left-3 right-3 z-[45] max-w-sm mx-auto animate-in fade-in"
        style={{ top: 'calc(var(--safe-top) + 3.75rem)' }}
        role="status"
      >
        <div className="liquid-glass-card rounded-2xl px-4 py-3 shadow-xl text-center">
          <p className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">SmartFinance is ready to work offline.</p>
        </div>
      </div>
    );
  }

  return null;
};
