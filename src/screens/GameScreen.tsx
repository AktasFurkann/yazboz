import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ColumnId, Side } from '../types/game';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ColumnView } from '../components/ColumnView';
import { NumberPad, parseDraft } from '../components/NumberPad';
import { BannerSlot } from '../components/BannerSlot';
import { EditNameModal } from '../components/EditNameModal';
import { ColorPickerModal } from '../components/ColorPickerModal';
import { ConfirmDestructiveModal } from '../components/ConfirmDestructiveModal';
import { LastRoundAlertModal } from '../components/LastRoundAlertModal';
import { Special101Modal } from '../components/Special101Modal';
import { GameEndPromptModal } from '../components/GameEndPromptModal';
import {
  computeBaseColorsByRound,
  computeMultipliersByRound,
} from '../logic/calculator';
import { useGameContext } from '../contexts/GameContext';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';
import { COLOR_BY_MULTIPLIER, MODE_LABEL } from '../types/game';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Game'>;

export const GameScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {
    columns,
    selection,
    selectionActive,
    result,
    mode,
    viewingRound,
    maxRound,
    isEmpty,
    currentCellHasInRound,
    playerNames,
    addNumbers,
    removeLast,
    clearCurrentCell,
    resetAll,
    select,
    cycleMode,
    goToRound,
    startNewRound,
    setPlayerName,
    setColorWinner,
    clearColorWinner,
    hasColorWinner,
    addPenalty,
    hasRoundColor,
    currentRoundColor,
    setRoundColor,
    clearRoundColor,
    isCurrentRoundComplete,
    currentRoundNeedsColor,
    colorTopColumns,
    hasColorTopInRound,
    roundMultipliers,
    specialFinishes,
    currentRoundIsSpecial,
    canAddNumber,
    deselect,
    swapColumns,
    visibleColumnIds,
    visibleColumnCount,
    finish101,
    markNotOpened,
    targetRounds,
    showLastRoundAlert,
    dismissLastRoundAlert,
    specialKafaVurma,
    gameEndPrompted,
    acknowledgeGameEnd,
  } = useGameContext();
  const is101 = mode === 'duz-101';

  const screenWidth = Dimensions.get('window').width;
  const columnWidth = screenWidth / Math.max(1, visibleColumnCount);

  const handleColumnDrag = useCallback(
    (from: ColumnId, dx: number) => {
      const movement = Math.round(dx / columnWidth);
      if (movement === 0) return;
      const max = visibleColumnCount - 1;
      const target = Math.max(0, Math.min(max, from + movement)) as ColumnId;
      if (target === from) return;
      swapColumns(from, target);
    },
    [columnWidth, swapColumns, visibleColumnCount]
  );

  const styles = useThemedStyles(makeStyles);

  const multipliersByRound = React.useMemo(
    () =>
      computeMultipliersByRound(
        columns,
        mode,
        roundMultipliers,
        specialFinishes
      ),
    [columns, mode, roundMultipliers, specialFinishes]
  );

  const baseColorsByRound = React.useMemo(
    () => computeBaseColorsByRound(columns, mode, roundMultipliers),
    [columns, mode, roundMultipliers]
  );

  const goToResult = useCallback(() => {
    if (isEmpty) {
      Alert.alert('Boş oyun', 'Hesaplamak için en az bir sayı girmelisiniz.');
      return;
    }
    navigation.navigate('Result');
  }, [isEmpty, navigation]);

  const handleAdd = useCallback(
    (values: number[]) => {
      addNumbers(values);
      deselect();
    },
    [addNumbers, deselect]
  );

  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const handleOpenColorPicker = useCallback(() => {
    setColorPickerOpen(true);
  }, []);

  const handleSelectRoundColor = useCallback(
    (value: number, isSpecial: boolean) => {
      setRoundColor(value, isSpecial);
    },
    [setRoundColor]
  );

  const handleReset = useCallback(() => {
    if (isEmpty) return;
    Alert.alert(
      'Sıfırla',
      'Tüm turlar ve sayılar silinecek. Emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sıfırla', style: 'destructive', onPress: resetAll },
      ]
    );
  }, [isEmpty, resetAll]);

  const handleClearCell = useCallback(() => {
    if (!currentCellHasInRound) return;
    const sideLabel = selection.side === 'top' ? 'üst' : 'alt';
    Alert.alert(
      'Hücreyi Temizle',
      `Tur ${viewingRound} · ${playerNames[selection.column]} · ${sideLabel} hücresindeki bu turun sayıları silinecek. Diğer turlar etkilenmez. Emin misin?`,
      [
        { text: 'Hayır', style: 'cancel' },
        { text: 'Evet, sil', style: 'destructive', onPress: clearCurrentCell },
      ]
    );
  }, [currentCellHasInRound, selection, viewingRound, playerNames, clearCurrentCell]);

  const handlePrevRound = () => {
    if (viewingRound > 1) goToRound(viewingRound - 1);
  };

  const [pendingAdvance, setPendingAdvance] = useState(false);

  const handleNextRound = () => {
    if (viewingRound < maxRound) {
      goToRound(viewingRound + 1);
      return;
    }
    if (!isCurrentRoundComplete) {
      Alert.alert(
        'Tüm oyuncular için veri girilmedi',
        '4 oyuncudan herhangi birinin bu turdaki cezası ya da bitti işareti eksik. Tüm verileri girdikten sonra yeni tura geçebilirsin.'
      );
      return;
    }
    if (
      maxRound >= targetRounds &&
      !gameEndPrompted
    ) {
      setGameEndOpen(true);
      return;
    }
    if (currentRoundNeedsColor) {
      setPendingAdvance(true);
      setColorPickerOpen(true);
      return;
    }
    startNewRound();
  };

  useEffect(() => {
    if (pendingAdvance && !currentRoundNeedsColor) {
      setPendingAdvance(false);
      startNewRound();
    }
  }, [pendingAdvance, currentRoundNeedsColor, startNewRound]);

  const [draft, setDraft] = useState('');

  const flushDraftToCurrent = useCallback(() => {
    if (!selectionActive) {
      if (draft.length > 0) setDraft('');
      return;
    }
    if (draft.length === 0) return;
    const values = parseDraft(draft);
    if (values.length > 0) {
      addNumbers(values);
    }
    setDraft('');
  }, [draft, addNumbers, selectionActive]);

  useEffect(() => {
    if (!selectionActive && draft.length > 0) {
      setDraft('');
    }
  }, [selectionActive, draft.length]);

  const handleSelect = useCallback(
    (col: ColumnId, side: Side) => {
      flushDraftToCurrent();
      select(col, is101 ? 'bottom' : side);
    },
    [flushDraftToCurrent, select, is101]
  );

  const [preview, setPreview] = useState<{
    column: ColumnId;
    side: Side;
  } | null>(null);

  const handlePreviewStart = useCallback(
    (column: ColumnId, side: Side) => setPreview({ column, side }),
    []
  );

  const handlePreviewEnd = useCallback(() => setPreview(null), []);

  const [editingNameIdx, setEditingNameIdx] = useState<ColumnId | null>(null);

  const handleEditName = useCallback(
    (col: ColumnId) => setEditingNameIdx(col),
    []
  );

  const handleSaveName = useCallback(
    (name: string) => {
      if (editingNameIdx !== null) {
        setPlayerName(editingNameIdx, name);
      }
      setEditingNameIdx(null);
    },
    [editingNameIdx, setPlayerName]
  );

  const colorInfo = COLOR_BY_MULTIPLIER[result.multiplier];
  const showColorBadge = mode === 'renkli-klasik' && colorInfo != null;
  const current101Column = columns[selection.column];
  const is101Winner =
    is101 &&
    current101Column.bottom.some(
      (e) => e.round === viewingRound && e.marker === 'finished'
    );
  const is101NotOpened =
    is101 &&
    current101Column.bottom.some(
      (e) => e.round === viewingRound && e.marker === 'not-opened'
    );
  const is101Okeyle = is101 && (specialFinishes[viewingRound] ?? false);
  const is101KafaVurma = is101 && (specialKafaVurma[viewingRound] ?? false);

  const [special101Open, setSpecial101Open] = useState(false);
  const handleOpenSpecial101 = useCallback(() => setSpecial101Open(true), []);
  const handleCloseSpecial101 = useCallback(() => setSpecial101Open(false), []);
  const handleConfirmSpecial101 = useCallback(
    (okeyle: boolean, kafaVurma: boolean) => {
      finish101(okeyle, kafaVurma);
      setSpecial101Open(false);
    },
    [finish101]
  );

  const isViewingPast = viewingRound < maxRound;
  const forwardLabel = viewingRound < maxRound ? `Tur ${viewingRound + 1} ›` : '+ Yeni Tur';
  const isColorMode =
    mode === 'renkli-klasik' && selection.side === 'top';

  const canAdvanceToNewRound =
    viewingRound < maxRound || isCurrentRoundComplete;

  const showBittiButton =
    !isViewingPast &&
    maxRound >= targetRounds &&
    isCurrentRoundComplete &&
    !gameEndPrompted;
  const forwardLabelEffective = showBittiButton ? '🏁 BİTTİ' : forwardLabel;

  const [gameEndOpen, setGameEndOpen] = useState(false);

  const handleResultFromEnd = useCallback(() => {
    setGameEndOpen(false);
    acknowledgeGameEnd();
    navigation.navigate('Result');
  }, [acknowledgeGameEnd, navigation]);

  const handleContinueFromEnd = useCallback(() => {
    setGameEndOpen(false);
    acknowledgeGameEnd();
  }, [acknowledgeGameEnd]);

  const handleColorPick = useCallback(
    (value: number, isSpecial: boolean) => {
      setColorWinner(value, isSpecial);
      deselect();
    },
    [setColorWinner, deselect]
  );

  const exitConfirmedRef = useRef(false);
  const pendingExitActionRef = useRef<(() => void) | null>(null);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const showExitConfirm = useCallback((onConfirm: () => void) => {
    pendingExitActionRef.current = onConfirm;
    setExitModalVisible(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    setExitModalVisible(false);
    exitConfirmedRef.current = true;
    resetAll();
    const action = pendingExitActionRef.current;
    pendingExitActionRef.current = null;
    action?.();
  }, [resetAll]);

  const handleCancelExit = useCallback(() => {
    setExitModalVisible(false);
    pendingExitActionRef.current = null;
  }, []);

  const handleBackToMenu = useCallback(() => {
    showExitConfirm(() => {
      navigation.navigate('Menu');
    });
  }, [showExitConfirm, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (exitConfirmedRef.current) {
        exitConfirmedRef.current = false;
        return;
      }
      e.preventDefault();
      showExitConfirm(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, showExitConfirm]);

  const handleColorClear = useCallback(() => {
    if (!hasColorWinner) return;
    Alert.alert(
      'Kazananı Sil',
      `Tur ${viewingRound} · ${playerNames[selection.column]} oyuncusunun bu turdaki kazanan rengi ve "bitti" çizgisi silinecek. Emin misin?`,
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, sil',
          style: 'destructive',
          onPress: clearColorWinner,
        },
      ]
    );
  }, [hasColorWinner, viewingRound, playerNames, selection.column, clearColorWinner]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Yazboz</Text>
          <View style={styles.subRow}>
            <Pressable
              onPress={handleBackToMenu}
              style={({ pressed }) => [
                styles.backPill,
                pressed && styles.pressed,
              ]}
              hitSlop={6}
            >
              <Text style={styles.backPillText}>‹ Menü</Text>
            </Pressable>
            {showColorBadge && (
              <View
                style={[
                  styles.colorBadge,
                  {
                    backgroundColor: colorInfo.hex + '33',
                    borderColor: colorInfo.hex,
                  },
                ]}
              >
                <View
                  style={[styles.colorDot, { backgroundColor: colorInfo.hex }]}
                />
                <Text
                  style={[styles.colorBadgeText, { color: colorInfo.hex }]}
                >
                  {colorInfo.name} ×{colorInfo.multiplier}
                  {currentRoundIsSpecial ? ' (2x)' : ''}
                </Text>
              </View>
            )}
            {currentRoundIsSpecial && (
              <View style={styles.specialBadge}>
                <Text style={styles.specialBadgeText}>⭐ ÖZEL</Text>
              </View>
            )}
            <Text style={styles.cellTag} numberOfLines={1}>
              {selectionActive
                ? `${playerNames[selection.column]} · ${
                    selection.side === 'top' ? 'Üst' : 'Alt'
                  }`
                : 'bir hücreye dokun'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate('History')}
            style={styles.iconBtn}
          >
            <Text style={styles.iconBtnText}>Geçmiş</Text>
          </Pressable>
          <Pressable
            onPress={handleReset}
            style={[styles.iconBtn, isEmpty && styles.iconBtnDisabled]}
            disabled={isEmpty}
          >
            <Text style={styles.iconBtnText}>Sıfırla</Text>
          </Pressable>
          <Pressable
            onPress={goToResult}
            style={[
              styles.iconBtn,
              styles.iconBtnAccent,
              isEmpty && styles.iconBtnDisabled,
            ]}
            disabled={isEmpty}
          >
            <Text style={[styles.iconBtnText, styles.iconBtnTextAccent]}>
              Sonuç
            </Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.roundBar,
          isViewingPast && styles.roundBarEditing,
        ]}
      >
        <Pressable
          onPress={handlePrevRound}
          disabled={viewingRound <= 1}
          hitSlop={8}
          style={({ pressed }) => [
            styles.roundArrow,
            viewingRound <= 1 && styles.roundArrowDisabled,
            pressed && viewingRound > 1 && styles.pressed,
          ]}
        >
          <Text style={styles.roundArrowText}>‹</Text>
        </Pressable>

        <View style={styles.roundInfo}>
          <Text style={styles.roundLabel}>
            TUR {viewingRound}
            {maxRound > 1 ? ` / ${maxRound}` : ''}
          </Text>
          {isViewingPast && (
            <Text style={styles.roundEditingHint}>geçmiş tur düzenleniyor</Text>
          )}
        </View>

        <Pressable
          onPress={handleNextRound}
          disabled={!canAdvanceToNewRound}
          hitSlop={8}
          style={({ pressed }) => [
            styles.roundForward,
            !isViewingPast && styles.roundForwardNew,
            !canAdvanceToNewRound && styles.roundForwardDisabled,
            pressed && canAdvanceToNewRound && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.roundForwardText,
              !isViewingPast && styles.roundForwardNewText,
              !canAdvanceToNewRound && styles.roundForwardTextDisabled,
            ]}
          >
            {forwardLabelEffective}
          </Text>
        </Pressable>
      </View>

      <View style={styles.columns}>
        {visibleColumnIds.map((id) => (
          <ColumnView
            key={id}
            index={id}
            column={columns[id]}
            result={result.columns[id]}
            name={playerNames[id]}
            isSelected={selectionActive && selection.column === id}
            selectedSide={
              selectionActive && selection.column === id ? selection.side : null
            }
            topLocked={
              is101 ||
              (mode === 'renkli-klasik' &&
                (columns[id].bottom.some(
                  (e) => e.round === viewingRound && !e.marker
                ) ||
                  (!colorTopColumns[id] &&
                    (hasColorTopInRound || hasRoundColor))))
            }
            multipliersByRound={multipliersByRound}
            baseColorsByRound={baseColorsByRound}
            specialFinishes={specialFinishes}
            specialKafaVurma={specialKafaVurma}
            maxRound={maxRound}
            mode={mode}
            onSelect={handleSelect}
            onEditName={handleEditName}
            onPreviewStart={handlePreviewStart}
            onPreviewEnd={handlePreviewEnd}
            onDragEnd={handleColumnDrag}
          />
        ))}
      </View>

      {selectionActive ? (
        <NumberPad
          onClearCell={handleClearCell}
          onUndoLast={removeLast}
          canUndo={currentCellHasInRound}
          onAdd={handleAdd}
          draft={draft}
          onDraftChange={setDraft}
          variant={isColorMode ? 'color' : 'digit'}
          onColorPick={handleColorPick}
          onColorClear={handleColorClear}
          canClearColor={hasColorWinner}
          currentSpecial={currentRoundIsSpecial}
          hasRoundColor={mode !== 'renkli-klasik' || hasRoundColor}
          onOpenRoundColor={handleOpenColorPicker}
          onPenalty={addPenalty}
          canPenalty={selection.side === 'bottom'}
          canAddNumber={canAddNumber}
          is101Mode={is101}
          onFinish101={finish101}
          onOpenSpecial101={handleOpenSpecial101}
          onMarkNotOpened={markNotOpened}
          is101Winner={is101Winner}
          is101NotOpened={is101NotOpened}
          is101Okeyle={is101Okeyle}
          is101KafaVurma={is101KafaVurma}
        />
      ) : (
        <View style={styles.selectHintBar}>
          <Text style={styles.selectHintText}>
            ✋ Veri girmek için bir hücreye dokun
          </Text>
        </View>
      )}

      <BannerSlot />

      {editingNameIdx !== null && (
        <EditNameModal
          visible
          initialName={playerNames[editingNameIdx]}
          playerIndex={editingNameIdx}
          onCancel={() => setEditingNameIdx(null)}
          onSave={handleSaveName}
        />
      )}

      <ConfirmDestructiveModal
        visible={exitModalVisible}
        title="MENÜYE DÖN"
        message="Tüm oyun verileri silinecek ve ana menüye döneceksin. Bu işlem geri alınamaz!"
        confirmLabel="⚠ EVET, ÇIK"
        cancelLabel="Vazgeç"
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />

      <LastRoundAlertModal
        visible={showLastRoundAlert}
        targetRounds={targetRounds}
        players={visibleColumnIds.map((id) => ({
          name: playerNames[id],
          net: result.columns[id]?.net ?? 0,
        }))}
        onDismiss={dismissLastRoundAlert}
      />

      <Special101Modal
        visible={special101Open}
        initialOkeyle={is101Okeyle}
        initialKafaVurma={is101KafaVurma}
        onConfirm={handleConfirmSpecial101}
        onCancel={handleCloseSpecial101}
      />

      <GameEndPromptModal
        visible={gameEndOpen}
        targetRounds={targetRounds}
        onResult={handleResultFromEnd}
        onContinue={handleContinueFromEnd}
      />

      <ColorPickerModal
        visible={colorPickerOpen}
        currentValue={currentRoundColor}
        currentSpecial={currentRoundIsSpecial}
        title={
          pendingAdvance
            ? `Tur ${viewingRound} bitsin · Renk Seç`
            : `Tur ${viewingRound} · Renk Seç`
        }
        onSelect={handleSelectRoundColor}
        onClear={hasRoundColor ? clearRoundColor : undefined}
        onClose={() => {
          setColorPickerOpen(false);
          setPendingAdvance(false);
        }}
      />

      {preview && (
        <View pointerEvents="none" style={styles.previewOverlay}>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>
              {playerNames[preview.column]} ·{' '}
              {preview.side === 'top' ? 'ÜST' : 'ALT'}
            </Text>
            <Text style={styles.previewValues}>
              {preview.side === 'top'
                ? columns[preview.column].top.map((t) => t.value).join(', ')
                : columns[preview.column].bottom
                    .filter((e) => e.marker !== 'finished')
                    .map(
                      (e) => e.value * (multipliersByRound[e.round] ?? 1)
                    )
                    .join(', ')}
            </Text>
            <Text style={styles.previewCount}>
              {preview.side === 'top'
                ? columns[preview.column].top.length
                : columns[preview.column].bottom.length}{' '}
              değer
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: { flex: 1 },
  title: { ...typography.title, color: c.textPrimary },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
    flexWrap: 'wrap',
  },
  modePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: c.surfaceElevated,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: c.textSecondary,
    letterSpacing: 0.5,
  },
  backPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: c.accentMuted,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.accent,
  },
  backPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: c.accent,
    letterSpacing: 0.5,
  },
  colorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 5,
  },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  colorBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  specialBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FBBF2433',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  specialBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  cellTag: { ...typography.caption, color: c.accent },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: c.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.border,
  },
  iconBtnAccent: {
    backgroundColor: c.accentMuted,
    borderColor: c.accent,
  },
  iconBtnDisabled: { opacity: 0.4 },
  iconBtnText: { ...typography.caption, color: c.textSecondary },
  iconBtnTextAccent: { color: c.accent },
  roundBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: c.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    gap: spacing.sm,
  },
  roundBarEditing: {
    borderColor: '#FBBF24',
    backgroundColor: '#FBBF2415',
  },
  roundArrow: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundArrowDisabled: { opacity: 0.3 },
  roundArrowText: {
    fontSize: 22,
    fontWeight: '700',
    color: c.textPrimary,
    lineHeight: 24,
  },
  roundInfo: { flex: 1, alignItems: 'center' },
  roundLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: c.textPrimary,
    letterSpacing: 1,
  },
  roundEditingHint: {
    fontSize: 10,
    color: '#FBBF24',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  roundForward: {
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  roundForwardNew: {
    backgroundColor: c.accentMuted,
    borderColor: c.accent,
  },
  roundForwardText: {
    fontSize: 12,
    fontWeight: '700',
    color: c.textSecondary,
  },
  roundForwardNewText: { color: c.accent },
  roundForwardDisabled: {
    opacity: 0.35,
    backgroundColor: c.surface,
    borderColor: c.border,
  },
  roundForwardTextDisabled: {
    color: c.textMuted,
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.6 },
  selectHintBar: {
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderColor: c.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectHintText: {
    ...typography.body,
    color: c.textMuted,
    letterSpacing: 0.5,
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  previewCard: {
    backgroundColor: c.surfaceElevated,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minWidth: 200,
    maxWidth: '90%',
    borderWidth: 2,
    borderColor: c.accent,
    alignItems: 'center',
  },
  previewTitle: {
    ...typography.caption,
    color: c.accent,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  previewValues: {
    fontSize: 22,
    fontWeight: '700',
    color: c.textPrimary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    lineHeight: 30,
  },
  previewCount: {
    ...typography.caption,
    color: c.textMuted,
    marginTop: spacing.sm,
  },
});
