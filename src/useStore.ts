import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { completeLogin, signInWithGoogle } from './auth';
import { configured } from './config';
import { request } from './api';
import { supabase } from './supabase';
import type { CartItem, Product } from './types';

export function useStore() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(configured);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sync, setSync] = useState('Sign in to sync your bag');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const currentUser = useRef<string | null>(null);
  const mutation = useRef(false);
  const cartRequest = useRef(0);
  const report = useCallback((e: unknown) => setError(e instanceof Error ? e.message : 'Please try again.'), []);

  const refreshCart = useCallback(async () => {
    const userId = currentUser.current;
    if (!userId) return;
    const version = ++cartRequest.current;
    try {
      const { items } = await request<{ items: CartItem[] }>('/api/cart');
      if (currentUser.current === userId && version === cartRequest.current) {
        setCart(items); setLastSynced(new Date());
      }
    } catch (e) { if (currentUser.current === userId) report(e); }
  }, [report]);
  const refreshProducts = useCallback(async () => {
    setLoading(true);
    try { setProducts((await request<{ products: Product[] }>('/api/products')).products); }
    catch (e) { report(e); }
    finally { setLoading(false); }
  }, [report]);

  useEffect(() => {
    if (!configured) return;
    let active = true;
    let authChanged = false;
    const update = (value: Session | null) => {
      if (!active) return;
      const id = value?.user.id ?? null;
      if (currentUser.current !== id) {
        setCart([]); setLastSynced(null); cartRequest.current++;
        setSync(id ? 'Connecting live sync…' : 'Sign in to sync your bag');
      }
      currentUser.current = id;
      setSession(value); setAuthLoading(false);
    };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, value) => { authChanged = true; update(value); });
    void supabase.auth.getSession().then(({ data, error: problem }) => {
      if (problem && active) report(problem);
      if (!authChanged) update(data.session);
    }).catch(e => { if (active) { report(e); setAuthLoading(false); } });
    const loginCallback = ({ url }: { url: string }) => { void completeLogin(url).catch(report); };
    const links = Linking.addEventListener('url', loginCallback);
    void Linking.getInitialURL().then(url => { if (url && active) loginCallback({ url }); }).catch(report);
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') { supabase.auth.startAutoRefresh(); void refreshCart(); }
      else supabase.auth.stopAutoRefresh();
    });
    if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
    // Initial network fetch; the loading state reflects this external request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshProducts();
    return () => { active = false; listener.subscription.unsubscribe(); links.remove(); appState.remove(); supabase.auth.stopAutoRefresh(); };
  }, [refreshCart, refreshProducts, report]);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    // Fetch the signed-in user's server cart even if Realtime is unavailable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCart();
    // The per-user revision row changes on INSERT, UPDATE and DELETE of cart items.
    // This avoids exposing DELETE events from other customers' carts.
    const channel = supabase.channel(`cart-sync:${userId}`).on('postgres_changes', {
      event: '*', schema: 'public', table: 'cart_sync', filter: `user_id=eq.${userId}`,
    }, () => { if (active) void refreshCart(); }).subscribe(status => {
      if (!active) return;
      if (status === 'SUBSCRIBED') { setSync('Live sync connected'); void refreshCart(); }
      else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) setSync('Live sync reconnecting · checking every 5 seconds');
    });
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refreshCart(); }, 5000);
    return () => { active = false; clearInterval(timer); void supabase.removeChannel(channel); };
  }, [userId, refreshCart]);

  async function login() {
    if (mutation.current) return;
    mutation.current = true; setBusy(true); setError(null);
    try { await signInWithGoogle(); } catch (e) { report(e); }
    finally { mutation.current = false; setBusy(false); }
  }
  async function logout() {
    if (mutation.current) return;
    mutation.current = true; setBusy(true); setError(null);
    try { const { error: problem } = await supabase.auth.signOut({ scope: 'local' }); if (problem) throw problem; }
    catch (e) { report(e); }
    finally { mutation.current = false; setBusy(false); }
  }
  async function changeCart(productId: string, size: string, quantity: number, method: 'POST' | 'PATCH' | 'DELETE') {
    if (!currentUser.current) { await login(); return false; }
    if (mutation.current) return false;
    mutation.current = true; setBusy(true); setError(null);
    try {
      await request('/api/cart', method, { productId, size, ...(method !== 'DELETE' ? { quantity } : {}) });
      await refreshCart(); return true;
    } catch (e) { report(e); return false; }
    finally { mutation.current = false; setBusy(false); }
  }
  return { session, authLoading, products, cart, loading, busy, error, setError, sync, lastSynced, refreshCart, refreshProducts, login, logout, changeCart };
}
