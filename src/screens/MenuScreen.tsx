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
import { PlayModeSelectionModal } from '../components/PlayModeSelectionModal';
import { RoundCountSelectionModal } from '../components/RoundCountSelectionModal';
import { StartValueSelectionModal } from '../components/StartValueSelectionModal';
import { useGameContext } from '../contexts/GameContext';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';
import { radius, spacing, ThemeColors, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { GameMode, PlayMode } from '../types/game';

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
    id: 'klasik-okey',
    title: 'Klasik Okey',
    subtitle: 'Sayıdan düşmeli · Normal -1 · Okeyle -2 · Okeyle+Çifte -4',
    mode: 'klasik-okey',
    enabled: true,
    accent: '#3B82F6',
  },
  {
    id: 'duz-101',
    title: '101 Okey (katlamasız)',
    subtitle: 'Biten -101 · Açamayan +202 · Açıp kalan = taş toplamı',
    mode: 'duz-101',
    enabled: true,
    accent: '#FBBF24',
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
  const styles = useThemedStyles(makeStyles);
  const { isDark, toggleTheme } = useTheme();
  const [pendingCategory, setPendingCategory] = useState<Category | null>(null);
  const [pendingPlayMode, setPendingPlayMode] = useState<PlayMode | null>(null);
  const [pendingRoundCount, setPendingRoundCount] = useState<number | null>(null);
  const [pendingStartValue, setPendingStartValue] = useState<number | null>(null);

  const isKlasikOkey = pendingCategory?.mode === 'klasik-okey';
  const configDone = isKlasikOkey
    ? pendingStartValue !== null
    : pendingRoundCount !== null;

  const handleCategoryTap = (cat: Category) => {
    if (!cat.enabled || !cat.mode) return;
    setPendingCategory(cat);
  };

  const handlePickPlayMode = (mode: PlayMode) => {
    setPendingPlayMode(mode);
  };

  const handlePickRoundCount = (n: number) => {
    setPendingRoundCount(n);
  };

  const handlePickStartValue = (n: number) => {
    setPendingStartValue(n);
  };

  const handleCancelPlayMode = () => {
    setPendingCategory(null);
  };

  const handleCancelConfig = () => {
    setPendingPlayMode(null);
  };

  const handleCancelNames = () => {
    setPendingRoundCount(null);
    setPendingStartValue(null);
  };

  const handleStart = (names: string[]) => {
    if (!pendingCategory?.mode || !pendingPlayMode || !configDone) {
      return;
    }
    startNewGame(
      names,
      pendingCategory.mode,
      pendingPlayMode,
      pendingRoundCount ?? undefined,
      pendingStartValue ?? undefined
    );
    setPendingCategory(null);
    setPendingPlayMode(null);
    setPendingRoundCount(null);
    setPendingStartValue(null);
    navigation.navigate('Game');
  };

  const playerCount = pendingPlayMode === 'pairs' ? 2 : 4;
  const placeholderPrefix = pendingPlayMode === 'pairs' ? 'Takım' : 'Oyuncu';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Yazboz</Text>
          <Text style={styles.subtitle}>Oyun türünü seç</Text>
        </View>
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.themeToggle,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Text style={styles.themeToggleIcon}>{isDark ? '🌙' : '☀️'}</Text>
          <Text style={styles.themeToggleText}>
            {isDark ? 'Gece' : 'Gündüz'}
          </Text>
        </Pressable>
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
                <Text style={[styles.cardArrow, { color: cat.accent ?? '#3DDC97' }]}>
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

      <PlayModeSelectionModal
        visible={pendingCategory !== null && pendingPlayMode === null}
        title={pendingCategory ? `${pendingCategory.title} · Tür` : 'Oyun Türü'}
        onSelect={handlePickPlayMode}
        onCancel={handleCancelPlayMode}
      />

      <RoundCountSelectionModal
        visible={
          pendingPlayMode !== null && !isKlasikOkey && pendingRoundCount === null
        }
        title={pendingCategory ? `${pendingCategory.title} · Tur` : 'Kaç tur?'}
        onSelect={handlePickRoundCount}
        onCancel={handleCancelConfig}
      />

      <StartValueSelectionModal
        visible={
          pendingPlayMode !== null && isKlasikOkey && pendingStartValue === null
        }
        title={
          pendingCategory
            ? `${pendingCategory.title} · Başlangıç`
            : 'Kaç sayıdan?'
        }
        onSelect={handlePickStartValue}
        onCancel={handleCancelConfig}
      />

      <NameSetupModal
        visible={configDone}
        initialNames={Array.from({ length: playerCount }, () => '')}
        count={playerCount}
        placeholderPrefix={placeholderPrefix}
        title={
          pendingPlayMode === 'pairs'
            ? `${pendingCategory?.title ?? ''} · Takımlar`
            : `${pendingCategory?.title ?? ''} · Oyuncular`
        }
        ctaLabel="Oyunu Başlat"
        onCancel={handleCancelNames}
        onConfirm={handleStart}
      />
    </SafeAreaView>
  );
};

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
    },
    headerLeft: { flex: 1 },
    title: {
      ...typography.display,
      color: c.textPrimary,
    },
    subtitle: {
      ...typography.body,
      color: c.textMuted,
      marginTop: 4,
    },
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: c.surfaceElevated,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
    },
    themeToggleIcon: { fontSize: 16 },
    themeToggleText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: 0.3,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 2,
      borderColor: c.border,
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
      color: c.textPrimary,
    },
    cardTitleDisabled: {
      color: c.textSecondary,
    },
    cardSubtitle: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: 4,
    },
    cardArrow: {
      fontSize: 32,
      fontWeight: '700',
    },
    soonBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: c.border,
      borderRadius: radius.pill,
    },
    soonBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 1,
    },
    historyBtn: {
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: c.surfaceElevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    historyBtnText: {
      ...typography.heading,
      color: c.textSecondary,
    },
    pressed: { opacity: 0.6 },
  });
