import { useCallback, useEffect, useMemo, useState } from 'react';
import { Column, ColumnId, COLUMN_COUNT, GameMode, Side } from '../types/game';
import {
  calculateGame,
  columnHasColorTopInRound,
  createEmptyColumns,
  hasEntriesInRound,
  makeBottomEntry,
  makeTopEntry,
  roundHasAnyData,
} from '../logic/calculator';
import { loadMode, saveMode } from '../storage/settings';

export interface GameSelection {
  column: ColumnId;
  side: Side;
}

const initialSelection: GameSelection = { column: 0, side: 'top' };

const isLast = (s: GameSelection): boolean =>
  s.column === COLUMN_COUNT - 1 && s.side === 'bottom';

const nextSelection = (s: GameSelection): GameSelection => {
  if (s.side === 'top') return { column: s.column, side: 'bottom' };
  if (s.column < COLUMN_COUNT - 1) {
    return { column: (s.column + 1) as ColumnId, side: 'top' };
  }
  return s;
};

const containsColorValue = (values: number[]): boolean =>
  values.some((v) => v >= 3 && v <= 6);

const removeLastInRound = <T extends { round: number; marker?: unknown }>(
  arr: T[],
  round: number,
  skipMarkers = false
): T[] => {
  for (let i = arr.length - 1; i >= 0; i--) {
    const entry = arr[i];
    if (entry.round !== round) continue;
    if (skipMarkers && entry.marker) continue;
    return [...arr.slice(0, i), ...arr.slice(i + 1)];
  }
  return arr;
};

const insertInRoundOrder = <T extends { round: number }>(
  arr: T[],
  items: T[],
  round: number
): T[] => {
  let insertAt = arr.length;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].round > round) {
      insertAt = i;
      break;
    }
  }
  return [...arr.slice(0, insertAt), ...items, ...arr.slice(insertAt)];
};

