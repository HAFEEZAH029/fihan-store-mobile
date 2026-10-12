import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
test('cart revisions cover mutations, checkout, RLS and account deletion', async () => {
  const db = new PGlite();
  const alice = '11111111-1111-4111-8111-111111111111';
  const bob = '22222222-2222-4222-8222-222222222222';
  async function asUser(id, work) {
    await db.exec('begin; set local role authenticated;');
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
    try { const result = await work(); await db.exec('commit;'); return result; }
    catch (error) { await db.exec('rollback;'); throw error; }
  }
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;`);
    await db.query("insert into auth.users values ($1, 'alice@example.com'), ($2, 'bob@example.com')", [alice, bob]);
    await db.exec(await readFile(new URL('./fixtures/store.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('./fixtures/seed.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/202610040001_cart_sync.sql', import.meta.url), 'utf8'));
    const product = (await db.query('select * from public.products limit 1')).rows[0];
    const change = (id, mode, quantity = 1) => asUser(id, () => db.query('select public.change_cart_item($1, $2, $3, $4)', [product.id, product.sizes[0], quantity, mode]));
    const revision = async id => Number((await asUser(id, () => db.query('select revision from public.cart_sync'))).rows[0]?.revision ?? 0);
    await change(alice, 'add'); assert.equal(await revision(alice), 1);
    await change(bob, 'add'); assert.equal(await revision(bob), 1);
    await change(alice, 'set', 3); assert.equal(await revision(alice), 2);
    await change(alice, 'remove', 0); assert.equal(await revision(alice), 3);
    assert.equal(await revision(bob), 1);
    await assert.rejects(asUser(alice, () => db.query('update public.cart_sync set revision = 100')), /permission denied/);
    await assert.rejects(asUser(alice, () => db.query('select public.notify_cart_sync()')), /permission denied/);
    await db.exec('begin; set local role anon;');
    await assert.rejects(db.query('select * from public.cart_sync'), /permission denied/);
    await db.exec('rollback;');
    await change(alice, 'add');
    await asUser(alice, () => db.query("select public.create_order($1, 'Alice Test', '+2348001234567', $2::jsonb)", ['33333333-3333-4333-8333-333333333333', JSON.stringify({ address: '12 Street', city: 'Lagos', country: 'Nigeria' })]));
    assert.equal(await revision(alice), 5);
    assert.equal((await asUser(alice, () => db.query('select * from public.cart_items'))).rows.length, 0);
    await db.query('delete from auth.users where id = $1', [bob]);
    assert.equal((await db.query('select * from public.cart_sync where user_id = $1', [bob])).rows.length, 0);
  } finally { await db.close(); }
});
