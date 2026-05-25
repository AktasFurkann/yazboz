import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMode } from '../types/game';
import type { ThemeName } from '../contexts/ThemeContext';

const KEY_MODE = '@yazboz/settings/mode';
const KEY_THEME = '@yazboz/settings/theme';

export const loadMode = async (): Promise<GameMode> => {
  const raw = await AsyncStorage.getItem(KEY_MODE);
  return raw === 'renkli-klasik' ? 'renkli-klasik' : 'klasik';
};

export const saveMode = async (mode: GameMode): Promise<void> => {
  await AsyncStorage.setItem(KEY_MODE, mode);
};

export const loadTheme = async (): Promise<ThemeName> => {
  const raw = await AsyncStorage.getItem(KEY_THEME);
  return raw === 'light' ? 'light' : 'dark';
};

export const saveTheme = async (theme: ThemeName): Promise<void> => {
  await AsyncStorage.setItem(KEY_THEME, theme);
};
