import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

test('existing API supports mobile tokens and keeps cookie authentication', async () => {
  const source = await readFile(new URL('../backend/src/lib/api.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let cookieCalls = 0;
  let tokenOptions;
  let validatedToken;
  const cookieUser = { id: 'website-customer' };
  const tokenUser = { id: 'mobile-customer' };
  const cookieClient = { auth: { getUser: async () => ({ data: { user: cookieUser }, error: null }) } };
  const tokenClient = { auth: { getUser: async token => {
    validatedToken = token;
    return { data: { user: token === 'valid-token' ? tokenUser : null }, error: token === 'valid-token' ? null : new Error('invalid token') };
  } } };
  const imports = {
    '@/lib/supabase/server': { createClient: async () => { cookieCalls++; return cookieClient; } },
    '@/lib/supabase/config': { isSupabaseConfigured: () => true, getSupabaseConfig: () => ({ url: 'https://example.supabase.co', key: 'public-key' }) },
    '@supabase/supabase-js': { createClient: (_url, _key, options) => { tokenOptions = options; return tokenClient; } },
  };
  const exports = {};
  new Function('require', 'exports', code)(name => imports[name], exports);
  const api = exports.api;
  const req = (headers = {}, method = 'GET') => new Request('https://fihan-store.vercel.app/api/cart', { headers, method });
  const work = async ({ supabase, user }) => ({ id: user?.id, client: supabase === tokenClient ? 'token' : 'cookie' });
  const cookie = await api(req(), work, true);
  assert.deepEqual(await cookie.json(), { id: cookieUser.id, client: 'cookie' });
  assert.equal(cookieCalls, 1);
  const mobile = await api(req({ Authorization: 'Bearer valid-token' }), work, true);
  assert.deepEqual(await mobile.json(), { id: tokenUser.id, client: 'token' });
  assert.equal(validatedToken, 'valid-token');
  assert.equal(tokenOptions.global.headers.Authorization, 'Bearer valid-token');
  assert.equal(tokenOptions.auth.persistSession, false);
  assert.equal(cookieCalls, 1, 'Bearer requests never use website cookies');
  assert.equal((await api(req({ Authorization: 'Bearer forged-token' }), work, true)).status, 401);
  assert.equal((await api(req({ Authorization: 'Basic something' }), work, true)).status, 401);
  assert.equal((await api(req({ Authorization: 'Bearer forged-token' }), work)).status, 401, 'public endpoints also reject supplied invalid credentials');
  const post = await api(req({ Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' }, 'POST'), work, true);
  assert.equal(post.status, 200);
  assert.equal((await api(req({ Authorization: 'Bearer valid-token', Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, 'POST'), work, true)).status, 403);
  assert.equal((await api(req({ Authorization: 'Bearer valid-token' }, 'POST'), work, true)).status, 415);
});
