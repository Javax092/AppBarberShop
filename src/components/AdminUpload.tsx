import { useState, type ChangeEvent, type FormEvent } from "react";
import { uploadImagemAdmin } from "../lib/admin";

interface AdminUploadProps {
  isAdmin: boolean;
  onUploaded?: () => Promise<void> | void;
}

export function AdminUpload({ isAdmin, onUploaded }: AdminUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isAdmin) {
    return null;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    setSuccess("");
    setFile(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Selecione uma imagem antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const uploaded = await uploadImagemAdmin({ file });
      setSuccess(`Upload concluido com sucesso: ${uploaded.publicUrl}`);
      setFile(null);
      event.currentTarget.reset();

      if (onUploaded) {
        await onUploaded();
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha ao enviar a imagem.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Upload de imagens</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="admin-image-upload">Selecionar imagem</label>
        <input
          id="admin-image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isSubmitting}
        />

        <button type="submit" disabled={isSubmitting || !file}>
          {isSubmitting ? "Enviando..." : "Enviar imagem"}
        </button>
      </form>

      {error ? <p role="alert">{error}</p> : null}
      {success ? <p>{success}</p> : null}
    </section>
  );
}
