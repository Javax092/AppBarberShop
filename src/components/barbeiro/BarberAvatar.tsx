function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function BarberAvatar({
  name,
  imageUrl,
  className = "",
  initialsClassName = "",
  roundedClassName = "rounded-[24px]",
  fit = "cover",
  showFallbackLabel = false
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
  initialsClassName?: string;
  roundedClassName?: string;
  fit?: "cover" | "contain";
  showFallbackLabel?: boolean;
}) {
  const initials = getInitials(name) || "BR";

  return (
    <div
      aria-label={`Avatar de ${name}`}
      className={[
        "overflow-hidden border border-[rgba(201,169,110,0.18)] bg-[radial-gradient(circle_at_top,rgba(201,169,110,0.28),rgba(17,14,11,0.92)_58%)] shadow-lg shadow-black/20",
        roundedClassName,
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {imageUrl ? (
        <img alt={name} className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`} loading="lazy" src={imageUrl} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(160deg,rgba(201,169,110,0.18),rgba(17,14,11,0.96))] px-3 text-center">
          <span className={["font-display uppercase tracking-[0.16em] text-[#f0ede6]", initialsClassName].filter(Boolean).join(" ")}>
            {initials}
          </span>
          {showFallbackLabel ? <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[rgba(240,237,230,0.52)]">Sem foto</span> : null}
        </div>
      )}
    </div>
  );
}
