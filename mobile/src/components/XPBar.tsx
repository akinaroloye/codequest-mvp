import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface Props {
  xpTotal: number;
  level: number;
  xpToNext: number;
}

function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.ceil(100 * Math.pow(level - 1, 1 / 0.667));
}

export function XPBar({ xpTotal, level, xpToNext }: Props) {
  const xpThisLevel = xpTotal - xpRequiredForLevel(level);
  const xpNeededForThisLevel = xpRequiredForLevel(level + 1) - xpRequiredForLevel(level);
  const progress = Math.min(1, xpThisLevel / Math.max(1, xpNeededForThisLevel));

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: progress,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.level}>Lvl {level}</Text>
        <Text style={styles.xp}>{xpToNext} XP to next</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  level: {
    color: colors.xp,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold as any,
  },
  xp: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.xp,
  },
});
