function normalizeHex(value: string): string {
  const v = value.replace(/^#/, "").trim();
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v}`;
  if (/^[0-9A-Fa-f]{3}$/.test(v)) {
    const r = v[0] + v[0];
    const g = v[1] + v[1];
    const b = v[2] + v[2];
    return `#${r}${g}${b}`;
  }
  return value;
}

function toColorInputValue(hex: string): string {
  const n = normalizeHex(hex);
  return /^#[0-9A-Fa-f]{6}$/.test(n) ? n : "#000000";
}

interface Props {
  label?: string;
  value: string;
  onInput: (value: string) => void;
  class?: string;
}

export default function ColorPicker({ label, value, onInput, class: cls }: Props) {
  const colorInputValue = toColorInputValue(value || "#000000");
  const displayValue = value?.trim() || "";

  function handleTextChange(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    onInput(v);
  }

  function handleNativeChange(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    onInput(v);
  }

  return (
    <div class={`flex flex-col gap-1 ${cls ?? ""}`}>
      {label && (
        <span class="text-sm text-[var(--text-secondary)]">{label}</span>
      )}
      <div class="flex items-center gap-2">
        <input
          type="color"
          value={colorInputValue}
          onInput={handleNativeChange}
          class="h-9 w-11 cursor-pointer rounded border border-[var(--border-subtle)] bg-transparent p-0.5"
          title="Elegir color"
        />
        <input
          type="text"
          value={displayValue}
          onInput={handleTextChange}
          placeholder="#000000"
          class="w-24 rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2 py-1 text-sm text-[var(--text-primary)] outline-none"
          title="Código hex"
        />
      </div>
    </div>
  );
}
