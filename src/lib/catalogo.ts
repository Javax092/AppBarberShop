import type { Promocao, Servico, ServicoPayload } from "../types/index.ts";
import { ensureValidSupabaseSession, getPublicUrl, supabase, uploadImage } from "./supabase.ts";

interface ServiceRow {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

function mapService(row: ServiceRow, promotions: Promocao[]): Servico {
  const promotion = promotions.find((item) => item.serviceId === row.id && item.status === "ativa") ?? null;

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
    promotion,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listServicos(promotions: Promocao[] = [], includeInactive = false) {
  let query = supabase.from("services").select("*").order("featured", { ascending: false }).order("name");

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.returns<ServiceRow[]>();
  if (error) {
    throw new Error(error.message);
  }

  return data.map((row) => mapService(row, promotions));
}

export async function upsertServico(payload: ServicoPayload, imageFile?: File | null) {
  await ensureValidSupabaseSession();

  let imagePath = payload.imageUrl;

  if (imageFile) {
    imagePath = await uploadImage(imageFile, "services");
  }

  const query = payload.id
    ? supabase
        .from("services")
        .update({
          name: payload.name,
          description: payload.description,
          price: payload.price,
          duration_minutes: payload.durationMinutes,
          category: payload.category,
          image_url: imagePath,
          is_active: payload.isActive,
          featured: payload.featured
        })
        .eq("id", payload.id)
    : supabase.from("services").insert({
        name: payload.name,
        description: payload.description,
        price: payload.price,
        duration_minutes: payload.durationMinutes,
        category: payload.category,
        image_url: imagePath,
        is_active: payload.isActive,
        featured: payload.featured
      });

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleServico(id: string, isActive: boolean) {
  await ensureValidSupabaseSession();

  const { error } = await supabase.from("services").update({ is_active: isActive }).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteServico(id: string) {
  await ensureValidSupabaseSession();

  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
