// Log in or create an account: shown before onboarding to anyone without a saved session.
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from '../components/SafeAreaView';
import { BundleImage, Card, ChunkyButton } from '../components/ui';
import { MIN_PASSWORD, useAuth } from '../hooks/useAuth';
import { C, body, heading } from '../utils/theme';

type Mode = 'login' | 'signup';

/** The words for each mode; login is the default. */
const COPY: Record<Mode, { subtitle: string; button: string; busy: string; toggle: string }> = {
  login: { subtitle: 'Log in to pick up where you left off.', button: 'Log in', busy: 'Logging in…', toggle: 'New here? Create an account' },
  signup: { subtitle: 'Create an account to get started.', button: 'Create account', busy: 'Creating account…', toggle: 'Already have an account? Log in' },
};

/** An outlined input box like onboarding's name field, with an optional button at the right end. */
const Field = React.forwardRef<TextInput, TextInputProps & { trailing?: React.ReactNode }>(({ trailing, ...props }, ref) => (
  <Card radius={14} shadow contentStyle={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: trailing ? 4 : 16 }}>
    <TextInput ref={ref} placeholderTextColor={C.muted} autoCorrect={false} style={[body(16, true), { flex: 1, paddingVertical: 12 }]} {...props} />
    {trailing}
  </Card>
));

/** The mascot, a welcome line, email and password, then log in or sign up. */
export default function AuthScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const passwordField = useRef<TextInput>(null);
  const copy = COPY[mode];
  const ready = email.includes('@') && password.length >= (mode === 'signup' ? MIN_PASSWORD : 1);

  // A successful log in or sign up changes the session, and RootNavigator moves on by itself.
  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = mode === 'login' ? await auth.signIn(email, password) : await auth.signUp(email, password);
    setBusy(false);
    setError(result.error);
    if (result.needsConfirm) {
      setNotice('Check your email to confirm your account, then log in.');
      setMode('login');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setNotice(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.cream }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 }}>
          <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: 14 }}>
            <BundleImage name="blob_excited" style={{ width: 96, height: 108, alignSelf: 'center' }} />
            <Text style={[heading(28), { textAlign: 'center' }]} accessibilityRole="header">Get ready to start learning</Text>
            <Text style={[body(15, true), { color: C.muted, textAlign: 'center', marginBottom: 6 }]}>{copy.subtitle}</Text>

            <Field
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordField.current?.focus()}
              accessibilityLabel="Email"
            />
            <Field
              ref={passwordField}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              textContentType={mode === 'login' ? 'password' : 'newPassword'}
              returnKeyType="go"
              onSubmitEditing={submit}
              accessibilityLabel="Password"
              trailing={
                <Pressable onPress={() => setShowPassword(!showPassword)} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={C.muted} />
                </Pressable>
              }
            />
            {mode === 'signup' && <Text style={[body(13), { color: C.muted }]}>At least {MIN_PASSWORD} characters.</Text>}
            {error && <Text style={[body(14, true), { color: C.brownText }]} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text>}
            {notice && <Text style={[body(14, true), { color: C.greenText }]} accessibilityLiveRegion="polite">{notice}</Text>}

            <ChunkyButton title={busy ? copy.busy : copy.button} enabled={ready && !busy} onPress={submit} style={{ marginTop: 6 }} />
            <Pressable onPress={toggleMode} accessibilityRole="button" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[body(16, true), { textDecorationLine: 'underline' }]}>{copy.toggle}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
