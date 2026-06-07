import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';
import { playSound } from '../utils/sounds';

interface Props {
  visible: boolean;
  loserName: string;
  loserNet: number;
  onDismiss: () => void;
}

export const LoserCelebrationModal: React.FC<Props> = ({
  visible,
  loserName,
  loserNet,
  onDismiss,
}) => {
  const styles = useThemedStyles(makeStyles);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      playSound('loss');
    }
  }, [visible]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.ribbon}>
            <Text style={styles.ribbonText}>KAYBEDEN</Text>
          </View>

          <Text style={styles.icon}>😅</Text>

          <Text style={styles.loserName} numberOfLines={2}>
            {loserName}
          </Text>

          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Toplam Skor</Text>
            <Text style={styles.scoreValue}>{loserNet}</Text>
          </View>

          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
          >
            <Text style={styles.btnText}>Geçmiş Olsun</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const RED = '#EF4444';

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: c.surfaceElevated,
      borderRadius: radius.lg,
      paddingTop: spacing.xxl,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      borderWidth: 3,
      borderColor: RED,
      alignItems: 'center',
      position: 'relative',
    },
    ribbon: {
      position: 'absolute',
      top: -16,
      backgroundColor: RED,
      paddingHorizontal: spacing.xl,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: c.surfaceElevated,
    },
    ribbonText: {
      fontSize: 14,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: 2.5,
    },
    icon: {
      fontSize: 72,
      marginVertical: spacing.sm,
    },
    loserName: {
      fontSize: 28,
      fontWeight: '900',
      color: c.textPrimary,
      textAlign: 'center',
      letterSpacing: 1,
      marginBottom: spacing.md,
    },
    scoreBox: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      marginBottom: spacing.lg,
      minWidth: 160,
    },
    scoreLabel: {
      ...typography.caption,
      color: c.textMuted,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    scoreValue: {
      fontSize: 32,
      fontWeight: '900',
      color: RED,
      fontVariant: ['tabular-nums'],
    },
    btn: {
      backgroundColor: c.buttonPrimary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      borderRadius: radius.md,
      width: '100%',
      alignItems: 'center',
    },
    btnText: {
      ...typography.heading,
      color: c.buttonPrimaryText,
      letterSpacing: 1.2,
    },
    pressed: { opacity: 0.7 },
  });
