import { sampleAppointments } from "../data";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

const TABLE_NAME = "appointments";

function normalizeAppointment(row) {
  return {
    id: row.id,
    barberId: row.barber_id,
    clientName: row.client_name,
    clientWhatsapp: row.client_whatsapp,
    serviceIds: row.service_ids,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
    notes: row.notes ?? ""
  };
}

function serializeAppointment(appointment) {
  return {
    id: appointment.id,
    barber_id: appointment.barberId,
    client_name: appointment.clientName,
    client_whatsapp: appointment.clientWhatsapp,
    service_ids: appointment.serviceIds,
    date: appointment.date,
    start_time: appointment.startTime,
    end_time: appointment.endTime,
    status: appointment.status,
    created_at: appointment.createdAt,
    notes: appointment.notes ?? ""
  };
}

export async function listAppointments() {
  if (!isSupabaseConfigured()) {
    return {
      source: "local",
      data: sampleAppointments
    };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return {
    source: "supabase",
    data: data.map(normalizeAppointment)
  };
}

export async function createAppointment(appointment) {
  if (!isSupabaseConfigured()) {
    return {
      source: "local",
      data: appointment
    };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(serializeAppointment(appointment))
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    source: "supabase",
    data: normalizeAppointment(data)
  };
}
