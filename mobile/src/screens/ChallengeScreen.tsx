import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable,
  StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { progressApi } from '../services/api';
import { useGameStore } from '../store/useGameStore';
import { useUserStore } from '../store/useUserStore';
import { colors, font, space, radius } from '../theme';
import type { SubmitResponse } from '../types';

export function ChallengeScreen() {
  const navigation = useNavigation<any>();
  const session    = useGameStore((s) => s.session);
  const loseHeart  = useGameStore((s) => s.loseHeart);
  const markSubmitted = useGameStore((s) => s.markSubmitted);
  const clearSession  = useGameStore((s) => s.clearSession);
  const patchUser  = useUserStore((s) => s.patchUser);
  const user       = useUserStore((s) => s.user);

  const [answer, setAnswer]         = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitting, setSubmitting]  = useState(false);
  const [timeLeft, setTimeLeft]      = useState(session?.challenge.timeLimitSecs ?? 300);
  const [wrongFlash, setWrongFlash]  = useState(false);

  // Countdown
  const handleSubmitRef = useRef<((timedOut?: boolean) => Promise<void>) | null>(null);
  useEffect(() => {
    if (!session || session.submitted) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); handleSubmitRef.current?.(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [session?.challenge.id]);

  const flashBorder = () => {
    setWrongFlash(true);
    setTimeout(() => setWrongFlash(false), 600);
  };

  const handleSubmit = useCallback(async (timedOut = false) => {
    if (!session || submitting) return;
    setSubmitting(true);
    markSubmitted();

    const timeTakenMs = (session.challenge.timeLimitSecs - timeLeft) * 1000;
    const type = session.challenge.type;

    let submission: Record<string, unknown> = {};
    if (type === 'syntax_completion')   submission = { answers: session.answers };
    else if (type === 'debugging')       submission = { code: answer };
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
        flashBorder();
        loseHeart();
        patchUser({ hearts: Math.max(0, (user?.hearts ?? 1) - 1) });
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        patchUser({ xpTotal: result.xpTotal, level: result.level, streakCurrent: result.streakCurrent });
      }

      clearSession();
      navigation.replace('Result', { result, timedOut });
    } catch {
      Alert.alert('Error', 'Could not submit. Check your connection.');
      setSubmitting(false);
    }
  }, [session, answer, selectedIdx, timeLeft, submitting]);

  // Keep ref current so timer can call it
  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  if (!session) return null;
  const { challenge } = session;
  const content = challenge.content as any;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerUrgent = timeLeft < 30;
  const timerWarn   = timeLeft < 60;
  const timerColor  = timerUrgent ? colors.error : timerWarn ? colors.warning : colors.textSub;

  const isDebug = challenge.type === 'debugging';
  const isMCQ   = challenge.type === 'output_prediction' || challenge.type === 'performance_tradeoff';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => { clearSession(); navigation.goBack(); }}
          accessibilityLabel="Close challenge"
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={20} color={colors.textSub} />
        </Pressable>

        <View style={styles.hearts}>
          {Array.from({ length: user?.hearts ?? 5 }).map((_, i) => (
            <Ionicons key={i} name="heart" size={14} color={colors.heart} />
          ))}
          {Array.from({ length: Math.max(0, 5 - (user?.hearts ?? 5)) }).map((_, i) => (
            <Ionicons key={`e${i}`} name="heart-outline" size={14} color={colors.textMuted} />
          ))}
        </View>

        <View style={[styles.timer, timerUrgent && styles.timerUrgent]}>
          <Ionicons name="time-outline" size={13} color={timerColor} />
          <Text style={[styles.timerText, { color: timerColor }]}>
            {mins}:{String(secs).padStart(2, '0')}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Meta */}
        <Text style={styles.typeTag}>
          {challenge.type.replace(/_/g, ' ')} · {challenge.difficulty}
        </Text>
        <Text style={styles.title}>{challenge.title}</Text>

        {/* Prompt (debugging & syntax) */}
        {content?.prompt && (
          <Text style={styles.prompt}>{content.prompt}</Text>
        )}

        {/* Code block — debugging buggy code */}
        {isDebug && content?.buggyCode && (
          <View style={styles.codeBlock}>
            <Text style={styles.codeLabel}>Buggy code</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.code}>{content.buggyCode}</Text>
            </ScrollView>
          </View>
        )}

        {/* Code block — output prediction / trace */}
        {!isDebug && content?.code && (
          <View style={styles.codeBlock}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.code}>{content.code}</Text>
            </ScrollView>
          </View>
        )}

        {/* MCQ options */}
        {isMCQ && content?.options?.map((opt: any, i: number) => (
          <Pressable
            key={i}
            style={[styles.option, selectedIdx === i && styles.optionSelected]}
            onPress={() => setSelectedIdx(i)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedIdx === i }}
          >
            <View style={[styles.optionDot, selectedIdx === i && styles.optionDotSelected]} />
            <Text style={styles.optionText}>{typeof opt === 'string' ? opt : opt.label}</Text>
          </Pressable>
        ))}

        {/* Debugging text input */}
        {isDebug && (
          <View>
            <Text style={styles.inputLabel}>Your fix</Text>
            <TextInput
              style={[styles.codeInput, wrongFlash && styles.codeInputError]}
              value={answer}
              onChangeText={setAnswer}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              placeholderTextColor={colors.textMuted}
              placeholder="Enter the corrected code…"
            />
          </View>
        )}
      </ScrollView>

      {/* Submit */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && styles.submitPressed,
            submitting && styles.submitDisabled,
          ]}
          onPress={() => handleSubmit()}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Submit answer"
        >
          <Text style={styles.submitText}>
            {submitting ? 'Checking…' : 'Submit answer'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  scroll:  { flex: 1 },
  content: { padding: space[4], paddingBottom: space[10], gap: space[4] },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: { padding: space[1] },
  hearts: { flexDirection: 'row', gap: 3 },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space[2],
    paddingVertical: space[1],
    borderRadius: radius.xs,
  },
  timerUrgent: { backgroundColor: colors.errorSub },
  timerText: {
    fontSize: font.size.label,
    fontWeight: font.weight.semibold,
    fontFamily: font.mono,
  },

  typeTag: {
    color: colors.textMuted,
    fontSize: font.size.caption,
    fontWeight: font.weight.medium,
    textTransform: 'capitalize',
  },
  title: {
    color: colors.text,
    fontSize: font.size.h2,
    fontWeight: font.weight.bold,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  prompt: {
    color: colors.textSub,
    fontSize: font.size.body,
    lineHeight: 22,
  },

  codeBlock: {
    backgroundColor: '#0A0A0D',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[4],
    gap: space[2],
  },
  codeLabel: {
    color: colors.textMuted,
    fontSize: font.size.caption,
    fontWeight: font.weight.medium,
  },
  code: {
    color: '#E2E8F0',
    fontFamily: font.mono,
    fontSize: 13,
    lineHeight: 21,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[3],
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[4],
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSub,
  },
  optionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.textMuted,
    marginTop: 1,
  },
  optionDotSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
  optionText: {
    flex: 1,
    color: colors.text,
    fontSize: font.size.label,
    fontFamily: font.mono,
    lineHeight: 20,
  },

  inputLabel: {
    color: colors.textSub,
    fontSize: font.size.label,
    fontWeight: font.weight.medium,
    marginBottom: space[2],
  },
  codeInput: {
    backgroundColor: '#0A0A0D',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[4],
    color: '#E2E8F0',
    fontFamily: font.mono,
    fontSize: 13,
    minHeight: 160,
    textAlignVertical: 'top',
    lineHeight: 21,
  },
  codeInputError: { borderColor: colors.error },

  footer: {
    padding: space[4],
    paddingBottom: space[6],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: space[3] + 2,
    alignItems: 'center',
  },
  submitPressed: { opacity: 0.8 },
  submitDisabled: { opacity: 0.5 },
  submitText: {
    color: '#fff',
    fontSize: font.size.body,
    fontWeight: font.weight.semibold,
  },
});
