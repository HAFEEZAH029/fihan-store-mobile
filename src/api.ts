import { config } from './config';
import { supabase } from './supabase';

export async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${config.apiUrl}${path}`, {
      method, signal: controller.signal, redirect: 'error',
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json().catch(() => { throw new Error('The store API did not return JSON. Check EXPO_PUBLIC_API_URL.'); });
    if (!response.ok) throw new Error(result.error || `Store request failed (${response.status})`);
    return result as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The store took too long to respond. Check your connection and retry.');
    throw error;
  } finally { clearTimeout(timeout); }
}
