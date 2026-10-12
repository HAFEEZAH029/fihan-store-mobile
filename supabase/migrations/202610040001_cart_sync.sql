-- Run once in the EXISTING Fihan Store Supabase project's SQL Editor.
begin;
create table public.cart_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1
);
alter table public.cart_sync enable row level security;
revoke all on public.cart_sync from anon, authenticated;
grant select on public.cart_sync to authenticated;
create policy "Customers can read their cart revision" on public.cart_sync
  for select to authenticated using ((select auth.uid()) = user_id);
create function public.notify_cart_sync()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid;
begin
  if TG_OP = 'DELETE' then v_user_id := OLD.user_id;
  else v_user_id := NEW.user_id;
  end if;
  -- Ignore account-deletion cascades.
  if exists (select 1 from auth.users where id = v_user_id) then
    insert into public.cart_sync(user_id) values (v_user_id)
    on conflict (user_id) do update set revision = cart_sync.revision + 1;
  end if;
  return null;
end;
$$;
revoke all on function public.notify_cart_sync() from public, anon, authenticated;
create trigger cart_sync_changed after insert or update or delete on public.cart_items
  for each row execute function public.notify_cart_sync();
do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;
alter publication supabase_realtime add table public.cart_sync;
commit;
