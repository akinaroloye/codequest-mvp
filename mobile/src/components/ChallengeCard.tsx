import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, font, space, radius } from '../theme';
import type { Challenge } from '../types';

const TYPE_LABELS: Record<string, string> = {
  syntax_completion:    'Fill blank',
  debugging:            'Debugging',
  output_prediction:    'Predict output',
  performance_tradeoff: 'Performance',
  trace_execution:      'Trace',
};

interface Props {
  challenge: Challenge;
  onPress: (c: Challenge) => void;
  completed?: boolean;
}

export function ChallengeCard({ challenge, onPress, completed = false }: Props) {
  const diffColor = colors.difficultyColor[challenge.difficulty] ?? colors.textSub;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed, completed && styles.completed]}
      onPress={() => onPress(challenge)}
      accessibilityRole="button"
      accessibilityLabel={`${challenge.title}, ${challenge.difficulty} ${challenge.type}`}
    >
      <View style={styles.topRow}>
        <Text style={styles.typeLabel}>{TYPE_LABELS[challenge.type] ?? challenge.type}</Text>
        <View style={styles.metaRight}>
          {challenge.isDaily && (
            <View style={styles.dailyPill}>
              <Text style={styles.dailyText}>Today</Text>
            </View>
          )}
          {completed && (
            <View style={styles.completedPill}>
              <Text style={styles.completedText}>Done</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{challenge.title}</Text>

      <View style={styles.bottomRow}>
        <Text style={[styles.difficulty, { color: diffColor }]}>
          {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
        </Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.lang}>{challenge.language}</Text>
        <Text style={styles.xp}>+{challenge.xpReward} XP</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[4],
    marginBottom: space[2],
    gap: space[2],
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  completed: { opacity: 0.5 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeLabel: {
    color: colors.textMuted,
    fontSize: font.size.caption,
    fontWeight: font.weight.medium,
  },
  metaRight: { flexDirection: 'row', gap: space[1], alignItems: 'center' },
  dailyPill: {
    backgroundColor: colors.warningSub,
    borderRadius: radius.xs,
    paddingHorizontal: space[2],
    paddingVertical: 2,
  },
  dailyText: {
    color: colors.warning,
    fontSize: font.size.caption,
    fontWeight: font.weight.semibold,
  },
  completedPill: {
    backgroundColor: colors.successSub,
    borderRadius: radius.xs,
    paddingHorizontal: space[2],
    paddingVertical: 2,
  },
  completedText: {
    color: colors.success,
    fontSize: font.size.caption,
    fontWeight: font.weight.semibold,
  },
  title: {
    color: colors.text,
    fontSize: font.size.body,
    fontWeight: font.weight.semibold,
    lineHeight: 22,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  difficulty: {
    fontSize: font.size.caption,
    fontWeight: font.weight.semibold,
  },
  dot: { color: colors.textMuted, fontSize: font.size.caption },
  lang: { color: colors.textSub, fontSize: font.size.caption },
  xp: {
    color: colors.xp,
    fontSize: font.size.caption,
    fontWeight: font.weight.semibold,
    marginLeft: 'auto',
  },
});
