import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { BannerSlot } from '../components/BannerSlot';
import { LoserCelebrationModal } from '../components/LoserCelebrationModal';
import { useGameContext } from '../contexts/GameContext';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';
import { saveGame } from '../storage/gameHistory';
import {
  COLOR_BY_MULTIPLIER,
  MAX_PLAYERS_BY_MODE,
  MODE_LABEL,
  SavedGame,
} from '../types/game';
import {
  buildRoundSummaries,
  computeBaseColorsByRound,
  computeMultipliersByRound,
} from '../logic/calculator';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Result'>;
type Rt = RouteProp<RootStackParamList, 'Result'>;

const formatTopList = (entries: { value: number; round: number }[]): string =>
  entries.length === 0 ? '–' : entries.map((t) => t.value).join(', ');

export const ResultScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const {
    columns: ctxColumns,
    result: ctxResult,
    mode: ctxMode,
    playMode: ctxPlayMode,
    playerNames: ctxPlayerNames,
    roundMultipliers: ctxRoundMultipliers,
    specialFinishes: ctxSpecialFinishes,
    specialKafaVurma: ctxSpecialKafaVurma,
    targetRounds: ctxTargetRounds,
    startValue: ctxStartValue,
    resetAll,
  } = useGameContext();

  const savedGame = route.params?.savedGame;
  const isHistorical = savedGame != null;

  const columns = isHistorical ? savedGame.columns : ctxColumns;
  const result = isHistorical ? savedGame.result : ctxResult;
  const mode = isHistorical ? savedGame.mode : ctxMode;
  const playerNames =
    (isHistorical ? savedGame.playerNames : ctxPlayerNames) ?? [
      'Oyuncu 1',
      'Oyuncu 2',
      'Oyuncu 3',
      'Oyuncu 4',
    ];
  const roundMultipliers =
    (isHistorical ? savedGame.roundMultipliers : ctxRoundMultipliers) ?? {};
  const specialFinishes =
    (isHistorical ? savedGame.specialFinishes : ctxSpecialFinishes) ?? {};
  const specialKafaVurma =
    (isHistorical ? savedGame.specialKafaVurma : ctxSpecialKafaVurma) ?? {};
  const playMode = (isHistorical ? savedGame.playMode : ctxPlayMode) ?? 'singles';
  const visibleCount = MAX_PLAYERS_BY_MODE[playMode];
  const is101 = mode === 'duz-101';
  const isKlasik = mode === 'klasik-okey';
  const noTop = is101 || isKlasik;

  const styles = useThemedStyles(makeStyles);
  const title = isHistorical ? 'Geçmiş Oyun' : 'Sonuç';
  const colorInfo = COLOR_BY_MULTIPLIER[result.multiplier];

  const losers = useMemo(() => {
    const count = Math.min(result.columns.length, MAX_PLAYERS_BY_MODE[playMode]);
    const nets = Array.from({ length: count }, (_, i) => ({
      idx: i,
      net: result.columns[i]?.net ?? 0,
    }));
    if (nets.length === 0) return [] as { idx: number; net: number }[];

    if (isKlasik) {
      // Anyone at 0 or below has lost; if multiple, list them all.
      const fallen = nets.filter((n) => n.net <= 0);
      if (fallen.length > 0) return fallen;
      // No one fell yet — show the player closest to losing (lowest remaining).
      const min = Math.min(...nets.map((n) => n.net));
      return nets.filter((n) => n.net === min);
    }

    // Other modes: highest score loses (ties → all of them).
    const max = Math.max(...nets.map((n) => n.net));
    return nets.filter((n) => n.net === max);
  }, [result.columns, playMode, isKlasik]);

  const loserEntries = useMemo(
    () =>
      losers.map((l) => ({
        name: playerNames[l.idx] ?? `Oyuncu ${l.idx + 1}`,
        net: l.net,
      })),
    [losers, playerNames]
  );

  const [loserModalVisible, setLoserModalVisible] = useState(!isHistorical);
  const dismissLoserModal = useCallback(() => setLoserModalVisible(false), []);

  const baseColorsByRound = useMemo(
    () => computeBaseColorsByRound(columns, mode, roundMultipliers),
    [columns, mode, roundMultipliers]
  );
  const multByRound = useMemo(
    () =>
      computeMultipliersByRound(
        columns,
        mode,
        roundMultipliers,
        specialFinishes
      ),
    [columns, mode, roundMultipliers, specialFinishes]
  );

  // Penalty entries are stored as value:0; their real cost is floorColor×100.
  // Render the per-round bottom contributions, penalties shown in red.
  const renderBottomForRound = useCallback(
    (col: (typeof columns)[number], round: number): React.ReactNode => {
      const entries = col.bottom.filter((e) => e.round === round);
      if (entries.some((e) => e.marker === 'finished')) {
        const tops = col.top.filter((t) => t.round === round);
        return tops.length > 0
          ? `bitti · üst ${tops.map((t) => t.value).join(',')}`
          : 'bitti';
      }
      const baseColor = baseColorsByRound[round] ?? 1;
      const mult = multByRound[round] ?? 1;
      const penaltyCount = entries.filter((e) => e.marker === 'penalty').length;
      const normals = entries.filter((e) => !e.marker);
      const nodes: React.ReactNode[] = [];
      if (penaltyCount > 0) {
        nodes.push(
          <Text key="p" style={styles.penaltyValue}>
            {baseColor * 100 * penaltyCount}
          </Text>
        );
      }
      normals.forEach((e, i) => {
        if (nodes.length > 0) nodes.push(<Text key={`s${i}`}> + </Text>);
        nodes.push(<Text key={`n${i}`}>{e.value * mult}</Text>);
      });
      return nodes.length > 0 ? nodes : '–';
    },
    [baseColorsByRound, multByRound, styles.penaltyValue]
  );

  // Penalty-aware list of all bottom values across rounds, penalties in red.
  const renderAlt = useCallback(
    (col: (typeof columns)[number]): React.ReactNode => {
      const rounds = Array.from(
        new Set(col.bottom.map((e) => e.round))
      ).sort((a, b) => a - b);
      const nodes: React.ReactNode[] = [];
      for (const r of rounds) {
        const entries = col.bottom.filter((e) => e.round === r);
        if (entries.some((e) => e.marker === 'finished')) continue;
        const baseColor = baseColorsByRound[r] ?? 1;
        const mult = multByRound[r] ?? 1;
        const penaltyCount = entries.filter(
          (e) => e.marker === 'penalty'
        ).length;
        if (penaltyCount > 0) {
          if (nodes.length > 0) nodes.push(<Text key={`as${r}`}>, </Text>);
          nodes.push(
            <Text key={`ap${r}`} style={styles.penaltyValue}>
              {penaltyCount * baseColor * 100}
            </Text>
          );
        }
        entries
          .filter((e) => !e.marker)
          .forEach((e, i) => {
            if (nodes.length > 0) nodes.push(<Text key={`asn${r}-${i}`}>, </Text>);
            nodes.push(<Text key={`an${r}-${i}`}>{e.value * mult}</Text>);
          });
      }
      return nodes.length > 0 ? nodes : '–';
    },
    [baseColorsByRound, multByRound, styles.penaltyValue]
  );

  // Full bottom contribution (penalty-aware) summed across all rounds.
  const bottomTotal = useCallback(
    (col: (typeof columns)[number]): number => {
      const rounds = Array.from(
        new Set(col.bottom.map((e) => e.round))
      );
      let total = 0;
      for (const r of rounds) {
        const entries = col.bottom.filter((e) => e.round === r);
        if (entries.some((e) => e.marker === 'finished')) continue;
        const baseColor = baseColorsByRound[r] ?? 1;
        const mult = multByRound[r] ?? 1;
        const penaltyCount = entries.filter(
          (e) => e.marker === 'penalty'
        ).length;
        total += penaltyCount * baseColor * 100;
        entries
          .filter((e) => !e.marker)
          .forEach((e) => (total += e.value * mult));
      }
      return total;
    },
    [baseColorsByRound, multByRound]
  );

  const roundSummaries = useMemo(
    () => buildRoundSummaries(columns, playerNames, mode, roundMultipliers),
    [columns, playerNames, mode, roundMultipliers]
  );

  useFocusEffect(
    useCallback(() => {
      if (isHistorical) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        return true;
      });
      return () => sub.remove();
    }, [isHistorical])
  );

  const handleNewGame = useCallback(async () => {
    if (isHistorical) {
      navigation.goBack();
      return;
    }
    const game: SavedGame = {
      id: `${Date.now()}`,
      createdAt: Date.now(),
      columns,
      mode,
      playMode,
      result,
      playerNames,
      roundMultipliers,
      specialFinishes,
      specialKafaVurma: ctxSpecialKafaVurma,
      targetRounds: ctxTargetRounds,
      startValue: ctxStartValue,
    };
    await saveGame(game);
    resetAll();
    navigation.popTo('Game');
  }, [
    isHistorical,
    columns,
    mode,
    playMode,
    result,
    playerNames,
    roundMultipliers,
    specialFinishes,
    ctxSpecialKafaVurma,
    ctxTargetRounds,
    ctxStartValue,
    resetAll,
    navigation,
  ]);

  const handleBack = useCallback(() => {
    if (isHistorical) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Kaydetmeden geri dön',
      'Oyunu düzenlemeye devam edebilirsin. Geçmişe eklenmeyecek.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Geri Dön', onPress: () => navigation.goBack() },
      ]
    );
  }, [isHistorical, navigation]);

  const roundCards = useMemo(
    () =>
      roundSummaries.map((rs) => {
        const isSpecial = specialFinishes[rs.round] ?? false;
        const isKafa = specialKafaVurma[rs.round] ?? false;
        const mult101 = (isSpecial ? 2 : 1) * (isKafa ? 2 : 1);
        return (
        <View key={rs.round} style={styles.roundCard}>
          <View style={styles.roundHeader}>
            <View style={styles.roundTitleRow}>
              <Text style={styles.roundTitle}>{rs.round}. Tur</Text>
              {noTop && mult101 > 1 && (
                <View style={styles.specialBadge}>
                  <Text style={styles.specialBadgeText}>×{mult101}</Text>
                </View>
              )}
              {!noTop && isSpecial && (
                <View style={styles.specialBadge}>
                  <Text style={styles.specialBadgeText}>⭐ ÖZEL</Text>
                </View>
              )}
            </View>
            {!noTop && rs.colorHex && rs.colorName && (
              <View
                style={[
                  styles.colorBadge,
                  {
                    backgroundColor: rs.colorHex + '33',
                    borderColor: rs.colorHex,
                  },
                ]}
              >
                <View
                  style={[styles.colorDot, { backgroundColor: rs.colorHex }]}
                />
                <Text style={[styles.colorBadgeText, { color: rs.colorHex }]}>
                  {rs.colorName} ×{rs.multiplier}
                  {isSpecial ? ' (2x)' : ''}
                </Text>
              </View>
            )}
          </View>

          {isKlasik
            ? (() => {
                const hasWinner = columns
                  .slice(0, visibleCount)
                  .some((col) =>
                    col.bottom.some(
                      (e) => e.round === rs.round && e.marker === 'finished'
                    )
                  );
                if (!hasWinner) return null;
                return columns.slice(0, visibleCount).map((col, idx) => {
                  const winner = col.bottom.some(
                    (e) => e.round === rs.round && e.marker === 'finished'
                  );
                  return (
                    <View key={idx} style={styles.playerRow}>
                      <Text
                        style={[
                          styles.playerName,
                          winner && styles.playerNameWinner,
                        ]}
                        numberOfLines={1}
                      >
                        {playerNames[idx]}
                      </Text>
                      <Text
                        style={[
                          styles.playerValue,
                          winner && styles.playerValueWinner,
                        ]}
                      >
                        {winner ? 'BİTTİ' : `-${mult101}`}
                      </Text>
                    </View>
                  );
                });
              })()
            : is101
            ? columns.slice(0, visibleCount).map((col, idx) => {
                const entries = col.bottom.filter((e) => e.round === rs.round);
                if (entries.length === 0) return null;
                const winner = entries.some((e) => e.marker === 'finished');
                const notOpenedCount = entries.filter(
                  (e) => e.marker === 'not-opened'
                ).length;
                const penaltyCount = entries.filter(
                  (e) => e.marker === 'penalty'
                ).length;
                const normals = entries.filter((e) => !e.marker);
                const parts: string[] = [];
                if (winner) parts.push(`${-101 * mult101}`);
                if (notOpenedCount > 0)
                  parts.push(`+${202 * mult101 * notOpenedCount}`);
                normals.forEach((n) => parts.push(`+${n.value * mult101}`));
                if (penaltyCount > 0)
                  parts.push(`+${101 * penaltyCount} ceza`);
                return (
                  <View key={idx} style={styles.playerRow}>
                    <Text
                      style={[
                        styles.playerName,
                        winner && styles.playerNameWinner,
                      ]}
                      numberOfLines={1}
                    >
                      {playerNames[idx]}
                    </Text>
                    <Text
                      style={[
                        styles.playerValue,
                        winner && styles.playerValueWinner,
                      ]}
                    >
                      {parts.join(' ')}
                    </Text>
                  </View>
                );
              })
            : rs.players.slice(0, visibleCount).map((p) => {
                const col = columns[p.column];
                const entriesInRound = col.bottom.filter(
                  (e) => e.round === rs.round
                );
                const topsInRound = col.top.filter(
                  (t) => t.round === rs.round
                );
                const hasData =
                  p.isWinner ||
                  topsInRound.length > 0 ||
                  entriesInRound.length > 0;
                if (!hasData) return null;
                return (
                  <View key={p.column} style={styles.playerRow}>
                    <Text
                      style={[
                        styles.playerName,
                        p.isWinner && styles.playerNameWinner,
                      ]}
                      numberOfLines={1}
                    >
                      {p.isWinner ? '✓ ' : ''}
                      {p.playerName}
                    </Text>
                    <Text
                      style={[
                        styles.playerValue,
                        p.isWinner && styles.playerValueWinner,
                      ]}
                    >
                      {renderBottomForRound(col, rs.round)}
                    </Text>
                  </View>
                );
              })}
        </View>
        );
      }),
    [
      roundSummaries,
      specialFinishes,
      specialKafaVurma,
      visibleCount,
      is101,
      isKlasik,
      noTop,
      columns,
      playerNames,
      renderBottomForRound,
    ]
  );

  const cards = useMemo(
    () =>
      columns.slice(0, visibleCount).map((col, idx) => {
        const r = result.columns[idx];
        return (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{playerNames[idx]}</Text>
              <Text
                style={[
                  styles.cardNet,
                  isKlasik
                    ? r.net <= 0 && styles.negative
                    : r.net < 0 && styles.negative,
                  !isKlasik && r.net > 0 && styles.positive,
                ]}
              >
                {r.net}
              </Text>
            </View>

            {!noTop && (
              <>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Üst</Text>
                  <Text style={styles.rowValue}>{formatTopList(col.top)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Alt</Text>
                  <Text style={styles.rowValue}>{renderAlt(col)}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Üst toplam</Text>
                  <Text style={styles.rowValue}>{r.topSum}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Alt toplam</Text>
                  <Text style={styles.rowValue}>{bottomTotal(col)}</Text>
                </View>
              </>
            )}
          </View>
        );
      }),
    [
      columns,
      result,
      playerNames,
      visibleCount,
      noTop,
      isKlasik,
      renderAlt,
      bottomTotal,
    ]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Geri</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.modeBar}>
          <Text style={styles.modeLabel}>MOD</Text>
          <Text style={styles.modeValue}>{MODE_LABEL[mode]}</Text>
          {mode === 'renkli-klasik' && colorInfo && (
            <View
              style={[
                styles.colorBadge,
                { backgroundColor: colorInfo.hex + '33', borderColor: colorInfo.hex },
              ]}
            >
              <View
                style={[styles.colorDot, { backgroundColor: colorInfo.hex }]}
              />
              <Text style={[styles.colorBadgeText, { color: colorInfo.hex }]}>
                {colorInfo.name} ×{colorInfo.multiplier}
              </Text>
            </View>
          )}
          {mode === 'renkli-klasik' && !colorInfo && (
            <Text style={styles.modeHint}>renk belirlenmedi (×1)</Text>
          )}
        </View>

        {roundSummaries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tur Detayları</Text>
            {roundCards}
          </>
        )}

        <Text style={styles.sectionTitle}>Oyuncu Toplamları</Text>
        {cards}
      </ScrollView>

      <View style={styles.actions}>
        {isHistorical && savedGame ? (
          <>
            <Button
              label="Kapat"
              onPress={handleNewGame}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <Button
              label="İncele"
              onPress={() => navigation.navigate('Inspect', { savedGame })}
              variant="primary"
              style={{ flex: 1 }}
            />
          </>
        ) : (
          <Button
            label="Yeni Oyun"
            onPress={handleNewGame}
            variant="primary"
            style={{ flex: 1 }}
          />
        )}
      </View>

      <BannerSlot />

      <LoserCelebrationModal
        visible={loserModalVisible}
        losers={loserEntries}
        showScore={!isKlasik}
        onDismiss={dismissLoserModal}
      />
    </SafeAreaView>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
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
  backText: {
    ...typography.body,
    color: c.accent,
  },
  headerTitle: {
    ...typography.heading,
    color: c.textPrimary,
  },
  headerSpacer: {
    minWidth: 80,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    flexWrap: 'wrap',
  },
  modeLabel: {
    ...typography.caption,
    color: c.textMuted,
  },
  modeValue: {
    ...typography.heading,
    color: c.textPrimary,
  },
  modeHint: {
    ...typography.caption,
    color: c.textMuted,
    fontStyle: 'italic',
  },
  sectionTitle: {
    ...typography.heading,
    color: c.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  roundCard: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: c.divider,
  },
  roundTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundTitle: {
    ...typography.heading,
    color: c.accent,
    fontWeight: '800',
  },
  specialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FBBF2433',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  specialBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 1,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  playerName: {
    ...typography.body,
    color: c.textPrimary,
    flex: 1,
  },
  playerNameWinner: {
    color: c.accent,
    fontWeight: '700',
  },
  playerValue: {
    ...typography.number,
    color: c.textPrimary,
  },
  playerValueWinner: {
    color: c.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  colorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  colorBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.heading,
    color: c.textPrimary,
  },
  cardNet: {
    ...typography.numberLarge,
    color: c.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    ...typography.body,
    color: c.textSecondary,
  },
  rowValue: {
    ...typography.number,
    color: c.textPrimary,
  },
  penaltyValue: {
    color: c.negative,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: c.divider,
    marginVertical: spacing.sm,
  },
  negative: { color: c.negative },
  positive: { color: c.positive },
  actions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderColor: c.border,
  },
});
