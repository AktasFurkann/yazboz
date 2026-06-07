import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';

interface Props {
  visible: boolean;
  title?: string;
  onSelect: (startValue: number) => void;
  onCancel: () => void;
}

export const StartValueSelectionModal: React.FC<Props> = ({
  visible,
  title = 'Kaç sayıdan düşülsün?',
  onSelect,
  onCancel,
}) => {
  const styles = useThemedStyles(makeStyles);
  const [customValue, setCustomValue] = useState('');
  const [focused, setFocused] = useState(false);

  React.useEffect(() => {
    if (!visible) {
      setCustomValue('');
      setFocused(false);
    }
  }, [visible]);

  const pick = (n: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect(n);
  };

  const confirmCustom = () => {
    const n = parseInt(customValue, 10);
    if (Number.isNaN(n) || n < 1) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect(n);
  };

  const customParsed = parseInt(customValue, 10);
  const customValid = !Number.isNaN(customParsed) && customParsed >= 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            0 veya altına düşen kaybeder
          </Text>

          <View style={styles.classicRow}>
            <Pressable
              onPress={() => pick(10)}
              style={({ pressed }) => [
                styles.classicBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.classicNumber}>10</Text>
              <Text style={styles.classicSub}>Klasik</Text>
            </Pressable>
            <Pressable
              onPress={() => pick(20)}
              style={({ pressed }) => [
                styles.classicBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.classicNumber}>20</Text>
              <Text style={styles.classicSub}>Klasik</Text>
            </Pressable>
          </View>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>VEYA ÖZEL</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.customRow}>
            <TextInput
              value={customValue}
              onChangeText={(t) => setCustomValue(t.replace(/[^0-9]/g, ''))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="örn. 15"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={3}
              style={[styles.input, focused && styles.inputFocused]}
            />
            <Pressable
              onPress={confirmCustom}
              disabled={!customValid}
              style={({ pressed }) => [
                styles.confirmBtn,
                !customValid && styles.confirmDisabled,
                pressed && customValid && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.confirmText,
                  !customValid && styles.confirmTextDisabled,
                ]}
              >
                Başla
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cancelText}>İptal</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
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
      backgroundColor: c.surfaceElevated,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    title: {
      ...typography.heading,
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: 4,
    },
    subtitle: {
      ...typography.caption,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    classicRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    classicBtn: {
      flex: 1,
      paddingVertical: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: c.accentMuted,
      borderWidth: 2,
      borderColor: c.accent,
      alignItems: 'center',
    },
    classicNumber: {
      fontSize: 34,
      fontWeight: '900',
      color: c.textPrimary,
      letterSpacing: 1,
    },
    classicSub: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
      marginTop: 2,
    },
    orRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    orLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.border,
    },
    orText: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textMuted,
      letterSpacing: 1.5,
    },
    customRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    input: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: c.border,
      fontSize: 22,
      fontWeight: '800',
      color: c.textPrimary,
      textAlign: 'center',
      letterSpacing: 1,
    },
    inputFocused: {
      borderColor: c.accent,
    },
    confirmBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: c.buttonPrimary,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 90,
    },
    confirmDisabled: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    confirmText: {
      ...typography.heading,
      color: c.buttonPrimaryText,
    },
    confirmTextDisabled: {
      color: c.textMuted,
    },
    cancelBtn: {
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    cancelText: {
      ...typography.body,
      color: c.textSecondary,
    },
    pressed: { opacity: 0.7 },
  });
