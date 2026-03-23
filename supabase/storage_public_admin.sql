create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.staff_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_staff_profiles_updated_at on public.staff_profiles;
create trigger set_staff_profiles_updated_at
before update on public.staff_profiles
for each row
execute function public.set_updated_at();

alter table public.staff_profiles enable row level security;

drop policy if exists "staff_profiles_select_own" on public.staff_profiles;
create policy "staff_profiles_select_own"
on public.staff_profiles
for select
to authenticated
using (auth.uid() = id);

create or replace function public.is_storage_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

insert into storage.buckets (id, name, public)
values ('galeria-publica', 'galeria-publica', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "public_images_select" on storage.objects;
create policy "public_images_select"
on storage.objects
for select
to public
using (bucket_id = 'galeria-publica');

drop policy if exists "public_images_insert_admin" on storage.objects;
create policy "public_images_insert_admin"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'galeria-publica'
  and public.is_storage_admin()
);

drop policy if exists "public_images_update_admin" on storage.objects;
create policy "public_images_update_admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'galeria-publica'
  and public.is_storage_admin()
)
with check (
  bucket_id = 'galeria-publica'
  and public.is_storage_admin()
);

drop policy if exists "public_images_delete_admin" on storage.objects;
create policy "public_images_delete_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'galeria-publica'
  and public.is_storage_admin()
);
