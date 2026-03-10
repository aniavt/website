import type { JSX } from "preact";
import { useState } from "preact/hooks";

interface Props {
  label?: string;
  error?: string;
  type?: string;
  class?: string;
  value?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onInput?: JSX.GenericEventHandler<HTMLInputElement>;
}

export default function Input({ label, error, type, class: cls, value, placeholder, autoFocus, onInput }: Props) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div class={`flex flex-col gap-1.5 ${cls ?? ""}`}>
      {label && <label class="text-sm font-medium text-[var(--text-secondary)]">{label}</label>}
      <div class="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onInput={onInput}
          class={`w-full rounded-lg border bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--border-accent)] ${error ? "border-[var(--error)]" : "border-[var(--border-subtle)]"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xs cursor-pointer"
          >
            {show ? "Ocultar" : "Mostrar"}
          </button>
        )}
      </div>
      {error && <span class="text-xs text-[var(--error)]">{error}</span>}
    </div>
  );
}
