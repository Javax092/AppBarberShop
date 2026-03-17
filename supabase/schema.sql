create extension if not exists btree_gist;
create extension if not exists pgcrypto;

create table if not exists public.services (
  id text primary key,
  name text not null,
  badge text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  duration integer not null check (duration > 0),
  category text not null default '',
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.barbers (
  id text primary key,
  name text not null,
  short_code text not null,
  role_title text not null,
  phone text not null,
  specialty text not null default '',
  bio text not null default '',
  working_start time not null,
  working_end time not null,
  days_off smallint[] not null default '{}',
  break_ranges jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('barber', 'admin')),
  barber_id text references public.barbers (id) on delete set null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  barber_id text references public.barbers (id) on delete cascade,
  title text not null,
  block_type text not null check (block_type in ('day_off', 'lunch', 'unavailable')),
  date date not null,
  start_time time,
  end_time time,
  is_all_day boolean not null default false,
  notes text not null default '',
  created_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint schedule_blocks_time_window check (
    is_all_day = true or (start_time is not null and end_time is not null and start_time < end_time)
  )
);

create table if not exists public.appointments (
  id text primary key,
  barber_id text not null references public.barbers (id) on delete restrict,
  client_name text not null,
  client_whatsapp text not null,
  service_ids text[] not null check (cardinality(service_ids) > 0),
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'completed', 'cancelled')),
  total_price numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notes text not null default ''
);

alter table public.appointments
  add column if not exists total_price numeric(10, 2) not null default 0;

alter table public.appointments
  add column if not exists updated_at timestamptz not null default now();

alter table public.appointments
  add column if not exists notes text not null default '';

alter table public.appointments
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('confirmed', 'completed', 'cancelled'));

create index if not exists appointments_barber_date_idx
  on public.appointments (barber_id, date, start_time);

create index if not exists schedule_blocks_barber_date_idx
  on public.schedule_blocks (barber_id, date);

alter table public.appointments
  drop constraint if exists appointments_no_overlap;

alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    barber_id with =,
    date with =,
    tsrange(
      (date + start_time)::timestamp,
      (date + end_time)::timestamp,
      '[)'
    ) with &&
  )
  where (status in ('confirmed', 'completed'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
before update on public.appointments
for each row
execute function public.set_updated_at();

create or replace function public.authenticate_staff(input_email text, input_password text)
returns table (
  user_id uuid,
  email text,
  full_name text,
  role text,
  barber_id text
)
language sql
security definer
set search_path = public
as $$
  select
    u.id as user_id,
    u.email,
    u.full_name,
    u.role,
    u.barber_id
  from public.app_users u
  where lower(u.email) = lower(input_email)
    and u.is_active = true
    and u.password_hash = extensions.crypt(input_password, u.password_hash);
$$;

revoke all on function public.authenticate_staff(text, text) from public;
grant execute on function public.authenticate_staff(text, text) to anon, authenticated;

alter table public.services enable row level security;
alter table public.barbers enable row level security;
alter table public.app_users enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "public_read_services" on public.services;
create policy "public_read_services"
  on public.services
  for select
  to anon
  using (true);

drop policy if exists "public_read_barbers" on public.barbers;
create policy "public_read_barbers"
  on public.barbers
  for select
  to anon
  using (true);

drop policy if exists "public_read_schedule_blocks" on public.schedule_blocks;
create policy "public_read_schedule_blocks"
  on public.schedule_blocks
  for select
  to anon
  using (true);

drop policy if exists "public_manage_schedule_blocks" on public.schedule_blocks;
create policy "public_manage_schedule_blocks"
  on public.schedule_blocks
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "public_read_appointments" on public.appointments;
create policy "public_read_appointments"
  on public.appointments
  for select
  to anon
  using (true);

drop policy if exists "public_insert_appointments" on public.appointments;
create policy "public_insert_appointments"
  on public.appointments
  for insert
  to anon
  with check (status in ('confirmed', 'completed', 'cancelled'));

drop policy if exists "public_update_appointments" on public.appointments;
create policy "public_update_appointments"
  on public.appointments
  for update
  to anon
  using (true)
  with check (status in ('confirmed', 'completed', 'cancelled'));

insert into public.services (id, name, badge, price, duration, category, description, sort_order)
values
  ('corte-classico', 'Corte classico', 'Mais pedido', 45, 40, 'Cabelo', 'Tesoura, maquina e acabamento de alta precisao.', 1),
  ('barba-premium', 'Barba premium', 'Toalha quente', 35, 30, 'Barba', 'Contorno, toalha quente e finalizacao com balm.', 2),
  ('sobrancelha', 'Sobrancelha', 'Detalhe fino', 15, 15, 'Detalhes', 'Alinhamento rapido para completar o visual.', 3),
  ('combo-executivo', 'Combo executivo', 'Experiencia completa', 79, 70, 'Combo', 'Corte, barba e acabamento premium no mesmo horario.', 4)
on conflict (id) do update
set
  name = excluded.name,
  badge = excluded.badge,
  price = excluded.price,
  duration = excluded.duration,
  category = excluded.category,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.barbers (
  id,
  name,
  short_code,
  role_title,
  phone,
  specialty,
  bio,
  working_start,
  working_end,
  days_off,
  break_ranges,
  sort_order
)
values
  (
    'lucas',
    'Lucas',
    'LC',
    'Master barber',
    '5592999991111',
    'Precisao, acabamento classico e atendimento premium.',
    'Perfil ideal para corte social, executivo e clientes recorrentes.',
    '09:00',
    '20:00',
    array[0]::smallint[],
    '[{"start":"12:00","end":"13:00"}]'::jsonb,
    1
  ),
  (
    'luquinhas',
    'Luquinhas',
    'LQ',
    'Style specialist',
    '5592999992222',
    'Visagismo, barba premium e finalizacao moderna.',
    'Ideal para combo completo, barba e servicos de detalhe.',
    '10:00',
    '21:00',
    array[1]::smallint[],
    '[{"start":"14:00","end":"15:00"}]'::jsonb,
    2
  )
on conflict (id) do update
set
  name = excluded.name,
  short_code = excluded.short_code,
  role_title = excluded.role_title,
  phone = excluded.phone,
  specialty = excluded.specialty,
  bio = excluded.bio,
  working_start = excluded.working_start,
  working_end = excluded.working_end,
  days_off = excluded.days_off,
  break_ranges = excluded.break_ranges,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.app_users (email, full_name, role, barber_id, password_hash)
values
  ('admin@opaitaon.com', 'Administrador', 'admin', null, extensions.crypt('Admin123!', extensions.gen_salt('bf'))),
  ('lucas@opaitaon.com', 'Lucas', 'barber', 'lucas', extensions.crypt('Lucas123!', extensions.gen_salt('bf'))),
  ('luquinhas@opaitaon.com', 'Luquinhas', 'barber', 'luquinhas', extensions.crypt('Luquinhas123!', extensions.gen_salt('bf')))
on conflict (email) do nothing;

notify pgrst, 'reload schema';
