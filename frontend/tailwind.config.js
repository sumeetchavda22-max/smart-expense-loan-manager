/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  future: {
    // On iOS, `hover:` styles otherwise "stick" after a tap. Only apply hover on devices that can hover.
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      screens: {
        // iPhone 15 / 15 Pro portrait width is 393px
        xs: '390px',
      },
      colors: {
        // ---------------------------------------------------------------
        // SMT-C design system — "institutional-grade modern fintech"
        // Deep slate-navy field with luminous emerald/teal/coral accents.
        // ---------------------------------------------------------------
        'text-primary': '#F9FAFB',
        'text-secondary': '#94A3B8',
        'surface-variant': '#313540',
        'debt-rose': '#B04183',
        'surface-dim': '#0f131d',
        'on-secondary-container': '#002e3e',
        'on-secondary-fixed-variant': '#004d65',
        error: '#ffb4ab',
        'surface-container-low': '#171b26',
        tertiary: '#ffb6b3',
        'slate-surface': '#111827',
        'inverse-surface': '#dfe2f1',
        'on-error': '#690005',
        'alert-coral': '#FF6B6B',
        'error-container': '#93000a',
        outline: '#85948e',
        'on-primary-fixed-variant': '#005140',
        'primary-fixed': '#63fbd3',
        'surface-container-highest': '#313540',
        'slate-surface-raised': '#1E293B',
        'surface-bright': '#353944',
        'on-tertiary': '#68000f',
        'primary-fixed-dim': '#3fdeb7',
        'surface-container': '#1c1f2a',
        'on-tertiary-container': '#840d1b',
        'inverse-on-surface': '#2c303b',
        'secondary-fixed': '#bfe9ff',
        'on-error-container': '#ffdad6',
        'on-primary-fixed': '#002018',
        'glass-panel': 'rgba(17, 24, 39, 0.72)',
        'on-background': '#dfe2f1',
        'slate-border': 'rgba(255, 255, 255, 0.08)',
        'secondary-container': '#2f9bc4',
        'surface-container-lowest': '#0a0e18',
        'on-surface': '#dfe2f1',
        'on-primary-container': '#004b3b',
        'surface-tint': '#3fdeb7',
        'cashflow-emerald': '#00C49F',
        'tertiary-fixed': '#ffdad8',
        'tertiary-container': '#ff8c89',
        'growth-teal': '#0088B0',
        background: '#0f131d',
        'on-primary': '#00382c',
        secondary: '#71d2fd',
        'on-tertiary-fixed': '#410006',
        'secondary-fixed-dim': '#71d2fd',
        'on-secondary-fixed': '#001f2a',
        'inverse-primary': '#006b56',
        'tertiary-fixed-dim': '#ffb3b0',
        'outline-variant': '#3c4a44',
        'on-tertiary-fixed-variant': '#8c1520',
        'warning-amber': '#F59E0B',
        primary: '#42e0ba',
        surface: '#0f131d',
        'on-surface-variant': '#bbcac3',
        'surface-container-high': '#262a35',
        'on-secondary': '#003547',
        'primary-container': '#00c49f',

        // `brand` / `accent2` are used everywhere in the app (buttons, links, active tabs, FAB,
        // gradients) — re-hued here to the design system's growth-teal / cashflow-emerald pair
        // so the whole app re-themes from this one file, with zero per-page edits.
        brand: {
          50: '#e6f6fb', 100: '#cceef7', 200: '#99ddef', 300: '#66cce7', 400: '#33bbdf',
          500: '#0aa3cc', 600: '#0088B0', 700: '#006d8d', 800: '#00526a', 900: '#003847', 950: '#001f28',
        },
        accent2: {
          50: '#e6faf5', 100: '#ccf5eb', 200: '#99ebd6', 300: '#66e0c2', 400: '#33d6ad',
          500: '#00C49F', 600: '#00a382', 700: '#008266', 800: '#00614b', 900: '#004030', 950: '#002018',
        },
        // Tailwind's stock `slate` scale is what every existing dark: surface/border/text class
        // in this app already uses — remapping it to the design system's surface tokens re-themes
        // the entire app to the new institutional-fintech palette without touching each page.
        slate: {
          50: '#f8fafc', 100: '#F9FAFB', 200: '#dfe2f1', 300: '#bbcac3', 400: '#94A3B8',
          500: '#85948e', 600: '#3a3f4d', 700: '#313540', 800: '#1c1f2a', 900: '#111827', 950: '#0a0e18',
        },
      },
      fontFamily: {
        // Driven by --font-sans/--font-heading custom properties (set in index.css, overridden
        // at runtime by the font picker in Settings — see ThemeContext.tsx) so every one of these
        // design-system tokens follows the user's chosen typeface, not just the plain h1-h6 rule.
        sans: ['var(--font-sans)', 'Inter', 'Roboto', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        // Design-system numeric font-family tokens (paired with matching fontSize tokens below)
        'headline-lg-mobile': ['var(--font-heading)', 'Inter', 'sans-serif'],
        'label-numeric-md': ['var(--font-sans)', 'Inter', 'sans-serif'],
        'display-lg': ['var(--font-heading)', 'Inter', 'sans-serif'],
        'display-lg-mobile': ['var(--font-heading)', 'Inter', 'sans-serif'],
        'body-md': ['var(--font-sans)', 'Inter', 'sans-serif'],
        'body-sm': ['var(--font-sans)', 'Inter', 'sans-serif'],
        'headline-lg': ['var(--font-heading)', 'Inter', 'sans-serif'],
        'body-lg': ['var(--font-sans)', 'Inter', 'sans-serif'],
        'label-numeric-lg': ['var(--font-heading)', 'Inter', 'sans-serif'],
        'label-caps': ['var(--font-sans)', 'Inter', 'sans-serif'],
        'headline-sm': ['var(--font-heading)', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'headline-lg-mobile': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'label-numeric-md': ['1rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-lg': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-lg-mobile': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-md': ['0.875rem', { lineHeight: '1.375rem', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0.01em', fontWeight: '400' }],
        'headline-lg': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0em', fontWeight: '400' }],
        'label-numeric-lg': ['1.5rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'label-caps': ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.08em', fontWeight: '600' }],
        'headline-sm': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        m3: '0px 4px 12px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
        'elevate-2': '0 8px 32px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12)',
        'glow-primary': '0 0 20px rgba(0, 196, 159, 0.4)',
      },
      spacing: {
        // iOS safe-area insets (Dynamic Island / home indicator)
        'safe-t': 'env(safe-area-inset-top)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
        'safe-r': 'env(safe-area-inset-right)',
        // Design-system named spacing tokens
        'space-sm': '0.5rem',
        'space-xs': '0.25rem',
        'space-md': '1rem',
        'margin-mobile': '1rem',
        'gutter-mobile': '0.75rem',
        margin: '2rem',
        'space-xl': '2.5rem',
        'space-lg': '1.5rem',
        gutter: '1.5rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0.6' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'zoom-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out both',
        'slide-up': 'slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'zoom-in': 'zoom-in 200ms ease-out both',
      },
    },
  },
  plugins: [],
}
