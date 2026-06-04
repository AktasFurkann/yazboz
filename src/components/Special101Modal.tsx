import React, { useEffect, useState } from 'react';
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
  initialOkeyle?: boolean;
  initialKafaVurma?: boolean;
  onConfirm: (okeyle: boolean, kafaVurma: boolean) => void;
  onCancel: () => void;
}

export const Special101Modal: React.FC<Props> = ({
  visible,
  initialOkeyle = false,
  initialKafaVurma = false,
  onConfirm,
  onCancel,
}) => {
  const styles = useThemedStyles(makeStyles);
  const [okeyle, setOkeyle] = useState(initialOkeyle);
  const [kafa, setKafa] = useState(initialKafaVurma);

  useEffect(() => {
    if (visible) {
      setOkeyle(initialOkeyle);
      setKafa(initialKafaVurma);
    }
  }, [visible, initialOkeyle, initialKafaVurma]);

  const toggleOkeyle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOkeyle((v) => !v);
  };

  const toggleKafa = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setKafa((v) => !v);
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(okeyle, kafa);
  };

  const mult = (okeyle ? 2 : 1) * (kafa ? 2 : 1);
  const winValue = -101 * mult;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>⭐ Özel Bitiş</Text>
          <Text style={styles.subtitle}>
            Birini veya ikisini birden seç
          </Text>

          <View style={styles.optionRow}>
            <Pressable
              onPress={toggleOkeyle}
              style={({ pressed }) => [
                styles.option,
                styles.optionOkeyle,
                okeyle && styles.optionOkeyleActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.radio, okeyle && styles.radioOkeyleActive]}>
                {okeyle && <View style={styles.radioInnerOkeyle} />}
              </View>
              <Text style={styles.optionTitle}>Okeyle / Çiftle</Text>
              <Text style={styles.optionSub}>×2</Text>
            </Pressable>

            <Pressable
              onPress={toggleKafa}
              style={({ pressed }) => [
                styles.option,
                styles.optionKafa,
                kafa && styles.optionKafaActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.radio, kafa && styles.radioKafaActive]}>
                {kafa && <View style={styles.radioInnerKafa} />}
              </View>
              <Text style={styles.optionTitle}>Açarak (kafa vurma)</Text>
              <Text style={styles.optionSub}>×2</Text>
            </Pressable>
          </View>

          <View style={styles.previewBar}>
            <Text style={styles.previewLabel}>Toplam Çarpan</Text>
            <Text style={styles.previewMult}>×{mult}</Text>
            <Text style={styles.previewWin}>
              Biten: <Text style={styles.previewWinValue}>{winValue}</Text>
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.cancelText}>İptal</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.confirmText}>ONAYLA</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const YELLOW = '#FBBF24';
const ORANGE = '#FB923C';

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
      maxWidth: 460,
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
      marginBottom: 2,
    },
    subtitle: {
      ...typography.caption,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    optionRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    option: {
      flex: 1,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      gap: 6,
    },
    optionOkeyle: {},
    optionOkeyleActive: {
      backgroundColor: YELLOW + '22',
      borderColor: YELLOW,
    },
    optionKafa: {},
    optionKafaActive: {
      backgroundColor: ORANGE + '22',
      borderColor: ORANGE,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    radioOkeyleActive: {
      borderColor: YELLOW,
    },
    radioInnerOkeyle: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: YELLOW,
    },
    radioKafaActive: {
      borderColor: ORANGE,
    },
    radioInnerKafa: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: ORANGE,
    },
    optionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: c.textPrimary,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    optionSub: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 0.5,
    },
    previewBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    previewLabel: {
      ...typography.caption,
      color: c.textMuted,
    },
    previewMult: {
      fontSize: 18,
      fontWeight: '900',
      color: c.accent,
      letterSpacing: 1,
    },
    previewWin: {
      ...typography.caption,
      color: c.textSecondary,
    },
    previewWinValue: {
      fontWeight: '900',
      color: c.negative,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    cancelText: {
      ...typography.body,
      color: c.textSecondary,
      fontWeight: '700',
    },
    confirmBtn: {
      flex: 2,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.buttonPrimary,
      alignItems: 'center',
    },
    confirmText: {
      ...typography.heading,
      color: c.buttonPrimaryText,
      letterSpacing: 1,
    },
    pressed: { opacity: 0.7 },
  });
