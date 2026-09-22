import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, space, radius } from '../theme';

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
  const xpNeeded = xpRequiredForLevel(level + 1) - xpRequiredForLevel(level);
  const progress = Math.min(1, xpThisLevel / Math.max(1, xpNeeded));

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: progress,
      tension: 60,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthPct = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.level}>Level {level}</Text>
        <Text style={styles.xpLabel}>{xpToNext.toLocaleString()} XP to next</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fillWrap, { width: widthPct }]}>
          <LinearGradient
            colors={['#30D158', '#22B548']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[2] },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  level: {
    color: colors.text,
    fontSize: font.size.label,
    fontWeight: font.weight.semibold,
  },
  xpLabel: {
    color: colors.textSub,
    fontSize: font.size.caption,
  },
  track: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    overflow: 'hidden',
  },
  fillWrap: {
    height: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
