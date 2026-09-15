import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'amoled';
export type FontChoice = 'inter' | 'jakarta' | 'serif' | 'mono';

interface ThemeContextType {
  theme: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  font: FontChoice;
  setFont: (font: FontChoice) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setThemeMode: () => {},
  toggleTheme: () => {},
  font: 'inter',
  setFont: () => {},
});

// Every option maps to the SAME stack for both headings and body text, so picking a font
// changes the whole app in one obvious, cohesive way instead of leaving half the UI on Inter.
const FONT_STACKS: Record<FontChoice, string> = {
  inter: `'Inter', Roboto, sans-serif`,
  jakarta: `'Plus Jakarta Sans', Inter, sans-serif`,
  serif: `'Source Serif 4', Georgia, serif`,
  mono: `'JetBrains Mono', 'Courier New', monospace`,
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('app_theme') as ThemeMode) || 'dark';
  });
  const [font, setFontState] = useState<FontChoice>(() => {
    return (localStorage.getItem('app_font') as FontChoice) || 'inter';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'amoled');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'amoled') {
      root.classList.add('dark', 'amoled');
    }

    localStorage.setItem('app_theme', theme);

    // Tint iOS Safari's chrome / PWA status bar to match the active theme
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) {
      meta.content = theme === 'light' ? '#0088b0' : theme === 'dark' ? '#0f131d' : '#000000';
    }
  }, [theme]);

  useEffect(() => {
    const stack = FONT_STACKS[font] || FONT_STACKS.inter;
    document.documentElement.style.setProperty('--font-sans', stack);
    document.documentElement.style.setProperty('--font-heading', stack);
    localStorage.setItem('app_font', font);
  }, [font]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'amoled';
      return 'light';
    });
  };

  const setFont = (next: FontChoice) => setFontState(next);

  return (
    <ThemeContext.Provider value={{ theme, setThemeMode, toggleTheme, font, setFont }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
