import React, { useCallback, useMemo } from 'react';
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
import { buildRoundSummaries } from '../logic/calculator';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Result'>;
type Rt = RouteProp<RootStackParamList, 'Result'>;

const formatTopList = (entries: { value: number; round: number }[]): string =>
  entries.length === 0 ? '–' : entries.map((t) => t.value).join(', ');

const formatBottomList = (
  entries: { value: number; round: number }[]
): string =>
  entries.length === 0 ? '–' : entries.map((e) => e.value).join(', ');

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
  const playMode = (isHistorical ? savedGame.playMode : ctxPlayMode) ?? 'singles';
  const visibleCount = MAX_PLAYERS_BY_MODE[playMode];

  const styles = useThemedStyles(makeStyles);
  const title = isHistorical ? 'Geçmiş Oyun' : 'Sonuç';
  const colorInfo = COLOR_BY_MULTIPLIER[result.multiplier];

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
        return (
        <View key={rs.round} style={styles.roundCard}>
          <View style={styles.roundHeader}>
            <View style={styles.roundTitleRow}>
              <Text style={styles.roundTitle}>{rs.round}. Tur</Text>
              {isSpecial && (
                <View style={styles.specialBadge}>
                  <Text style={styles.specialBadgeText}>⭐ ÖZEL</Text>
                </View>
              )}
            </View>
            {rs.colorHex && rs.colorName && (
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

          {rs.players.slice(0, visibleCount).map((p) => {
            const hasData =
              p.isWinner || p.topValues.length > 0 || p.bottomValues.length > 0;
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
                  {p.isWinner
                    ? p.topValues.length > 0
                      ? `bitti · üst ${p.topValues.join(',')}`
                      : 'bitti'
                    : p.bottomValues.length > 0
                    ? p.bottomValues.join(', ')
                    : '–'}
                </Text>
              </View>
            );
          })}
        </View>
        );
      }),
    [roundSummaries, specialFinishes, visibleCount]
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
                  r.net < 0 && styles.negative,
                  r.net > 0 && styles.positive,
                ]}
              >
                {r.net}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Üst</Text>
              <Text style={styles.rowValue}>{formatTopList(col.top)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Alt</Text>
              <Text style={styles.rowValue}>{formatBottomList(col.bottom)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Üst toplam</Text>
              <Text style={styles.rowValue}>{r.topSum}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Alt toplam</Text>
              <Text style={styles.rowValue}>{r.bottomSum}</Text>
            </View>
          </View>
        );
      }),
    [columns, result, playerNames, visibleCount]
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
        {isHistorical && savedGame && (
          <Button
            label="İncele"
            onPress={() => navigation.navigate('Inspect', { savedGame })}
            variant="secondary"
            style={{ flex: 1 }}
          />
        )}
        <Button
          label={isHistorical ? 'Kapat' : 'Yeni Oyun'}
          onPress={handleNewGame}
          variant="primary"
          style={{ flex: 1 }}
        />
      </View>

      <BannerSlot />
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
