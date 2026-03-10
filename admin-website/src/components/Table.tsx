import type { ComponentChildren } from "preact";

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ComponentChildren;
  class?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyFn: (item: T) => string;
  emptyMessage?: string;
}

export default function Table<T>({ columns, data, keyFn, emptyMessage = "Sin datos" }: Props<T>) {
  return (
    <div class="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            {columns.map((col) => (
              <th key={col.key} class={`px-4 py-3 text-left font-medium text-[var(--text-secondary)] ${col.class ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} class="px-4 py-8 text-center text-[var(--text-muted)]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyFn(item)} class="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors">
                {columns.map((col) => (
                  <td key={col.key} class={`px-4 py-3 ${col.class ?? ""}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
