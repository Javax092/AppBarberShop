function normalizePhoneDigits(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatWhatsAppNumber(value: string | null | undefined) {
  const digits = normalizePhoneDigits(value);

  if (!digits) {
    return null;
  }

  if (digits.startsWith("55") && digits.length >= 12) {
    return digits;
  }

  if (digits.length >= 10 && digits.length <= 11) {
    return `55${digits}`;
  }

  return digits.length >= 12 ? digits : null;
}

export function buildWhatsAppUrl(phone: string | null | undefined, message: string) {
  const normalizedNumber = formatWhatsAppNumber(phone);

  if (!normalizedNumber) {
    return null;
  }

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}

export function buildAppointmentWhatsAppMessage({
  clientName,
  serviceName,
  barberName,
  appointmentDate,
  appointmentTime,
  publicCode
}: {
  clientName: string;
  serviceName: string;
  barberName: string;
  appointmentDate: string;
  appointmentTime: string;
  publicCode?: string | null;
}) {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${appointmentDate}T12:00:00`));

  return [
    "Olá, acabei de fazer um agendamento.",
    `Nome: ${clientName}`,
    `Serviço: ${serviceName}`,
    `Barbeiro: ${barberName}`,
    `Data: ${formattedDate}`,
    `Horário: ${appointmentTime}`,
    publicCode ? `Código: ${publicCode}` : null
  ]
    .filter(Boolean)
    .join("\n");
}
