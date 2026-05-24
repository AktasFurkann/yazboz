import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

export const BANNER_HEIGHT = 60;

export const BannerSlot: React.FC = () => {
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

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  sublabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    opacity: 0.7,
  },
});
