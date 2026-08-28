import { useState, useEffect } from 'react';
import { themes } from '../constants/themes';

export const useTheme = () => {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('themeName') || 'classic');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'dark');

  useEffect(() => {
    const selectedTheme = themes[themeName][themeMode];
    Object.entries(selectedTheme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    localStorage.setItem('themeName', themeName);
    localStorage.setItem('themeMode', themeMode);

    // Also update body background for seamless transitions
    document.body.style.backgroundColor = selectedTheme['--bg-color'];

    // Add theme class to body for specific CSS overrides
    document.body.className = `theme-${themeName}`;
  }, [themeName, themeMode]);

  return { themeName, setThemeName, themeMode, setThemeMode };
};
