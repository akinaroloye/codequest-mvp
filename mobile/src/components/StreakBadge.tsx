import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, space, radius } from '../theme';

interface Props {
  streak: number;
  compact?: boolean;
}

export function StreakBadge({ streak, compact = false }: Props) {
  const active = streak > 0;
  const color = active ? colors.streak : colors.textMuted;

  if (compact) {
    return (
      <View style={[styles.pill, { borderColor: active ? colors.warningSub : colors.border }]}>
        <Text style={[styles.pillEmoji]}>🔥</Text>
        <Text style={[styles.pillCount, { color }]}>{streak}</Text>
      </View>
    );
  }

  return (
    <View style={styles.full}>
      <Text style={styles.fullEmoji}>🔥</Text>
      <Text style={[styles.fullCount, { color }]}>{streak}</Text>
      <Text style={styles.fullLabel}>day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
  },
  pillEmoji: { fontSize: 13 },
  pillCount: {
    fontSize: font.size.label,
    fontWeight: font.weight.semibold,
  },
  full: {
    alignItems: 'center',
    gap: space[1],
  },
  fullEmoji: { fontSize: 32 },
  fullCount: {
    fontSize: font.size.hero,
    fontWeight: font.weight.heavy,
  },
  fullLabel: {
    color: colors.textSub,
    fontSize: font.size.label,
  },
});
