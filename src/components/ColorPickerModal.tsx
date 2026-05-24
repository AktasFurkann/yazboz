import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../theme';
import { COLOR_BY_MULTIPLIER } from '../types/game';

interface Props {
  visible: boolean;
  currentValue: number | null;
  currentSpecial?: boolean;
  title?: string;
  onSelect: (value: number, isSpecial: boolean) => void;
  onClear?: () => void;
  onClose: () => void;
}

const OPTIONS = [3, 4, 5, 6];

export const ColorPickerModal: React.FC<Props> = ({
  visible,
  currentValue,
  currentSpecial = false,
  title = 'Tur Rengini Seç',
  onSelect,
  onClear,
  onClose,
}) => {
  const [isSpecial, setIsSpecial] = useState(false);

  useEffect(() => {
    if (visible) setIsSpecial(currentSpecial);
  }, [visible, currentSpecial]);

  const handlePick = (v: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect(v, isSpecial);
    onClose();
  };

  const handleClear = () => {
    if (!onClear) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClear();
    onClose();
  };

  const toggleMode = (special: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSpecial(special);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {isSpecial
              ? 'Özel bitiş: kazanan ×100, kaybedenler ×2 ceza'
              : 'Normal bitiş: kazanan ×-10, kaybedenler ×renk'}
          </Text>

          <View style={styles.modeToggle}>
            <Pressable
              onPress={() => toggleMode(false)}
              style={({ pressed }) => [
                styles.modeBtn,
                !isSpecial && styles.modeBtnActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  !isSpecial && styles.modeBtnTextActive,
                ]}
              >
                Normal Bitiş
              </Text>
            </Pressable>
            <Pressable
              onPress={() => toggleMode(true)}
              style={({ pressed }) => [
                styles.modeBtn,
                isSpecial && styles.modeBtnActiveSpecial,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.modeBtnText,
                  isSpecial && styles.modeBtnTextActive,
                ]}
              >
                ⭐ Özel Bitiş
              </Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            {OPTIONS.map((v) => {
              const info = COLOR_BY_MULTIPLIER[v];
              if (!info) return null;
              const selected = currentValue === v;
              return (
                <Pressable
                  key={v}
                  onPress={() => handlePick(v)}
                  style={({ pressed }) => [
                    styles.colorBtn,
                    { backgroundColor: info.hex },
                    selected && styles.colorBtnSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.colorNumber,
                      v === 6 && styles.colorTextDark,
                    ]}
                  >
                    {v}
                  </Text>
                  <Text
                    style={[
                      styles.colorName,
                      v === 6 && styles.colorTextDark,
                    ]}
                  >
                    {info.name}
                  </Text>
                  <Text
                    style={[
                      styles.colorSub,
                      v === 6 && styles.colorTextDark,
                    ]}
                  >
                    {isSpecial ? `×${v * 2} / +${v * 100}` : `×${v}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            {currentValue !== null && onClear && (
              <Pressable
                onPress={handleClear}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.clearBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.clearBtnText}>✕ Rengi Sil</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.cancelBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelBtnText}>İptal</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const SPECIAL_COLOR = '#FBBF24';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  modeBtnActiveSpecial: {
    backgroundColor: SPECIAL_COLOR + '33',
    borderColor: SPECIAL_COLOR,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  modeBtnTextActive: {
    color: colors.textPrimary,
  },
  grid: {
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
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorBtnSelected: {
    borderColor: colors.accent,
  },
  colorNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    lineHeight: 32,
  },
  colorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginTop: 2,
  },
  colorSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.85,
  },
  colorTextDark: {
    color: '#0F1419',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  clearBtn: {
    backgroundColor: colors.negativeMuted,
    borderWidth: 1,
    borderColor: colors.negative,
  },
  clearBtnText: {
    ...typography.heading,
    color: colors.negative,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    ...typography.heading,
    color: colors.textSecondary,
  },
  pressed: { opacity: 0.7 },
});
