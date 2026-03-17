const SLOT_STEP_MINUTES = 10;
const BUFFER_MINUTES = 10;
const MAX_BUFFER_MINUTES = 15;

export function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value) {
  const hours = String(Math.floor(value / 60)).padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function getServiceTotals(selectedServices) {
  const subtotal = selectedServices.reduce((sum, item) => sum + item.price, 0);
  const duration = selectedServices.reduce((sum, item) => sum + item.duration, 0);
  const buffer = selectedServices.length > 1 ? MAX_BUFFER_MINUTES : BUFFER_MINUTES;
  return {
    subtotal,
    serviceDuration: duration,
    buffer,
    totalDuration: duration + buffer
  };
}

export function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

export function buildAppointmentEnd(startTime, totalDuration) {
  return minutesToTime(timeToMinutes(startTime) + totalDuration);
}

export function isSlotBlocked({
  barber,
  date,
  startTime,
  totalDuration,
  appointments
}) {
  const day = new Date(`${date}T12:00:00`).getDay();
  if (barber.daysOff.includes(day)) {
    return true;
  }

  const start = timeToMinutes(startTime);
  const end = start + totalDuration;
  const workingStart = timeToMinutes(barber.workingHours.start);
  const workingEnd = timeToMinutes(barber.workingHours.end);

  if (start < workingStart || end > workingEnd) {
    return true;
  }

  const hasBreakConflict = barber.breakRanges.some((range) =>
    overlaps(start, end, timeToMinutes(range.start), timeToMinutes(range.end))
  );

  if (hasBreakConflict) {
    return true;
  }

  const barberAppointments = appointments.filter(
    (appointment) =>
      appointment.barberId === barber.id &&
      appointment.date === date &&
      appointment.status !== "cancelled"
  );

  return barberAppointments.some((appointment) =>
    overlaps(
      start,
      end,
      timeToMinutes(appointment.startTime),
      timeToMinutes(appointment.endTime)
    )
  );
}

export function generateTimeSlots({ barber, date, totalDuration, appointments }) {
  const slots = [];
  const start = timeToMinutes(barber.workingHours.start);
  const end = timeToMinutes(barber.workingHours.end);

  for (let cursor = start; cursor <= end - totalDuration; cursor += SLOT_STEP_MINUTES) {
    const startTime = minutesToTime(cursor);
    slots.push({
      value: startTime,
      disabled: isSlotBlocked({
        barber,
        date,
        startTime,
        totalDuration,
        appointments
      })
    });
  }

  return slots;
}

export function groupAppointmentsByBarber(appointments) {
  return appointments.reduce((acc, appointment) => {
    if (!acc[appointment.barberId]) {
      acc[appointment.barberId] = [];
    }

    acc[appointment.barberId].push(appointment);
    return acc;
  }, {});
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function formatDateLabel(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(new Date(`${date}T12:00:00`));
}

export function formatLongDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(new Date(`${date}T12:00:00`));
}

export function createDateOptions(total = 10) {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = 0; index < total; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

export function buildWhatsAppLink(phone, message) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildBookingCode(barberCode, date, count) {
  const suffix = date.replace(/-/g, "").slice(-4);
  const serial = String(count + 1).padStart(2, "0");
  return `${barberCode}-${suffix}-${serial}`;
}
