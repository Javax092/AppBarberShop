export type PerfilAcesso = "admin" | "barber";
export type StatusAgendamento = "pending" | "confirmed" | "cancelled" | "completed";
export type StatusPromocao = "ativa" | "futura" | "expirada";

export interface AuthProfile {
  id: string;
  email: string;
  fullName: string;
  role: PerfilAcesso;
  phone: string | null;
  avatarUrl: string | null;
  barberId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  authMode?: "supabase" | "app_users";
  fallbackSecret?: string;
}

export interface Barbeiro {
  id: string;
  name: string;
  bio: string;
  phone: string | null;
  avatarUrl: string | null;
  specialties: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BarbeiroAdmin extends Barbeiro {
  profileId: string;
  email: string;
  fullName: string;
}

export interface Promocao {
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  imageUrl: string | null;
  isActive: boolean;
  status: StatusPromocao;
  createdAt: string;
  updatedAt: string;
}

export interface Servico {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
  featured: boolean;
  promotion: Promocao | null;
  createdAt: string;
  updatedAt: string;
}

export interface HorarioDisponibilidade {
  id: string;
  barberId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotIntervalMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleBlock {
  id: string;
  barberId: string | null;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  label: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HorarioSlot {
  time: string;
  barberId: string;
  barberName: string;
  available: boolean;
}

export interface Agendamento {
  id: string;
  publicCode: string;
  barberId: string;
  serviceId: string;
  clientName: string;
  clientPhone: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: StatusAgendamento;
  notes: string;
  totalPrice: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  barber?: Barbeiro;
  service?: Servico;
}

export interface DashboardResumo {
  todayAppointments: number;
  weekAppointments: number;
  estimatedRevenue: number;
}

export interface AlertaAdmin {
  id: string;
  title: string;
  description: string;
  tone: "warning" | "info";
}

export interface SessionState {
  session: import("@supabase/supabase-js").Session | null;
  profile: AuthProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isBarbeiro: boolean;
}

export interface CreateAppointmentInput {
  barberId: string;
  serviceId: string;
  clientName: string;
  clientPhone: string;
  appointmentDate: string;
  startTime: string;
  notes?: string;
}

export interface ServicoPayload {
  id?: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
  imageUrl: string | null;
  isActive: boolean;
  featured: boolean;
}

export interface PromocaoPayload {
  id?: string;
  title: string;
  description: string;
  discountPercent: number;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  imageUrl: string | null;
  isActive: boolean;
}

export interface BarbeiroPayload {
  id?: string;
  email: string;
  password?: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  barber: {
    id?: string;
    name: string;
    bio: string;
    phone: string | null;
    avatarUrl: string | null;
    specialties: string[];
    isActive: boolean;
  };
}

export interface BusySlotRow {
  barber_id: string;
  start_time: string;
  end_time: string;
}

export interface PublicHomeMetrics {
  servicesCount: number;
  categoriesCount: number;
  barbersCount: number;
  barbersWithPhotos: number;
}

export interface PublicHomeSnapshot {
  barbers: Barbeiro[];
  services: Servico[];
  metrics: PublicHomeMetrics;
}

export interface PublicBookingSnapshot {
  barbers: Barbeiro[];
  services: Servico[];
  availability: HorarioDisponibilidade[];
  scheduleBlocks: ScheduleBlock[];
}
