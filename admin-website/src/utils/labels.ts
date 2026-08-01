export const lastActionLabel: Record<string, string> = {
  created: "Creado",
  updated: "Actualizado",
  deleted: "Eliminado",
  restore: "Restaurado",
  restored: "Restaurado",
};

export function formatDate(
  value: string | number | Date | null | undefined,
  opts?: { withTime?: boolean },
): string {
  if (value == null || value === "") return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return opts?.withTime ? d.toLocaleString() : d.toLocaleDateString();
}
