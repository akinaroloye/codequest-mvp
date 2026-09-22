import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { challengeApi } from '../services/api';
import { useUserStore } from '../store/useUserStore';
import { useGameStore } from '../store/useGameStore';
import { StreakBadge } from '../components/StreakBadge';
import { XPBar } from '../components/XPBar';
import { ChallengeCard } from '../components/ChallengeCard';
import { colors, font, space, radius } from '../theme';
import type { Challenge } from '../types';

function xpToNext(xpTotal: number, level: number): number {
  return Math.max(0, Math.ceil(100 * Math.pow(level, 1 / 0.667)) - xpTotal);
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={sectionLabelStyle}>{children}</Text>;
}

const sectionLabelStyle: any = {
  color: colors.textSub,
  fontSize: font.size.label,
  fontWeight: font.weight.semibold,
  marginBottom: space[3],
};

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useUserStore((s) => s.user);
  const startSession = useGameStore((s) => s.startSession);

  const dailyQuery = useQuery({
    queryKey: ['daily'],
    queryFn: challengeApi.getDaily,
    staleTime: 60_000,
  });
  const listQuery = useQuery({
    queryKey: ['challenges'],
    queryFn: () => challengeApi.list({ limit: 20 }),
    staleTime: 60_000,
  });

  const openChallenge = useCallback((challenge: Challenge) => {
    startSession(challenge);
    navigation.navigate('Challenge', { challengeId: challenge.id });
  }, [navigation, startSession]);

  if (!user) return null;

  const refreshing = dailyQuery.isFetching || listQuery.isFetching;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { dailyQuery.refetch(); listQuery.refetch(); }}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.username}>{user.username}</Text>
          </View>
          <View style={styles.headerMeta}>
            <StreakBadge streak={user.streakCurrent} compact />
            <View style={styles.heartsPill}>
              <Text style={styles.heartsEmoji}>❤</Text>
              <Text style={styles.heartsCount}>{user.hearts}</Text>
            </View>
          </View>
        </View>

        {/* XP progress */}
        <View style={styles.xpSection}>
          <XPBar xpTotal={user.xpTotal} level={user.level} xpToNext={xpToNext(user.xpTotal, user.level)} />
        </View>

        {/* Daily challenge */}
        <View style={styles.section}>
          <SectionLabel>Today's challenge</SectionLabel>
          {dailyQuery.isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.accent} size="small" />
            </View>
          ) : dailyQuery.data ? (
            <DailyCard challenge={dailyQuery.data} onPress={openChallenge} />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No challenge today yet.</Text>
            </View>
          )}
        </View>

        {/* Practice */}
        <View style={styles.section}>
          <SectionLabel>Practice</SectionLabel>
          {listQuery.isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : listQuery.data?.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="code-slash-outline" size={24} color={colors.textMuted} />
              <Text style={styles.emptyText}>No challenges available yet.</Text>
            </View>
          ) : listQuery.isError ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Could not load challenges.</Text>
            </View>
          ) : (
            listQuery.data?.map((c) => (
              <ChallengeCard key={c.id} challenge={c} onPress={openChallenge} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DailyCard({ challenge, onPress }: { challenge: Challenge; onPress: (c: Challenge) => void }) {
  const diffColor = colors.difficultyColor[challenge.difficulty] ?? colors.textSub;
  return (
    <Pressable
      style={({ pressed }) => [styles.dailyCard, pressed && { opacity: 0.75 }]}
      onPress={() => onPress(challenge)}
      accessibilityRole="button"
      accessibilityLabel={`Today's challenge: ${challenge.title}`}
    >
      <View style={styles.dailyAccent} />
      <View style={styles.dailyContent}>
        <Text style={styles.dailyType}>
          {challenge.type.replace(/_/g, ' ')}
        </Text>
        <Text style={styles.dailyTitle}>{challenge.title}</Text>
        <View style={styles.dailyMeta}>
          <Text style={[styles.dailyDiff, { color: diffColor }]}>
            {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
          </Text>
          <Text style={styles.dailyDot}>·</Text>
          <Text style={styles.dailyLang}>{challenge.language}</Text>
          <Text style={styles.dailyXP}>+{challenge.xpReward} XP</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  scroll:  { flex: 1 },
  content: { padding: space[4], paddingBottom: space[16] },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space[5],
  },
  greeting: {
    color: colors.textSub,
    fontSize: font.size.label,
  },
  username: {
    color: colors.text,
    fontSize: font.size.h1,
    fontWeight: font.weight.bold,
    letterSpacing: -0.3,
    marginTop: 1,
  },
  headerMeta: { flexDirection: 'row', gap: space[2], alignItems: 'center' },
  heartsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  heartsEmoji: { fontSize: 13, color: colors.heart },
  heartsCount: {
    color: colors.heart,
    fontSize: font.size.label,
    fontWeight: font.weight.semibold,
  },

  xpSection: { marginBottom: space[6] },

  section: { marginBottom: space[6] },

  // Daily card — left accent border, no glowing box
  dailyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dailyAccent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: colors.warning,
  },
  dailyContent: { flex: 1, padding: space[4], gap: space[1] },
  dailyType: {
    color: colors.textMuted,
    fontSize: font.size.caption,
    fontWeight: font.weight.medium,
    textTransform: 'capitalize',
  },
  dailyTitle: {
    color: colors.text,
    fontSize: font.size.h3,
    fontWeight: font.weight.semibold,
  },
  dailyMeta: { flexDirection: 'row', alignItems: 'center', gap: space[2], marginTop: space[1] },
  dailyDiff: { fontSize: font.size.caption, fontWeight: font.weight.semibold },
  dailyDot:  { color: colors.textMuted, fontSize: font.size.caption },
  dailyLang: { color: colors.textSub,   fontSize: font.size.caption },
  dailyXP:   {
    color: colors.xp,
    fontSize: font.size.caption,
    fontWeight: font.weight.semibold,
    marginLeft: 'auto',
  },

  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[6],
    alignItems: 'center',
    gap: space[2],
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: font.size.label,
  },

  skeleton: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[4],
    marginBottom: space[2],
    gap: space[2],
  },
  skeletonLine: {
    height: 12,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceHigh,
    width: '80%',
  },
});
