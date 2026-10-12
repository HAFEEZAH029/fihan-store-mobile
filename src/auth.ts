import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { supabase } from './supabase';

export const redirectTo = 'fihanstore://auth/callback';
let exchanging: Promise<void> | null = null;
let lastCode: string | null = null;

export async function completeLogin(url: string) {
  if (!url.startsWith(`${redirectTo}?`)) return;
  const params = new URL(url).searchParams;
  const problem = params.get('error_description') || params.get('error');
  if (problem) throw new Error(problem);
  const code = params.get('code');
  if (!code) throw new Error('Google did not return a login code. Please try again.');
  if (lastCode === code) return;
  if (exchanging) return exchanging;
  exchanging = (async () => {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    lastCode = code;
  })();
  try { await exchanging; } finally { exchanging = null; }
}

export async function signInWithGoogle() {
  if (Constants.appOwnership === 'expo') {
    throw new Error('Install the Fihan Store Android development build to use Google login. See README.md.');
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Google login is unavailable.');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success') await completeLogin(result.url);
}
