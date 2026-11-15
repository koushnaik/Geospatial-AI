import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  isLight: false,
  setTheme: () => {},
  toggleTheme: () => {},
  chartTheme: {
    grid: '#1E2D44',
    axis: '#94A3B8',
    tooltipBg: '#111C2E',
    tooltipBorder: '#1E2D44',
    tooltipText: '#F8FAFC',
  },
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('geoflood-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      console.warn('Unable to access localStorage for theme:', e);
    }
    return 'dark'; // Dark Mode as standard default
  });

  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    try {
      localStorage.setItem('geoflood-theme', theme);
    } catch (e) {
      console.warn('Unable to save theme to localStorage:', e);
    }

    // Sync theme-color meta tag for browser chrome
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', isDark ? '#0B1220' : '#F1F5F9');
    }
  }, [theme, isDark]);

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Reusable theme tokens for SVG / Canvas / Recharts components
  const chartTheme = {
    grid: isDark ? '#1E2D44' : '#E2E8F0',
    axis: isDark ? '#94A3B8' : '#475569',
    tooltipBg: isDark ? '#111C2E' : '#FFFFFF',
    tooltipBorder: isDark ? '#1E2D44' : '#CBD5E1',
    tooltipText: isDark ? '#F8FAFC' : '#0F172A',
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        isLight,
        setTheme,
        toggleTheme,
        chartTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
