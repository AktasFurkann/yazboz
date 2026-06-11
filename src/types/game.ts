export type ColumnId = 0 | 1 | 2 | 3;

export const COLUMN_COUNT = 4;
export const COLUMN_IDS: readonly ColumnId[] = [0, 1, 2, 3] as const;

export type Side = 'top' | 'bottom';

export type GameMode = 'klasik' | 'renkli-klasik' | 'duz-101' | 'klasik-okey';

export type PlayMode = 'singles' | 'pairs';

export const MAX_PLAYERS_BY_MODE: Record<PlayMode, number> = {
  singles: 4,
  pairs: 2,
};

export const PLAY_MODE_LABEL: Record<PlayMode, string> = {
  singles: 'Tek',
  pairs: 'Eşli',
};

export interface TopEntry {
  value: number;
  round: number;
}

export type BottomMarker = 'finished' | 'penalty' | 'not-opened' | 'gosterge';

export interface BottomEntry {
  value: number;
  round: number;
  marker?: BottomMarker;
}

export interface Column {
  top: TopEntry[];
  bottom: BottomEntry[];
}

export interface ColumnResult {
  topSum: number;
  bottomSum: number;
  net: number;
}

export interface GameResult {
  columns: ColumnResult[];
  grandTotal: number;
  mode: GameMode;
  multiplier: number;
  multiplierColor: string | null;
}

export interface SavedGame {
  id: string;
  createdAt: number;
  columns: Column[];
  mode: GameMode;
  playMode?: PlayMode;
  result: GameResult;
  playerNames?: string[];
  roundMultipliers?: Record<number, number>;
  specialFinishes?: Record<number, boolean>;
  specialKafaVurma?: Record<number, boolean>;
  label?: string;
  targetRounds?: number;
  startValue?: number;
}

export const DEFAULT_TARGET_ROUNDS = 11;
export const DEFAULT_START_VALUE = 10;

export interface ColorInfo {
  multiplier: number;
  name: string;
  hex: string;
}

export const COLOR_BY_MULTIPLIER: Record<number, ColorInfo> = {
  3: { multiplier: 3, name: 'Mavi', hex: '#3B82F6' },
  4: { multiplier: 4, name: 'Kırmızı', hex: '#EF4444' },
  5: { multiplier: 5, name: 'Siyah', hex: '#1F2937' },
  6: { multiplier: 6, name: 'Sarı', hex: '#FBBF24' },
};

export const MODE_LABEL: Record<GameMode, string> = {
  'klasik': 'Klasik',
  'renkli-klasik': 'Renkli',
  'duz-101': '101 Okey (katlamasız)',
  'klasik-okey': 'Klasik Okey',
};
