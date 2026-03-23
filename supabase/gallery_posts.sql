-- ALTERACAO: schema da galeria com leitura publica, escrita autenticada e bucket dedicado.
create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_active_admin()
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
      and coalesce(is_active, true)
  );
$$;

create table if not exists public.gallery_posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  caption text,
  tag text not null default 'geral',
  image_path text,
  image_url text,
  sort_order int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_gallery_updated_at on public.gallery_posts;

create trigger trg_gallery_updated_at
before update on public.gallery_posts
for each row execute function public.set_updated_at();

alter table public.gallery_posts enable row level security;

drop policy if exists "gallery_public_read" on public.gallery_posts;
create policy "gallery_public_read"
on public.gallery_posts for select
using (true);

drop policy if exists "gallery_auth_write" on public.gallery_posts;
create policy "gallery_auth_write"
on public.gallery_posts for insert
with check (public.is_active_admin());

drop policy if exists "gallery_auth_update" on public.gallery_posts;
create policy "gallery_auth_update"
on public.gallery_posts for update
using (public.is_active_admin())
with check (public.is_active_admin());

drop policy if exists "gallery_auth_delete" on public.gallery_posts;
create policy "gallery_auth_delete"
on public.gallery_posts for delete
using (public.is_active_admin());

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update
set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('opaitaon-media', 'opaitaon-media', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "gallery_storage_read" on storage.objects;
create policy "gallery_storage_read"
on storage.objects for select
using (bucket_id = 'gallery');

drop policy if exists "gallery_storage_upload" on storage.objects;
create policy "gallery_storage_upload"
on storage.objects for insert
with check (
  bucket_id = 'gallery'
  and public.is_active_admin()
);

drop policy if exists "gallery_storage_update" on storage.objects;
create policy "gallery_storage_update"
on storage.objects for update
using (
  bucket_id = 'gallery'
  and public.is_active_admin()
)
with check (
  bucket_id = 'gallery'
  and public.is_active_admin()
);

drop policy if exists "gallery_storage_delete" on storage.objects;
create policy "gallery_storage_delete"
on storage.objects for delete
using (
  bucket_id = 'gallery'
  and public.is_active_admin()
);

drop policy if exists "media_storage_read" on storage.objects;
create policy "media_storage_read"
on storage.objects for select
using (bucket_id = 'opaitaon-media');

drop policy if exists "media_storage_upload" on storage.objects;
create policy "media_storage_upload"
on storage.objects for insert
with check (
  bucket_id = 'opaitaon-media'
  and public.is_active_admin()
);

drop policy if exists "media_storage_update" on storage.objects;
create policy "media_storage_update"
on storage.objects for update
using (
  bucket_id = 'opaitaon-media'
  and public.is_active_admin()
)
with check (
  bucket_id = 'opaitaon-media'
  and public.is_active_admin()
);

drop policy if exists "media_storage_delete" on storage.objects;
create policy "media_storage_delete"
on storage.objects for delete
using (
  bucket_id = 'opaitaon-media'
  and public.is_active_admin()
);
