import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';

export const BANNER_HEIGHT = 60;

export const BannerSlot: React.FC = () => {
  const styles = useThemedStyles(makeStyles);
  if (__DEV__) {
    return (
      <View style={styles.container} accessible accessibilityLabel="Reklam alanı">
        <Text style={styles.label}>REKLAM ALANI</Text>
        <Text style={styles.sublabel}>(yayın sonrası gerçek reklam)</Text>
      </View>
    );
  }
  return <View style={styles.container} />;
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      height: BANNER_HEIGHT,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    label: {
      ...typography.caption,
      color: c.textMuted,
      letterSpacing: 1.5,
    },
    sublabel: {
      fontSize: 10,
      color: c.textMuted,
      marginTop: 2,
      opacity: 0.7,
    },
  });
