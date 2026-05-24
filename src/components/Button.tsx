import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  style?: ViewStyle;
  disabled?: boolean;
}

export const Button: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled,
}) => {
  const handle = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPress={handle}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, textStyles[variant], disabled && styles.textDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.buttonPrimary },
  secondary: {
    backgroundColor: colors.buttonSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: { backgroundColor: colors.buttonDanger },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  text: { ...typography.heading, letterSpacing: 0.5 },
  textDisabled: {},
});

const textStyles = StyleSheet.create({
  primary: { color: colors.buttonPrimaryText },
  secondary: { color: colors.buttonSecondaryText },
  danger: { color: '#fff' },
  ghost: { color: colors.textSecondary },
});
