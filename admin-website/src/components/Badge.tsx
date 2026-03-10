const variants = {
  active: "bg-[var(--success)]/15 text-[var(--success)]",
  inactive: "bg-[var(--error)]/15 text-[var(--error)]",
  admin: "bg-[var(--warning)]/15 text-[var(--warning)]",
  root: "bg-[var(--info)]/15 text-[var(--info)]",
  deleted: "bg-[var(--text-muted)]/15 text-[var(--text-muted)]",
} as const;

interface Props {
  variant: keyof typeof variants;
  children: string;
}

export default function Badge({ variant, children }: Props) {
  return (
    <span class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
