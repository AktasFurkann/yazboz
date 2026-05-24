import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '../theme';
import { Column, ColumnId, ColumnResult, Side } from '../types/game';

interface Props {
  index: ColumnId;
  column: Column;
  result: ColumnResult;
  name: string;
  isSelected: boolean;
  selectedSide: Side | null;
  topLocked?: boolean;
  multipliersByRound?: Record<number, number>;
  onSelect: (column: ColumnId, side: Side) => void;
  onEditName?: (column: ColumnId) => void;
  onPreviewStart?: (column: ColumnId, side: Side) => void;
  onPreviewEnd?: () => void;
}

const formatNumbersComma = (values: number[]): string =>
  values.length === 0 ? '–' : values.join(',');

const extractTopValues = (
  top: { value: number; round: number }[]
): number[] => top.map((t) => t.value);

const ColumnViewComponent: React.FC<Props> = ({
  index,
  column,
  result,
  name,
  isSelected,
  selectedSide,
  topLocked = false,
  multipliersByRound,
  onSelect,
  onEditName,
  onPreviewStart,
  onPreviewEnd,
}) => {
  const handlePress = (side: Side) => {
    Haptics.selectionAsync();
    onSelect(index, side);
  };

  const handleLongPress = (side: Side) => {
    const hasValues =
      side === 'top' ? column.top.length > 0 : column.bottom.length > 0;
    if (!hasValues) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPreviewStart?.(index, side);
  };

  const handleNameTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEditName?.(index);
  };

  const topActive = isSelected && selectedSide === 'top';
  const bottomActive = isSelected && selectedSide === 'bottom';

  const hasAnyNumbers = column.top.length > 0 || column.bottom.length > 0;

  return (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      <Pressable
        onPress={handleNameTap}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        hitSlop={4}
      >
        <Text
          style={styles.headerLabel}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handlePress('top')}
        onLongPress={() => handleLongPress('top')}
        onPressOut={() => onPreviewEnd?.()}
        delayLongPress={250}
        disabled={topLocked}
        style={[
          styles.cellTop,
          topActive && styles.cellActive,
          topLocked && styles.cellLocked,
        ]}
      >
        <Text style={styles.cellLabel}>
          ÜST · ×-10{topLocked ? ' · 🔒' : ''}
        </Text>
        <Text
          style={[
            styles.topValues,
            column.top.length === 0 && styles.empty,
            topLocked && styles.empty,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {formatNumbersComma(extractTopValues(column.top))}
        </Text>
      </Pressable>

      <View style={styles.line} />

      <Pressable
        onPress={() => handlePress('bottom')}
        onLongPress={() => handleLongPress('bottom')}
        onPressOut={() => onPreviewEnd?.()}
        delayLongPress={250}
        style={[styles.cellBottom, bottomActive && styles.cellActive]}
      >
        <Text style={styles.cellLabel}>ALT · +</Text>
        <View style={styles.bottomList}>
          {column.bottom.length === 0 ? (
            <Text style={[styles.bottomItem, styles.empty]}>–</Text>
          ) : (
            column.bottom.map((e, idx) => {
              if (e.marker === 'finished') {
                return <View key={idx} style={styles.finishedLine} />;
              }
              const mult = multipliersByRound?.[e.round] ?? 1;
              return (
                <Text key={idx} style={styles.bottomItem}>
                  {e.value * mult}
                </Text>
              );
            })
          )}
        </View>

        {hasAnyNumbers && (
          <View style={styles.netFooter}>
            <Text style={styles.netLabel}>NET</Text>
            <Text
              style={[
                styles.netValue,
                result.net < 0 && styles.netNegative,
                result.net > 0 && styles.netPositive,
              ]}
            >
              {result.net}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

const TOP_MIN_HEIGHT = 54;
const TOP_MAX_HEIGHT = 80;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.sm,
    marginHorizontal: 3,
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  containerSelected: {
    borderColor: colors.accent,
  },
  header: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: spacing.xs,
    minHeight: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  cellTop: {
    minHeight: TOP_MIN_HEIGHT,
    maxHeight: TOP_MAX_HEIGHT,
    backgroundColor: colors.negativeMuted + '40',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellBottom: {
    flex: 1,
    backgroundColor: colors.positiveMuted + '40',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  cellActive: {
    backgroundColor: colors.accent + '33',
  },
  cellLocked: {
    opacity: 0.4,
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  topValues: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  bottomList: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 2,
    overflow: 'hidden',
  },
  bottomItem: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    lineHeight: 24,
    textAlign: 'center',
  },
  empty: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  netFooter: {
    width: '100%',
    marginTop: spacing.xs,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  netLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  netValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  netNegative: { color: colors.negative },
  netPositive: { color: colors.positive },
  finishedLine: {
    width: '85%',
    height: 3,
    backgroundColor: colors.accent,
    marginVertical: 6,
    borderRadius: 2,
  },
  line: {
    height: 2,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
    borderRadius: 1,
  },
  pressed: { opacity: 0.6 },
});

export const ColumnView = memo(ColumnViewComponent);
