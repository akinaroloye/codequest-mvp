import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../services/api';
import { useUserStore } from '../store/useUserStore';
import { colors, font, space, radius } from '../theme';

export function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const setToken = useUserStore((s) => s.setToken);
  const setUser = useUserStore((s) => s.setUser);

  const submit = async () => {
    if (!email || !password || (mode === 'register' && !username)) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const token = mode === 'register'
        ? await authApi.register(email, username, password)
        : await authApi.login(email, password);
      setToken(token);
      const user = await authApi.me();
      setUser(user);
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? 'Something went wrong. Check your connection.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.wordmark}>CodeQuest</Text>
          <Text style={styles.tagline}>Practice that makes permanent.</Text>
        </View>

        <View style={styles.toggle}>
          {(['login', 'register'] as const).map((m) => (
            <Pressable
              key={m}
              style={[styles.toggleBtn, mode === m && styles.toggleActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              returnKeyType="next"
            />
            {mode === 'register' && (
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed, loading && styles.disabled]}
            onPress={submit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={mode === 'login' ? 'Sign in' : 'Create account'}
          >
            {loading
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={styles.submitText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: space[6], gap: space[8] },
  header: { gap: space[2] },
  wordmark: {
    color: colors.text,
    fontSize: font.size.hero,
    fontWeight: font.weight.heavy,
    letterSpacing: -0.5,
  },
  tagline: {
    color: colors.textSub,
    fontSize: font.size.body,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: space[2] + 2,
    borderRadius: radius.xs + 2,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: colors.accent },
  toggleText: {
    color: colors.textSub,
    fontSize: font.size.label,
    fontWeight: font.weight.medium,
  },
  toggleTextActive: { color: '#fff', fontWeight: font.weight.semibold },
  form: { gap: space[3] },
  fieldGroup: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    color: colors.text,
    fontSize: font.size.body,
    paddingVertical: space[3] + 2,
    paddingHorizontal: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: space[3] + 2,
    alignItems: 'center',
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  submitText: {
    color: '#fff',
    fontSize: font.size.body,
    fontWeight: font.weight.semibold,
  },
});
