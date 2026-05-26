import {
  BottomEntry,
  BottomMarker,
  COLOR_BY_MULTIPLIER,
  Column,
  ColumnId,
  ColumnResult,
  GameMode,
  GameResult,
  TopEntry,
} from '../types/game';

export const TOP_MULTIPLIER = -10;
export const SPECIAL_TOP_MULTIPLIER = -100;
export const SPECIAL_BOTTOM_BONUS = 2;
export const SPECIAL_TOP_DISPLAY_FACTOR = 100;
export const PENALTY_FACTOR = 100;

const isColorMultiplier = (n: number): boolean =>
  n === 3 || n === 4 || n === 5 || n === 6;

const findLastColorInRound = (
  top: TopEntry[],
  round: number
): number | null => {
  for (let i = top.length - 1; i >= 0; i--) {
    const t = top[i];
    if (t.round === round && isColorMultiplier(t.value)) return t.value;
  }
  return null;
};

export const detectMultiplierForRound = (
  columns: Column[],
  round: number,
  hint: ColumnId | null = null,
  roundMultipliers: Record<number, number> = {}
): number => {
  const explicit = roundMultipliers[round];
  if (typeof explicit === 'number' && explicit > 0) return explicit;
  if (hint !== null) {
    const fromHint = findLastColorInRound(columns[hint].top, round);
    if (fromHint !== null) return fromHint;
  }
  for (const col of columns) {
    const m = findLastColorInRound(col.top, round);
    if (m !== null) return m;
  }
  return 1;
};

const collectRounds = (columns: Column[]): number[] => {
  const set = new Set<number>();
  for (const col of columns) {
    col.top.forEach((t) => set.add(t.round));
    col.bottom.forEach((e) => set.add(e.round));
  }
  return Array.from(set).sort((a, b) => a - b);
};

const calculateColumn = (
  column: Column,
  multByRound: Map<number, number>,
  baseColorByRound: Map<number, number>,
  specialFinishes: Record<number, boolean> = {}
): ColumnResult => {
  const topSum = column.top.reduce((acc, t) => acc + t.value, 0);
  const bottomSum = column.bottom.reduce((acc, e) => acc + e.value, 0);

  const topContribution = column.top.reduce((acc, t) => {
    const isColor = isColorMultiplier(t.value);
    const factor =
      specialFinishes[t.round] && isColor
        ? SPECIAL_TOP_MULTIPLIER
        : TOP_MULTIPLIER;
    return acc + t.value * factor;
  }, 0);

  const bottomContribution = column.bottom.reduce((acc, e) => {
    if (e.marker === 'finished') return acc;
    if (e.marker === 'penalty') {
      const baseColor = baseColorByRound.get(e.round) ?? 1;
      return acc + baseColor * PENALTY_FACTOR;
    }
    const base = multByRound.get(e.round) ?? 1;
    const bonus = specialFinishes[e.round] ? SPECIAL_BOTTOM_BONUS : 1;
    return acc + e.value * base * bonus;
  }, 0);

  const net = topContribution + bottomContribution;
  return { topSum, bottomSum, net };
};

export const calculateGame = (
  columns: Column[],
  mode: GameMode = 'klasik',
  winnerHint: ColumnId | null = null,
  viewingRound: number = 1,
  roundMultipliers: Record<number, number> = {},
  specialFinishes: Record<number, boolean> = {}
): GameResult => {
  const rounds = collectRounds(columns);
  if (!rounds.includes(viewingRound)) rounds.push(viewingRound);
  for (const k of Object.keys(roundMultipliers)) {
    const n = Number(k);
    if (!rounds.includes(n)) rounds.push(n);
  }

  const multByRound = new Map<number, number>();
  const baseColorByRound = new Map<number, number>();
  for (const r of rounds) {
    if (mode === 'renkli-klasik') {
      const hint = r === viewingRound ? winnerHint : null;
      const base = detectMultiplierForRound(columns, r, hint, roundMultipliers);
      baseColorByRound.set(r, base);
      multByRound.set(r, base);
    } else {
      baseColorByRound.set(r, 1);
      multByRound.set(r, 1);
    }
  }

  const results = columns.map((col) =>
    calculateColumn(col, multByRound, baseColorByRound, specialFinishes)
  );
  const grandTotal = results.reduce((acc, r) => acc + r.net, 0);
  const activeMultiplier = multByRound.get(viewingRound) ?? 1;
  const colorInfo = COLOR_BY_MULTIPLIER[activeMultiplier];

  return {
    columns: results,
    grandTotal,
    mode,
    multiplier: activeMultiplier,
    multiplierColor: colorInfo?.name ?? null,
  };
};

export const createEmptyColumn = (): Column => ({ top: [], bottom: [] });

export const createEmptyColumns = (count: number): Column[] =>
  Array.from({ length: count }, createEmptyColumn);

