create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create or replace function public.is_hardcoded_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'ryanlmxxv@gmail.com';
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'barber');
  end if;

  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type public.appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.normalize_staff_profile()
returns trigger
language plpgsql
as $$
begin
  new.email = lower(trim(new.email));

  if new.role = 'admin' then
    new.barber_id = null;
  elsif new.barber_id is null then
    raise exception 'Perfis com role barber exigem barber_id valido.';
  end if;

  return new;
end;
$$;

create or replace function public.generate_appointment_code()
returns text
language sql
volatile
as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

create table if not exists public.staff_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.app_role not null,
  phone text,
  avatar_url text,
  barber_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.staff_auth_credentials (
  user_id uuid primary key references public.staff_profiles (id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text not null default '',
  phone text,
  avatar_url text,
  specialties text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'staff_profiles'
      and constraint_name = 'staff_profiles_barber_id_fkey'
  ) then
    alter table public.staff_profiles
      add constraint staff_profiles_barber_id_fkey
      foreign key (barber_id) references public.barbers (id) on delete set null;
  end if;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.is_hardcoded_admin()
    or exists (
      select 1
      from public.staff_profiles
      where id = auth.uid()
        and role = 'admin'
        and is_active = true
    );
$$;

create or replace function public.current_barber_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select barber_id
  from public.staff_profiles
  where id = auth.uid()
    and role = 'barber'
    and is_active = true;
$$;

create or replace function public.hash_staff_password(input_password text)
returns text
language sql
security definer
set search_path = public
as $$
  select extensions.crypt(input_password, extensions.gen_salt('bf'));
$$;

create or replace function public.sync_staff_app_password(
  input_user_id uuid,
  input_email text,
  input_password text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.staff_auth_credentials (user_id, email, password_hash)
  values (
    input_user_id,
    lower(trim(input_email)),
    public.hash_staff_password(input_password)
  )
  on conflict (user_id) do update
  set email = excluded.email,
      password_hash = excluded.password_hash,
      updated_at = timezone('utc', now());
end;
$$;

create or replace function public.sync_staff_app_credential_email(
  input_user_id uuid,
  input_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.staff_auth_credentials
  set email = lower(trim(input_email)),
      updated_at = timezone('utc', now())
  where user_id = input_user_id;
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
    sp.id as user_id,
    sp.email,
    sp.full_name,
    sp.role,
    sp.phone,
    sp.avatar_url,
    sp.barber_id,
    sp.is_active
  from public.staff_profiles sp
  join public.staff_auth_credentials sac
    on sac.user_id = sp.id
  where sp.email = lower(trim(input_email))
    and sac.email = lower(trim(input_email))
    and sp.is_active = true
    and (input_role is null or sp.role = input_role)
    and extensions.crypt(input_password, sac.password_hash) = sac.password_hash
  limit 1;
$$;

create or replace function public.list_barber_appointments_app_user(
  input_email text,
  input_password text,
  input_date date default null,
  input_status public.appointment_status default null
)
returns setof public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  authenticated_barber_id uuid;
begin
  select barber_id
  into authenticated_barber_id
  from public.authenticate_staff(input_email, input_password, 'barber');

  if authenticated_barber_id is null then
    raise exception 'Credenciais invalidas para barbeiro.';
  end if;

  return query
  select a.*
  from public.appointments a
  where a.barber_id = authenticated_barber_id
    and (input_date is null or a.appointment_date = input_date)
    and (input_status is null or a.status = input_status)
  order by a.appointment_date, a.start_time;
end;
$$;

create or replace function public.get_barber_dashboard_summary_app_user(
  input_email text,
  input_password text
)
returns table (
  today_appointments bigint,
  week_appointments bigint,
  estimated_revenue numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  authenticated_barber_id uuid;
  today_date date := current_date;
  week_end_date date := current_date + 7;
begin
  select barber_id
  into authenticated_barber_id
  from public.authenticate_staff(input_email, input_password, 'barber');

  if authenticated_barber_id is null then
    raise exception 'Credenciais invalidas para barbeiro.';
  end if;

  return query
  select
    count(*) filter (where a.appointment_date = today_date) as today_appointments,
    count(*) filter (where a.appointment_date between today_date and week_end_date) as week_appointments,
    coalesce(sum(a.total_price) filter (where a.appointment_date = today_date), 0)::numeric as estimated_revenue
  from public.appointments a
  where a.barber_id = authenticated_barber_id;
end;
$$;

create or replace function public.update_barber_appointment_status_app_user(
  input_email text,
  input_password text,
  input_appointment_id uuid,
  input_status public.appointment_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  authenticated_barber_id uuid;
begin
  select barber_id
  into authenticated_barber_id
  from public.authenticate_staff(input_email, input_password, 'barber');

  if authenticated_barber_id is null then
    raise exception 'Credenciais invalidas para barbeiro.';
  end if;

  update public.appointments
  set status = input_status,
      updated_at = timezone('utc', now())
  where id = input_appointment_id
    and barber_id = authenticated_barber_id;

  if not found then
    raise exception 'Agendamento nao encontrado para este barbeiro.';
  end if;
end;
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
  authenticated_user_id uuid;
  authenticated_barber_id uuid;
begin
  select user_id, barber_id
  into authenticated_user_id, authenticated_barber_id
  from public.authenticate_staff(input_email, input_password, 'barber');

  if authenticated_user_id is null or authenticated_barber_id is null then
    raise exception 'Credenciais invalidas para barbeiro.';
  end if;

  update public.staff_profiles
  set full_name = trim(input_full_name),
      phone = nullif(trim(coalesce(input_phone, '')), ''),
      avatar_url = nullif(trim(coalesce(input_avatar_url, '')), ''),
      updated_at = timezone('utc', now())
  where id = authenticated_user_id;

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

create or replace function public.replace_barber_availability_app_user(
  input_email text,
  input_password text,
  input_rows jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  authenticated_barber_id uuid;
begin
  select barber_id
  into authenticated_barber_id
  from public.authenticate_staff(input_email, input_password, 'barber');

  if authenticated_barber_id is null then
    raise exception 'Credenciais invalidas para barbeiro.';
  end if;

  delete from public.barber_availability
  where barber_id = authenticated_barber_id;

  insert into public.barber_availability (
    id,
    barber_id,
    day_of_week,
    start_time,
    end_time,
    slot_interval_minutes,
    is_active
  )
  select
    coalesce((item->>'id')::uuid, gen_random_uuid()),
    authenticated_barber_id,
    (item->>'day_of_week')::integer,
    (item->>'start_time')::time,
    (item->>'end_time')::time,
    coalesce((item->>'slot_interval_minutes')::integer, 30),
    coalesce((item->>'is_active')::boolean, true)
  from jsonb_array_elements(coalesce(input_rows, '[]'::jsonb)) item;
end;
$$;

create or replace function public.save_barber_staff_profile(
  input_user_id uuid,
  input_email text,
  input_full_name text,
  input_phone text,
  input_avatar_url text,
  input_is_active boolean,
  input_barber_id uuid,
  input_barber_name text,
  input_barber_bio text,
  input_barber_phone text,
  input_barber_avatar_url text,
  input_barber_specialties text[],
  input_barber_is_active boolean,
  input_default_availability jsonb default '[]'::jsonb
)
returns table (
  profile_id uuid,
  barber_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_barber_id uuid;
  should_seed_default_availability boolean := false;
begin
  if input_user_id is null then
    raise exception 'Usuario obrigatorio para salvar barbeiro.';
  end if;

  resolved_barber_id := input_barber_id;

  if resolved_barber_id is null then
    insert into public.barbers (
      name,
      bio,
      phone,
      avatar_url,
      specialties,
      is_active
    )
    values (
      trim(coalesce(input_barber_name, input_full_name)),
      coalesce(input_barber_bio, ''),
      nullif(trim(coalesce(input_barber_phone, input_phone, '')), ''),
      nullif(trim(coalesce(input_barber_avatar_url, input_avatar_url, '')), ''),
      coalesce(input_barber_specialties, '{}'),
      coalesce(input_barber_is_active, input_is_active, true)
    )
    returning id into resolved_barber_id;

    should_seed_default_availability := true;
  else
    update public.barbers
    set name = trim(coalesce(input_barber_name, input_full_name)),
        bio = coalesce(input_barber_bio, ''),
        phone = nullif(trim(coalesce(input_barber_phone, input_phone, '')), ''),
        avatar_url = nullif(trim(coalesce(input_barber_avatar_url, input_avatar_url, '')), ''),
        specialties = coalesce(input_barber_specialties, '{}'),
        is_active = coalesce(input_barber_is_active, input_is_active, true),
        updated_at = timezone('utc', now())
    where id = resolved_barber_id;

    if not found then
      raise exception 'Barbeiro informado nao foi encontrado.';
    end if;

    should_seed_default_availability := not exists (
      select 1
      from public.barber_availability
      where barber_id = resolved_barber_id
    );
  end if;

  insert into public.staff_profiles (
    id,
    email,
    full_name,
    role,
    phone,
    avatar_url,
    barber_id,
    is_active
  )
  values (
    input_user_id,
    lower(trim(input_email)),
    trim(input_full_name),
    'barber',
    nullif(trim(coalesce(input_phone, '')), ''),
    nullif(trim(coalesce(input_avatar_url, '')), ''),
    resolved_barber_id,
    coalesce(input_is_active, true)
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      phone = excluded.phone,
      avatar_url = excluded.avatar_url,
      barber_id = excluded.barber_id,
      is_active = excluded.is_active,
      updated_at = timezone('utc', now());

  if should_seed_default_availability then
    insert into public.barber_availability (
      barber_id,
      day_of_week,
      start_time,
      end_time,
      slot_interval_minutes,
      is_active
    )
    select
      resolved_barber_id,
      (item->>'day_of_week')::integer,
      (item->>'start_time')::time,
      (item->>'end_time')::time,
      coalesce((item->>'slot_interval_minutes')::integer, 30),
      coalesce((item->>'is_active')::boolean, true)
    from jsonb_array_elements(coalesce(input_default_availability, '[]'::jsonb)) item;
  end if;

  return query
  select input_user_id, resolved_barber_id;
end;
$$;

create or replace function public.public_home_snapshot()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  with active_barbers as (
    select
      b.id,
      b.name,
      b.bio,
      b.phone,
      b.avatar_url,
      b.specialties,
      b.created_at,
      b.updated_at
    from public.barbers b
    where b.is_active = true
  ),
  active_promotions as (
    select p.*
    from public.promotions p
    where p.is_active = true
      and timezone('utc', now()) between p.starts_at and p.ends_at
  ),
  active_services as (
    select
      s.id,
      s.name,
      s.description,
      s.price,
      s.duration_minutes,
      s.category,
      s.image_url,
      s.featured,
      s.created_at,
      s.updated_at,
      (
        select jsonb_build_object(
          'id', p.id,
          'title', p.title,
          'description', p.description,
          'discount_percent', p.discount_percent,
          'service_id', p.service_id,
          'starts_at', p.starts_at,
          'ends_at', p.ends_at,
          'image_url', p.image_url,
          'is_active', p.is_active,
          'status', 'ativa',
          'created_at', p.created_at,
          'updated_at', p.updated_at
        )
        from active_promotions p
        where p.service_id = s.id
        order by p.discount_percent desc, p.ends_at asc
        limit 1
      ) as promotion
    from public.services s
    where s.is_active = true
  ),
  service_metrics as (
    select
      count(*)::integer as services_count,
      count(distinct category)::integer as categories_count
    from active_services
  ),
  barber_metrics as (
    select
      count(*)::integer as barbers_count,
      count(*) filter (where coalesce(avatar_url, '') <> '')::integer as barbers_with_photos
    from active_barbers
  )
  select jsonb_build_object(
    'barbers',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', b.id,
            'name', b.name,
            'bio', b.bio,
            'phone', b.phone,
            'avatar_url', b.avatar_url,
            'specialties', b.specialties,
            'is_active', true,
            'created_at', b.created_at,
            'updated_at', b.updated_at
          )
          order by b.name
        )
        from active_barbers b
      ),
      '[]'::jsonb
    ),
    'services',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'description', s.description,
            'price', s.price,
            'duration_minutes', s.duration_minutes,
            'category', s.category,
            'image_url', s.image_url,
            'is_active', true,
            'featured', s.featured,
            'promotion', s.promotion,
            'created_at', s.created_at,
            'updated_at', s.updated_at
          )
          order by s.featured desc, s.name
        )
        from active_services s
      ),
      '[]'::jsonb
    ),
    'metrics',
    jsonb_build_object(
      'services_count', coalesce((select services_count from service_metrics), 0),
      'categories_count', coalesce((select categories_count from service_metrics), 0),
      'barbers_count', coalesce((select barbers_count from barber_metrics), 0),
      'barbers_with_photos', coalesce((select barbers_with_photos from barber_metrics), 0)
    )
  );
