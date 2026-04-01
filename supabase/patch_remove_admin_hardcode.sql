create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.staff_profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

drop function if exists public.is_hardcoded_admin();

create or replace function public.upsert_admin_staff_profile(
  input_user_id uuid,
  input_email text,
  input_full_name text,
  input_phone text default null,
  input_is_active boolean default true
)
returns public.staff_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_profile public.staff_profiles;
begin
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
    'admin',
    nullif(trim(coalesce(input_phone, '')), ''),
    null,
    null,
    coalesce(input_is_active, true)
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      phone = excluded.phone,
      role = 'admin',
      barber_id = null,
      is_active = excluded.is_active,
      updated_at = timezone('utc', now())
  returning * into saved_profile;

  return saved_profile;
end;
$$;

revoke all on function public.upsert_admin_staff_profile(uuid, text, text, text, boolean) from public;
