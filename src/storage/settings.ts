import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameMode } from '../types/game';

const KEY_MODE = '@yazboz/settings/mode';

export const loadMode = async (): Promise<GameMode> => {
  const raw = await AsyncStorage.getItem(KEY_MODE);
  return raw === 'renkli-klasik' ? 'renkli-klasik' : 'klasik';
};

export const saveMode = async (mode: GameMode): Promise<void> => {
  await AsyncStorage.setItem(KEY_MODE, mode);
};
