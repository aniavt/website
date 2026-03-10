import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ComponentChildren;
}

export default function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div class="fixed inset-0 z-40 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60" onClick={onClose} />
      <div class="relative z-50 w-full max-w-lg rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 shadow-2xl mx-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            class="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
