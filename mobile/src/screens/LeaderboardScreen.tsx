import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { leaderboardApi } from '../services/api';
import { colors, font, space, radius } from '../theme';

type Entry = {
  rank: number; userId: string; username: string;
  xpTotal: number; level: number; streakCurrent: number; isMe: boolean;
};

const MEDAL_COLORS = ['#FFD60A', '#C4C4C4', '#CD7F32'] as const;

export function LeaderboardScreen() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: leaderboardApi.getTop,
    staleTime: 60_000,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Leaderboard</Text>
        {isFetching && !isLoading && (
          <ActivityIndicator size="small" color={colors.accent} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="wifi-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>Could not load leaderboard.</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={data && data.length > 0 ? <TopThree entries={data.slice(0, 3)} /> : null}
          renderItem={({ item }) =>
            item.rank <= 3 ? null : <EntryRow entry={item} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No players yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function TopThree({ entries }: { entries: Entry[] }) {
  const order = [entries[1], entries[0], entries[2]].filter(Boolean);
  const heights = [80, 100, 64];
  const heightMap: Record<number, number> = { 0: heights[1], 1: heights[0], 2: heights[2] };

  return (
    <View style={styles.podium}>
      {order.map((entry, idx) => {
        const isCenter = entry.rank === 1;
        const medalColor = MEDAL_COLORS[entry.rank - 1] ?? colors.textSub;
        return (
          <View key={entry.userId} style={[styles.podiumSlot, isCenter && styles.podiumCenter]}>
            <View style={[styles.podiumAvatar, isCenter && styles.podiumAvatarCenter, { borderColor: medalColor }]}>
              <Text style={[styles.podiumInitial, { color: medalColor }]}>
                {entry.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.podiumName, entry.isMe && { color: colors.accent }]} numberOfLines={1}>
              {entry.isMe ? 'You' : entry.username}
            </Text>
            <Text style={[styles.podiumXP, { color: medalColor }]}>
              {entry.xpTotal.toLocaleString()} XP
            </Text>
            <View style={[styles.podiumBar, { height: heightMap[entry.rank - 1] ?? 64, backgroundColor: medalColor + '22' }]}>
              <Text style={[styles.podiumRankNum, { color: medalColor }]}>#{entry.rank}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function EntryRow({ entry }: { entry: Entry }) {
  return (
    <View style={[styles.row, entry.isMe && styles.rowMe]}>
      <Text style={[styles.rank, entry.isMe && { color: colors.accent }]}>
        #{entry.rank}
      </Text>
      <View style={styles.rowAvatar}>
        <Text style={styles.rowInitial}>{entry.username.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, entry.isMe && { color: colors.accent }]}>
          {entry.username}{entry.isMe ? ' · you' : ''}
        </Text>
        <Text style={styles.rowSub}>Level {entry.level} · {entry.streakCurrent}d streak</Text>
      </View>
      <Text style={styles.rowXP}>{entry.xpTotal.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingTop: space[4],
    paddingBottom: space[3],
  },
  pageTitle: {
    color: colors.text,
    fontSize: font.size.h1,
    fontWeight: font.weight.bold,
    letterSpacing: -0.3,
  },

  list: { paddingHorizontal: space[4], paddingBottom: space[16] },

  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: space[3],
    paddingVertical: space[6],
  },
  podiumSlot: { alignItems: 'center', flex: 1, gap: space[1] },
  podiumCenter: { marginBottom: 0 },
  podiumAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumAvatarCenter: { width: 52, height: 52, borderRadius: 26 },
  podiumInitial: { fontSize: font.size.body, fontWeight: font.weight.bold },
  podiumName: {
    color: colors.text,
    fontSize: font.size.caption,
    fontWeight: font.weight.medium,
    maxWidth: 72,
    textAlign: 'center',
  },
  podiumXP: { fontSize: font.size.caption, fontWeight: font.weight.semibold },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: radius.xs,
    borderTopRightRadius: radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: space[2],
  },
  podiumRankNum: { fontSize: font.size.label, fontWeight: font.weight.bold },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: space[3],
    marginBottom: space[2],
    gap: space[3],
  },
  rowMe: { backgroundColor: colors.accentSub, borderWidth: 1, borderColor: colors.accent + '40' },
  rank: {
    color: colors.textMuted,
    fontSize: font.size.label,
    fontWeight: font.weight.semibold,
    width: 32,
    textAlign: 'center',
  },
  rowAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInitial: { color: colors.textSub, fontSize: font.size.label, fontWeight: font.weight.semibold },
  rowInfo: { flex: 1 },
  rowName: {
    color: colors.text,
    fontSize: font.size.label,
    fontWeight: font.weight.semibold,
  },
  rowSub: { color: colors.textMuted, fontSize: font.size.caption, marginTop: 1 },
  rowXP: {
    color: colors.xp,
    fontSize: font.size.label,
    fontWeight: font.weight.semibold,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: space[3],
    paddingTop: space[16],
  },
  emptyText: { color: colors.textSub, fontSize: font.size.body },
  retryBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  retryText: { color: colors.accent, fontSize: font.size.label, fontWeight: font.weight.medium },
});
