import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Load theme from storage on mount
  useEffect(() => {
    if (chrome?.storage?.local) {
      chrome.storage.local.get(['theme'], (result) => {
        const savedTheme = result.theme as Theme;
        if (savedTheme) {
          setTheme(savedTheme);
        }
      });
    }
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    const applyTheme = () => {
      let effectiveTheme: 'light' | 'dark';

      if (theme === 'system') {
        // Use system preference
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      } else {
        effectiveTheme = theme;
      }

      setResolvedTheme(effectiveTheme);
      document.documentElement.setAttribute('data-theme', effectiveTheme);
    };

    applyTheme();

    // Listen for system theme changes if theme is set to 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme: Theme =
      theme === 'system' ? 'light' :
      theme === 'light' ? 'dark' :
      'system';

    setTheme(newTheme);

    // Save to storage
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ theme: newTheme });
    }
  };

  return { theme, resolvedTheme, toggleTheme };
};
