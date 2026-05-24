import React from 'react';
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
  title?: string;
  onSelect: (value: number) => void;
  onClear?: () => void;
  onClose: () => void;
}

const OPTIONS = [3, 4, 5, 6];

export const ColorPickerModal: React.FC<Props> = ({
  visible,
  currentValue,
  title = 'Tur Rengini Seç',
  onSelect,
  onClear,
  onClose,
}) => {
  const handlePick = (v: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect(v);
    onClose();
  };

  const handleClear = () => {
    if (!onClear) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClear();
    onClose();
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
            Bu turdaki ceza çarpanı (kimse bitmese bile)
          </Text>

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
    marginBottom: spacing.lg,
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
