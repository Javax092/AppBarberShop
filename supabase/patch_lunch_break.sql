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
    notes,
    total_price,
    status
  ) values (
    input_barber_id,
    input_service_id,
    trim(input_client_name),
    trim(input_client_phone),
    input_appointment_date,
    input_start_time,
    booking_end_time,
    coalesce(input_notes, ''),
    final_price,
    'pending'
  )
  returning * into created_appointment;

  return created_appointment;
end;
$$;

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
