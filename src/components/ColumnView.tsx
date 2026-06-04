import React, { memo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';
import { Column, ColumnId, ColumnResult, GameMode, Side } from '../types/game';

interface Props {
  index: ColumnId;
  column: Column;
  result: ColumnResult;
  name: string;
  isSelected: boolean;
  selectedSide: Side | null;
  topLocked?: boolean;
  maxRound?: number;
  multipliersByRound?: Record<number, number>;
  baseColorsByRound?: Record<number, number>;
  specialFinishes?: Record<number, boolean>;
  specialKafaVurma?: Record<number, boolean>;
  readOnly?: boolean;
  mode?: GameMode;
  onSelect: (column: ColumnId, side: Side) => void;
  onEditName?: (column: ColumnId) => void;
  onPreviewStart?: (column: ColumnId, side: Side) => void;
  onPreviewEnd?: () => void;
  onDragEnd?: (column: ColumnId, dx: number) => void;
}

const formatNumbersComma = (values: number[]): string =>
  values.length === 0 ? '–' : values.join(',');

const isColor = (v: number) => v >= 3 && v <= 6;

const formatTopDisplay = (
  top: { value: number; round: number }[],
  specialFinishes?: Record<number, boolean>
): string => {
  if (top.length === 0) return '–';
  return top
    .map((t) =>
      specialFinishes?.[t.round] && isColor(t.value) ? t.value * 100 : t.value
    )
    .join(',');
};

type BottomEntryWithMeta = {
  value: number;
  round: number;
  marker?: 'finished' | 'penalty' | 'not-opened';
};

const computeSlotMetrics = (
  maxRound: number
): { fontSize: number; lineHeight: number; minHeight: number } => {
  if (maxRound <= 4) return { fontSize: 22, lineHeight: 28, minHeight: 38 };
  if (maxRound <= 6) return { fontSize: 18, lineHeight: 22, minHeight: 30 };
  if (maxRound <= 9) return { fontSize: 15, lineHeight: 19, minHeight: 24 };
  if (maxRound <= 13) return { fontSize: 13, lineHeight: 16, minHeight: 20 };
  return { fontSize: 11, lineHeight: 14, minHeight: 17 };
};

const renderBottomByRound = (
  bottom: BottomEntryWithMeta[],
  maxRound: number,
  multipliersByRound: Record<number, number> | undefined,
  baseColorsByRound: Record<number, number> | undefined,
  styles: ReturnType<typeof makeStyles>,
  mode?: GameMode,
  specialFinishes?: Record<number, boolean>,
  specialKafaVurma?: Record<number, boolean>
) => {
  const metrics = computeSlotMetrics(maxRound);
  // Use the slot height as the line-height so every slot has identical
  // vertical footprint regardless of content (text vs finished line).
  const dynamicSlotStyle = { height: metrics.minHeight };
  const dynamicLineStyle = {
    fontSize: metrics.fontSize,
    lineHeight: metrics.minHeight,
  };
  const dynamicLineCompactStyle = {
    fontSize: Math.max(10, metrics.fontSize - 4),
    lineHeight: metrics.minHeight,
  };
  // Render one slot per round (1..maxRound) so all columns line up vertically.
  const slots: React.ReactNode[] = [];
  const is101 = mode === 'duz-101';
  for (let r = 1; r <= maxRound; r++) {
    const entries = bottom.filter((e) => e.round === r);
    const hasFinished = entries.some((e) => e.marker === 'finished');
    const isSpecial = specialFinishes?.[r] ?? false;

    let inner: React.ReactNode = null;

    if (is101) {
      const penaltyCount = entries.filter((e) => e.marker === 'penalty').length;
      const notOpenedCount = entries.filter((e) => e.marker === 'not-opened').length;
      const normalEntries = entries.filter((e) => !e.marker);
      const okeyle = specialFinishes?.[r] ?? false;
      const kafa = specialKafaVurma?.[r] ?? false;
      const mult = (okeyle ? 2 : 1) * (kafa ? 2 : 1);

      const parts: React.ReactNode[] = [];

      if (hasFinished) {
        const winVal = -101 * mult;
        parts.push(
          <Text key="w" style={styles.winValue101}>
            {winVal}
          </Text>
        );
      }
      if (notOpenedCount > 0) {
        const notOpenedTotal = 202 * mult * notOpenedCount;
        if (parts.length > 0) parts.push(<Text key="sep-no">{' + '}</Text>);
        parts.push(
          <Text key="no" style={styles.notOpenedInline}>
            {notOpenedTotal}
          </Text>
        );
      }
      if (penaltyCount > 0) {
        const penaltyTotal = 101 * penaltyCount;
        if (parts.length > 0) parts.push(<Text key="sep-p">{' + '}</Text>);
        parts.push(
          <Text key="p" style={styles.penaltyInline}>
            {penaltyTotal}
          </Text>
        );
      }
      normalEntries.forEach((e, i) => {
        if (parts.length > 0) {
          parts.push(<Text key={`sep-${i}`}>{' + '}</Text>);
        }
        parts.push(<Text key={`n-${i}`}>{e.value * mult}</Text>);
      });

      if (parts.length > 0) {
        const partCount = parts.filter((_, idx) => idx % 2 === 0).length;
        const lineStyle = [
          partCount >= 2 ? styles.bottomLineCompact : styles.bottomLine,
          partCount >= 2 ? dynamicLineCompactStyle : dynamicLineStyle,
        ];
        inner = (
          <Text style={lineStyle} numberOfLines={1}>
            {parts}
          </Text>
        );
      }
    } else if (hasFinished) {
      inner = <View style={styles.finishedLine} />;
    } else if (entries.length > 0) {
      const baseColor = baseColorsByRound?.[r] ?? 1;
      const mult = multipliersByRound?.[r] ?? 1;
      const penaltyCount = entries.filter((e) => e.marker === 'penalty').length;
      const normalEntries = entries.filter((e) => !e.marker);

      const parts: React.ReactNode[] = [];

      if (penaltyCount > 0) {
        const penaltyTotal = baseColor * 100 * penaltyCount;
        parts.push(
          <Text key="p" style={styles.penaltyInline}>
            {penaltyTotal}
          </Text>
        );
      }

      normalEntries.forEach((e, i) => {
        if (parts.length > 0) {
          parts.push(<Text key={`sep-${i}`}>{' + '}</Text>);
        }
        parts.push(<Text key={`n-${i}`}>{e.value * mult}</Text>);
      });

      const partCount = (penaltyCount > 0 ? 1 : 0) + normalEntries.length;
      const lineStyle = [
        partCount >= 2 ? styles.bottomLineCompact : styles.bottomLine,
        partCount >= 2 ? dynamicLineCompactStyle : dynamicLineStyle,
      ];

      inner = (
        <Text style={lineStyle} numberOfLines={1}>
          {parts}
        </Text>
      );
    }

    slots.push(
      <View key={r} style={[styles.roundSlot, dynamicSlotStyle]}>
        {inner}
      </View>
    );
  }
  return slots;
};

const ColumnViewComponent: React.FC<Props> = ({
  index,
  column,
  result,
  name,
  isSelected,
  selectedSide,
  topLocked = false,
  maxRound = 1,
  multipliersByRound,
  baseColorsByRound,
  specialFinishes,
  specialKafaVurma,
  readOnly = false,
  mode,
  onSelect,
  onEditName,
  onPreviewStart,
  onPreviewEnd,
  onDragEnd,
}) => {
  const styles = useThemedStyles(makeStyles);
  const translateX = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        !readOnly && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        setIsDragging(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, g) => {
        setIsDragging(false);
        onDragEnd?.(index, g.dx);
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          friction: 8,
        }).start();
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;
  const handlePress = (side: Side) => {
    if (readOnly) return;
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
    if (readOnly) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEditName?.(index);
  };

  const topActive = isSelected && selectedSide === 'top';
  const bottomActive = isSelected && selectedSide === 'bottom';

  const hasAnyNumbers = column.top.length > 0 || column.bottom.length > 0;

  return (
    <Animated.View
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        isDragging && styles.containerDragging,
        { transform: [{ translateX }] },
      ]}
    >
      <View {...panResponder.panHandlers}>
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
          {isDragging && (
            <Text style={styles.dragHint}>↔ sürükle</Text>
          )}
        </Pressable>
      </View>

      {mode !== 'duz-101' && (
        <>
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
            <Text
              style={[
                styles.topValues,
                column.top.length === 0 && styles.empty,
                topLocked && styles.empty,
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {formatTopDisplay(column.top, specialFinishes)}
            </Text>
          </Pressable>

          <View style={styles.line} />
        </>
      )}

      <Pressable
        onPress={() => handlePress('bottom')}
        onLongPress={() => handleLongPress('bottom')}
        onPressOut={() => onPreviewEnd?.()}
        delayLongPress={250}
        style={[styles.cellBottom, bottomActive && styles.cellActive]}
      >
        {column.bottom.length === 0 && maxRound <= 1 ? (
          <View style={styles.bottomList}>
            <Text style={[styles.bottomItem, styles.empty]}>–</Text>
          </View>
        ) : (
          <View style={styles.bottomList}>
            <ScrollView
              contentContainerStyle={styles.bottomListContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {renderBottomByRound(
                column.bottom,
                maxRound,
                multipliersByRound,
                baseColorsByRound,
                styles,
                mode,
                specialFinishes,
                specialKafaVurma
              )}
            </ScrollView>
          </View>
        )}

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
    </Animated.View>
  );
};

const TOP_MIN_HEIGHT = 54;
const TOP_MAX_HEIGHT = 80;

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: c.border,
      padding: spacing.sm,
      marginHorizontal: 3,
      overflow: 'hidden',
      justifyContent: 'flex-start',
    },
    containerSelected: {
      borderColor: c.accent,
    },
    containerDragging: {
      borderColor: c.accent,
      borderWidth: 2.5,
      shadowColor: c.accent,
      shadowOpacity: 0.5,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 10,
      zIndex: 100,
    },
    dragHint: {
      fontSize: 9,
      fontWeight: '700',
      color: c.accent,
      letterSpacing: 0.5,
      marginTop: 2,
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
      color: c.textSecondary,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    cellTop: {
      minHeight: TOP_MIN_HEIGHT,
      maxHeight: TOP_MAX_HEIGHT,
      backgroundColor: c.negativeMuted + '60',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cellBottom: {
      flex: 1,
      backgroundColor: c.positiveMuted + '60',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.sm,
      alignItems: 'center',
    },
    cellActive: {
      backgroundColor: c.accent + '33',
    },
    cellLocked: {
      opacity: 0.4,
    },
    topValues: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    bottomList: {
      flex: 1,
      width: '100%',
    },
    bottomListContent: {
      paddingVertical: 4,
      alignItems: 'center',
    },
    roundSlot: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomItem: {
      fontSize: 20,
      fontWeight: '700',
      color: c.textPrimary,
      fontVariant: ['tabular-nums'],
      lineHeight: 26,
      textAlign: 'center',
    },
    bottomLine: {
      textAlign: 'center',
      fontWeight: '700',
      color: c.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    bottomLineCompact: {
      textAlign: 'center',
      fontWeight: '700',
      color: c.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    bottomSep: {
      fontWeight: '600',
      color: c.textMuted,
    },
    penaltyInline: {
      fontWeight: '900',
      color: c.negative,
    },
    notOpenedInline: {
      fontWeight: '900',
      color: '#FBBF24',
    },
    winValue101: {
      fontWeight: '900',
      color: c.accent,
    },
    empty: {
      color: c.textMuted,
      fontWeight: '400',
    },
    netFooter: {
      width: '100%',
      marginTop: spacing.xs,
      paddingVertical: 4,
      borderTopWidth: 1,
      borderColor: c.divider,
      alignItems: 'center',
    },
    netLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 1,
    },
    netValue: {
      fontSize: 18,
      fontWeight: '800',
      color: c.textPrimary,
      fontVariant: ['tabular-nums'],
      marginTop: 1,
    },
    netNegative: { color: c.negative },
    netPositive: { color: c.positive },
    finishedLine: {
      width: '85%',
      height: 3,
      backgroundColor: c.accent,
      marginVertical: 6,
      borderRadius: 2,
    },
    line: {
      height: 2,
      backgroundColor: c.divider,
      marginVertical: spacing.xs,
      borderRadius: 1,
    },
    pressed: { opacity: 0.6 },
  });

export const ColumnView = memo(ColumnViewComponent);
