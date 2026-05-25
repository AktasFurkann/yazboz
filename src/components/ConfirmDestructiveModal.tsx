import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDestructiveModal: React.FC<Props> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'İptal',
  onConfirm,
  onCancel,
}) => {
  const styles = useThemedStyles(makeStyles);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>⚠</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                styles.btnCancel,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.btnCancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.btn,
                styles.btnDanger,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.btnDangerText}>{confirmLabel}</Text>
            </Pressable>
          </View>
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
      maxWidth: 380,
      backgroundColor: c.surfaceElevated,
      borderRadius: radius.lg,
      padding: spacing.xl,
      borderWidth: 2,
      borderColor: c.negative,
      alignItems: 'center',
    },
    iconBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.negativeMuted,
      borderWidth: 2,
      borderColor: c.negative,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    iconText: {
      fontSize: 32,
      color: c.negative,
      fontWeight: '900',
    },
    title: {
      ...typography.title,
      color: c.negative,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: spacing.sm,
      letterSpacing: 0.5,
    },
    message: {
      ...typography.body,
      color: c.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      width: '100%',
    },
    btn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnCancel: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    btnCancelText: {
      ...typography.heading,
      color: c.textSecondary,
      fontWeight: '700',
    },
    btnDanger: {
      backgroundColor: c.negative,
    },
    btnDangerText: {
      ...typography.heading,
      color: '#FFFFFF',
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    pressed: { opacity: 0.7 },
  });
