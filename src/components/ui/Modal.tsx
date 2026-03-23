import type { PropsWithChildren } from "react";

export function Modal({
  open,
  title,
  onClose,
  children
}: PropsWithChildren<{ open: boolean; title: string; onClose: () => void }>) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[rgba(5,5,4,0.8)] p-4 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="surface-elevated w-full max-w-2xl p-6 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-4xl text-[#f0ede6]">{title}</h3>
          <button className="btn-secondary px-4 py-2" onClick={onClose} type="button">
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
