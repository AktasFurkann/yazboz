import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { BannerSlot } from '../components/BannerSlot';
import { radius, spacing, ThemeColors, typography } from '../theme';
import { useThemedStyles } from '../contexts/ThemeContext';
import { clearHistory, deleteGame, loadHistory } from '../storage/gameHistory';
import { SavedGame } from '../types/game';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'History'>;

const formatDate = (ts: number): string => {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const styles = useThemedStyles(makeStyles);
  const [games, setGames] = useState<SavedGame[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await loadHistory();
    setGames(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleDelete = (id: string) => {
    Alert.alert('Sil', 'Bu oyun silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const next = await deleteGame(id);
          setGames(next);
        },
      },
    ]);
  };

  const handleClearAll = () => {
    if (games.length === 0) return;
    Alert.alert('Tüm geçmişi sil', 'Bu işlem geri alınamaz.', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setGames([]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Geçmiş</Text>
        {games.length > 0 && (
          <Pressable onPress={handleClearAll}>
            <Text style={styles.clearText}>Tümünü Sil</Text>
          </Pressable>
        )}
      </View>

      {loading ? null : games.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Henüz oyun yok.</Text>
          <Text style={styles.emptyHint}>
            Bir oyun bitirdiğinde burada listelenir.
          </Text>
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('Result', { savedGame: item })}
              onLongPress={() => handleDelete(item.id)}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
              <View style={styles.cardColumns}>
                {item.result.columns.map((c, idx) => (
                  <View key={idx} style={styles.miniCol}>
                    <Text style={styles.miniLabel}>S{idx + 1}</Text>
                    <Text
                      style={[
                        styles.miniValue,
                        c.net < 0 && styles.negative,
                        c.net > 0 && styles.positive,
                      ]}
                    >
                      {c.net}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.hint}>Uzun bas: sil</Text>
            </Pressable>
          )}
        />
      )}

      <View style={styles.actions}>
        <Button
          label="Geri"
          variant="secondary"
          onPress={() => navigation.goBack()}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.display,
    color: c.textPrimary,
  },
  clearText: {
    ...typography.caption,
    color: c.negative,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    ...typography.heading,
    color: c.textSecondary,
  },
  emptyHint: {
    ...typography.body,
    color: c.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardDate: {
    ...typography.caption,
    color: c.textSecondary,
    marginBottom: spacing.md,
  },
  cardColumns: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  miniCol: {
    alignItems: 'center',
  },
  miniLabel: {
    fontSize: 10,
    color: c.textMuted,
    letterSpacing: 0.5,
  },
  miniValue: {
    ...typography.number,
    color: c.textPrimary,
    marginTop: 2,
  },
  negative: { color: c.negative },
  positive: { color: c.positive },
  hint: {
    fontSize: 10,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actions: {
    padding: spacing.lg,
    backgroundColor: c.background,
    borderTopWidth: 1,
    borderColor: c.border,
  },
});
