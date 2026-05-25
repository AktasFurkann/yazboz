import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import { computeMultipliersByRound } from '../logic/calculator';
import { useGameContext } from '../contexts/GameContext';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';
import { COLUMN_IDS, COLOR_BY_MULTIPLIER, MODE_LABEL } from '../types/game';
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
  } = useGameContext();

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
    },
    [addNumbers]
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
      select(col, side);
    },
    [flushDraftToCurrent, select]
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
  const isViewingPast = viewingRound < maxRound;
  const forwardLabel = viewingRound < maxRound ? `Tur ${viewingRound + 1} ›` : '+ Yeni Tur';
  const isColorMode =
    mode === 'renkli-klasik' && selection.side === 'top';

  const canAdvanceToNewRound =
    viewingRound < maxRound || isCurrentRoundComplete;

  const handleColorPick = useCallback(
    (value: number, isSpecial: boolean) => {
      setColorWinner(value, isSpecial);
    },
    [setColorWinner]
  );

  const exitConfirmedRef = useRef(false);

  const showExitConfirm = useCallback(
    (onConfirm: () => void) => {
      Alert.alert(
        'Menüye Dön',
        'Tüm oyun verileri silinecek ve ana menüye döneceksin. Emin misin?',
        [
          { text: 'İptal', style: 'cancel', onPress: () => {} },
          {
            text: 'Evet, dön',
            style: 'destructive',
            onPress: () => {
              exitConfirmedRef.current = true;
              resetAll();
              onConfirm();
            },
          },
        ]
      );
    },
    [resetAll]
  );

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
            {forwardLabel}
          </Text>
        </Pressable>
      </View>

      <View style={styles.columns}>
        {COLUMN_IDS.map((id) => (
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
              mode === 'renkli-klasik' &&
              !colorTopColumns[id] &&
              (hasColorTopInRound || hasRoundColor)
            }
            multipliersByRound={multipliersByRound}
            specialFinishes={specialFinishes}
            onSelect={handleSelect}
            onEditName={handleEditName}
            onPreviewStart={handlePreviewStart}
            onPreviewEnd={handlePreviewEnd}
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
              {preview.side === 'top'
                ? 'ÜST (×-10)'
                : mode === 'renkli-klasik'
                ? 'ALT (çarpanlı)'
                : 'ALT'}
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
