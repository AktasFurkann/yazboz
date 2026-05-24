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
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  visible: boolean;
  initialNames: string[];
  title?: string;
  ctaLabel?: string;
  onCancel: () => void;
  onConfirm: (names: string[]) => void;
}

export const NameSetupModal: React.FC<Props> = ({
  visible,
  initialNames,
  title = 'Oyuncu İsimleri',
  ctaLabel = 'Başlat',
  onCancel,
  onConfirm,
}) => {
  const [names, setNames] = useState<string[]>(initialNames);

  useEffect(() => {
    if (visible) setNames(initialNames);
  }, [visible, initialNames]);

  const updateAt = (idx: number, val: string) => {
    setNames((prev) => prev.map((n, i) => (i === idx ? val : n)));
  };

  const handleConfirm = () => {
    onConfirm(
      names.map((n, i) =>
        n.trim() ? n.trim() : initialNames[i] || `Oyuncu ${i + 1}`
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
                placeholder={`Oyuncu ${idx + 1}`}
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
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
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.accent,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
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
  btnPrimary: { backgroundColor: colors.buttonPrimary },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnTextPrimary: {
    ...typography.heading,
    color: colors.buttonPrimaryText,
    fontWeight: '700',
  },
  btnTextSecondary: {
    ...typography.heading,
    color: colors.textSecondary,
  },
  pressed: { opacity: 0.7 },
});
