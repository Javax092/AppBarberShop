-- Refatora barbeiros para perfis internos sem dependencia de auth.users.
-- Mantem apenas administradores em public.staff_profiles / Supabase Auth.

create table if not exists public.barber_profiles (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null unique references public.barbers (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  status text not null default 'active',
  created_by_admin_id uuid references auth.users (id) on delete set null,
  backend_user_id text,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint barber_profiles_status_check check (status in ('active', 'inactive', 'deleted'))
);

create table if not exists public.barber_auth_credentials (
  barber_profile_id uuid primary key references public.barber_profiles (id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.barbers add column if not exists status text not null default 'active';
alter table public.barbers add column if not exists created_by_admin_id uuid references auth.users (id) on delete set null;
alter table public.barbers add column if not exists backend_user_id text;
alter table public.barbers add column if not exists deleted_at timestamptz;
alter table public.barber_availability alter column id set default gen_random_uuid();
alter table public.schedule_blocks alter column id set default gen_random_uuid();

create index if not exists barber_profiles_email_idx on public.barber_profiles (email);
create index if not exists barber_profiles_active_idx on public.barber_profiles (is_active, status);
create index if not exists barber_auth_credentials_email_idx on public.barber_auth_credentials (email);

drop trigger if exists set_barber_profiles_updated_at on public.barber_profiles;
create trigger set_barber_profiles_updated_at
before update on public.barber_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_barber_auth_credentials_updated_at on public.barber_auth_credentials;
create trigger set_barber_auth_credentials_updated_at
before update on public.barber_auth_credentials
for each row execute function public.set_updated_at();

insert into public.barber_profiles (
  id,
  barber_id,
  full_name,
  email,
  phone,
  avatar_url,
  is_active,
  status,
  created_at,
  updated_at
)
select
  sp.id,
  sp.barber_id,
  sp.full_name,
  lower(trim(sp.email)),
  sp.phone,
  coalesce(sp.avatar_url, b.avatar_url),
  sp.is_active,
  case when sp.is_active then 'active' else 'inactive' end,
  sp.created_at,
  sp.updated_at
from public.staff_profiles sp
join public.barbers b on b.id = sp.barber_id
where sp.role = 'barber'
  and sp.barber_id is not null
on conflict (id) do update
set barber_id = excluded.barber_id,
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    avatar_url = excluded.avatar_url,
    is_active = excluded.is_active,
    status = excluded.status,
    updated_at = timezone('utc', now());

insert into public.barber_auth_credentials (
  barber_profile_id,
  email,
  password_hash,
  created_at,
  updated_at
)
select
  sac.user_id,
  lower(trim(sac.email)),
  sac.password_hash,
  sac.created_at,
  sac.updated_at
from public.staff_auth_credentials sac
join public.barber_profiles bp on bp.id = sac.user_id
on conflict (barber_profile_id) do update
set email = excluded.email,
    password_hash = excluded.password_hash,
    updated_at = timezone('utc', now());

update public.barbers b
set is_active = bp.is_active,
    status = bp.status,
    avatar_url = coalesce(bp.avatar_url, b.avatar_url),
    phone = coalesce(bp.phone, b.phone),
    backend_user_id = bp.backend_user_id,
    updated_at = timezone('utc', now())
from public.barber_profiles bp
where bp.barber_id = b.id;

alter table public.barber_profiles enable row level security;
alter table public.barber_auth_credentials enable row level security;

drop policy if exists "barber_profiles_admin_select" on public.barber_profiles;
create policy "barber_profiles_admin_select"
on public.barber_profiles
for select
using (public.is_admin());

drop policy if exists "barber_profiles_admin_insert" on public.barber_profiles;
create policy "barber_profiles_admin_insert"
on public.barber_profiles
for insert
with check (public.is_admin());

drop policy if exists "barber_profiles_admin_update" on public.barber_profiles;
create policy "barber_profiles_admin_update"
on public.barber_profiles
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "barber_profiles_admin_delete" on public.barber_profiles;
create policy "barber_profiles_admin_delete"
on public.barber_profiles
for delete
using (public.is_admin());

drop policy if exists "barber_auth_credentials_admin_only" on public.barber_auth_credentials;
create policy "barber_auth_credentials_admin_only"
on public.barber_auth_credentials
for all
using (public.is_admin())
with check (public.is_admin());

create or replace function public.sync_barber_auth_password(
  input_profile_id uuid,
  input_email text,
  input_password text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.barber_auth_credentials (barber_profile_id, email, password_hash)
  values (
    input_profile_id,
    lower(trim(input_email)),
    public.hash_staff_password(input_password)
  )
  on conflict (barber_profile_id) do update
  set email = excluded.email,
      password_hash = excluded.password_hash,
      updated_at = timezone('utc', now());
end;
$$;

create or replace function public.sync_barber_auth_email(
  input_profile_id uuid,
  input_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.barber_auth_credentials
  set email = lower(trim(input_email)),
      updated_at = timezone('utc', now())
  where barber_profile_id = input_profile_id;
end;
$$;

create or replace function public.authenticate_staff(
  input_email text,
  input_password text,
  input_role public.app_role default null
)
returns table (
  user_id uuid,
  email text,
  full_name text,
  role public.app_role,
  phone text,
  avatar_url text,
  barber_id uuid,
  is_active boolean
)
language sql
security definer
set search_path = public
as $$
  select
    bp.id as user_id,
    bp.email,
    bp.full_name,
    'barber'::public.app_role as role,
    bp.phone,
    bp.avatar_url,
    bp.barber_id,
    bp.is_active
  from public.barber_profiles bp
  join public.barber_auth_credentials bac
    on bac.barber_profile_id = bp.id
  where lower(trim(bp.email)) = lower(trim(input_email))
    and lower(trim(bac.email)) = lower(trim(input_email))
    and bp.is_active = true
    and bp.deleted_at is null
    and (input_role is null or input_role = 'barber')
    and extensions.crypt(input_password, bac.password_hash) = bac.password_hash
  limit 1;
$$;

create or replace function public.update_own_barber_profile_app_user(
  input_email text,
  input_password text,
  input_full_name text,
  input_phone text,
  input_avatar_url text,
  input_bio text,
  input_specialties text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  authenticated_profile_id uuid;
  authenticated_barber_id uuid;
begin
  select user_id, barber_id
  into authenticated_profile_id, authenticated_barber_id
  from public.authenticate_staff(input_email, input_password, 'barber');

  if authenticated_profile_id is null or authenticated_barber_id is null then
    raise exception 'Credenciais invalidas para barbeiro.';
  end if;

  update public.barber_profiles
  set full_name = trim(input_full_name),
      phone = nullif(trim(coalesce(input_phone, '')), ''),
      avatar_url = nullif(trim(coalesce(input_avatar_url, '')), ''),
      updated_at = timezone('utc', now())
  where id = authenticated_profile_id;

  update public.barbers
  set name = trim(input_full_name),
      bio = coalesce(input_bio, ''),
      phone = nullif(trim(coalesce(input_phone, '')), ''),
      avatar_url = nullif(trim(coalesce(input_avatar_url, '')), ''),
      specialties = coalesce(input_specialties, '{}'),
      updated_at = timezone('utc', now())
  where id = authenticated_barber_id;
end;
$$;
