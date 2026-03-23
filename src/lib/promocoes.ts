import { isAfter, isBefore } from "date-fns";

import type { Promocao, PromocaoPayload } from "../types/index.ts";
import { ensureValidSupabaseSession, getPublicUrl, supabase, uploadImage } from "./supabase.ts";

interface PromotionRow {
  id: string;
  title: string;
  description: string;
  discount_percent: number;
  service_id: string;
  starts_at: string;
  ends_at: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function getStatus(row: PromotionRow): Promocao["status"] {
  const now = new Date();
  const startsAt = new Date(row.starts_at);
  const endsAt = new Date(row.ends_at);

  if (!row.is_active || isAfter(now, endsAt)) {
    return "expirada";
  }

  if (isBefore(now, startsAt)) {
    return "futura";
  }

  return "ativa";
}

function mapPromotion(row: PromotionRow): Promocao {
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
    status: getStatus(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listPromocoes(includeInactive = false) {
  let query = supabase.from("promotions").select("*").order("starts_at", { ascending: true });

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.returns<PromotionRow[]>();
  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapPromotion);
}

export async function upsertPromocao(payload: PromocaoPayload, imageFile?: File | null) {
  await ensureValidSupabaseSession();

  let imagePath = payload.imageUrl;

  if (imageFile) {
    imagePath = await uploadImage(imageFile, "promotions");
  }

  const query = payload.id
    ? supabase
        .from("promotions")
        .update({
          title: payload.title,
          description: payload.description,
          discount_percent: payload.discountPercent,
          service_id: payload.serviceId,
          starts_at: payload.startsAt,
          ends_at: payload.endsAt,
          image_url: imagePath,
          is_active: payload.isActive
        })
        .eq("id", payload.id)
    : supabase.from("promotions").insert({
        title: payload.title,
        description: payload.description,
        discount_percent: payload.discountPercent,
        service_id: payload.serviceId,
        starts_at: payload.startsAt,
        ends_at: payload.endsAt,
        image_url: imagePath,
        is_active: payload.isActive
      });

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}

export async function togglePromocao(id: string, isActive: boolean) {
  await ensureValidSupabaseSession();

  const { error } = await supabase.from("promotions").update({ is_active: isActive }).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function deletePromocao(id: string) {
  await ensureValidSupabaseSession();

  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
