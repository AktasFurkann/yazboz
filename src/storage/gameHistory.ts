import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BottomEntry,
  BottomMarker,
  Column,
  SavedGame,
  TopEntry,
} from '../types/game';

const STORAGE_KEY = '@yazboz/game-history/v1';
const MAX_HISTORY = 50;

type LegacyTop = number | { value: number; locked?: boolean; round?: number };
type LegacyBottom =
  | number
  | {
      value: number;
      multiplier?: number;
      locked?: boolean;
      round?: number;
      marker?: BottomMarker;
    };

const VALID_MARKERS: BottomMarker[] = [
  'finished',
  'penalty',
  'not-opened',
  'gosterge',
];

type LegacyColumn = { top: LegacyTop[]; bottom: LegacyBottom[] };
type LegacyGame = Omit<SavedGame, 'columns' | 'mode'> & {
  columns: LegacyColumn[];
  mode?: SavedGame['mode'];
  playMode?: SavedGame['playMode'];
  roundMultipliers?: Record<number, number>;
  specialFinishes?: Record<number, boolean>;
  playerNames?: string[];
};

const migrateTop = (entry: LegacyTop): TopEntry => {
  if (typeof entry === 'number') return { value: entry, round: 1 };
  return { value: entry.value, round: entry.round ?? 1 };
};

const migrateBottom = (entry: LegacyBottom): BottomEntry => {
  if (typeof entry === 'number') return { value: entry, round: 1 };
  const base: BottomEntry = { value: entry.value, round: entry.round ?? 1 };
  // Preserve every known marker (finished / penalty / not-opened); older code
  // only kept 'finished', which silently dropped penalty amounts in history.
  if (entry.marker && VALID_MARKERS.includes(entry.marker)) {
    base.marker = entry.marker;
  }
  return base;
};

const migrateColumn = (col: LegacyColumn): Column => ({
  top: (col.top ?? []).map(migrateTop),
  bottom: (col.bottom ?? []).map(migrateBottom),
});

const migrateGame = (game: LegacyGame): SavedGame => ({
  ...game,
  mode: game.mode ?? 'klasik',
  playMode: game.playMode ?? 'singles',
  columns: (game.columns ?? []).map(migrateColumn),
  playerNames: game.playerNames ?? [
    'Oyuncu 1',
    'Oyuncu 2',
    'Oyuncu 3',
    'Oyuncu 4',
  ],
  roundMultipliers: game.roundMultipliers ?? {},
  specialFinishes: game.specialFinishes ?? {},
});

export const loadHistory = async (): Promise<SavedGame[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateGame);
  } catch {
    return [];
  }
};

export const saveGame = async (game: SavedGame): Promise<SavedGame[]> => {
  const existing = await loadHistory();
  const next = [game, ...existing].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const deleteGame = async (id: string): Promise<SavedGame[]> => {
  const existing = await loadHistory();
  const next = existing.filter((g) => g.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const clearHistory = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