$$;

create or replace function public.public_booking_snapshot_v2()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'barbers',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', b.id,
            'name', b.name,
            'bio', b.bio,
            'phone', b.phone,
            'avatar_url', b.avatar_url,
            'specialties', b.specialties,
            'is_active', true,
            'created_at', b.created_at,
            'updated_at', b.updated_at
          )
          order by b.name
        )
        from public.barbers b
        where b.is_active = true
      ),
      '[]'::jsonb
    ),
    'services',
    coalesce((public.public_home_snapshot() -> 'services'), '[]'::jsonb),
    'availability',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ba.id,
            'barber_id', ba.barber_id,
            'day_of_week', ba.day_of_week,
            'start_time', ba.start_time,
            'end_time', ba.end_time,
            'slot_interval_minutes', ba.slot_interval_minutes,
            'is_active', ba.is_active,
            'created_at', ba.created_at,
            'updated_at', ba.updated_at
          )
          order by ba.day_of_week, ba.start_time
        )
        from public.barber_availability ba
        join public.barbers b on b.id = ba.barber_id
        where ba.is_active = true
          and b.is_active = true
      ),
      '[]'::jsonb
    ),
    'schedule_blocks',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', sb.id,
            'barber_id', sb.barber_id,
            'day_of_week', sb.day_of_week,
            'start_time', sb.start_time,
            'end_time', sb.end_time,
            'label', sb.label,
            'is_active', sb.is_active,
            'created_at', sb.created_at,
            'updated_at', sb.updated_at
          )
          order by sb.day_of_week nulls first, sb.start_time
        )
        from public.schedule_blocks sb
        where sb.is_active = true
      ),
      '[]'::jsonb
    )
  );
