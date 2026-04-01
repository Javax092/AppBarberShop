import type { CSSProperties } from "react";

export function Skeleton({
  className = "",
  style = {},
  rounded = "24px"
}: {
  className?: string;
  style?: CSSProperties;
  rounded?: string;
}) {
  return (
    <>
      <style>{`
        .ui-skeleton {
          position: relative;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.07);
        }

        .ui-skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-120%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
          animation: shimmer 1.4s infinite linear;
        }

        .ui-skeleton--metric,
        .ui-skeleton--service,
        .ui-skeleton--barber {
          display: grid;
          gap: 12px;
          padding: 18px;
          border-radius: 24px;
          border: 1px solid var(--border-soft);
          background: var(--surface-elevated);
        }

        .ui-skeleton--service .ui-skeleton__thumb {
          aspect-ratio: 3 / 4;
          border-radius: 20px;
        }

        .ui-skeleton--barber .ui-skeleton__avatar {
          width: 56px;
          height: 56px;
          border-radius: 999px;
        }
      `}</style>
      <div
        aria-hidden="true"
        className={`ui-skeleton ${className}`.trim()}
        style={{ borderRadius: rounded, ...style }}
      />
    </>
  );
}

export function MetricSkeleton() {
  return (
    <div aria-hidden="true" className="ui-skeleton--metric">
      <Skeleton style={{ width: "52%", height: 28 }} />
      <Skeleton style={{ width: "68%", height: 12 }} />
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div aria-hidden="true" className="ui-skeleton--service">
      <Skeleton className="ui-skeleton__thumb" />
      <Skeleton style={{ width: "58%", height: 12 }} />
      <Skeleton style={{ width: "78%", height: 16 }} />
    </div>
  );
}

export function BarberCardSkeleton() {
  return (
    <div aria-hidden="true" className="ui-skeleton--barber">
      <Skeleton className="ui-skeleton__avatar" />
      <Skeleton style={{ width: "58%", height: 14 }} />
      <Skeleton style={{ width: "74%", height: 12 }} />
      <Skeleton style={{ width: "46%", height: 12 }} />
    </div>
  );
}
