import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Column,
  ColumnId,
  COLUMN_COUNT,
  DEFAULT_START_VALUE,
  DEFAULT_TARGET_ROUNDS,
  GameMode,
  MAX_PLAYERS_BY_MODE,
  PlayMode,
  Side,
} from '../types/game';
import {
  calculateGame,
  columnHasColorTopInRound,
  computeKlasikOkeyDeductions,
  createEmptyColumns,
  hasEntriesInRound,
  makeBottomEntry,
  makeTopEntry,
  roundHasAnyData,
} from '../logic/calculator';
import { loadMode, loadPlayMode, saveMode, savePlayMode } from '../storage/settings';

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

const removeLastInRound = <
  T extends { round: number; marker?: string }
>(
  arr: T[],
  round: number,
  skipMarkers: readonly string[] = []
): T[] => {
  for (let i = arr.length - 1; i >= 0; i--) {
    const entry = arr[i];
    if (entry.round !== round) continue;
    if (entry.marker && skipMarkers.includes(entry.marker)) continue;
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
  const [playMode, setPlayModeState] = useState<PlayMode>('singles');
  const [playerNames, setPlayerNames] = useState<string[]>([
    'Oyuncu 1',
    'Oyuncu 2',
    'Oyuncu 3',
    'Oyuncu 4',
  ]);
  const [roundMultipliers, setRoundMultipliers] = useState<
    Record<number, number>
  >({});
  const [specialFinishes, setSpecialFinishes] = useState<
    Record<number, boolean>
  >({});
  const [targetRounds, setTargetRoundsState] = useState<number>(
    DEFAULT_TARGET_ROUNDS
  );
  const [lastRoundAlertShown, setLastRoundAlertShown] = useState(false);
  const [showLastRoundAlert, setShowLastRoundAlert] = useState(false);
  const [specialKafaVurma, setSpecialKafaVurma] = useState<
    Record<number, boolean>
  >({});
  const [gameEndPrompted, setGameEndPrompted] = useState(false);
  const [startValue, setStartValueState] = useState<number>(
    DEFAULT_START_VALUE
  );

  useEffect(() => {
    loadMode().then(setModeState);
    loadPlayMode().then(setPlayModeState);
  }, []);

  const visibleColumnCount = MAX_PLAYERS_BY_MODE[playMode];

  const visibleColumnIds = useMemo<ColumnId[]>(
    () =>
      Array.from(
        { length: visibleColumnCount },
        (_, i) => i as ColumnId
      ),
    [visibleColumnCount]
  );

  const setPlayMode = useCallback((next: PlayMode) => {
    setPlayModeState(next);
    savePlayMode(next);
  }, []);

  const result = useMemo(
    () =>
      calculateGame(
        columns,
        mode,
        winnerHint,
        viewingRound,
        roundMultipliers,
        specialFinishes,
        specialKafaVurma,
        startValue
      ),
    [
      columns,
      mode,
      winnerHint,
      viewingRound,
      roundMultipliers,
      specialFinishes,
      specialKafaVurma,
      startValue,
    ]
  );

  const klasikOkeyDeductions = useMemo(
    () =>
      mode === 'klasik-okey'
        ? computeKlasikOkeyDeductions(columns, specialFinishes, specialKafaVurma)
        : {},
    [mode, columns, specialFinishes, specialKafaVurma]
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
          const cleanedBottom =
            mode === 'duz-101'
              ? col.bottom.filter(
                  (e) =>
                    !(
                      e.round === viewingRound &&
                      (e.marker === 'finished' || e.marker === 'not-opened')
                    )
                )
              : col.bottom;
          const newBottoms = values.map((v) =>
            makeBottomEntry(v, viewingRound)
          );
          return {
            ...col,
            bottom: insertInRoundOrder(cleanedBottom, newBottoms, viewingRound),
          };
        })
      );
      updateWinnerHint(selection.column, selection.side, values);
    },
    [selection, viewingRound, updateWinnerHint, mode]
  );

  const addNumber = useCallback(
    (value: number) => addNumbers([value]),
    [addNumbers]
  );

  const removeLast = useCallback(() => {
    const colIdx = selection.column;
    const isCountdownMode = mode === 'duz-101' || mode === 'klasik-okey';
    setColumns((prev) => {
      const next = prev.map((col, idx) => {
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
        const skipMarkers = isCountdownMode ? [] : ['finished'];
        return {
          ...col,
          bottom: removeLastInRound(col.bottom, viewingRound, skipMarkers),
        };
      });
      if (isCountdownMode) {
        const anyFinished = next.some((c) =>
          c.bottom.some(
            (e) => e.round === viewingRound && e.marker === 'finished'
          )
        );
        if (!anyFinished) {
          setSpecialFinishes((prev) => {
            if (!(viewingRound in prev)) return prev;
            const copy = { ...prev };
            delete copy[viewingRound];
            return copy;
          });
          setSpecialKafaVurma((prev) => {
            if (!(viewingRound in prev)) return prev;
            const copy = { ...prev };
            delete copy[viewingRound];
            return copy;
          });
        }
      }
      return next;
    });
    if (selection.side === 'top' && winnerHint === selection.column) {
      setWinnerHint(null);
    }
  }, [selection, viewingRound, winnerHint, mode]);

  const addPenalty = useCallback(() => {
    if (selection.side !== 'bottom') return;
    const colIdx = selection.column;
    setColumns((prev) =>
      prev.map((c, idx) => {
        if (idx !== colIdx) return c;
        const newEntry: typeof c.bottom[number] = {
          value: 0,
          round: viewingRound,
          marker: 'penalty',
        };
        return {
          ...c,
          bottom: insertInRoundOrder(c.bottom, [newEntry], viewingRound),
        };
      })
    );
  }, [selection, viewingRound]);

  const finish101 = useCallback(
    (okeyle: boolean, kafaVurma: boolean = false) => {
      const colIdx = selection.column;
      const round = viewingRound;
      setColumns((prev) =>
        prev.map((c, idx) => {
          if (idx === colIdx) {
            const others = c.bottom.filter(
              (e) => e.round !== round || e.marker === 'penalty'
            );
            const finishEntry: typeof c.bottom[number] = {
              value: 0,
              round,
              marker: 'finished',
            };
            return {
              ...c,
              bottom: insertInRoundOrder(others, [finishEntry], round),
            };
          }
          const hadFinished = c.bottom.some(
            (e) => e.round === round && e.marker === 'finished'
          );
          if (!hadFinished) return c;
          return {
            ...c,
            bottom: c.bottom.filter(
              (e) => !(e.round === round && e.marker === 'finished')
            ),
          };
        })
      );
      setSpecialFinishes((prev) => {
        const next = { ...prev };
        if (okeyle) next[round] = true;
        else delete next[round];
        return next;
      });
      setSpecialKafaVurma((prev) => {
        const next = { ...prev };
        if (kafaVurma) next[round] = true;
        else delete next[round];
        return next;
      });
    },
    [selection.column, viewingRound]
  );

  const markNotOpened = useCallback(() => {
    const colIdx = selection.column;
    const round = viewingRound;
    setColumns((prev) =>
      prev.map((c, idx) => {
        if (idx !== colIdx) return c;
        const hasNotOpened = c.bottom.some(
          (e) => e.round === round && e.marker === 'not-opened'
        );
        if (hasNotOpened) {
          return {
            ...c,
            bottom: c.bottom.filter(
              (e) => !(e.round === round && e.marker === 'not-opened')
            ),
          };
        }
        const others = c.bottom.filter(
          (e) =>
            e.round !== round ||
            e.marker === 'penalty' ||
            e.marker === 'finished'
        );
        const entry: typeof c.bottom[number] = {
          value: 0,
          round,
          marker: 'not-opened',
        };
        return {
          ...c,
          bottom: insertInRoundOrder(others, [entry], round),
        };
      })
    );
  }, [selection.column, viewingRound]);

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
    setSpecialFinishes({});
    setSpecialKafaVurma({});
    setLastRoundAlertShown(false);
    setShowLastRoundAlert(false);
    setGameEndPrompted(false);
  }, []);

  const setStartValue = useCallback((n: number) => {
    setStartValueState(Math.max(1, Math.floor(n)));
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
    if (next === targetRounds && !lastRoundAlertShown) {
      setShowLastRoundAlert(true);
      setLastRoundAlertShown(true);
    }
  }, [maxRound, targetRounds, lastRoundAlertShown]);

  const dismissLastRoundAlert = useCallback(() => {
    setShowLastRoundAlert(false);
  }, []);

  const setTargetRounds = useCallback((n: number) => {
    setTargetRoundsState(Math.max(1, Math.floor(n)));
  }, []);

  const setColorWinner = useCallback(
    (colorValue: number, isSpecial: boolean = false) => {
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
      setSpecialFinishes((prev) => {
        const next = { ...prev };
        if (isSpecial) next[viewingRound] = true;
        else delete next[viewingRound];
        return next;
      });
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
    setSpecialFinishes((prev) => {
      const next = { ...prev };
      delete next[viewingRound];
      return next;
    });
  }, [selection.column, viewingRound, winnerHint]);

  const setRoundColor = useCallback(
    (colorValue: number, isSpecial: boolean = false) => {
      setRoundMultipliers((prev) => ({ ...prev, [viewingRound]: colorValue }));
      setSpecialFinishes((prev) => {
        const next = { ...prev };
        if (isSpecial) next[viewingRound] = true;
        else delete next[viewingRound];
        return next;
      });
    },
    [viewingRound]
  );

  const clearRoundColor = useCallback(() => {
    setRoundMultipliers((prev) => {
      const next = { ...prev };
      delete next[viewingRound];
      return next;
    });
    setSpecialFinishes((prev) => {
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

  const currentRoundIsSpecial = specialFinishes[viewingRound] ?? false;

  const isCurrentRoundComplete = useMemo(
    () => {
      if (mode === 'klasik-okey') {
        // A round is complete once exactly one player is marked as the winner.
        return visibleColumnIds.some((idx) =>
          columns[idx].bottom.some(
            (e) => e.round === viewingRound && e.marker === 'finished'
          )
        );
      }
      return visibleColumnIds.every((idx) => {
        const c = columns[idx];
        return (
          c.top.some((t) => t.round === viewingRound) ||
          c.bottom.some((e) => e.round === viewingRound)
        );
      });
    },
    [columns, viewingRound, visibleColumnIds, mode]
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

  const swapColumns = useCallback(
    (a: ColumnId, b: ColumnId) => {
      if (a === b) return;
      setColumns((prev) => {
        const next = [...prev];
        [next[a], next[b]] = [next[b], next[a]];
        return next;
      });
      setPlayerNames((prev) => {
        const next = [...prev];
        [next[a], next[b]] = [next[b], next[a]];
        return next;
      });
      setSelection((prev) => {
        if (prev.column === a) return { ...prev, column: b };
        if (prev.column === b) return { ...prev, column: a };
        return prev;
      });
      setWinnerHint((prev) => {
        if (prev === a) return b;
        if (prev === b) return a;
        return prev;
      });
    },
    []
  );

  const setAllPlayerNames = useCallback((names: string[]) => {
    setPlayerNames((prev) =>
      prev.map((n, i) => {
        const candidate = (names[i] ?? '').trim();
        return candidate || n;
      })
    );
  }, []);

  const startNewGame = useCallback(
    (
      names?: string[],
      gameMode?: GameMode,
      newPlayMode?: PlayMode,
      newTargetRounds?: number,
      newStartValue?: number
    ) => {
      setColumns(createEmptyColumns(COLUMN_COUNT));
      setSelection(initialSelection);
      setSelectionActive(false);
      setWinnerHint(null);
      setMaxRound(1);
      setViewingRound(1);
      setRoundMultipliers({});
      setSpecialFinishes({});
      setSpecialKafaVurma({});
      setLastRoundAlertShown(false);
      setShowLastRoundAlert(false);
      setGameEndPrompted(false);
      if (typeof newTargetRounds === 'number') {
        setTargetRoundsState(Math.max(1, Math.floor(newTargetRounds)));
      }
      if (typeof newStartValue === 'number') {
        setStartValueState(Math.max(1, Math.floor(newStartValue)));
      }
      if (newPlayMode) {
        setPlayModeState(newPlayMode);
        savePlayMode(newPlayMode);
      }
      if (names) {
        // names array length = visible count; fill rest with sensible defaults
        const fullNames = ['', '', '', ''].map((_, i) => {
          const candidate = (names[i] ?? '').trim();
          if (candidate) return candidate;
          if (newPlayMode === 'pairs' && i < 2) return `Takım ${i + 1}`;
          return `Oyuncu ${i + 1}`;
        });
        setPlayerNames(fullNames);
      }
      if (gameMode) setMode(gameMode);
    },
    [setMode]
  );

  const isOnLastCell = useMemo(() => isLast(selection), [selection]);

  const isEmpty = useMemo(
    () => columns.every((c) => c.top.length === 0 && c.bottom.length === 0),
    [columns]
  );

  const currentCellHasInRound = useMemo(
    () => {
      const excludeMarkers: ('finished' | 'penalty' | 'not-opened')[] =
        mode === 'duz-101' || mode === 'klasik-okey' ? [] : ['finished'];
      return hasEntriesInRound(
        columns[selection.column],
        viewingRound,
        selection.side,
        excludeMarkers
      );
    },
    [columns, selection, viewingRound, mode]
  );

  const canAddNumber = useMemo(() => {
    if (selection.side === 'top') return true;
    const col = columns[selection.column];
    if (mode !== 'duz-101') {
      const topHasRound = col.top.some((t) => t.round === viewingRound);
      if (topHasRound) return false;
    } else {
      const blocked = col.bottom.some(
        (e) =>
          e.round === viewingRound &&
          (e.marker === 'finished' || e.marker === 'not-opened')
      );
      if (blocked) return false;
    }
    const normalCount = col.bottom.filter(
      (e) => e.round === viewingRound && !e.marker
    ).length;
    return normalCount === 0;
  }, [columns, selection, viewingRound, mode]);

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
    addPenalty,
    roundMultipliers,
    currentRoundColor,
    hasRoundColor,
    setRoundColor,
    clearRoundColor,
    isCurrentRoundComplete,
    currentRoundNeedsColor,
    colorTopColumns,
    hasColorTopInRound,
    specialFinishes,
    currentRoundIsSpecial,
    canAddNumber,
    swapColumns,
    playMode,
    setPlayMode,
    visibleColumnIds,
    visibleColumnCount,
    finish101,
    markNotOpened,
    targetRounds,
    setTargetRounds,
    showLastRoundAlert,
    dismissLastRoundAlert,
    specialKafaVurma,
    gameEndPrompted,
    acknowledgeGameEnd: useCallback(() => setGameEndPrompted(true), []),
    startValue,
    setStartValue,
    klasikOkeyDeductions,
    finishKlasik: finish101,
  };
};

export type UseGameReturn = ReturnType<typeof useGame>;
