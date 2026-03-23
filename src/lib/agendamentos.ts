import { addDays, format } from "date-fns";

import type { Agendamento, AuthProfile, CreateAppointmentInput, DashboardResumo, StatusAgendamento } from "../types/index.ts";
import { listBarbeiros } from "./barbeiros.ts";
import { listServicos } from "./catalogo.ts";
import { listPromocoes } from "./promocoes.ts";
import { supabase } from "./supabase.ts";

interface AppointmentRow {
  id: string;
  public_code: string;
  barber_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: StatusAgendamento;
  notes: string;
  total_price: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface BarberDashboardRow {
  today_appointments: number;
  week_appointments: number;
  estimated_revenue: number;
}

function mapAppointment(row: AppointmentRow): Agendamento {
  return {
    id: row.id,
    publicCode: row.public_code,
    barberId: row.barber_id,
    serviceId: row.service_id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    appointmentDate: row.appointment_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    notes: row.notes,
    totalPrice: Number(row.total_price),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function enrichAppointments(rows: AppointmentRow[]) {
  const promotions = await listPromocoes(true);
  const [barbers, services] = await Promise.all([listBarbeiros(true), listServicos(promotions, true)]);

  return rows.map((row) => ({
    ...mapAppointment(row),
    barber: barbers.find((item) => item.id === row.barber_id),
    service: services.find((item) => item.id === row.service_id)
  }));
}

async function listAgendamentosForAppUser(
  sessionProfile: AuthProfile,
  filters?: {
    barberId?: string;
    date?: string;
    status?: StatusAgendamento | "all";
  }
) {
  const { data, error } = await supabase.rpc("list_barber_appointments_app_user", {
    input_email: sessionProfile.email,
    input_password: sessionProfile.fallbackSecret ?? "",
    input_date: filters?.date ?? null,
    input_status: filters?.status && filters.status !== "all" ? filters.status : null
  });

  if (error) {
    throw new Error(error.message);
  }

  return enrichAppointments((data ?? []) as AppointmentRow[]);
}

export async function listAgendamentos(filters?: {
  barberId?: string;
  date?: string;
  status?: StatusAgendamento | "all";
}, sessionProfile?: AuthProfile | null) {
  if (sessionProfile?.authMode === "app_users") {
    return listAgendamentosForAppUser(sessionProfile, filters);
  }

  let query = supabase.from("appointments").select("*").order("appointment_date").order("start_time");

  if (filters?.barberId) {
    query = query.eq("barber_id", filters.barberId);
  }

  if (filters?.date) {
    query = query.eq("appointment_date", filters.date);
  }

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query.returns<AppointmentRow[]>();
  if (error) {
    throw new Error(error.message);
  }

  return enrichAppointments(data);
}

export async function listAgendaHoje(barberId?: string, sessionProfile?: AuthProfile | null) {
  return listAgendamentos({ barberId, date: format(new Date(), "yyyy-MM-dd") }, sessionProfile);
}

export async function listProximosAgendamentos(barberId?: string, sessionProfile?: AuthProfile | null) {
  if (sessionProfile?.authMode === "app_users") {
    const today = format(new Date(), "yyyy-MM-dd");
    return listAgendamentosForAppUser(sessionProfile, { barberId, status: "all" }).then((items) =>
      items.filter((item) => item.appointmentDate >= today && item.appointmentDate <= format(addDays(new Date(), 7), "yyyy-MM-dd"))
    );
  }

  const endDate = format(addDays(new Date(), 7), "yyyy-MM-dd");
  let query = supabase
    .from("appointments")
    .select("*")
    .gte("appointment_date", format(new Date(), "yyyy-MM-dd"))
    .lte("appointment_date", endDate)
    .order("appointment_date")
    .order("start_time");

  if (barberId) {
    query = query.eq("barber_id", barberId);
  }

  const { data, error } = await query.returns<AppointmentRow[]>();
  if (error) {
    throw new Error(error.message);
  }

  return enrichAppointments(data);
}

export async function createAgendamento(input: CreateAppointmentInput) {
  const { data, error } = await supabase.rpc("create_public_appointment", {
    input_barber_id: input.barberId,
    input_service_id: input.serviceId,
    input_client_name: input.clientName,
    input_client_phone: input.clientPhone,
    input_appointment_date: input.appointmentDate,
    input_start_time: input.startTime,
    input_notes: input.notes ?? ""
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("Nao foi possivel confirmar o agendamento.");
  }

  return mapAppointment(row as AppointmentRow);
}

export async function updateStatusAgendamento(id: string, status: StatusAgendamento, sessionProfile?: AuthProfile | null) {
  if (sessionProfile?.authMode === "app_users") {
    const { error } = await supabase.rpc("update_barber_appointment_status_app_user", {
      input_email: sessionProfile.email,
      input_password: sessionProfile.fallbackSecret ?? "",
      input_appointment_id: id,
      input_status: status
    });

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function getDashboardResumo(sessionProfile?: AuthProfile | null) {
  if (sessionProfile?.authMode === "app_users") {
    const { data, error } = await supabase.rpc("get_barber_dashboard_summary_app_user", {
      input_email: sessionProfile.email,
      input_password: sessionProfile.fallbackSecret ?? ""
    });

    if (error) {
      throw new Error(error.message);
    }

    const row = (Array.isArray(data) ? data[0] : data) as BarberDashboardRow | null;
    return {
      todayAppointments: Number(row?.today_appointments ?? 0),
      weekAppointments: Number(row?.week_appointments ?? 0),
      estimatedRevenue: Number(row?.estimated_revenue ?? 0)
    };
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const weekEnd = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const [todayRows, weekRows] = await Promise.all([
    supabase.from("appointments").select("id, total_price").eq("appointment_date", today),
    supabase
      .from("appointments")
      .select("id, total_price")
      .gte("appointment_date", today)
      .lte("appointment_date", weekEnd)
  ]);

  if (todayRows.error) {
    throw new Error(todayRows.error.message);
  }

  if (weekRows.error) {
    throw new Error(weekRows.error.message);
  }

  const result: DashboardResumo = {
    todayAppointments: todayRows.data.length,
    weekAppointments: weekRows.data.length,
    estimatedRevenue: todayRows.data.reduce((sum, item) => sum + Number(item.total_price), 0)
  };

  return result;
}
