import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import type { Challenge } from '../types';

const TYPE_LABELS: Record<string, string> = {
  syntax_completion:    'Fill Blank',
  debugging:            'Debug',
  output_prediction:    'Predict Output',
  performance_tradeoff: 'Perf Trade-off',
  trace_execution:      'Trace',
};

interface Props {
  challenge: Challenge;
  onPress: (c: Challenge) => void;
  completed?: boolean;
}

export function ChallengeCard({ challenge, onPress, completed = false }: Props) {
  const diffColor = colors.difficultyColor[challenge.difficulty] ?? colors.textSecondary;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed, completed && styles.completed]}
      onPress={() => onPress(challenge)}
    >
      <View style={styles.topRow}>
        <View style={[styles.typePill, { backgroundColor: colors.accentGlow }]}>
          <Text style={styles.typeLabel}>{TYPE_LABELS[challenge.type] ?? challenge.type}</Text>
        </View>
        {challenge.isDaily && (
          <View style={[styles.typePill, { backgroundColor: 'rgba(168,139,250,0.15)' }]}>
            <Text style={[styles.typeLabel, { color: colors.gem }]}>DAILY</Text>
          </View>
        )}
        {completed && <Text style={styles.checkmark}>✓</Text>}
      </View>

      <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>

      <View style={styles.bottomRow}>
        <Text style={[styles.difficulty, { color: diffColor }]}>
          {challenge.difficulty.toUpperCase()}
        </Text>
        <Text style={styles.lang}>{challenge.language}</Text>
        <Text style={styles.xp}>+{challenge.xpReward} XP</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  completed: { borderColor: colors.success, opacity: 0.65 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  typePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  typeLabel: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as any,
    letterSpacing: 0.5,
  },
  checkmark: { color: colors.success, fontSize: 14, marginLeft: 'auto' },
  title: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  difficulty: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold as any },
  lang: { color: colors.textSecondary, fontSize: typography.sizes.xs },
  xp: {
    color: colors.xp,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as any,
    marginLeft: 'auto',
  },
});
