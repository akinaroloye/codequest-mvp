import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { SubmitResponse } from '../types';
import { colors, font, space, radius } from '../theme';

export function ResultScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const result: SubmitResponse = route.params?.result;
  const timedOut: boolean      = route.params?.timedOut ?? false;

  const correct = !timedOut && result?.correct;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const icon   = timedOut ? 'time-outline' : correct ? 'checkmark-circle' : 'close-circle';
  const color  = timedOut ? colors.warning  : correct ? colors.success     : colors.error;
  const headline = timedOut ? "Time's up" : correct ? 'Correct' : 'Not quite';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Icon + headline */}
        <View style={styles.heroSection}>
          <View style={[styles.iconWrap, { backgroundColor: correct ? colors.successSub : timedOut ? colors.warningSub : colors.errorSub }]}>
            <Ionicons name={icon as any} size={40} color={color} />
          </View>
          <Text style={[styles.headline, { color }]}>{headline}</Text>
          {result?.explanation ? (
            <Text style={styles.explanation}>{result.explanation}</Text>
          ) : null}
        </View>

        {/* Hint (wrong only) */}
        {!correct && !timedOut && result?.hint ? (
          <View style={styles.hintCard}>
            <Text style={styles.hintLabel}>Hint</Text>
            <Text style={styles.hintText}>{result.hint}</Text>
          </View>
        ) : null}

        {/* XP stats (correct only) */}
        {correct && result ? (
          <View style={styles.statsRow}>
            <StatPill label="XP earned" value={`+${result.xpEarned}`} color={colors.xp} />
            <StatPill label="Streak"    value={`${result.streakCurrent}d`} color={colors.streak} />
            <StatPill label="Level"     value={`${result.level}`} color={colors.accent} />
          </View>
        ) : null}

        {/* Level up callout */}
        {correct && result?.streakMilestone ? (
          <View style={styles.milestoneCard}>
            <Ionicons name="flame" size={18} color={colors.streak} />
            <Text style={styles.milestoneText}>
              {result.streakMilestone}-day streak — shield earned!
            </Text>
          </View>
        ) : null}

        {/* Action */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.8 }]}
            onPress={() => navigation.navigate('Main')}
            accessibilityRole="button"
            accessibilityLabel="Back to home"
          >
            <Text style={styles.primaryBtnText}>Back to home</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: space[6], gap: space[5], justifyContent: 'center' },

  heroSection: { alignItems: 'center', gap: space[3] },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headline: {
    fontSize: font.size.hero,
    fontWeight: font.weight.heavy,
    letterSpacing: -0.5,
  },
  explanation: {
    color: colors.textSub,
    fontSize: font.size.body,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },

  hintCard: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    padding: space[4],
    gap: space[2],
  },
  hintLabel: {
    color: colors.warning,
    fontSize: font.size.caption,
    fontWeight: font.weight.semibold,
  },
  hintText: { color: colors.text, fontSize: font.size.body, lineHeight: 22 },

  statsRow: {
    flexDirection: 'row',
    gap: space[3],
    justifyContent: 'center',
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space[4],
    alignItems: 'center',
    gap: space[1],
  },
  statValue: {
    fontSize: font.size.h1,
    fontWeight: font.weight.heavy,
  },
  statLabel: {
    color: colors.textSub,
    fontSize: font.size.caption,
  },

  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: colors.warningSub,
    borderRadius: radius.sm,
    padding: space[3],
    alignSelf: 'center',
  },
  milestoneText: {
    color: colors.warning,
    fontSize: font.size.label,
    fontWeight: font.weight.medium,
  },

  actions: { gap: space[3], marginTop: space[2] },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: space[3] + 2,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: font.size.body,
    fontWeight: font.weight.semibold,
  },
});
