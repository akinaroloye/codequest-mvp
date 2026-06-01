import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface Props {
  streak: number;
  compact?: boolean;
}

const getFlameIntensity = (streak: number) => {
  if (streak >= 100) return { emoji: '🔥', color: '#EF4444' };
  if (streak >= 30)  return { emoji: '🔥', color: '#F97316' };
  if (streak >= 7)   return { emoji: '🔥', color: colors.streak };
  if (streak >= 1)   return { emoji: '🔥', color: '#FBD38D' };
  return { emoji: '💧', color: colors.textMuted };
};

export function StreakBadge({ streak, compact = false }: Props) {
  const { emoji, color } = getFlameIntensity(streak);

  if (compact) {
    return (
      <View style={[styles.compact, { borderColor: color }]}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.countCompact, { color }]}>{streak}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: color, shadowColor: color }]}>
      <Text style={styles.emojiLarge}>{emoji}</Text>
      <Text style={[styles.count, { color }]}>{streak}</Text>
      <Text style={styles.label}>day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  emoji: { fontSize: 14 },
  emojiLarge: { fontSize: 36, marginBottom: spacing.xs },
  count: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.black as any,
    lineHeight: 40,
  },
  countCompact: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold as any,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium as any,
  },
});
