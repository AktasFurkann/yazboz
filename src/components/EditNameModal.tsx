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
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
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
      maxWidth: 360,
      backgroundColor: c.surfaceElevated,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    title: {
      ...typography.heading,
      color: c.textPrimary,
      marginBottom: spacing.md,
    },
    input: {
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
