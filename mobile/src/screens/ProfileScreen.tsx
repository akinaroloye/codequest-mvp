import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../store/useUserStore';
import { XPBar } from '../components/XPBar';
import { StreakBadge } from '../components/StreakBadge';
import { colors, font, space, radius } from '../theme';

function xpToNext(xpTotal: number, level: number): number {
  return Math.max(0, Math.ceil(100 * Math.pow(level, 1 / 0.667)) - xpTotal);
}

interface StatRowProps { label: string; value: string | number; icon: string; }

function StatRow({ label, value, icon }: StatRowProps) {
  return (
    <View style={styles.statRow}>
      <Ionicons name={icon as any} size={16} color={colors.textMuted} style={styles.statIcon} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const { user, logout } = useUserStore();

  if (!user) return null;

  const confirmLogout = () =>
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {user.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        {/* XP card */}
        <View style={styles.card}>
          <XPBar xpTotal={user.xpTotal} level={user.level} xpToNext={xpToNext(user.xpTotal, user.level)} />
        </View>

        {/* Streak card */}
        <View style={styles.card}>
          <View style={styles.streakRow}>
            <View style={styles.streakMain}>
              <StreakBadge streak={user.streakCurrent} />
            </View>
            <View style={styles.streakSide}>
              <Text style={styles.streakSideValue}>{user.streakLongest}</Text>
              <Text style={styles.streakSideLabel}>Best streak</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <StatRow label="Total XP"      value={user.xpTotal.toLocaleString()} icon="star-outline" />
          <View style={styles.divider} />
          <StatRow label="Gems"          value={user.gems}                      icon="diamond-outline" />
          <View style={styles.divider} />
          <StatRow label="Hearts"        value={`${user.hearts} / 5`}          icon="heart-outline" />
          <View style={styles.divider} />
          <StatRow label="Shields"       value={`${user.streakShieldsBanked} / 2`} icon="shield-outline" />
          <View style={styles.divider} />
          <StatRow label="Language"      value={user.preferredLanguage}         icon="code-slash-outline" />
        </View>

        {/* Sign out */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          onPress={confirmLogout}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Ionicons name="log-out-outline" size={16} color={colors.error} />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], paddingBottom: space[16], gap: space[3] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    marginBottom: space[2],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSub,
    borderWidth: 1,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: colors.accent,
    fontSize: font.size.h2,
    fontWeight: font.weight.bold,
  },
  headerText: { gap: 2 },
  username: {
    color: colors.text,
    fontSize: font.size.h2,
    fontWeight: font.weight.bold,
    letterSpacing: -0.2,
  },
  email: { color: colors.textSub, fontSize: font.size.label },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[4],
  },

  streakRow: { flexDirection: 'row', alignItems: 'center' },
  streakMain: { flex: 1 },
  streakSide: { alignItems: 'flex-end', gap: space[1] },
  streakSideValue: {
    color: colors.text,
    fontSize: font.size.h1,
    fontWeight: font.weight.bold,
  },
  streakSideLabel: { color: colors.textSub, fontSize: font.size.caption },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[3],
  },
  statIcon: { marginRight: space[3] },
  statLabel: { flex: 1, color: colors.textSub, fontSize: font.size.body },
  statValue: { color: colors.text, fontSize: font.size.body, fontWeight: font.weight.medium },
  divider: { height: 1, backgroundColor: colors.border },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    backgroundColor: colors.errorSub,
    borderRadius: radius.md,
    padding: space[3] + 2,
    marginTop: space[2],
  },
  logoutText: {
    color: colors.error,
    fontSize: font.size.body,
    fontWeight: font.weight.medium,
  },
});
