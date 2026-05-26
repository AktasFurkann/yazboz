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
import { PlayMode } from '../types/game';

interface Props {
  visible: boolean;
  title?: string;
  onSelect: (mode: PlayMode) => void;
  onCancel: () => void;
}

export const PlayModeSelectionModal: React.FC<Props> = ({
  visible,
  title = 'Nasıl oynayacaksınız?',
  onSelect,
  onCancel,
}) => {
  const styles = useThemedStyles(makeStyles);

  const pick = (mode: PlayMode) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect(mode);
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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Oyun türünü seç (sonra değiştirilebilir)
          </Text>

          <View style={styles.grid}>
            <Pressable
              onPress={() => pick('singles')}
              style={({ pressed }) => [
                styles.choiceBtn,
                styles.choiceSingles,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.choiceIcon}>👤</Text>
              <Text style={styles.choiceTitle}>TEK</Text>
              <Text style={styles.choiceSub}>4 oyuncu</Text>
            </Pressable>

            <Pressable
              onPress={() => pick('pairs')}
              style={({ pressed }) => [
                styles.choiceBtn,
                styles.choicePairs,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.choiceIcon}>👥</Text>
              <Text style={styles.choiceTitle}>EŞLİ</Text>
              <Text style={styles.choiceSub}>2 takım</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
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
    grid: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    choiceBtn: {
      flex: 1,
      paddingVertical: spacing.xl,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    choiceSingles: {
      backgroundColor: c.accentMuted,
      borderColor: c.accent,
    },
    choicePairs: {
      backgroundColor: '#FBBF2422',
      borderColor: '#FBBF24',
    },
    choiceIcon: {
      fontSize: 48,
      lineHeight: 56,
    },
    choiceTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: c.textPrimary,
      letterSpacing: 2,
      marginTop: 4,
    },
    choiceSub: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
      marginTop: 2,
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
