export type ColumnId = 0 | 1 | 2 | 3;

export const COLUMN_COUNT = 4;
export const COLUMN_IDS: readonly ColumnId[] = [0, 1, 2, 3] as const;

export type Side = 'top' | 'bottom';

export type GameMode = 'klasik' | 'renkli-klasik';

export interface TopEntry {
  value: number;
  round: number;
}

export type BottomMarker = 'finished';

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
  result: GameResult;
  playerNames?: string[];
  roundMultipliers?: Record<number, number>;
  specialFinishes?: Record<number, boolean>;
  label?: string;
}

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
};
