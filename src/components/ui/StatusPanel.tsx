import type { ReactNode } from "react";

interface StatusPanelProps {
  title: string;
  description: string;
  tone?: "default" | "warning" | "danger";
  action?: ReactNode;
  compact?: boolean;
}

const toneClassMap = {
  default: "border-white/10 bg-white/[0.03] text-white/80",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-50",
  danger: "border-rose-400/24 bg-rose-400/10 text-rose-50"
} satisfies Record<NonNullable<StatusPanelProps["tone"]>, string>;

export function StatusPanel({
  title,
  description,
  tone = "default",
  action = null,
  compact = false
}: StatusPanelProps) {
  return (
    <section
      className={`rounded-[28px] border px-5 ${compact ? "py-4" : "py-5 sm:px-6 sm:py-6"} ${toneClassMap[tone]}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-current/70">
            Status da experiencia
          </p>
          <h3 className="mt-2 text-xl font-semibold text-current">{title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-current/80">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}
