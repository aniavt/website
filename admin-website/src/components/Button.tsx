import type { JSX } from "preact";

const variants = {
  primary: "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white",
  danger: "bg-[var(--error)] hover:bg-[var(--error-muted)] text-white",
  success: "bg-[var(--success)] hover:bg-[var(--success-muted)] text-white",
  ghost: "bg-transparent hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]",
  warning: "bg-[var(--warning)] hover:bg-[var(--warning-muted)] text-black",
} as const;

interface Props {
  variant?: keyof typeof variants;
  loading?: boolean;
  disabled?: boolean;
  type?: string;
  class?: string;
  onClick?: JSX.MouseEventHandler<HTMLButtonElement>;
  children: preact.ComponentChildren;
}

export default function Button({ variant = "primary", loading, disabled, type, class: cls, onClick, children }: Props) {
  return (
    <button
      type={type as "button" | "submit" | "reset" | undefined}
      disabled={disabled || loading}
      onClick={onClick}
      class={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${cls ?? ""}`}
    >
      {loading && (
        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