$$;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  category text not null,
  image_url text,
  is_active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  discount_percent integer not null check (discount_percent between 1 and 100),
  service_id uuid not null references public.services (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint promotions_period_check check (ends_at > starts_at)
);

create table if not exists public.barber_availability (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes between 10 and 120),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint barber_availability_window_check check (end_time > start_time)
);

create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid references public.barbers (id) on delete cascade,
  day_of_week integer check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  label text not null default 'Indisponivel',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint schedule_blocks_window_check check (end_time > start_time)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique default public.generate_appointment_code(),
  barber_id uuid not null references public.barbers (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  client_name text not null,
  client_phone text not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status public.appointment_status not null default 'pending',
  notes text not null default '',
  total_price numeric(10, 2) not null check (total_price >= 0),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint appointments_time_check check (end_time > start_time)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_no_overlapping_active_slots'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_no_overlapping_active_slots
      exclude using gist (
        barber_id with =,
        tsrange(
          (appointment_date + start_time)::timestamp without time zone,
          (appointment_date + end_time)::timestamp without time zone,
          '[)'
        ) with &&
      )
      where (status in ('pending', 'confirmed'));
  end if;
end $$;

create index if not exists staff_profiles_role_idx on public.staff_profiles (role, is_active);
create index if not exists staff_auth_credentials_email_idx on public.staff_auth_credentials (email);
create index if not exists barbers_active_idx on public.barbers (is_active);
create index if not exists barbers_public_listing_idx on public.barbers (is_active, name);
create index if not exists services_active_idx on public.services (is_active, category);
create index if not exists services_public_listing_idx on public.services (is_active, featured, name);
create index if not exists promotions_period_idx on public.promotions (starts_at, ends_at, is_active);
create index if not exists promotions_active_service_idx on public.promotions (service_id, is_active, starts_at, ends_at);
create index if not exists barber_availability_lookup_idx on public.barber_availability (barber_id, day_of_week, is_active);
create index if not exists schedule_blocks_lookup_idx on public.schedule_blocks (barber_id, day_of_week, is_active);
create index if not exists appointments_schedule_idx on public.appointments (barber_id, appointment_date, status);
create index if not exists appointments_status_idx on public.appointments (status, appointment_date);
create index if not exists appointments_active_barber_date_idx on public.appointments (barber_id, appointment_date, start_time)
where status in ('pending', 'confirmed');

drop trigger if exists set_staff_profiles_updated_at on public.staff_profiles;
create trigger set_staff_profiles_updated_at
before update on public.staff_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_staff_auth_credentials_updated_at on public.staff_auth_credentials;
create trigger set_staff_auth_credentials_updated_at
before update on public.staff_auth_credentials
for each row execute function public.set_updated_at();

drop trigger if exists normalize_staff_profiles_before_write on public.staff_profiles;
create trigger normalize_staff_profiles_before_write
before insert or update on public.staff_profiles
for each row execute function public.normalize_staff_profile();

drop trigger if exists set_barbers_updated_at on public.barbers;
create trigger set_barbers_updated_at
before update on public.barbers
for each row execute function public.set_updated_at();

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists set_promotions_updated_at on public.promotions;
create trigger set_promotions_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

drop trigger if exists set_barber_availability_updated_at on public.barber_availability;
create trigger set_barber_availability_updated_at
before update on public.barber_availability
for each row execute function public.set_updated_at();

drop trigger if exists set_schedule_blocks_updated_at on public.schedule_blocks;
create trigger set_schedule_blocks_updated_at
before update on public.schedule_blocks
for each row execute function public.set_updated_at();

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

alter table public.staff_profiles enable row level security;
alter table public.staff_auth_credentials enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.promotions enable row level security;
alter table public.barber_availability enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "staff_profiles_self_or_admin_select" on public.staff_profiles;
create policy "staff_profiles_self_or_admin_select"
on public.staff_profiles
for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "staff_profiles_self_or_admin_update" on public.staff_profiles;
create policy "staff_profiles_self_or_admin_update"
on public.staff_profiles
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "staff_profiles_admin_insert" on public.staff_profiles;
create policy "staff_profiles_admin_insert"
on public.staff_profiles
for insert
with check (public.is_admin());

drop policy if exists "staff_profiles_admin_delete" on public.staff_profiles;
create policy "staff_profiles_admin_delete"
on public.staff_profiles
for delete
using (public.is_admin());

drop policy if exists "staff_auth_credentials_admin_only" on public.staff_auth_credentials;
create policy "staff_auth_credentials_admin_only"
on public.staff_auth_credentials
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "barbers_public_read" on public.barbers;
create policy "barbers_public_read"
on public.barbers
for select
using (is_active = true or public.is_admin() or public.current_barber_id() = id);

drop policy if exists "barbers_admin_insert" on public.barbers;
create policy "barbers_admin_insert"
on public.barbers
for insert
with check (public.is_admin());

drop policy if exists "barbers_admin_or_self_update" on public.barbers;
create policy "barbers_admin_or_self_update"
on public.barbers
for update
using (public.is_admin() or public.current_barber_id() = id)
with check (public.is_admin() or public.current_barber_id() = id);

drop policy if exists "barbers_admin_delete" on public.barbers;
create policy "barbers_admin_delete"
on public.barbers
for delete
using (public.is_admin());

drop policy if exists "services_public_read" on public.services;
create policy "services_public_read"
on public.services
for select
using (is_active = true or public.is_admin());

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write"
on public.services
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "promotions_public_read" on public.promotions;
create policy "promotions_public_read"
on public.promotions
for select
using (
  (
    is_active = true
    and starts_at <= timezone('utc', now()) + interval '365 days'
  )
  or public.is_admin()
);

drop policy if exists "promotions_admin_write" on public.promotions;
create policy "promotions_admin_write"
on public.promotions
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "barber_availability_public_read" on public.barber_availability;
create policy "barber_availability_public_read"
on public.barber_availability
for select
using (
  is_active = true
  or public.is_admin()
  or barber_id = public.current_barber_id()
);

drop policy if exists "barber_availability_admin_insert" on public.barber_availability;
create policy "barber_availability_admin_insert"
on public.barber_availability
for insert
with check (
  public.is_admin()
  or barber_id = public.current_barber_id()
);

drop policy if exists "barber_availability_admin_or_self_update" on public.barber_availability;
create policy "barber_availability_admin_or_self_update"
on public.barber_availability
for update
using (public.is_admin() or barber_id = public.current_barber_id())
with check (public.is_admin() or barber_id = public.current_barber_id());

drop policy if exists "barber_availability_admin_or_self_delete" on public.barber_availability;
create policy "barber_availability_admin_or_self_delete"
on public.barber_availability
for delete
using (public.is_admin() or barber_id = public.current_barber_id());

drop policy if exists "schedule_blocks_public_read" on public.schedule_blocks;
create policy "schedule_blocks_public_read"
on public.schedule_blocks
for select
using (
  is_active = true
  or public.is_admin()
  or barber_id = public.current_barber_id()
);

drop policy if exists "schedule_blocks_admin_or_self_insert" on public.schedule_blocks;
create policy "schedule_blocks_admin_or_self_insert"
on public.schedule_blocks
for insert
with check (
  public.is_admin()
  or barber_id = public.current_barber_id()
);

drop policy if exists "schedule_blocks_admin_or_self_update" on public.schedule_blocks;
create policy "schedule_blocks_admin_or_self_update"
on public.schedule_blocks
for update
using (public.is_admin() or barber_id = public.current_barber_id())
with check (public.is_admin() or barber_id = public.current_barber_id());

drop policy if exists "schedule_blocks_admin_or_self_delete" on public.schedule_blocks;
create policy "schedule_blocks_admin_or_self_delete"
on public.schedule_blocks
for delete
using (public.is_admin() or barber_id = public.current_barber_id());

drop policy if exists "appointments_admin_read_all" on public.appointments;
create policy "appointments_admin_read_all"
on public.appointments
for select
using (
  public.is_admin()
  or barber_id = public.current_barber_id()
);

drop policy if exists "appointments_public_create" on public.appointments;

drop policy if exists "appointments_admin_or_barber_update" on public.appointments;
create policy "appointments_admin_or_barber_update"
on public.appointments
for update
using (
  public.is_admin()
  or barber_id = public.current_barber_id()
)
with check (
  public.is_admin()
  or barber_id = public.current_barber_id()
);

drop policy if exists "appointments_admin_delete" on public.appointments;
create policy "appointments_admin_delete"
on public.appointments
for delete
using (public.is_admin());

create or replace function public.get_busy_slots(target_date date, target_barber_id uuid default null)
returns table (
  barber_id uuid,
  start_time time,
  end_time time
)
language sql
security definer
set search_path = public
as $$
  select a.barber_id, a.start_time, a.end_time
  from public.appointments a
  where a.appointment_date = target_date
    and a.status in ('pending', 'confirmed')
    and (target_barber_id is null or a.barber_id = target_barber_id);
$$;

revoke all on function public.get_busy_slots(date, uuid) from public;
grant execute on function public.get_busy_slots(date, uuid) to anon, authenticated;

revoke all on function public.hash_staff_password(text) from public;
grant execute on function public.hash_staff_password(text) to anon, authenticated;

revoke all on function public.sync_staff_app_password(uuid, text, text) from public;
grant execute on function public.sync_staff_app_password(uuid, text, text) to anon, authenticated;

revoke all on function public.sync_staff_app_credential_email(uuid, text) from public;
grant execute on function public.sync_staff_app_credential_email(uuid, text) to anon, authenticated;

revoke all on function public.authenticate_staff(text, text, public.app_role) from public;
grant execute on function public.authenticate_staff(text, text, public.app_role) to anon, authenticated;

revoke all on function public.list_barber_appointments_app_user(text, text, date, public.appointment_status) from public;
grant execute on function public.list_barber_appointments_app_user(text, text, date, public.appointment_status) to anon, authenticated;

revoke all on function public.get_barber_dashboard_summary_app_user(text, text) from public;
grant execute on function public.get_barber_dashboard_summary_app_user(text, text) to anon, authenticated;

revoke all on function public.update_barber_appointment_status_app_user(text, text, uuid, public.appointment_status) from public;
grant execute on function public.update_barber_appointment_status_app_user(text, text, uuid, public.appointment_status) to anon, authenticated;

revoke all on function public.update_own_barber_profile_app_user(text, text, text, text, text, text, text[]) from public;
grant execute on function public.update_own_barber_profile_app_user(text, text, text, text, text, text, text[]) to anon, authenticated;

revoke all on function public.replace_barber_availability_app_user(text, text, jsonb) from public;
grant execute on function public.replace_barber_availability_app_user(text, text, jsonb) to anon, authenticated;

revoke all on function public.save_barber_staff_profile(uuid, text, text, text, text, boolean, uuid, text, text, text, text, text[], boolean, jsonb) from public;
grant execute on function public.save_barber_staff_profile(uuid, text, text, text, text, boolean, uuid, text, text, text, text, text[], boolean, jsonb) to anon, authenticated;

revoke all on function public.public_home_snapshot() from public;
grant execute on function public.public_home_snapshot() to anon, authenticated;

revoke all on function public.public_booking_snapshot_v2() from public;
grant execute on function public.public_booking_snapshot_v2() to anon, authenticated;

create or replace function public.create_public_appointment(
  input_barber_id uuid,
  input_service_id uuid,
  input_client_name text,
  input_client_phone text,
  input_appointment_date date,
  input_start_time time,
  input_notes text default ''
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  target_barber public.barbers%rowtype;
  target_service public.services%rowtype;
  active_promotion public.promotions%rowtype;
  matching_availability public.barber_availability%rowtype;
  matching_schedule_block public.schedule_blocks%rowtype;
  created_appointment public.appointments%rowtype;
  booking_end_time time;
  final_price numeric(10, 2);
  slot_offset_minutes integer;
begin
  if coalesce(trim(input_client_name), '') = '' then
    raise exception 'Informe o nome do cliente.';
  end if;

  if coalesce(trim(input_client_phone), '') = '' then
    raise exception 'Informe o telefone do cliente.';
  end if;

  if input_appointment_date < current_date then
    raise exception 'Nao e permitido agendar para datas passadas.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(input_barber_id::text || ':' || input_appointment_date::text, 0));

  select *
  into target_barber
  from public.barbers
  where id = input_barber_id
    and is_active = true;

  if not found then
    raise exception 'Barbeiro indisponivel para agendamento.';
  end if;

  select *
  into target_service
  from public.services
  where id = input_service_id
    and is_active = true;

  if not found then
    raise exception 'Servico indisponivel para agendamento.';
  end if;

  booking_end_time := (input_start_time + make_interval(mins => target_service.duration_minutes))::time;

  select *
  into matching_schedule_block
  from public.schedule_blocks
  where is_active = true
    and (barber_id is null or barber_id = input_barber_id)
    and (day_of_week is null or day_of_week = extract(dow from input_appointment_date)::integer)
    and input_start_time < end_time
    and booking_end_time > start_time
  order by case when barber_id is null then 1 else 0 end, start_time
  limit 1;

  if found then
    raise exception 'Horario indisponivel: % (% ate %).',
      matching_schedule_block.label,
      to_char(matching_schedule_block.start_time, 'HH24:MI'),
      to_char(matching_schedule_block.end_time, 'HH24:MI');
  end if;

  select *
  into matching_availability
  from public.barber_availability
  where barber_id = input_barber_id
    and is_active = true
    and day_of_week = extract(dow from input_appointment_date)::integer
    and input_start_time >= start_time
    and booking_end_time <= end_time
  order by start_time
  limit 1;

  if not found then
    raise exception 'Horario fora da disponibilidade do barbeiro.';
  end if;

  slot_offset_minutes := floor(extract(epoch from (input_start_time - matching_availability.start_time)) / 60);
  if slot_offset_minutes < 0 or mod(slot_offset_minutes, matching_availability.slot_interval_minutes) <> 0 then
    raise exception 'Horario nao alinhado com os intervalos disponiveis.';
  end if;

  if exists (
    select 1
    from public.appointments
    where barber_id = input_barber_id
      and appointment_date = input_appointment_date
      and status in ('pending', 'confirmed')
      and tsrange(
        (appointment_date + start_time)::timestamp without time zone,
        (appointment_date + end_time)::timestamp without time zone,
        '[)'
      ) && tsrange(
        (input_appointment_date + input_start_time)::timestamp without time zone,
        (input_appointment_date + booking_end_time)::timestamp without time zone,
        '[)'
      )
  ) then
    raise exception 'Este horario acabou de ser reservado. Escolha outro horario.';
  end if;

  select *
  into active_promotion
  from public.promotions
  where service_id = input_service_id
    and is_active = true
    and starts_at <= timezone('utc', now())
    and ends_at >= timezone('utc', now())
  order by starts_at desc
  limit 1;

  final_price := target_service.price;
  if found then
    final_price := round((target_service.price * (100 - active_promotion.discount_percent)) / 100.0, 2);
  end if;

  insert into public.appointments (
    barber_id,
    service_id,
    client_name,
    client_phone,
    appointment_date,
    start_time,
    end_time,
    status,
    notes,
    total_price,
    created_by
  ) values (
    input_barber_id,
    input_service_id,
    trim(input_client_name),
    trim(input_client_phone),
    input_appointment_date,
    input_start_time,
    booking_end_time,
    'confirmed',
    coalesce(input_notes, ''),
    final_price,
    auth.uid()
  )
  returning *
  into created_appointment;

  return created_appointment;
end;
$$;

revoke all on function public.create_public_appointment(uuid, uuid, text, text, date, time, text) from public;
grant execute on function public.create_public_appointment(uuid, uuid, text, text, date, time, text) to anon, authenticated;

insert into public.schedule_blocks (barber_id, day_of_week, start_time, end_time, label, is_active)
select null, null, '12:30', '14:00', 'Intervalo de almoco', true
where not exists (
  select 1
  from public.schedule_blocks
  where barber_id is null
    and day_of_week is null
    and start_time = '12:30'
    and end_time = '14:00'
    and label = 'Intervalo de almoco'
);

insert into storage.buckets (id, name, public)
values ('barbershop-assets', 'barbershop-assets', true)
on conflict (id) do nothing;

drop policy if exists "Public can read barbershop assets" on storage.objects;
create policy "Public can read barbershop assets"
on storage.objects
for select
using (bucket_id = 'barbershop-assets');

drop policy if exists "Admins can manage barbershop assets" on storage.objects;
create policy "Admins can manage barbershop assets"
on storage.objects
for all
using (bucket_id = 'barbershop-assets' and public.is_admin())
with check (bucket_id = 'barbershop-assets' and public.is_admin());

drop policy if exists "Barbers can manage own avatar assets" on storage.objects;
create policy "Barbers can manage own avatar assets"
on storage.objects
for all
using (
  bucket_id = 'barbershop-assets'
  and split_part(name, '/', 1) = 'barbers'
  and split_part(name, '/', 2) = auth.uid()::text
)
with check (
  bucket_id = 'barbershop-assets'
  and split_part(name, '/', 1) = 'barbers'
  and split_part(name, '/', 2) = auth.uid()::text
);

comment on table public.staff_profiles is 'Perfis autenticados com roles admin e barber.';
comment on table public.barbers is 'Perfis publicos de barbeiros exibidos no app.';
comment on table public.services is 'Catalogo de servicos.';
comment on table public.promotions is 'Promocoes vinculadas a servicos.';
comment on table public.barber_availability is 'Disponibilidade por barbeiro e dia da semana.';
comment on table public.schedule_blocks is 'Bloqueios de agenda globais ou por barbeiro.';
comment on table public.appointments is 'Agendamentos publicos e internos.';
