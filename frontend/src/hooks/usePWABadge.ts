import { useEffect } from 'react';
import { Reminder } from '../types/finance';

declare global {
  interface Navigator {
    setAppBadge?: (contents?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

/**
 * Badging API — puts the count of due-or-overdue, unpaid reminders on the installed app's
 * Home Screen icon. Supported on Android Chrome, desktop Chrome/Edge, and iOS 16.4+ Safari
 * once added to Home Screen; unsupported browsers simply skip this (feature-detected below).
 */
export function usePWABadge(reminders: Reminder[]) {
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return;
    const today = new Date().toISOString().substring(0, 10);
    const dueCount = reminders.filter((r) => !r.isCompleted && r.dueDate <= today).length;
    if (dueCount > 0) {
      navigator.setAppBadge!(dueCount).catch(() => {});
    } else {
      navigator.clearAppBadge?.().catch(() => {});
    }
  }, [reminders]);
}
