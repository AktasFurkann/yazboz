import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { darkColors, lightColors, ThemeColors } from '../theme';
import { loadTheme, saveTheme } from '../storage/settings';

export type ThemeName = 'dark' | 'light';

interface ThemeContextValue {
  name: ThemeName;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (name: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [name, setName] = useState<ThemeName>('dark');

  useEffect(() => {
    loadTheme().then(setName);
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setName(next);
    saveTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setName((prev) => {
      const next: ThemeName = prev === 'dark' ? 'light' : 'dark';
      saveTheme(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      name,
      isDark: name === 'dark',
      colors: name === 'dark' ? darkColors : lightColors,
      setTheme,
      toggleTheme,
    }),
    [name, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return ctx;
};

export const useThemedStyles = <T,>(
  factory: (colors: ThemeColors) => T
): T => {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
};
