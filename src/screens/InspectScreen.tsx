import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ColumnView } from '../components/ColumnView';
import { BannerSlot } from '../components/BannerSlot';
import {
  computeBaseColorsByRound,
  computeKlasikOkeyDeductions,
  computeMultipliersByRound,
} from '../logic/calculator';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';
import {
  COLOR_BY_MULTIPLIER,
  ColumnId,
  MAX_PLAYERS_BY_MODE,
  MODE_LABEL,
  Side,
} from '../types/game';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Inspect'>;
type Rt = RouteProp<RootStackParamList, 'Inspect'>;

const computeMaxRound = (columns: { top: { round: number }[]; bottom: { round: number }[] }[]): number => {
  let max = 1;
  for (const col of columns) {
    for (const t of col.top) if (t.round > max) max = t.round;
    for (const b of col.bottom) if (b.round > max) max = b.round;
  }
  return max;
};

export const InspectScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const styles = useThemedStyles(makeStyles);

  const savedGame = route.params.savedGame;
  const {
    columns,
    result,
    mode,
    playerNames = ['Oyuncu 1', 'Oyuncu 2', 'Oyuncu 3', 'Oyuncu 4'],
    roundMultipliers = {},
    specialFinishes = {},
    specialKafaVurma = {},
    playMode = 'singles',
  } = savedGame;

  const visibleCount = MAX_PLAYERS_BY_MODE[playMode];
  const maxRound = useMemo(() => computeMaxRound(columns), [columns]);

  const multipliersByRound = useMemo(
    () => computeMultipliersByRound(columns, mode, roundMultipliers, specialFinishes),
    [columns, mode, roundMultipliers, specialFinishes]
  );

  const baseColorsByRound = useMemo(
    () => computeBaseColorsByRound(columns, mode, roundMultipliers),
    [columns, mode, roundMultipliers]
  );

  const colorInfo = COLOR_BY_MULTIPLIER[result.multiplier];
  const showColorBadge = mode === 'renkli-klasik' && colorInfo != null;

  const klasikDeductions = useMemo(
    () =>
      mode === 'klasik-okey'
        ? computeKlasikOkeyDeductions(columns, specialFinishes, specialKafaVurma)
        : {},
    [mode, columns, specialFinishes, specialKafaVurma]
  );

  const cellTopHeight = useMemo(() => {
    if (mode === 'duz-101' || mode === 'klasik-okey') return undefined;
    const maxTopLen = Math.max(0, ...columns.map((c) => c.top.length));
    if (maxTopLen === 0) return 54;
    return maxTopLen > 4 ? 80 : 54;
  }, [columns, mode]);

  const [preview, setPreview] = useState<{ column: ColumnId; side: Side } | null>(null);

  const handlePreviewStart = useCallback(
    (column: ColumnId, side: Side) => setPreview({ column, side }),
    []
  );
  const handlePreviewEnd = useCallback(() => setPreview(null), []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={12}
        >
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Geri</Text>
        </Pressable>
        <Text style={styles.title}>İncele</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.modeBar}>
        <Text style={styles.modeLabel}>MOD</Text>
        <Text style={styles.modeValue}>{MODE_LABEL[mode]}</Text>
        {showColorBadge && (
          <View
            style={[
              styles.colorBadge,
              {
                backgroundColor: colorInfo.hex + '33',
                borderColor: colorInfo.hex,
              },
            ]}
          >
            <View style={[styles.colorDot, { backgroundColor: colorInfo.hex }]} />
            <Text style={[styles.colorBadgeText, { color: colorInfo.hex }]}>
              {colorInfo.name} ×{colorInfo.multiplier}
            </Text>
          </View>
        )}
        <Text style={styles.roundCount}>{maxRound} tur</Text>
      </View>

      <View style={styles.columns}>
        {columns.slice(0, visibleCount).map((col, idx) => (
          <ColumnView
            key={idx}
            index={idx as ColumnId}
            column={col}
            result={result.columns[idx]}
            name={playerNames[idx] ?? `Oyuncu ${idx + 1}`}
            isSelected={false}
            selectedSide={null}
            multipliersByRound={multipliersByRound}
            baseColorsByRound={baseColorsByRound}
            specialFinishes={specialFinishes}
            specialKafaVurma={specialKafaVurma}
            klasikDeductions={klasikDeductions}
            maxRound={maxRound}
            readOnly
            mode={mode}
            cellTopHeight={cellTopHeight}
            onSelect={() => {}}
            onPreviewStart={handlePreviewStart}
            onPreviewEnd={handlePreviewEnd}
          />
        ))}
      </View>

      <View style={styles.readOnlyBar}>
        <Text style={styles.readOnlyText}>👁 Salt-okunur · Bu oyun değiştirilemez</Text>
      </View>

      <BannerSlot />

      {preview && (
        <View pointerEvents="none" style={styles.previewOverlay}>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>
              {playerNames[preview.column] ?? `Oyuncu ${preview.column + 1}`} ·{' '}
              {preview.side === 'top' ? 'ÜST' : 'ALT'}
            </Text>
            <Text style={styles.previewValues}>
              {preview.side === 'top'
                ? columns[preview.column].top.map((t) => t.value).join(', ')
                : columns[preview.column].bottom
                    .filter((e) => e.marker !== 'finished')
                    .map((e) => e.value * (multipliersByRound[e.round] ?? 1))
                    .join(', ')}
            </Text>
            <Text style={styles.previewCount}>
              {preview.side === 'top'
                ? columns[preview.column].top.length
                : columns[preview.column].bottom.length}{' '}
              değer
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderColor: c.border,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      minWidth: 80,
    },
    backIcon: {
      fontSize: 28,
      color: c.accent,
      marginRight: 4,
      lineHeight: 28,
    },
    backText: { ...typography.body, color: c.accent },
    title: { ...typography.heading, color: c.textPrimary },
    headerSpacer: { minWidth: 80 },
    pressed: { opacity: 0.6 },
    modeBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surface,
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      flexWrap: 'wrap',
    },
    modeLabel: { ...typography.caption, color: c.textMuted },
    modeValue: { ...typography.body, color: c.textPrimary, fontWeight: '700' },
    roundCount: {
      ...typography.caption,
      color: c.textSecondary,
      marginLeft: 'auto',
    },
    colorBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1,
      gap: 5,
    },
    colorDot: { width: 8, height: 8, borderRadius: 4 },
    colorBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    columns: {
      flex: 1,
      flexDirection: 'row',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    readOnlyBar: {
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderColor: c.border,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    readOnlyText: {
      ...typography.caption,
      color: c.textMuted,
      letterSpacing: 0.5,
    },
    previewOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    previewCard: {
      backgroundColor: c.surfaceElevated,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      minWidth: 200,
      maxWidth: '90%',
      borderWidth: 2,
      borderColor: c.accent,
      alignItems: 'center',
    },
    previewTitle: {
      ...typography.caption,
      color: c.accent,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    previewValues: {
      fontSize: 22,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
      lineHeight: 30,
    },
    previewCount: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: spacing.sm,
    },
  });