export const useGame = () => {
  const [columns, setColumns] = useState<Column[]>(() =>
    createEmptyColumns(COLUMN_COUNT)
  );
  const [selection, setSelection] = useState<GameSelection>(initialSelection);
  const [selectionActive, setSelectionActive] = useState<boolean>(false);
  const [mode, setModeState] = useState<GameMode>('klasik');
  const [winnerHint, setWinnerHint] = useState<ColumnId | null>(null);
  const [maxRound, setMaxRound] = useState(1);
  const [viewingRound, setViewingRound] = useState(1);
  const [playerNames, setPlayerNames] = useState<string[]>([
    'Oyuncu 1',
    'Oyuncu 2',
    'Oyuncu 3',
    'Oyuncu 4',
  ]);
  const [roundMultipliers, setRoundMultipliers] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    loadMode().then(setModeState);
  }, []);

  const result = useMemo(
    () =>
      calculateGame(columns, mode, winnerHint, viewingRound, roundMultipliers),
    [columns, mode, winnerHint, viewingRound, roundMultipliers]
  );

  const updateWinnerHint = useCallback(
    (col: ColumnId, side: Side, values: number[]) => {
      if (side !== 'top') return;
      if (containsColorValue(values)) setWinnerHint(col);
    },
    []
  );

  const addNumbers = useCallback(
    (values: number[]) => {
      if (values.length === 0) return;
      setColumns((prev) =>
        prev.map((col, idx) => {
          if (idx !== selection.column) return col;
          if (selection.side === 'top') {
            const newTops = values.map((v) => makeTopEntry(v, viewingRound));
            return {
              ...col,
              top: insertInRoundOrder(col.top, newTops, viewingRound),
            };
          }
          const newBottoms = values.map((v) =>
            makeBottomEntry(v, viewingRound)
          );
          return {
            ...col,
            bottom: insertInRoundOrder(col.bottom, newBottoms, viewingRound),
          };
        })
      );
      updateWinnerHint(selection.column, selection.side, values);
    },
    [selection, viewingRound, updateWinnerHint]
  );

  const addNumber = useCallback(
    (value: number) => addNumbers([value]),
    [addNumbers]
  );

  const removeLast = useCallback(() => {
    const colIdx = selection.column;
    setColumns((prev) =>
      prev.map((col, idx) => {
        if (idx !== colIdx) return col;
        if (selection.side === 'top') {
          const newTop = removeLastInRound(col.top, viewingRound);
          const stillHasColorTop = newTop.some(
            (t) =>
              t.round === viewingRound && t.value >= 3 && t.value <= 6
          );
          const newBottom = stillHasColorTop
            ? col.bottom
            : col.bottom.filter(
                (e) => !(e.round === viewingRound && e.marker === 'finished')
              );
          return { ...col, top: newTop, bottom: newBottom };
        }
        return {
          ...col,
          bottom: removeLastInRound(col.bottom, viewingRound, true),
        };
      })
    );
    if (selection.side === 'top' && winnerHint === selection.column) {
      setWinnerHint(null);
    }
  }, [selection, viewingRound, winnerHint]);

  const clearCurrentCell = useCallback(() => {
    setColumns((prev) =>
      prev.map((col, idx) => {
        if (idx !== selection.column) return col;
        if (selection.side === 'top') {
          return {
            ...col,
            top: col.top.filter((t) => t.round !== viewingRound),
            bottom: col.bottom.filter(
              (e) => !(e.round === viewingRound && e.marker === 'finished')
            ),
          };
        }
        return {
          ...col,
          bottom: col.bottom.filter(
            (e) => e.round !== viewingRound || e.marker === 'finished'
          ),
        };
      })
    );
    if (selection.side === 'top' && winnerHint === selection.column) {
      setWinnerHint(null);
    }
  }, [selection, viewingRound, winnerHint]);

  const resetAll = useCallback(() => {
    setColumns(createEmptyColumns(COLUMN_COUNT));
    setSelection(initialSelection);
    setSelectionActive(false);
    setWinnerHint(null);
    setMaxRound(1);
    setViewingRound(1);
    setRoundMultipliers({});
  }, []);

  const select = useCallback((column: ColumnId, side: Side) => {
    setSelection({ column, side });
    setSelectionActive(true);
  }, []);

  const deselect = useCallback(() => {
    setSelectionActive(false);
  }, []);

  const goToNext = useCallback((): boolean => {
    const wasLast = isLast(selection);
    if (!wasLast) setSelection(nextSelection(selection));
    return wasLast;
  }, [selection]);

  const setMode = useCallback((next: GameMode) => {
    setModeState(next);
    saveMode(next);
  }, []);

  const cycleMode = useCallback(() => {
    setMode(mode === 'klasik' ? 'renkli-klasik' : 'klasik');
  }, [mode, setMode]);

  const goToRound = useCallback(
    (r: number) => {
      if (r < 1 || r > maxRound) return;
      setViewingRound(r);
      setWinnerHint(null);
      setSelection(initialSelection);
      setSelectionActive(false);
    },
    [maxRound]
  );

  const startNewRound = useCallback(() => {
    const next = maxRound + 1;
    setMaxRound(next);
    setViewingRound(next);
    setWinnerHint(null);
    setSelection(initialSelection);
    setSelectionActive(false);
  }, [maxRound]);

  const setColorWinner = useCallback(
    (colorValue: number) => {
      const colIdx = selection.column;
      setColumns((prev) =>
        prev.map((c, idx) => {
          if (idx !== colIdx) return c;
          const otherRoundTops = c.top.filter((t) => t.round !== viewingRound);
          const newTop = insertInRoundOrder(
            otherRoundTops,
            [makeTopEntry(colorValue, viewingRound)],
            viewingRound
          );
          const hasFinished = c.bottom.some(
            (e) => e.round === viewingRound && e.marker === 'finished'
          );
          let newBottom = c.bottom;
          if (!hasFinished) {
            const markerEntry: typeof c.bottom[number] = {
              value: 0,
              round: viewingRound,
              marker: 'finished',
            };
            newBottom = insertInRoundOrder(c.bottom, [markerEntry], viewingRound);
          }
          return { ...c, top: newTop, bottom: newBottom };
        })
      );
      setWinnerHint(colIdx);
      setRoundMultipliers((prev) => ({ ...prev, [viewingRound]: colorValue }));
    },
    [selection.column, viewingRound]
  );

  const clearColorWinner = useCallback(() => {
    const colIdx = selection.column;
    setColumns((prev) =>
      prev.map((c, idx) => {
        if (idx !== colIdx) return c;
        return {
          ...c,
          top: c.top.filter((t) => t.round !== viewingRound),
          bottom: c.bottom.filter(
            (e) => !(e.round === viewingRound && e.marker === 'finished')
          ),
        };
      })
    );
    if (winnerHint === colIdx) setWinnerHint(null);
    setRoundMultipliers((prev) => {
      const next = { ...prev };
      delete next[viewingRound];
      return next;
    });
  }, [selection.column, viewingRound, winnerHint]);

  const setRoundColor = useCallback(
    (colorValue: number) => {
      setRoundMultipliers((prev) => ({ ...prev, [viewingRound]: colorValue }));
    },
    [viewingRound]
  );

  const clearRoundColor = useCallback(() => {
    setRoundMultipliers((prev) => {
      const next = { ...prev };
      delete next[viewingRound];
      return next;
    });
  }, [viewingRound]);

  const hasColorWinner = useMemo(() => {
    const col = columns[selection.column];
    return (
      col.top.some((t) => t.round === viewingRound) ||
      col.bottom.some(
        (e) => e.round === viewingRound && e.marker === 'finished'
      )
    );
  }, [columns, selection.column, viewingRound]);

  const currentRoundColor = useMemo(
    () => roundMultipliers[viewingRound] ?? null,
    [roundMultipliers, viewingRound]
  );

  const hasRoundColor = currentRoundColor !== null;

  const isCurrentRoundComplete = useMemo(
    () =>
      columns.every(
        (c) =>
          c.top.some((t) => t.round === viewingRound) ||
          c.bottom.some((e) => e.round === viewingRound)
      ),
    [columns, viewingRound]
  );

  const colorTopColumns = useMemo(
    () => columns.map((c) => columnHasColorTopInRound(c, viewingRound)),
    [columns, viewingRound]
  );

  const hasColorTopInRound = colorTopColumns.some(Boolean);

  const currentRoundEffectiveMultiplier = useMemo(
    () => (mode === 'renkli-klasik' ? result.multiplier : 1),
    [mode, result.multiplier]
  );

  const currentRoundNeedsColor =
    mode === 'renkli-klasik' && currentRoundEffectiveMultiplier === 1;

  const setPlayerName = useCallback((idx: number, name: string) => {
    const trimmed = name.trim();
    setPlayerNames((prev) =>
      prev.map((n, i) => (i === idx ? (trimmed || n) : n))
    );
  }, []);

  const setAllPlayerNames = useCallback((names: string[]) => {
    setPlayerNames((prev) =>
      prev.map((n, i) => {
        const candidate = (names[i] ?? '').trim();
        return candidate || n;
      })
    );
  }, []);

  const startNewGame = useCallback(
    (names?: string[], gameMode?: GameMode) => {
      setColumns(createEmptyColumns(COLUMN_COUNT));
      setSelection(initialSelection);
      setSelectionActive(false);
      setWinnerHint(null);
      setMaxRound(1);
      setViewingRound(1);
      setRoundMultipliers({});
      if (names) setAllPlayerNames(names);
      if (gameMode) setMode(gameMode);
    },
    [setAllPlayerNames, setMode]
  );

  const isOnLastCell = useMemo(() => isLast(selection), [selection]);

  const isEmpty = useMemo(
    () => columns.every((c) => c.top.length === 0 && c.bottom.length === 0),
    [columns]
  );

  const currentCellHasInRound = useMemo(
    () =>
      hasEntriesInRound(
        columns[selection.column],
        viewingRound,
        selection.side
      ),
    [columns, selection, viewingRound]
  );

  const viewingRoundHasData = useMemo(
    () => roundHasAnyData(columns, viewingRound),
    [columns, viewingRound]
  );

  return {
    columns,
    selection,
    selectionActive,
    result,
    mode,
    viewingRound,
    maxRound,
    isEmpty,
    isOnLastCell,
    currentCellHasInRound,
    viewingRoundHasData,
    playerNames,
    addNumber,
    addNumbers,
    removeLast,
    clearCurrentCell,
    resetAll,
    select,
    deselect,
    goToNext,
    setMode,
    cycleMode,
    goToRound,
    startNewRound,
    setPlayerName,
    setAllPlayerNames,
    startNewGame,
    setColorWinner,
    clearColorWinner,
    hasColorWinner,
    roundMultipliers,
    currentRoundColor,
    hasRoundColor,
    setRoundColor,
    clearRoundColor,
    isCurrentRoundComplete,
    currentRoundNeedsColor,
    colorTopColumns,
    hasColorTopInRound,
  };
};

export type UseGameReturn = ReturnType<typeof useGame>;
