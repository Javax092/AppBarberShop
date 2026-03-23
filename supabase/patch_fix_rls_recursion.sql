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
