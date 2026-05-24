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
  initialName: string;
  playerIndex: number;
  onCancel: () => void;
  onSave: (name: string) => void;
}

export const EditNameModal: React.FC<Props> = ({
  visible,
  initialName,
  playerIndex,
  onCancel,
  onSave,
}) => {
  const [value, setValue] = useState(initialName);

  useEffect(() => {
    if (visible) setValue(initialName);
  }, [visible, initialName]);

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
          <Text style={styles.title}>
            Oyuncu {playerIndex + 1} İsmi
          </Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={`Oyuncu ${playerIndex + 1}`}
            placeholderTextColor={colors.textMuted}
            maxLength={20}
            autoFocus
            selectTextOnFocus
            onSubmitEditing={() => onSave(value)}
          />
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
              onPress={() => onSave(value)}
              style={({ pressed }) => [
                styles.btn,
                styles.btnPrimary,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.btnTextPrimary}>Kaydet</Text>
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
    maxWidth: 360,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
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
