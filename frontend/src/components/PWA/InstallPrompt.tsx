import React, { useEffect, useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const DISMISS_KEY = 'pwa_install_dismissed_at';
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000; // re-offer after 14 days, not on every visit

function wasRecentlyDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_FOR_MS;
}

/** Floating banner, docked just above the bottom tab bar, offering to install the app. */
export const InstallPrompt: React.FC = () => {
  const { canInstall, canPromptInstall, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(wasRecentlyDismissed);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  // A native prompt arriving after the user already dismissed the banner this session
  // is still worth surfacing — re-check once canPromptInstall flips true.
  useEffect(() => {
    if (canPromptInstall) setDismissed(wasRecentlyDismissed());
  }, [canPromptInstall]);

  if (!canInstall || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleInstallClick = async () => {
    if (isIOS && !canPromptInstall) {
      setShowIOSSteps(true);
      return;
    }
    const accepted = await promptInstall();
    if (accepted) dismiss();
  };

  return (
    <div
      className="fixed left-3 right-3 z-[45] max-w-sm mx-auto animate-in slide-in-from-bottom fade-in"
      style={{ bottom: 'calc(var(--bottom-nav-h) + var(--safe-bottom) + 0.75rem)' }}
      role="dialog"
      aria-label="Install SmartFinance"
    >
      <div className="liquid-glass-card rounded-2xl p-4 shadow-xl">
        {!showIOSSteps ? (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 dark:text-white">Install SmartFinance</p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                Add it to your Home Screen for a full-screen, offline-ready app.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 rounded-xl bg-brand-600 active:bg-brand-700 text-white text-xs font-semibold shadow-sm"
                >
                  Install
                </button>
                <button
                  onClick={dismiss}
                  className="px-3 py-1.5 rounded-xl text-gray-500 dark:text-slate-400 text-xs font-semibold"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="shrink-0 p-1 -m-1 text-gray-400 dark:text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 shrink-0">
              <SquarePlus className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 dark:text-white">Add to Home Screen</p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
                Tap <Share className="w-3.5 h-3.5 inline text-brand-600" aria-hidden="true" /> <span className="font-semibold">Share</span> in Safari, then
                <span className="font-semibold">Add to Home Screen</span>.
              </p>
              <button
                onClick={dismiss}
                className="px-3 py-1.5 rounded-xl bg-brand-600 active:bg-brand-700 text-white text-xs font-semibold shadow-sm mt-3"
              >
                Got it
              </button>
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="shrink-0 p-1 -m-1 text-gray-400 dark:text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
