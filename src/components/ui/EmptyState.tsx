export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="surface-elevated px-6 py-10 text-center sm:px-8">
      <svg className="empty-illustration" fill="none" viewBox="0 0 160 160">
        <rect x="22" y="32" width="116" height="96" rx="24" stroke="currentColor" strokeOpacity="0.34" strokeWidth="1.5" />
        <path d="M48 58h64M48 78h42M48 98h28" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.46" strokeWidth="1.5" />
        <circle cx="114" cy="98" r="18" stroke="currentColor" strokeWidth="1.5" />
        <path d="m126 110 12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
      <span className="section-kicker">Disponibilidade</span>
      <h3 className="mt-5 font-display text-4xl text-[#f0ede6]">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[rgba(240,237,230,0.62)]">{description}</p>
    </div>
  );
}
