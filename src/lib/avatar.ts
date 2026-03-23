const ALLOWED_TYPES = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"]
} as const;

export const BARBER_AVATAR_MAX_SIZE_BYTES = 3 * 1024 * 1024;
export const BARBER_AVATAR_ACCEPT = ".jpg,.jpeg,.png,.webp";

function getExtensionFromName(fileName: string) {
  return fileName.split(".").pop()?.trim().toLowerCase() ?? "";
}

export function getBarberAvatarMimeType(file: File) {
  const normalizedType = file.type.trim().toLowerCase();
  const extension = getExtensionFromName(file.name);

  if (normalizedType in ALLOWED_TYPES) {
    return normalizedType as keyof typeof ALLOWED_TYPES;
  }

  const fallbackType = Object.entries(ALLOWED_TYPES).find(([, extensions]) => extensions.includes(extension));
  return (fallbackType?.[0] ?? null) as keyof typeof ALLOWED_TYPES | null;
}

export function getBarberAvatarExtension(file: File) {
  const mimeType = getBarberAvatarMimeType(file);
  if (!mimeType) {
    return null;
  }

  return ALLOWED_TYPES[mimeType][0];
}

export function validateBarberAvatarFile(file: File) {
  const mimeType = getBarberAvatarMimeType(file);

  if (!mimeType) {
    throw new Error("Envie uma imagem JPG, JPEG, PNG ou WEBP.");
  }

  if (file.size > BARBER_AVATAR_MAX_SIZE_BYTES) {
    throw new Error("A foto deve ter no maximo 3 MB.");
  }

  return {
    mimeType,
    extension: ALLOWED_TYPES[mimeType][0]
  };
}

export function formatBarberAvatarSizeLimit() {
  return `${Math.round(BARBER_AVATAR_MAX_SIZE_BYTES / (1024 * 1024))} MB`;
}

export function createObjectPreview(file: File) {
  return URL.createObjectURL(file);
}

export async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem selecionada."));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const [, base64] = result.split(",", 2);

      if (!base64) {
        reject(new Error("Nao foi possivel converter a imagem."));
        return;
      }

      resolve(base64);
    };

    reader.readAsDataURL(file);
  });
}
