export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[rgba(240,237,230,0.72)]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(201,169,110,0.16)] border-t-[#c9a96e]" />
      <span>{label}</span>
    </div>
  );
}
