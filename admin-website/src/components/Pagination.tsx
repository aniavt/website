import Button from "@components/Button";

interface Props {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
}

export default function Pagination({ offset, limit, total, onChange }: Props) {
  if (total <= limit) return null;

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div class="flex items-center justify-between pt-4">
      <span class="text-sm text-[var(--text-muted)]">
        Página {currentPage} de {totalPages}
      </span>
      <div class="flex gap-2">
        <Button variant="ghost" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>
          Anterior
        </Button>
        <Button variant="ghost" disabled={offset + limit >= total} onClick={() => onChange(offset + limit)}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
