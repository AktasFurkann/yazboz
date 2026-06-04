import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';

interface PlayerScore {
  name: string;
  net: number;
}

interface Props {
  visible: boolean;
  targetRounds: number;
  players: PlayerScore[];
  onDismiss: () => void;
}

const VIBRATION_PATTERN = [0, 300, 150, 300, 150, 500];

export const LastRoundAlertModal: React.FC<Props> = ({
  visible,
  targetRounds,
  players,
  onDismiss,
}) => {
  const styles = useThemedStyles(makeStyles);

  useEffect(() => {
    if (!visible) return;
    Vibration.vibrate(VIBRATION_PATTERN);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    return () => {
      Vibration.cancel();
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.icon}>🔔</Text>
          <Text style={styles.title}>SON TURA GİRİYORSUNUZ!</Text>
          <Text style={styles.subtitle}>
            {targetRounds}. tur · son skorlar
          </Text>

          <View style={styles.list}>
            {[...players]
              .sort((a, b) => b.net - a.net)
              .map((p, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text
                    style={[
                      styles.score,
                      p.net < 0 && styles.scoreNegative,
                      p.net > 0 && styles.scorePositive,
                    ]}
                  >
                    {p.net}
                  </Text>
                </View>
              ))}
          </View>

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.okBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.okText}>TAMAM</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

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
      padding: spacing.xl,
      borderWidth: 3,
      borderColor: '#FBBF24',
      alignItems: 'stretch',
    },
    icon: {
      fontSize: 56,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 20,
      fontWeight: '900',
      color: '#FBBF24',
      textAlign: 'center',
      letterSpacing: 1.2,
      marginBottom: 4,
    },
    subtitle: {
      ...typography.caption,
      color: c.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      letterSpacing: 0.5,
    },
    list: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    name: {
      ...typography.body,
      color: c.textPrimary,
      fontWeight: '700',
      flex: 1,
      paddingRight: spacing.md,
    },
    score: {
      ...typography.numberLarge,
      color: c.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    scoreNegative: { color: c.negative },
    scorePositive: { color: c.positive },
    okBtn: {
      paddingVertical: spacing.lg,
      backgroundColor: '#FBBF24',
      borderRadius: radius.md,
      alignItems: 'center',
    },
    okText: {
      fontSize: 16,
      fontWeight: '900',
      color: '#1A1A1A',
      letterSpacing: 1.5,
    },
    pressed: { opacity: 0.7 },
  });
