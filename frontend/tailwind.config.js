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
        // Smart Money design system — teal primary
        brand: {
          50: '#e9f8ff',
          100: '#e9f8ff',
          200: '#cbeeff',
          300: '#99e0ff',
          400: '#62c5ee',
          500: '#38a6cf',
          600: '#1186ac',
          700: '#006786',
          800: '#004961',
          900: '#0a303e',
          950: '#071f28',
        },
        // Smart Money design system — magenta secondary accent
        accent2: {
          50: '#fff1f4',
          100: '#fff1f4',
          200: '#ffdee6',
          300: '#ffc0d0',
          400: '#ff90b1',
          500: '#ff458e',
          600: '#d82071',
          700: '#aa0b56',
          800: '#790e3d',
          900: '#4b1528',
          950: '#2f0c19',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'm3': '0px 4px 12px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
      },
      spacing: {
        // iOS safe-area insets (Dynamic Island / home indicator)
        'safe-t': 'env(safe-area-inset-top)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
        'safe-r': 'env(safe-area-inset-right)',
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
