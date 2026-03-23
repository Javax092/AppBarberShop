import { addMinutes, format, getDay, isAfter, parse } from "date-fns";

import type { Barbeiro, BusySlotRow, HorarioDisponibilidade, HorarioSlot, ScheduleBlock } from "../types/index.ts";
import { listBarbeiros, listDisponibilidade, listScheduleBlocks } from "./barbeiros.ts";
import { supabase } from "./supabase.ts";

function overlaps(slotStart: string, slotEnd: string, busyStart: string, busyEnd: string) {
  return !(slotEnd <= busyStart || slotStart >= busyEnd);
}

function overlapsScheduleBlock(slotStart: string, slotEnd: string, block: ScheduleBlock, targetDay: number, barberId: string) {
  const appliesToDay = block.dayOfWeek === null || block.dayOfWeek === targetDay;
  const appliesToBarber = block.barberId === null || block.barberId === barberId;

  return appliesToDay && appliesToBarber && overlaps(slotStart, slotEnd, block.startTime, block.endTime);
}

function buildSlotsForAvailability(
  availability: HorarioDisponibilidade,
  barberName: string,
  busySlots: BusySlotRow[],
  scheduleBlocks: ScheduleBlock[],
  serviceDuration: number,
  targetDate: string
) {
  const dayReference = "2026-01-01";
  const start = parse(`${dayReference} ${availability.startTime}`, "yyyy-MM-dd HH:mm:ss", new Date());
  const end = parse(`${dayReference} ${availability.endTime}`, "yyyy-MM-dd HH:mm:ss", new Date());
  const slots: HorarioSlot[] = [];
  const now = new Date();
  const isToday = targetDate === format(now, "yyyy-MM-dd");
  const targetDay = getDay(new Date(`${targetDate}T12:00:00`));

  for (let cursor = start; addMinutes(cursor, serviceDuration) <= end; cursor = addMinutes(cursor, availability.slotIntervalMinutes)) {
    const slotStart = format(cursor, "HH:mm:ss");
    const slotEnd = format(addMinutes(cursor, serviceDuration), "HH:mm:ss");
    const slotDateTime = parse(`${targetDate} ${slotStart}`, "yyyy-MM-dd HH:mm:ss", new Date());
    const isBusy = busySlots.some(
      (item) => item.barber_id === availability.barberId && overlaps(slotStart, slotEnd, item.start_time, item.end_time)
    );
    const isBlocked = scheduleBlocks.some((block) =>
      overlapsScheduleBlock(slotStart, slotEnd, block, targetDay, availability.barberId)
    );
    const isPastSlot = isToday && !isAfter(slotDateTime, now);

    if (!isBusy && !isBlocked && !isPastSlot) {
      slots.push({
        time: format(cursor, "HH:mm"),
        barberId: availability.barberId,
        barberName,
        available: true
      });
    }
  }

  return slots;
}

export async function listBusySlots(date: string, barberId?: string | null) {
  const { data, error } = await supabase.rpc("get_busy_slots", {
    target_date: date,
    target_barber_id: barberId ?? null
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BusySlotRow[];
}

export async function listAvailableSlots(
  date: string,
  barberId: string | null,
  serviceDuration: number,
  preload?: {
    barbers?: Barbeiro[];
    availability?: HorarioDisponibilidade[];
    scheduleBlocks?: ScheduleBlock[];
  }
) {
  const [barbers, availability, busySlots, scheduleBlocks] = await Promise.all([
    preload?.barbers ? Promise.resolve(preload.barbers) : listBarbeiros(false),
    preload?.availability ? Promise.resolve(preload.availability) : listDisponibilidade(barberId ?? undefined),
    listBusySlots(date, barberId),
    preload?.scheduleBlocks ? Promise.resolve(preload.scheduleBlocks) : listScheduleBlocks(barberId ?? undefined)
  ]);

  const targetDay = getDay(new Date(`${date}T12:00:00`));
  const filteredAvailability = availability.filter((item) => item.dayOfWeek === targetDay && item.isActive);

  const slots = filteredAvailability.flatMap((item) => {
    const barber = barbers.find((current) => current.id === item.barberId);
    if (!barber) {
      return [];
    }

    return buildSlotsForAvailability(item, barber.name, busySlots, scheduleBlocks, serviceDuration, date);
  });

  const deduped = new Map<string, HorarioSlot>();

  for (const slot of slots) {
    const key = barberId ? slot.time : `${slot.time}-${slot.barberId}`;
    if (!deduped.has(key)) {
      deduped.set(key, slot);
    }
  }

  return Array.from(deduped.values()).sort((left, right) => left.time.localeCompare(right.time));
}