export const makeTopEntry = (value: number, round: number): TopEntry => ({
  value,
  round,
});

export const makeBottomEntry = (
  value: number,
  round: number
): BottomEntry => ({ value, round });

export const getMaxRound = (columns: Column[]): number => {
  let max = 1;
  for (const col of columns) {
    for (const t of col.top) if (t.round > max) max = t.round;
    for (const e of col.bottom) if (e.round > max) max = e.round;
  }
  return max;
};

export const hasEntriesInRound = (
  column: Column,
  round: number,
  side: 'top' | 'bottom',
  excludeMarkers: BottomMarker[] = []
): boolean => {
  if (side === 'top') return column.top.some((t) => t.round === round);
  return column.bottom.some(
    (e) =>
      e.round === round &&
      !(e.marker !== undefined && excludeMarkers.includes(e.marker))
  );
};

export const columnHasColorTopInRound = (
  column: Column,
  round: number
): boolean =>
  column.top.some(
    (t) => t.round === round && t.value >= 3 && t.value <= 6
  );

export const computeMultipliersByRound = (
  columns: Column[],
  mode: GameMode,
  roundMultipliers: Record<number, number> = {},
  specialFinishes: Record<number, boolean> = {}
): Record<number, number> => {
  const result: Record<number, number> = {};
  const allRounds = new Set<number>();
  for (const c of columns) {
    c.top.forEach((t) => allRounds.add(t.round));
    c.bottom.forEach((e) => allRounds.add(e.round));
  }
  for (const k of Object.keys(roundMultipliers)) {
    allRounds.add(Number(k));
  }
  for (const r of allRounds) {
    const base =
      mode === 'renkli-klasik'
        ? detectMultiplierForRound(columns, r, null, roundMultipliers)
        : 1;
    result[r] = specialFinishes[r] ? base * SPECIAL_BOTTOM_BONUS : base;
  }
  return result;
};

export const computeBaseColorsByRound = (
  columns: Column[],
  mode: GameMode,
  roundMultipliers: Record<number, number> = {}
): Record<number, number> => {
  const result: Record<number, number> = {};
  const allRounds = new Set<number>();
  for (const c of columns) {
    c.top.forEach((t) => allRounds.add(t.round));
    c.bottom.forEach((e) => allRounds.add(e.round));
  }
  for (const k of Object.keys(roundMultipliers)) {
    allRounds.add(Number(k));
  }
  for (const r of allRounds) {
    result[r] =
      mode === 'renkli-klasik'
        ? detectMultiplierForRound(columns, r, null, roundMultipliers)
        : 1;
  }
  return result;
};

export const roundHasAnyData = (
  columns: Column[],
  round: number
): boolean =>
  columns.some(
    (c) =>
      c.top.some((t) => t.round === round) ||
      c.bottom.some((e) => e.round === round)
  );

export interface PlayerRoundData {
  column: number;
  playerName: string;
  isWinner: boolean;
  topValues: number[];
  bottomValues: number[];
}

export interface RoundSummary {
  round: number;
  multiplier: number;
  colorName: string | null;
  colorHex: string | null;
  players: PlayerRoundData[];
}

export const buildRoundSummaries = (
  columns: Column[],
  playerNames: string[],
  mode: GameMode,
  roundMultipliers: Record<number, number> = {}
): RoundSummary[] => {
  const allRounds = new Set<number>();
  for (const c of columns) {
    c.top.forEach((t) => allRounds.add(t.round));
    c.bottom.forEach((e) => allRounds.add(e.round));
  }
  for (const k of Object.keys(roundMultipliers)) {
    allRounds.add(Number(k));
  }

  return Array.from(allRounds)
    .sort((a, b) => a - b)
    .map((r) => {
      const players: PlayerRoundData[] = columns.map((c, idx) => {
        const topInRound = c.top.filter((t) => t.round === r);
        const bottomInRound = c.bottom.filter((e) => e.round === r);
        const isWinner = bottomInRound.some(
          (e) => e.marker === 'finished'
        );
        return {
          column: idx,
          playerName: playerNames[idx] ?? `Oyuncu ${idx + 1}`,
          isWinner,
          topValues: topInRound.map((t) => t.value),
          bottomValues: bottomInRound
            .filter((e) => e.marker !== 'finished')
            .map((e) => e.value),
        };
      });

      let multiplier = 1;
      let colorName: string | null = null;
      let colorHex: string | null = null;

      if (mode === 'renkli-klasik') {
        multiplier = detectMultiplierForRound(columns, r, null, roundMultipliers);
        const info = COLOR_BY_MULTIPLIER[multiplier];
        if (info) {
          colorName = info.name;
          colorHex = info.hex;
        }
      }

      return { round: r, multiplier, colorName, colorHex, players };
    });
};
