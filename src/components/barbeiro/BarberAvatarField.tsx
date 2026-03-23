import { BARBER_AVATAR_ACCEPT, formatBarberAvatarSizeLimit } from "../../lib/avatar.ts";
import { BarberAvatar } from "./BarberAvatar.tsx";

export function BarberAvatarField({
  barberName,
  imageUrl,
  disabled = false,
  helperText,
  error,
  previewLabel,
  onFileChange,
  onRemove
}: {
  barberName: string;
  imageUrl: string | null;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  previewLabel?: string;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  return (
    <section className="rounded-[24px] border border-[rgba(201,169,110,0.12)] bg-[rgba(255,255,255,0.02)] p-5">
      <div className="grid gap-5 md:grid-cols-[148px_1fr] md:items-center">
        <div className="space-y-3">
          <BarberAvatar
            className="h-36 w-36"
            imageUrl={imageUrl}
            initialsClassName="text-4xl"
            name={barberName}
            roundedClassName="rounded-[32px]"
            showFallbackLabel
          />
          <div className="rounded-[20px] border border-[rgba(201,169,110,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-xs text-[rgba(240,237,230,0.56)]">
            <p className="font-semibold uppercase tracking-[0.22em] text-[#c9a96e]">Preview</p>
            <p className="mt-2 leading-5">{previewLabel ?? (imageUrl ? "Imagem pronta para perfil, card e lista." : "Avatar padrao sera usado ate enviar uma foto.")}</p>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="barber-avatar">
            Foto do perfil
          </label>
          <p className="mt-2 text-sm leading-6 text-[rgba(240,237,230,0.58)]">
            Envie JPG, JPEG, PNG ou WEBP com ate {formatBarberAvatarSizeLimit()}. O arquivo e renomeado no servidor e salvo com seguranca.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <label className={`btn-secondary cursor-pointer px-4 py-2 ${disabled ? "pointer-events-none opacity-60" : ""}`} htmlFor="barber-avatar">
              Escolher imagem
            </label>
            <input
              accept={BARBER_AVATAR_ACCEPT}
              className="sr-only"
              disabled={disabled}
              id="barber-avatar"
              type="file"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />

            <button
              className="btn-secondary px-4 py-2"
              disabled={disabled || !imageUrl}
              type="button"
              onClick={onRemove}
            >
              Remover foto
            </button>
          </div>

          {helperText ? <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[rgba(240,237,230,0.38)]">{helperText}</p> : null}
          {error ? <p className="mt-3 text-sm text-[#d09c9c]">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
