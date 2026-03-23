import { PUBLIC_IMAGES_BUCKET, PUBLIC_IMAGES_FOLDER, supabase } from "./supabase.ts";

export interface ImagemPublica {
  name: string;
  path: string;
  publicUrl: string;
  updatedAt: string | null;
}

export async function listarImagensPublicas(folder = PUBLIC_IMAGES_FOLDER): Promise<ImagemPublica[]> {
  const normalizedFolder = folder.trim();
  const { data, error } = await supabase.storage.from(PUBLIC_IMAGES_BUCKET).list(normalizedFolder, {
    limit: 100,
    offset: 0,
    sortBy: { column: "updated_at", order: "desc" }
  });

  if (error) {
    throw new Error(`Falha ao listar as imagens publicas: ${error.message}`);
  }

  return (data ?? [])
    .filter((item) => item.name && item.id)
    .map((item) => {
      const path = normalizedFolder ? `${normalizedFolder}/${item.name}` : item.name;
      const { data: publicUrlData } = supabase.storage.from(PUBLIC_IMAGES_BUCKET).getPublicUrl(path);

      return {
        name: item.name,
        path,
        publicUrl: publicUrlData.publicUrl,
        updatedAt: item.updated_at ?? null
      };
    });
}
