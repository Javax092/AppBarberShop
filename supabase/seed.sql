-- Seed alinhado ao schema atual.
-- Crie os usuarios pelo Supabase Auth/Dashboard e depois associe os perfis em public.staff_profiles.

insert into public.barbers (
  id,
  name,
  bio,
  phone,
  avatar_url,
  specialties,
  is_active
) values
  (
    '7b3e77c1-d3ae-4c2b-9d77-10df7a10c001',
    'Lucas',
    'Corte social refinado, acabamento preciso e atendimento de assinatura.',
    '5592999991111',
    null,
    array['Corte social', 'Acabamento executivo', 'Barba'],
    true
  ),
  (
    '7b3e77c1-d3ae-4c2b-9d77-10df7a10c002',
    'Luquinhas',
    'Visagismo, barba premium e leitura moderna de estilo.',
    '5592999992222',
    null,
    array['Fade', 'Barba premium', 'Visagismo'],
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  bio = excluded.bio,
  phone = excluded.phone,
  avatar_url = excluded.avatar_url,
  specialties = excluded.specialties,
  is_active = excluded.is_active;

insert into public.services (
  id,
  name,
  description,
  price,
  duration_minutes,
  category,
  image_url,
  is_active,
  featured
) values
  (
    '5d1c6a76-2ec0-49a9-bb96-10df7a10c101',
    'Corte de assinatura',
    'Tesoura, maquina e acabamento preciso para manter uma imagem alinhada do inicio ao fim.',
    55.00,
    45,
    'Cabelo',
    null,
    true,
    true
  ),
  (
    '5d1c6a76-2ec0-49a9-bb96-10df7a10c102',
    'Barba completa',
    'Contorno detalhado, toalha quente e finalizacao para uma barba mais firme e bem desenhada.',
    38.00,
    30,
    'Barba',
    null,
    true,
    false
  ),
  (
    '5d1c6a76-2ec0-49a9-bb96-10df7a10c103',
    'Fade de assinatura',
    'Degrade preciso com transicao limpa, textura controlada e acabamento de alto nivel.',
    60.00,
    50,
    'Cabelo',
    null,
    true,
    true
  ),
  (
    '5d1c6a76-2ec0-49a9-bb96-10df7a10c104',
    'Combo de presenca',
    'Corte, barba e finalizacao em uma sessao completa para elevar a imagem com consistencia.',
    92.00,
    80,
    'Combo',
    null,
    true,
    false
  )
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  duration_minutes = excluded.duration_minutes,
  category = excluded.category,
  image_url = excluded.image_url,
  is_active = excluded.is_active,
  featured = excluded.featured;

delete from public.barber_availability
where barber_id in (
  '7b3e77c1-d3ae-4c2b-9d77-10df7a10c001',
  '7b3e77c1-d3ae-4c2b-9d77-10df7a10c002'
);

insert into public.barber_availability (
  barber_id,
  day_of_week,
  start_time,
  end_time,
  slot_interval_minutes,
  is_active
) values
  ('7b3e77c1-d3ae-4c2b-9d77-10df7a10c001', 1, '09:00', '19:00', 30, true),
  ('7b3e77c1-d3ae-4c2b-9d77-10df7a10c001', 2, '09:00', '19:00', 30, true),
  ('7b3e77c1-d3ae-4c2b-9d77-10df7a10c001', 3, '09:00', '19:00', 30, true),
  ('7b3e77c1-d3ae-4c2b-9d77-10df7a10c001', 4, '09:00', '19:00', 30, true),
  ('7b3e77c1-d3ae-4c2b-9d77-10df7a10c001', 5, '09:00', '19:00', 30, true),
  ('7b3e77c1-d3ae-4c2b-9d77-10df7a10c002', 1, '10:00', '20:00', 30, true),
  ('7b3e77c1-d3ae-4c2b-9d77-10df7a10c002', 2, '10:00', '20:00', 30, true),
  ('7b3e77c1-d3ae-4c2b-9d77-10df7a10c002', 3, '10:00', '20:00', 30, true),
  ('7b3e77c1-d3ae-4c2b-9d77-10df7a10c002', 4, '10:00', '20:00', 30, true),
  ('7b3e77c1-d3ae-4c2b-9d77-10df7a10c002', 5, '10:00', '20:00', 30, true)
;

insert into public.promotions (
  id,
  title,
  description,
  discount_percent,
  service_id,
  starts_at,
  ends_at,
  image_url,
  is_active
) values
  (
    '9c4fd5da-6f32-4c58-85b2-10df7a10c201',
    'Semana do fade',
    'Desconto especial para corte fade durante a campanha atual.',
    15,
    '5d1c6a76-2ec0-49a9-bb96-10df7a10c103',
    timezone('utc', now()) - interval '1 day',
    timezone('utc', now()) + interval '14 days',
    null,
    true
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  discount_percent = excluded.discount_percent,
  service_id = excluded.service_id,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  image_url = excluded.image_url,
  is_active = excluded.is_active;
