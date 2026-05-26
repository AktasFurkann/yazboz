import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';

interface Props {
  visible: boolean;
  initialNames: string[];
  count?: number;
  placeholderPrefix?: string;
  title?: string;
  ctaLabel?: string;
  onCancel: () => void;
  onConfirm: (names: string[]) => void;
}

export const NameSetupModal: React.FC<Props> = ({
  visible,
  initialNames,
  count,
  placeholderPrefix = 'Oyuncu',
  title = 'Oyuncu İsimleri',
  ctaLabel = 'Başlat',
  onCancel,
  onConfirm,
}) => {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const effectiveCount = count ?? initialNames.length;
  const buildInitial = () =>
    Array.from(
      { length: effectiveCount },
      (_, i) => initialNames[i] ?? ''
    );
  const [names, setNames] = useState<string[]>(buildInitial);

  useEffect(() => {
    if (visible) setNames(buildInitial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialNames, effectiveCount]);

  const updateAt = (idx: number, val: string) => {
    setNames((prev) => prev.map((n, i) => (i === idx ? val : n)));
  };

  const handleConfirm = () => {
    onConfirm(
      names.map((n, i) =>
        n.trim()
          ? n.trim()
          : initialNames[i] || `${placeholderPrefix} ${i + 1}`
      )
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            4 oyuncu için isim gir (boş bırakırsan varsayılan kullanılır)
          </Text>

          {names.map((name, idx) => (
            <View key={idx} style={styles.row}>
              <View style={styles.indexChip}>
                <Text style={styles.indexChipText}>{idx + 1}</Text>
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(v) => updateAt(idx, v)}
                placeholder={`${placeholderPrefix} ${idx + 1}`}
                placeholderTextColor={colors.textMuted}
                maxLength={20}
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          ))}

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                styles.btnSecondary,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.btnTextSecondary}>İptal</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.btn,
                styles.btnPrimary,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.btnTextPrimary}>{ctaLabel}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.caption,
      color: c.textMuted,
      marginBottom: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    indexChip: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: c.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    indexChipText: {
      fontSize: 14,
      fontWeight: '800',
      color: c.accent,
    },
    input: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: c.textPrimary,
      fontSize: 16,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    btn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    btnPrimary: { backgroundColor: c.buttonPrimary },
    btnSecondary: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    btnTextPrimary: {
      ...typography.heading,
      color: c.buttonPrimaryText,
      fontWeight: '700',
    },
    btnTextSecondary: {
      ...typography.heading,
      color: c.textSecondary,
    },
    pressed: { opacity: 0.7 },
  });
