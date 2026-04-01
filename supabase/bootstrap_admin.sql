-- Bootstrap seguro para um admin real usando Supabase Auth + staff_profiles.
-- Execute no SQL Editor ou via Supabase CLI conectada ao projeto.
--
-- Passo 1:
-- Crie ou confirme o usuario em Authentication > Users.
--
-- Passo 2:
-- Descubra o UUID real do usuario Auth:
-- select id, email, email_confirmed_at from auth.users where email = 'admin@opaitaon.com';
--
-- Passo 3:
-- Substitua os valores abaixo e execute:

select public.upsert_admin_staff_profile(
  '00000000-0000-0000-0000-000000000000',
  'admin@opaitaon.com',
  'Administrador',
  null,
  true
);

-- Passo 4:
-- Validacao:
-- select id, email, full_name, role, is_active from public.staff_profiles where email = 'admin@opaitaon.com';
