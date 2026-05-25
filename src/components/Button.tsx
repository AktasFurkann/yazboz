import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';

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
  const styles = useThemedStyles(makeStyles);
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
      <Text style={[styles.text, styles[`${variant}Text` as const], disabled && styles.textDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    base: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: { backgroundColor: c.buttonPrimary },
    secondary: {
      backgroundColor: c.buttonSecondary,
      borderWidth: 1,
      borderColor: c.border,
    },
    danger: { backgroundColor: c.buttonDanger },
    ghost: { backgroundColor: 'transparent' },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.7 },
    text: { ...typography.heading, letterSpacing: 0.5 },
    textDisabled: {},
    primaryText: { color: c.buttonPrimaryText },
    secondaryText: { color: c.buttonSecondaryText },
    dangerText: { color: '#fff' },
    ghostText: { color: c.textSecondary },
  });
