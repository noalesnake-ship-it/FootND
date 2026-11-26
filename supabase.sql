-- KickBrawl 3D : base de données Supabase
-- À coller dans Supabase > SQL Editor > Run (une seule fois).
-- Une seule table "kv" (chemin -> valeur JSON) + règles de sécurité (RLS) par chemin.

create table if not exists public.kv (
  path  text primary key,
  grp   text not null default '',
  val   jsonb not null,
  owner uuid not null default auth.uid(),
  t     timestamptz not null default now()
);
create index if not exists kv_grp_idx on public.kv (grp);

-- grp = 2 premiers segments du chemin (sert au temps réel)
create or replace function public.kv_set_grp() returns trigger language plpgsql as $$
begin
  new.grp := split_part(new.path,'/',1) || '/' || split_part(new.path,'/',2);
  return new;
end $$;
drop trigger if exists kv_grp_trg on public.kv;
create trigger kv_grp_trg before insert or update of path on public.kv
  for each row execute function public.kv_set_grp();

alter table public.kv replica identity full;
alter table public.kv enable row level security;

-- ---------- règles ----------
create or replace function public.kv_host(code text) returns text
language sql stable security definer set search_path = public as $$
  select val #>> '{}' from public.kv where path = 'rooms/' || code || '/host'
$$;

create or replace function public.kv_exists(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.kv where path = p)
$$;

create or replace function public.kv_owner(p text) returns uuid
language sql stable security definer set search_path = public as $$
  select owner from public.kv where path = p
$$;

create or replace function public.kv_can_read(p text) returns boolean
language sql stable set search_path = public as $$
  select auth.uid() is not null and (
    split_part(p,'/',1) in ('users','codes','names','presence','rooms')
    or (split_part(p,'/',1) = 'saves' and split_part(p,'/',2) = auth.uid()::text)
    or (split_part(p,'/',1) in ('friends','invites')
        and auth.uid()::text in (split_part(p,'/',2), split_part(p,'/',3)))   -- visible par les deux parties
  )
$$;

create or replace function public.kv_can_insert(p text, v jsonb) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  me text := auth.uid()::text;
  r text := split_part(p,'/',1);
  a text := split_part(p,'/',2);
  b text := split_part(p,'/',3);
  c text := split_part(p,'/',4);
begin
  if me is null or a = '' then return false; end if;
  if r in ('users','saves','presence') then return a = me; end if;
  if r in ('friends','invites') then return a = me or b = me; end if;
  if r in ('codes','names') then
    return b = '' and v = to_jsonb(me) and not exists(select 1 from public.kv where path = p);
  end if;
  if r = 'rooms' then
    if p = 'rooms/' || a || '/host' then
      return v = to_jsonb(me) and kv_host(a) is null;      -- création du salon
    end if;
    if b in ('m','in') and c = me then return true; end if;  -- son propre emplacement
    return kv_host(a) = me;                                  -- le reste : hôte seulement
  end if;
  return false;
end $$;

create or replace function public.kv_can_delete(p text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  me text := auth.uid()::text;
  r text := split_part(p,'/',1);
  a text := split_part(p,'/',2);
  b text := split_part(p,'/',3);
  c text := split_part(p,'/',4);
begin
  if me is null or a = '' then return false; end if;
  if r in ('users','saves','presence') then return a = me; end if;
  if r in ('friends','invites') then return a = me or b = me; end if;
  if r = 'codes' then return kv_owner(p) = auth.uid(); end if;
  if r = 'rooms' then
    if b in ('m','in') and c = me then return true; end if;
    return kv_host(a) = me;
  end if;
  return false;
end $$;

drop policy if exists kv_select on public.kv;
drop policy if exists kv_insert on public.kv;
drop policy if exists kv_delete on public.kv;
create policy kv_select on public.kv for select to authenticated using (public.kv_can_read(path));
create policy kv_insert on public.kv for insert to authenticated with check (owner = auth.uid() and public.kv_can_insert(path, val));
create policy kv_delete on public.kv for delete to authenticated using (public.kv_can_delete(path));

-- remplace tout le sous-arbre "prefix" par les feuilles données (l'ordre compte : l'hôte d'abord)
create or replace function public.kv_replace(prefix text, leaves jsonb) returns void
language plpgsql set search_path = public as $$
declare r record;
begin
  if prefix is null or prefix = '' then raise exception 'prefix vide'; end if;
  delete from public.kv
   where path = prefix or left(path, length(prefix) + 1) = prefix || '/';
  for r in
    select e->>'path' as path, e->'val' as val
      from jsonb_array_elements(leaves) with ordinality as t(e, ord)
     order by ord
  loop
    insert into public.kv(path, val) values (r.path, r.val);
  end loop;
end $$;

-- ---------- accès API ----------
revoke all on public.kv from anon;
grant select, insert, delete on public.kv to authenticated;
grant execute on function public.kv_replace(text, jsonb) to authenticated;
grant execute on function public.kv_host(text), public.kv_exists(text), public.kv_owner(text),
  public.kv_can_read(text), public.kv_can_insert(text, jsonb), public.kv_can_delete(text) to authenticated;

-- ---------- temps réel ----------
do $$ begin
  alter publication supabase_realtime add table public.kv;
exception when duplicate_object then null; end $$;
