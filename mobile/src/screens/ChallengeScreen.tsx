/**
 * ChallengeScreen — the core challenge-solving UI.
 *
 * Renders the appropriate sub-view based on challenge type.
 * On submission, patches the user store with updated XP/streak
 * and navigates to the result modal.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable,
  StyleSheet, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';

import { progressApi } from '../services/api';
import { useGameStore } from '../store/useGameStore';
import { useUserStore } from '../store/useUserStore';
import { colors, spacing, radius, typography } from '../theme';
import type { SubmitResponse } from '../types';

const HEART_EMOJI = '❤️';

export function ChallengeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const session = useGameStore((s) => s.session);
  const recordAnswer = useGameStore((s) => s.recordAnswer);
  const loseHeart = useGameStore((s) => s.loseHeart);
  const markSubmitted = useGameStore((s) => s.markSubmitted);
  const clearSession = useGameStore((s) => s.clearSession);
  const patchUser = useUserStore((s) => s.patchUser);
  const user = useUserStore((s) => s.user);

  const [answer, setAnswer] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(session?.challenge.timeLimitSecs ?? 300);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Countdown timer
  useEffect(() => {
    if (!session || session.submitted) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [session?.challenge.id]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = useCallback(async (timedOut = false) => {
    if (!session || submitting) return;
    setSubmitting(true);
    markSubmitted();

    const timeTakenMs = (session.challenge.timeLimitSecs - timeLeft) * 1000;
    const type = session.challenge.type;

    let submission: Record<string, unknown> = {};
    if (type === 'syntax_completion') submission = { answers: session.answers };
    else if (type === 'debugging') submission = { code: answer };
    else if (type === 'output_prediction' || type === 'performance_tradeoff')
      submission = { selected_index: selectedIdx };
    else if (type === 'trace_execution') submission = { final_state: session.answers };

    try {
      const result: SubmitResponse = await progressApi.submit({
        challengeId: session.challenge.id,
        submission,
        timeTakenMs,
      });

      if (!result.correct) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shake();
        loseHeart();
        patchUser({ hearts: Math.max(0, (user?.hearts ?? 1) - 1) });
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        patchUser({
          xpTotal: result.xpTotal,
          level: result.level,
          streakCurrent: result.streakCurrent,
        });
      }

      clearSession();
      navigation.replace('Result', { result, timedOut });
    } catch {
      Alert.alert('Error', 'Could not submit. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  }, [session, answer, selectedIdx, timeLeft, submitting]);

  if (!session) return null;
  const { challenge } = session;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerColor = timeLeft < 30 ? colors.error : timeLeft < 60 ? colors.accent : colors.textSecondary;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => { clearSession(); navigation.goBack(); }}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.heartsRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text key={i} style={{ fontSize: 16, opacity: i < (user?.hearts ?? 5) ? 1 : 0.2 }}>
              {HEART_EMOJI}
            </Text>
          ))}
        </View>
        <Text style={[styles.timer, { color: timerColor }]}>
          {mins}:{String(secs).padStart(2, '0')}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Challenge header */}
        <Text style={styles.typeLabel}>
          {challenge.type.replace('_', ' ').toUpperCase()} · {challenge.difficulty.toUpperCase()}
        </Text>
        <Text style={styles.title}>{challenge.title}</Text>

        {/* Code display */}
        {challenge.content && 'buggyCode' in challenge.content && (
          <View style={styles.codeBlock}>
            <Text style={styles.prompt}>{(challenge.content as any).prompt}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.codeScroll}>
              <Text style={styles.code}>{(challenge.content as any).buggyCode}</Text>
            </ScrollView>
          </View>
        )}

        {challenge.content && 'code' in challenge.content && (
          <View style={styles.codeBlock}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.codeScroll}>
              <Text style={styles.code}>{(challenge.content as any).code}</Text>
            </ScrollView>
          </View>
        )}

        {/* MCQ Options */}
        {(challenge.type === 'output_prediction' || challenge.type === 'performance_tradeoff') &&
          challenge.content && 'options' in challenge.content &&
          (challenge.content as any).options.map((opt: any, i: number) => (
            <Pressable
              key={i}
              style={[styles.option, selectedIdx === i && styles.optionSelected]}
              onPress={() => setSelectedIdx(i)}
            >
              <Text style={styles.optionText}>{typeof opt === 'string' ? opt : opt.label}</Text>
            </Pressable>
          ))}

        {/* Debugging text input */}
        {challenge.type === 'debugging' && (
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <Text style={styles.inputLabel}>Your corrected code:</Text>
            <TextInput
              style={styles.codeInput}
              value={answer}
              onChangeText={setAnswer}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              placeholderTextColor={colors.textMuted}
              placeholder="Paste your fix here…"
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Submit button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.submitBtn, submitting && styles.submitDisabled]}
          onPress={() => handleSubmit()}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? 'Checking…' : 'Submit Answer'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  close: { color: colors.textSecondary, fontSize: 18, fontWeight: 'bold' },
  heartsRow: { flexDirection: 'row', gap: 4 },
  timer: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold as any, fontFamily: typography.mono },
  typeLabel: { color: colors.accent, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold as any, letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold as any },
  prompt: { color: colors.textSecondary, fontSize: typography.sizes.sm, marginBottom: spacing.sm },
  codeBlock: {
    backgroundColor: '#0A0A0C',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  codeScroll: { maxHeight: 300 },
  code: {
    color: '#E2E8F0',
    fontFamily: typography.mono,
    fontSize: 13,
    lineHeight: 20,
  },
  option: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  optionText: { color: colors.text, fontSize: typography.sizes.sm, fontFamily: typography.mono },
  inputLabel: { color: colors.textSecondary, fontSize: typography.sizes.sm, marginBottom: spacing.xs },
  codeInput: {
    backgroundColor: '#0A0A0C',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: '#E2E8F0',
    fontFamily: typography.mono,
    fontSize: 13,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#000', fontWeight: typography.weights.bold as any, fontSize: typography.sizes.md },
});
