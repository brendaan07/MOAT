// The login session as React context: loads the saved session, follows log in and log out, and turns Supabase errors into friendly messages.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthError, Session, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

/** Matches the minimum password length set in the Supabase console (Authentication → Providers → Email). */
export const MIN_PASSWORD = 8;

/** error is null when it worked; needsConfirm means sign up worked but the email must be confirmed before logging in. */
export interface AuthResult {
  error: string | null;
  needsConfirm?: boolean;
}

interface AuthValue {
  /** True once the saved session has loaded, so a logged-in learner never sees the login screen flash. */
  hydrated: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** A message a learner can act on, for each Supabase error they can cause. */
function friendly(error: AuthError): string {
  if (isAuthRetryableFetchError(error)) return "Can't reach the server. Check your connection and try again.";
  switch (error.code) {
    case 'invalid_credentials':
      return "That email and password don't match.";
    case 'user_already_exists':
    case 'email_exists':
      return 'That email already has an account. Log in instead.';
    case 'weak_password':
      return `Use at least ${MIN_PASSWORD} characters.`;
    case 'email_address_invalid':
      return "That email address doesn't look right.";
    case 'email_not_confirmed':
      return 'Confirm your email first. The link is in your inbox.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many tries. Wait a minute and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/** Loads the saved session and provides it, with log in, sign up and log out, to the app. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  // The first event is the saved session (or none); later ones are log in, log out and token refreshes.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setHydrated(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return { error: error ? friendly(error) : null };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) return { error: friendly(error) };
    // With email confirmation on, a taken email comes back as a user with no identities instead of an error.
    if (data.user && data.user.identities?.length === 0) return { error: 'That email already has an account. Log in instead.' };
    return { error: null, needsConfirm: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value: AuthValue = { hydrated, session, signIn, signUp, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** The login session and its actions. */
export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
