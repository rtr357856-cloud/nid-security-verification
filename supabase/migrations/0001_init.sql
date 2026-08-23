-- MasterLink initial schema
-- Extensible messaging platform enum (add new platforms here for future expansion)

create type public.messaging_platform as enum ('sms', 'whatsapp', 'telegram');

create table public.links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  recipient_number text not null,
  message text not null,
  platform public.messaging_platform not null default 'sms',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index links_slug_idx on public.links (slug);

create table public.clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  device_type text,
  browser text,
  os text
);

create index clicks_link_id_clicked_idx on public.clicks (link_id, clicked_at);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helper used by RLS policies (security definer bypasses RLS to check admin role)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.is_admin
  )
$$;

revoke execute on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;

-- Public link resolution. Security definer so anonymous visitors can resolve a
-- single unguessable slug without being able to enumerate the links table.
create or replace function public.resolve_link(p_slug text)
returns table (
  id uuid,
  slug text,
  recipient_number text,
  message text,
  platform public.messaging_platform,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.slug, l.recipient_number, l.message, l.platform, l.status
  from public.links l
  where l.slug = p_slug
  limit 1;
$$;

revoke execute on function public.resolve_link(text) from public;
grant execute on function public.resolve_link(text) to anon, authenticated;

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.links enable row level security;
alter table public.clicks enable row level security;
alter table public.profiles enable row level security;

-- Aggregate stats view (security_invoker => RLS of base tables applies)
create or replace view public.link_stats
with (security_invoker = true) as
select
  l.id as link_id,
  count(c.id) as total_clicks,
  max(c.clicked_at) as last_opened
from public.links l
left join public.clicks c on c.link_id = l.id
group by l.id;

revoke all on public.link_stats from anon;
grant select on public.link_stats to authenticated;

-- Public policies -------------------------------------------------------------
-- Public access is limited to the resolve_link RPC (single-slug lookup only).

-- Public can record a click.
create policy "public_insert_clicks" on public.clicks
  for insert to anon, authenticated with check (true);

-- Admin policies --------------------------------------------------------------
create policy "admin_select_links" on public.links
  for select to authenticated using (public.is_admin(auth.uid()));

create policy "admin_insert_links" on public.links
  for insert to authenticated with check (public.is_admin(auth.uid()));

create policy "admin_update_links" on public.links
  for update to authenticated using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admin_delete_links" on public.links
  for delete to authenticated using (public.is_admin(auth.uid()));

create policy "admin_select_clicks" on public.clicks
  for select to authenticated using (public.is_admin(auth.uid()));

-- Profiles --------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select to authenticated using (public.is_admin(auth.uid()));
