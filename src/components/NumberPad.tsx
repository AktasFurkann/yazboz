import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
// note: parseDraft is exported for parent (GameScreen) auto-commit logic
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../theme';
import { COLOR_BY_MULTIPLIER } from '../types/game';

interface Props {
  onClearCell: () => void;
  onUndoLast: () => void;
  onAdd: (values: number[]) => void;
  canUndo: boolean;
  draft: string;
  onDraftChange: (next: string) => void;
  variant?: 'digit' | 'color';
  onColorPick?: (value: number) => void;
  onColorClear?: () => void;
  canClearColor?: boolean;
  hasRoundColor?: boolean;
  onOpenRoundColor?: () => void;
}

const COLOR_OPTIONS = [3, 4, 5, 6];

const UNDO_KEY = '↺';
const BACKSPACE_KEY = '⌫';

const DIGITS: string[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [UNDO_KEY, '0', BACKSPACE_KEY],
];

export const parseDraft = (draft: string): number[] => {
  if (draft.length === 0) return [];
  const v = parseInt(draft, 10);
  return Number.isNaN(v) ? [] : [v];
};

const NumberPadComponent: React.FC<Props> = ({
  onClearCell,
  onUndoLast,
  onAdd,
  canUndo,
  draft,
  onDraftChange,
  variant = 'digit',
  onColorPick,
  onColorClear,
  canClearColor = false,
  hasRoundColor = false,
  onOpenRoundColor,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const isColorMode = variant === 'color';

  const handleColorPick = (value: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onColorPick?.(value);
  };

  const handleColorClear = () => {
    if (!canClearColor) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onColorClear?.();
  };

  const press = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === BACKSPACE_KEY) {
      onDraftChange(draft.slice(0, -1));
      return;
    }
    if (key === UNDO_KEY) {
      if (!canUndo) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onUndoLast();
      return;
    }
    if (draft.length >= 4) return;
    onDraftChange(draft + key);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDraftChange('');
    onClearCell();
  };

  const handleAdd = () => {
    const values = parseDraft(draft);
    if (values.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd(values);
    onDraftChange('');
  };

  const handleOpenColor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenRoundColor?.();
  };

  const toggleCollapsed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCollapsed((c) => !c);
  };

  const hasDraft = draft.length > 0;

  if (collapsed) {
    return (
      <Pressable
        onPress={toggleCollapsed}
        style={({ pressed }) => [
          styles.collapsedBar,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.collapsedText}>▲  KLAVYEYİ AÇ</Text>
      </Pressable>
    );
  }

  if (isColorMode) {
    return (
      <View style={styles.container}>
        <View style={styles.colorHeader}>
          <Text style={styles.colorTitle}>Kazanan Rengi Seç</Text>
          <View style={styles.colorHeaderActions}>
            <Pressable
              onPress={handleColorClear}
              disabled={!canClearColor}
              style={({ pressed }) => [
                styles.clearColorBtn,
                !canClearColor && styles.clearColorBtnDisabled,
                pressed && canClearColor && styles.pressed,
              ]}
              hitSlop={6}
            >
              <Text
                style={[
                  styles.clearColorBtnText,
                  !canClearColor && styles.clearColorBtnTextDisabled,
                ]}
              >
                ✕ Sil
              </Text>
            </Pressable>
            <Pressable
              onPress={toggleCollapsed}
              style={({ pressed }) => [
                styles.collapseToggle,
                pressed && styles.pressed,
              ]}
              hitSlop={8}
            >
              <Text style={styles.collapseToggleText}>▼</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map((v) => {
            const info = COLOR_BY_MULTIPLIER[v];
            if (!info) return null;
            return (
              <Pressable
                key={v}
                onPress={() => handleColorPick(v)}
                style={({ pressed }) => [
                  styles.colorBtn,
                  { backgroundColor: info.hex },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.colorBtnNumber,
                    v === 6 && styles.colorBtnNumberDark,
                  ]}
                >
                  {v}
                </Text>
                <Text
                  style={[
                    styles.colorBtnName,
                    v === 6 && styles.colorBtnNameDark,
                  ]}
                >
                  {info.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={handleClear}
          style={({ pressed }) => [
            styles.smallBtn,
            pressed && styles.pressed,
          ]}
          hitSlop={6}
        >
          <Text style={styles.smallBtnText}>Temizle</Text>
        </Pressable>

        <View style={styles.draftBox}>
          <Text
            style={[styles.draftText, !hasDraft && styles.draftEmpty]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {draft || 'rakam gir'}
          </Text>
        </View>

        <Pressable
          onPress={handleAdd}
          disabled={!hasDraft}
          style={({ pressed }) => [
            styles.smallBtn,
            styles.nextBtn,
            !hasDraft && styles.smallBtnDisabled,
            pressed && hasDraft && styles.pressed,
          ]}
          hitSlop={6}
        >
          <Text
            style={[
              styles.smallBtnText,
              styles.nextBtnText,
              !hasDraft && styles.smallBtnTextDisabled,
            ]}
          >
            + EKLE
          </Text>
        </Pressable>

        <Pressable
          onPress={toggleCollapsed}
          style={({ pressed }) => [
            styles.collapseToggle,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Text style={styles.collapseToggleText}>▼</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {DIGITS.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((key) => {
              const isUndo = key === UNDO_KEY;
              const isBackspace = key === BACKSPACE_KEY;
              const isAction = isUndo || isBackspace;
              const undoDisabled = isUndo && !canUndo;
              return (
                <Pressable
                  key={key}
                  onPress={() => press(key)}
                  disabled={undoDisabled}
                  style={({ pressed }) => [
                    styles.key,
                    isBackspace && styles.keyBackspace,
                    isUndo && styles.keyUndo,
                    undoDisabled && styles.keyDisabled,
                    pressed && !undoDisabled && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.keyText,
                      isAction && styles.keyActionText,
                      isUndo && styles.keyUndoText,
                      undoDisabled && styles.keyTextDisabled,
                    ]}
                  >
                    {isUndo ? 'Sil' : key}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        {hasRoundColor ? (
          <Pressable
            onPress={handleAdd}
            disabled={!hasDraft}
            style={({ pressed }) => [
              styles.addBtn,
              !hasDraft && styles.addBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.addBtnText}>+ EKLE</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleOpenColor}
            style={({ pressed }) => [
              styles.colorPickBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.colorPickBtnText}>🎨  RENK SEÇ</Text>
            <Text style={styles.colorPickBtnSub}>
              tur çarpanını belirle (kapalı el için)
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const YELLOW = '#FBBF24';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  collapsedBar: {
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  smallBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 70,
  },
  nextBtn: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  smallBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  nextBtnText: {
    color: colors.accent,
    fontWeight: '700',
  },
  draftBox: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 38,
  },
  draftText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 1,
  },
  draftEmpty: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  collapseToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 38,
  },
  collapseToggleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  grid: {},
  row: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  key: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.sm,
    marginHorizontal: 3,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBackspace: {
    backgroundColor: colors.border,
  },
  keyUndo: {
    backgroundColor: YELLOW + '22',
    borderWidth: 1,
    borderColor: YELLOW,
  },
  keyDisabled: {
    opacity: 0.35,
  },
  keyText: {
    ...typography.title,
    color: colors.textPrimary,
  },
  keyActionText: {
    color: colors.textSecondary,
  },
  keyUndoText: {
    ...typography.heading,
    color: YELLOW,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  keyTextDisabled: {
    color: colors.textMuted,
  },
  addBtn: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: spacing.md,
    marginHorizontal: 3,
    marginTop: 2,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: colors.border,
  },
  addBtnText: {
    ...typography.title,
    color: colors.buttonPrimaryText,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  colorPickBtn: {
    backgroundColor: '#FBBF24',
    paddingVertical: spacing.md,
    marginHorizontal: 3,
    marginTop: 2,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  colorPickBtnText: {
    fontSize: 18,
    color: '#0F1419',
    letterSpacing: 1.5,
    fontWeight: '900',
  },
  colorPickBtnSub: {
    fontSize: 11,
    color: '#0F1419',
    opacity: 0.7,
    marginTop: 2,
    fontWeight: '600',
  },
  smallBtnDisabled: {
    opacity: 0.4,
  },
  smallBtnTextDisabled: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.6,
  },
  colorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  colorTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  colorHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clearColorBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.negativeMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.negative,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearColorBtnDisabled: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    opacity: 0.5,
  },
  clearColorBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.negative,
    letterSpacing: 0.5,
  },
  clearColorBtnTextDisabled: {
    color: colors.textMuted,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorBtn: {
    width: '47.5%',
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBtnNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    lineHeight: 36,
  },
  colorBtnNumberDark: {
    color: '#0F1419',
  },
  colorBtnName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginTop: 2,
  },
  colorBtnNameDark: {
    color: '#0F1419',
  },
});

export const NumberPad = memo(NumberPadComponent);
