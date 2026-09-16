/**
 * Vibration API wrapper — Android Chrome/PWA supports it, iOS Safari has never implemented
 * navigator.vibrate at all (same platform gap as the manifest `shortcuts` feature), so this
 * is a silent no-op there rather than an error. Durations are short/native-feeling on purpose.
 */
const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export type HapticStyle = 'light' | 'medium' | 'success' | 'warning';

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 8,
  medium: 16,
  success: [10, 40, 10],
  warning: [15, 60, 15, 60, 15],
};

export function haptic(style: HapticStyle = 'light') {
  if (!canVibrate) return;
  try {
    navigator.vibrate(PATTERNS[style]);
  } catch {
    // Some browsers throw if called outside a user gesture — never let that break a click handler.
  }
}
