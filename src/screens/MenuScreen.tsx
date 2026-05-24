import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BannerSlot } from '../components/BannerSlot';
import { NameSetupModal } from '../components/NameSetupModal';
import { useGameContext } from '../contexts/GameContext';
import { colors, radius, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { GameMode } from '../types/game';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface Category {
  id: string;
  title: string;
  subtitle: string;
  mode: GameMode | null;
  enabled: boolean;
  accent?: string;
}

const CATEGORIES: Category[] = [
  {
    id: 'renkli-klasik',
    title: 'Renkli Klasik',
    subtitle: 'Yer rengi çarpanlı (3-Mavi · 4-Kırmızı · 5-Siyah · 6-Sarı)',
    mode: 'renkli-klasik',
    enabled: true,
    accent: '#3DDC97',
  },
  {
    id: 'klasik',
    title: 'Klasik',
    subtitle: 'Düz hesap (üst ×-10, alt +)',
    mode: 'klasik',
    enabled: false,
  },
  {
    id: 'duz-101',
    title: 'Düz 101',
    subtitle: 'Yakında',
    mode: null,
    enabled: false,
  },
  {
    id: '101-klasik',
    title: '101 Klasik',
    subtitle: 'Yakında',
    mode: null,
    enabled: false,
  },
];

export const MenuScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { startNewGame } = useGameContext();
  const [pendingCategory, setPendingCategory] = useState<Category | null>(null);

  const handleCategoryTap = (cat: Category) => {
    if (!cat.enabled || !cat.mode) return;
    setPendingCategory(cat);
  };

  const handleStart = (names: string[]) => {
    if (!pendingCategory?.mode) return;
    startNewGame(names, pendingCategory.mode);
    setPendingCategory(null);
    navigation.navigate('Game');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Yazboz</Text>
        <Text style={styles.subtitle}>Oyun türünü seç</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => handleCategoryTap(cat)}
            disabled={!cat.enabled}
            style={({ pressed }) => [
              styles.card,
              !cat.enabled && styles.cardDisabled,
              cat.enabled && cat.accent
                ? { borderColor: cat.accent }
                : undefined,
              pressed && cat.enabled && styles.cardPressed,
            ]}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardLeft}>
                <Text
                  style={[
                    styles.cardTitle,
                    !cat.enabled && styles.cardTitleDisabled,
                  ]}
                >
                  {cat.title}
                </Text>
                <Text style={styles.cardSubtitle}>{cat.subtitle}</Text>
              </View>
              {cat.enabled ? (
                <Text style={[styles.cardArrow, { color: cat.accent ?? colors.accent }]}>
                  ›
                </Text>
              ) : (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonBadgeText}>YAKINDA</Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}

        <Pressable
          onPress={() => navigation.navigate('History')}
          style={({ pressed }) => [
            styles.historyBtn,
            pressed && styles.cardPressed,
          ]}
        >
          <Text style={styles.historyBtnText}>📜 Oyun Geçmişi</Text>
        </Pressable>
      </ScrollView>

      <BannerSlot />

      <NameSetupModal
        visible={pendingCategory !== null}
        initialNames={['', '', '', '']}
        title={pendingCategory ? `${pendingCategory.title} · Oyuncular` : 'Oyuncular'}
        ctaLabel="Oyunu Başlat"
        onCancel={() => setPendingCategory(null)}
        onConfirm={handleStart}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  cardTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  cardTitleDisabled: {
    color: colors.textSecondary,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  cardArrow: {
    fontSize: 32,
    fontWeight: '700',
  },
  soonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
  },
  soonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  historyBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  historyBtnText: {
    ...typography.heading,
    color: colors.textSecondary,
  },
});
