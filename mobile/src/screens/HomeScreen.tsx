import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Pressable,
} from 'react-native';
import { useQuery } from 'react-query';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { challengeApi } from '../services/api';
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';
import { StreakBadge } from '../components/StreakBadge';
import { XPBar } from '../components/XPBar';
import { ChallengeCard } from '../components/ChallengeCard';
import { colors, spacing, radius, typography } from '../theme';
import type { Challenge } from '../types';

function xpToNext(xpTotal: number, level: number): number {
  const xpForNext = Math.ceil(100 * Math.pow(level, 1 / 0.667));
  return Math.max(0, xpForNext - xpTotal);
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useUserStore((s) => s.user);
  const startSession = useGameStore((s) => s.startSession);

  const dailyQuery = useQuery('daily', challengeApi.getDaily, { staleTime: 60_000 });
  const listQuery = useQuery(['challenges'], () => challengeApi.list({ limit: 20 }), {
    staleTime: 60_000,
  });

  const openChallenge = useCallback((challenge: Challenge) => {
    startSession(challenge);
    navigation.navigate('Challenge', { challengeId: challenge.id });
  }, [navigation, startSession]);

  if (!user) return null;

  const remaining = xpToNext(user.xpTotal, user.level);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={dailyQuery.isFetching || listQuery.isFetching}
            onRefresh={() => { dailyQuery.refetch(); listQuery.refetch(); }}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.username}>{user.username}</Text>
          </View>
          <StreakBadge streak={user.streakCurrent} compact />
        </View>

        {/* XP Bar */}
        <View style={styles.section}>
          <XPBar xpTotal={user.xpTotal} level={user.level} xpToNext={remaining} />
        </View>

        {/* Hearts */}
        <View style={styles.heartsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={{ fontSize: 20, opacity: i < user.hearts ? 1 : 0.2 }}>❤️</Text>
          ))}
          <Text style={styles.heartsLabel}>{user.hearts}/5 hearts</Text>
        </View>

        {/* Daily Challenge */}
        <Text style={styles.sectionTitle}>Today's Challenge</Text>
        {dailyQuery.isLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : dailyQuery.data ? (
          <Pressable onPress={() => openChallenge(dailyQuery.data!)} style={styles.dailyCard}>
            <View style={styles.dailyBadge}>
              <Text style={styles.dailyBadgeText}>DAILY +50% XP</Text>
            </View>
            <Text style={styles.dailyTitle}>{dailyQuery.data.title}</Text>
            <Text style={styles.dailyMeta}>
              {dailyQuery.data.difficulty.toUpperCase()} · {dailyQuery.data.language} · {dailyQuery.data.xpReward} XP
            </Text>
          </Pressable>
        ) : null}

        {/* Challenge List */}
        <Text style={styles.sectionTitle}>Practice</Text>
        {listQuery.isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
        ) : (
          listQuery.data?.map((c) => (
            <ChallengeCard key={c.id} challenge={c} onPress={openChallenge} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: { color: colors.textSecondary, fontSize: typography.sizes.sm },
  username: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any },
  section: { marginBottom: spacing.md },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  heartsLabel: { color: colors.textSecondary, fontSize: typography.sizes.xs, marginLeft: spacing.xs },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as any,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  dailyCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...{
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  dailyBadge: {
    backgroundColor: colors.accentGlow,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  dailyBadgeText: { color: colors.accent, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold as any },
  dailyTitle: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold as any },
  dailyMeta: { color: colors.textSecondary, fontSize: typography.sizes.sm },
});
