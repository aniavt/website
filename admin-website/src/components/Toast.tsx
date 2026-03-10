import { toasts, removeToast } from "@store/toast";

const typeStyles = {
  success: "border-[var(--success)]",
  error: "border-[var(--error)]",
  info: "border-[var(--info)]",
} as const;

export default function ToastContainer() {
  if (toasts.value.length === 0) return null;

  return (
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.value.map((t) => (
        <div
          key={t.id}
          class={`flex items-center gap-3 rounded-lg border-l-4 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] px-4 py-3 shadow-lg ${typeStyles[t.type]}`}
        >
          <span class="text-sm text-[var(--text-primary)] flex-1">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            class="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
