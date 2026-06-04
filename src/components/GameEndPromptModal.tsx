import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';

interface Props {
  visible: boolean;
  targetRounds: number;
  onResult: () => void;
  onContinue: () => void;
}

export const GameEndPromptModal: React.FC<Props> = ({
  visible,
  targetRounds,
  onResult,
  onContinue,
}) => {
  const styles = useThemedStyles(makeStyles);

  const handleResult = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onResult();
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onContinue();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>🏁</Text>
          <Text style={styles.title}>OYUN BİTTİ</Text>
          <Text style={styles.message}>
            {targetRounds} tur tamamlandı. Devam etmek istiyor musunuz?
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => [
                styles.continueBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.continueText}>Devam Et</Text>
            </Pressable>
            <Pressable
              onPress={handleResult}
              style={({ pressed }) => [
                styles.resultBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.resultText}>Sonuç</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
      padding: spacing.xl,
      borderWidth: 2,
      borderColor: c.accent,
      alignItems: 'stretch',
    },
    icon: {
      fontSize: 48,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: c.accent,
      textAlign: 'center',
      letterSpacing: 1.5,
      marginBottom: spacing.sm,
    },
    message: {
      ...typography.body,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    continueBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    continueText: {
      ...typography.heading,
      color: c.textPrimary,
      letterSpacing: 0.5,
    },
    resultBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.buttonPrimary,
      alignItems: 'center',
    },
    resultText: {
      ...typography.heading,
      color: c.buttonPrimaryText,
      letterSpacing: 0.5,
    },
    pressed: { opacity: 0.7 },
  });
