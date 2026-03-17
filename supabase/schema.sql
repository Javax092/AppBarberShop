create extension if not exists btree_gist;

create table if not exists public.appointments (
  id text primary key,
  barber_id text not null,
  client_name text not null,
  client_whatsapp text not null,
  service_ids text[] not null check (cardinality(service_ids) > 0),
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  notes text not null default ''
);

create index if not exists appointments_barber_date_idx
  on public.appointments (barber_id, date, start_time);

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
  where (status = 'confirmed');

alter table public.appointments enable row level security;

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
  with check (status = 'confirmed');
