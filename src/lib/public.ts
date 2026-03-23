import type {
  Barbeiro,
  HorarioDisponibilidade,
  Promocao,
  PublicBookingSnapshot,
  PublicHomeSnapshot,
  ScheduleBlock,
  Servico
} from "../types/index.ts";
import { getPublicUrl, supabase } from "./supabase.ts";

interface PublicBarberRow {
  id: string;
  name: string;
  bio: string;
  phone: string | null;
  avatar_url: string | null;
  specialties: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PublicPromotionRow {
  id: string;
  title: string;
  description: string;
  discount_percent: number;
  service_id: string;
  starts_at: string;
  ends_at: string;
  image_url: string | null;
  is_active: boolean;
  status: "ativa";
  created_at: string;
  updated_at: string;
}

interface PublicServiceRow {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
  featured: boolean;
  promotion: PublicPromotionRow | null;
  created_at: string;
  updated_at: string;
}

interface PublicAvailabilityRow {
  id: string;
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_interval_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PublicScheduleBlockRow {
  id: string;
  barber_id: string | null;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PublicHomeMetricsRow {
  services_count: number;
  categories_count: number;
  barbers_count: number;
  barbers_with_photos: number;
}

function mapPromotion(row: PublicPromotionRow | null): Promocao | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    discountPercent: row.discount_percent,
    serviceId: row.service_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    imageUrl: getPublicUrl(row.image_url),
    isActive: row.is_active,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapBarber(row: PublicBarberRow): Barbeiro {
  return {
    id: row.id,
    name: row.name,
    bio: row.bio,
    phone: row.phone,
    avatarUrl: getPublicUrl(row.avatar_url),
    specialties: row.specialties ?? [],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapService(row: PublicServiceRow): Servico {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    durationMinutes: row.duration_minutes,
    category: row.category,
    imageUrl: getPublicUrl(row.image_url),
    isActive: row.is_active,
    featured: row.featured,
    promotion: mapPromotion(row.promotion),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapAvailability(row: PublicAvailabilityRow): HorarioDisponibilidade {
  return {
    id: row.id,
    barberId: row.barber_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    slotIntervalMinutes: row.slot_interval_minutes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapScheduleBlock(row: PublicScheduleBlockRow): ScheduleBlock {
  return {
    id: row.id,
    barberId: row.barber_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    label: row.label,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getPublicHomeSnapshot(): Promise<PublicHomeSnapshot> {
  const { data, error } = await supabase.rpc("public_home_snapshot");

  if (error) {
    throw new Error(error.message);
  }

  const payload = (data ?? {}) as {
    barbers?: PublicBarberRow[];
    services?: PublicServiceRow[];
    metrics?: PublicHomeMetricsRow;
  };

  return {
    barbers: (payload.barbers ?? []).map(mapBarber),
    services: (payload.services ?? []).map(mapService),
    metrics: {
      servicesCount: Number(payload.metrics?.services_count ?? 0),
      categoriesCount: Number(payload.metrics?.categories_count ?? 0),
      barbersCount: Number(payload.metrics?.barbers_count ?? 0),
      barbersWithPhotos: Number(payload.metrics?.barbers_with_photos ?? 0)
    }
  };
}

export async function getPublicBookingSnapshot(): Promise<PublicBookingSnapshot> {
  const { data, error } = await supabase.rpc("public_booking_snapshot_v2");

  if (error) {
    throw new Error(error.message);
  }

  const payload = (data ?? {}) as {
    barbers?: PublicBarberRow[];
    services?: PublicServiceRow[];
    availability?: PublicAvailabilityRow[];
    schedule_blocks?: PublicScheduleBlockRow[];
  };

  return {
    barbers: (payload.barbers ?? []).map(mapBarber),
    services: (payload.services ?? []).map(mapService),
    availability: (payload.availability ?? []).map(mapAvailability),
    scheduleBlocks: (payload.schedule_blocks ?? []).map(mapScheduleBlock)
  };
}
