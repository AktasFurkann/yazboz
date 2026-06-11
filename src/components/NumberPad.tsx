import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
// note: parseDraft is exported for parent (GameScreen) auto-commit logic
import * as Haptics from 'expo-haptics';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';
import { COLOR_BY_MULTIPLIER } from '../types/game';

interface Props {
  onClearCell: () => void;
  onUndoLast: () => void;
  onAdd: (values: number[]) => void;
  canUndo: boolean;
  draft: string;
  onDraftChange: (next: string) => void;
  variant?: 'digit' | 'color';
  onColorPick?: (value: number, isSpecial: boolean) => void;
  onColorClear?: () => void;
  canClearColor?: boolean;
  currentSpecial?: boolean;
  hasRoundColor?: boolean;
  onOpenRoundColor?: () => void;
  onPenalty?: () => void;
  canPenalty?: boolean;
  canAddNumber?: boolean;
  is101Mode?: boolean;
  onFinish101?: (okeyle: boolean, kafaVurma: boolean) => void;
  onOpenSpecial101?: () => void;
  onMarkNotOpened?: () => void;
  is101Winner?: boolean;
  is101NotOpened?: boolean;
  is101Okeyle?: boolean;
  is101KafaVurma?: boolean;
  is101OtherWinner?: boolean;
  isKlasikOkeyMode?: boolean;
  onGosterge?: () => void;
  isGosterge?: boolean;
  isGostergeOther?: boolean;
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
  currentSpecial = false,
  hasRoundColor = false,
  onOpenRoundColor,
  onPenalty,
  canPenalty = false,
  canAddNumber = true,
  is101Mode = false,
  onFinish101,
  onOpenSpecial101,
  onMarkNotOpened,
  is101Winner = false,
  is101NotOpened = false,
  is101Okeyle = false,
  is101KafaVurma = false,
  is101OtherWinner = false,
  isKlasikOkeyMode = false,
  onGosterge,
  isGosterge = false,
  isGostergeOther = false,
}) => {
  const styles = useThemedStyles(makeStyles);
  const [collapsed, setCollapsed] = useState(false);
  const [isSpecialMode, setIsSpecialMode] = useState(false);

  const isColorMode = variant === 'color';

  React.useEffect(() => {
    if (isColorMode) setIsSpecialMode(currentSpecial);
  }, [isColorMode, currentSpecial]);

  const handleColorPick = (value: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onColorPick?.(value, isSpecialMode);
  };

  const toggleSpecialMode = (special: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSpecialMode(special);
  };

  const handleColorClear = () => {
    if (!canClearColor) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onColorClear?.();
  };

  const press = (key: string) => {
    if (key === BACKSPACE_KEY) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onDraftChange(draft.slice(0, -1));
      return;
    }
    if (key === UNDO_KEY) {
      if (!canUndo) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onUndoLast();
      return;
    }
    if (!canAddNumber) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (draft.length >= 4) return;
    onDraftChange(draft + key);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDraftChange('');
    onClearCell();
  };

  const handlePenaltyPress = () => {
    if (!canPenalty) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onPenalty?.();
  };

  const handleNormalFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onFinish101?.(false, false);
  };

  const handleOpenSpecial = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenSpecial101?.();
  };

  const handleMarkNotOpened = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onMarkNotOpened?.();
  };

  const handleGosterge = () => {
    if (isGostergeOther) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onGosterge?.();
  };

  const is101SpecialActive = is101Winner && (is101Okeyle || is101KafaVurma);
  const specialMult = (is101Okeyle ? 2 : 1) * (is101KafaVurma ? 2 : 1);

  const handleAdd = () => {
    if (!canAddNumber) return;
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

  if (isKlasikOkeyMode) {
    return (
      <View style={styles.container}>
        <View style={styles.colorHeader}>
          <Text style={styles.colorTitle}>
            {is101Winner ? 'Kazanan seçildi' : 'Bu eli kim kazandı?'}
          </Text>
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
        <View style={styles.actionRow101}>
          <Pressable
            onPress={handleNormalFinish}
            disabled={is101OtherWinner}
            style={({ pressed }) => [
              styles.action101Btn,
              styles.action101BtnFinish,
              is101Winner && !is101SpecialActive && styles.action101BtnFinishActive,
              is101OtherWinner && styles.action101BtnDisabled,
              pressed && !is101OtherWinner && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.action101Text,
                styles.action101TextFinish,
                is101Winner && !is101SpecialActive && styles.action101TextActive,
                is101OtherWinner && styles.action101TextDisabled,
              ]}
            >
              BİTTİ
            </Text>
            <Text
              style={[
                styles.action101Hint,
                styles.action101HintFinish,
                is101OtherWinner && styles.action101TextDisabled,
              ]}
            >
              diğerleri -2
            </Text>
          </Pressable>
          <Pressable
            onPress={handleOpenSpecial}
            disabled={is101OtherWinner}
            style={({ pressed }) => [
              styles.action101Btn,
              styles.action101BtnSpecial,
              is101SpecialActive && styles.action101BtnSpecialActive,
              is101OtherWinner && styles.action101BtnDisabled,
              pressed && !is101OtherWinner && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.action101Text,
                styles.action101TextSpecial,
                is101SpecialActive && styles.action101TextActive,
                is101OtherWinner && styles.action101TextDisabled,
              ]}
            >
              ⭐ ÖZEL
            </Text>
            <Text
              style={[
                styles.action101Hint,
                styles.action101HintSpecial,
                is101OtherWinner && styles.action101TextDisabled,
              ]}
            >
              {is101SpecialActive
                ? `diğerleri -${2 * specialMult}`
                : 'okeyle / çifte'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.klasikBottomRow}>
          <Pressable
            onPress={handleGosterge}
            disabled={isGostergeOther}
            style={({ pressed }) => [
              styles.gostergeBtn,
              isGosterge && styles.gostergeBtnActive,
              isGostergeOther && styles.action101BtnDisabled,
              pressed && !isGostergeOther && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.gostergeText,
                isGosterge && styles.action101TextActive,
                isGostergeOther && styles.action101TextDisabled,
              ]}
            >
              🎯 GÖSTERGE
            </Text>
            <Text
              style={[
                styles.gostergeHint,
                isGostergeOther && styles.action101TextDisabled,
              ]}
            >
              diğerleri -1
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onUndoLast();
            }}
            disabled={!canUndo}
            style={({ pressed }) => [
              styles.klasikSilBtn,
              !canUndo && styles.klasikSilBtnDisabled,
              pressed && canUndo && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.klasikSilText,
                !canUndo && styles.klasikSilTextDisabled,
              ]}
            >
              ✕ Sil
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isColorMode) {
    return (
      <View style={styles.container}>
        <View style={styles.colorHeader}>
          <Text style={styles.colorTitle}>
            {isSpecialMode ? '⭐ Özel Bitiş' : 'Kazanan Rengi Seç'}
          </Text>
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

        <View style={styles.modeToggleRow}>
          <Pressable
            onPress={() => toggleSpecialMode(false)}
            style={({ pressed }) => [
              styles.modeBtn,
              !isSpecialMode && styles.modeBtnActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.modeBtnText,
                !isSpecialMode && styles.modeBtnTextActive,
              ]}
            >
              Normal Bitiş
            </Text>
          </Pressable>
          <Pressable
            onPress={() => toggleSpecialMode(true)}
            style={({ pressed }) => [
              styles.modeBtn,
              isSpecialMode && styles.modeBtnActiveSpecial,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.modeBtnText,
                isSpecialMode && styles.modeBtnTextActive,
              ]}
            >
              ⭐ Özel Bitiş
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={handlePenaltyPress}
          disabled={!canPenalty}
          style={({ pressed }) => [
            styles.penaltyBtn,
            !canPenalty && styles.penaltyBtnDisabled,
            pressed && canPenalty && styles.pressed,
          ]}
          hitSlop={6}
        >
          <Text
            style={[
              styles.penaltyBtnText,
              !canPenalty && styles.penaltyBtnTextDisabled,
            ]}
          >
            ⚠ CEZA!
          </Text>
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
          disabled={!hasDraft || !canAddNumber}
          style={({ pressed }) => [
            styles.smallBtn,
            styles.nextBtn,
            (!hasDraft || !canAddNumber) && styles.smallBtnDisabled,
            pressed && hasDraft && canAddNumber && styles.pressed,
          ]}
          hitSlop={6}
        >
          <Text
            style={[
              styles.smallBtnText,
              styles.nextBtnText,
              (!hasDraft || !canAddNumber) && styles.smallBtnTextDisabled,
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

      {is101Mode && (
        <View style={styles.actionRow101}>
          <Pressable
            onPress={handleMarkNotOpened}
            disabled={is101Winner}
            style={({ pressed }) => [
              styles.action101Btn,
              is101NotOpened && styles.action101BtnActive,
              is101Winner && styles.action101BtnDisabled,
              pressed && !is101Winner && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.action101Text,
                is101NotOpened && styles.action101TextActive,
                is101Winner && styles.action101TextDisabled,
              ]}
            >
              AÇILAMADI
            </Text>
            <Text
              style={[
                styles.action101Hint,
                is101Winner && styles.action101TextDisabled,
              ]}
            >
              +202
            </Text>
          </Pressable>
          <Pressable
            onPress={handleNormalFinish}
            disabled={is101OtherWinner}
            style={({ pressed }) => [
              styles.action101Btn,
              styles.action101BtnFinish,
              is101Winner && !is101SpecialActive && styles.action101BtnFinishActive,
              is101OtherWinner && styles.action101BtnDisabled,
              pressed && !is101OtherWinner && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.action101Text,
                styles.action101TextFinish,
                is101Winner && !is101SpecialActive && styles.action101TextActive,
                is101OtherWinner && styles.action101TextDisabled,
              ]}
            >
              BİTTİ
            </Text>
            <Text
              style={[
                styles.action101Hint,
                styles.action101HintFinish,
                is101OtherWinner && styles.action101TextDisabled,
              ]}
            >
              -101
            </Text>
          </Pressable>
          <Pressable
            onPress={handleOpenSpecial}
            disabled={is101OtherWinner}
            style={({ pressed }) => [
              styles.action101Btn,
              styles.action101BtnSpecial,
              is101SpecialActive && styles.action101BtnSpecialActive,
              is101OtherWinner && styles.action101BtnDisabled,
              pressed && !is101OtherWinner && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.action101Text,
                styles.action101TextSpecial,
                is101SpecialActive && styles.action101TextActive,
                is101OtherWinner && styles.action101TextDisabled,
              ]}
            >
              ⭐ ÖZEL
            </Text>
            <Text
              style={[
                styles.action101Hint,
                styles.action101HintSpecial,
                is101OtherWinner && styles.action101TextDisabled,
              ]}
            >
              {is101SpecialActive ? `×${specialMult}` : '×2'}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.grid}>
        {DIGITS.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((key) => {
              const isUndo = key === UNDO_KEY;
              const isBackspace = key === BACKSPACE_KEY;
              const isAction = isUndo || isBackspace;
              const undoDisabled = isUndo && !canUndo;
              const digitDisabled = !isAction && !canAddNumber;
              const disabled = undoDisabled || digitDisabled;
              return (
                <Pressable
                  key={key}
                  onPress={() => press(key)}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.key,
                    isBackspace && styles.keyBackspace,
                    isUndo && styles.keyUndo,
                    disabled && styles.keyDisabled,
                    pressed && !disabled && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.keyText,
                      isAction && styles.keyActionText,
                      isUndo && styles.keyUndoText,
                      disabled && styles.keyTextDisabled,
                    ]}
                  >
                    {isUndo ? 'Sil' : key}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        {!canAddNumber && (
          <Text style={styles.restrictionHint}>Sadece CEZA verilebilir</Text>
        )}
      </View>
    </View>
  );
};

const YELLOW = '#FBBF24';
const RED = '#EF4444';

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
  container: {
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  collapsedBar: {
    backgroundColor: c.surfaceElevated,
    borderTopWidth: 1,
    borderColor: c.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedText: {
    ...typography.caption,
    color: c.accent,
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
    backgroundColor: c.surfaceElevated,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.border,
    minWidth: 70,
  },
  nextBtn: {
    backgroundColor: c.accentMuted,
    borderColor: c.accent,
  },
  smallBtnText: {
    ...typography.caption,
    color: c.textSecondary,
  },
  nextBtnText: {
    color: c.accent,
    fontWeight: '700',
  },
  draftBox: {
    flex: 1,
    backgroundColor: c.surfaceElevated,
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
    color: c.accent,
    letterSpacing: 1,
  },
  draftEmpty: {
    color: c.textMuted,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  collapseToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: c.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 38,
  },
  collapseToggleText: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '700',
  },
  grid: {},
  row: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  key: {
    flex: 1,
    backgroundColor: c.surfaceElevated,
    paddingVertical: spacing.sm,
    marginHorizontal: 3,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBackspace: {
    backgroundColor: c.border,
  },
  keyUndo: {
    backgroundColor: RED + '22',
    borderWidth: 1,
    borderColor: RED,
  },
  keyDisabled: {
    opacity: 0.35,
  },
  keyText: {
    ...typography.title,
    color: c.textPrimary,
  },
  keyActionText: {
    color: c.textSecondary,
  },
  keyUndoText: {
    ...typography.heading,
    color: RED,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  keyTextDisabled: {
    color: c.textMuted,
  },
  restrictionHint: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: c.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  smallBtnDisabled: {
    opacity: 0.4,
  },
  smallBtnTextDisabled: {
    color: c.textMuted,
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
    color: c.textPrimary,
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
    backgroundColor: c.negativeMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.negative,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearColorBtnDisabled: {
    backgroundColor: c.surfaceElevated,
    borderColor: c.border,
    opacity: 0.5,
  },
  clearColorBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: c.negative,
    letterSpacing: 0.5,
  },
  clearColorBtnTextDisabled: {
    color: c.textMuted,
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
  modeToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: c.surfaceElevated,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: c.accentMuted,
    borderColor: c.accent,
  },
  modeBtnActiveSpecial: {
    backgroundColor: '#FBBF2433',
    borderColor: '#FBBF24',
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: c.textSecondary,
    letterSpacing: 0.5,
  },
  modeBtnTextActive: {
    color: c.textPrimary,
  },
  penaltyBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: c.negative,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.negative,
    minWidth: 80,
  },
  penaltyBtnDisabled: {
    backgroundColor: c.surfaceElevated,
    borderColor: c.border,
    opacity: 0.5,
  },
  penaltyBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  penaltyBtnTextDisabled: {
    color: c.textMuted,
  },
  actionRow101: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  action101Btn: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: c.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action101BtnActive: {
    backgroundColor: c.accentMuted,
    borderColor: c.accent,
  },
  action101BtnDisabled: {
    opacity: 0.35,
  },
  action101TextDisabled: {
    color: c.textMuted,
  },
  klasikBottomRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  gostergeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: '#3B82F622',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gostergeBtnActive: {
    backgroundColor: '#3B82F6',
  },
  gostergeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  gostergeHint: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
    opacity: 0.8,
    marginTop: 2,
  },
  klasikSilBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: c.negative + '22',
    borderWidth: 1,
    borderColor: c.negative,
    alignItems: 'center',
    justifyContent: 'center',
  },
  klasikSilBtnDisabled: {
    opacity: 0.4,
  },
  klasikSilText: {
    fontSize: 14,
    fontWeight: '800',
    color: c.negative,
    letterSpacing: 0.5,
  },
  klasikSilTextDisabled: {
    color: c.textMuted,
  },
  action101BtnFinish: {
    backgroundColor: c.accentMuted,
    borderColor: c.accent,
  },
  action101BtnFinishActive: {
    backgroundColor: c.accent,
  },
  action101BtnSpecial: {
    backgroundColor: '#FBBF2422',
    borderColor: YELLOW,
  },
  action101BtnSpecialActive: {
    backgroundColor: YELLOW,
  },
  action101Text: {
    fontSize: 13,
    fontWeight: '800',
    color: c.textSecondary,
    letterSpacing: 0.5,
  },
  action101TextFinish: {
    color: c.accent,
  },
  action101TextSpecial: {
    color: YELLOW,
  },
  action101TextActive: {
    color: '#FFFFFF',
  },
  action101Hint: {
    fontSize: 10,
    fontWeight: '700',
    color: c.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  action101HintFinish: {
    color: c.accent,
    opacity: 0.7,
  },
  action101HintSpecial: {
    color: YELLOW,
    opacity: 0.8,
  },
});

export const NumberPad = memo(NumberPadComponent);
