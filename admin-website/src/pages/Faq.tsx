import { useState, useEffect, useCallback } from "preact/hooks";
import { api, ApiError, t } from "@utils";
import { addToast } from "@store/toast";
import {
  canManageFaqRead,
  canManageFaqCreate,
  canManageFaqUpdate,
  canManageFaqDelete,
  canManageFaqRestore,
} from "@store/auth";
import Layout from "@components/Layout";
import Table, { type Column } from "@components/Table";
import Button from "@components/Button";
import Badge from "@components/Badge";
import Modal from "@components/Modal";
import Input from "@components/Input";

interface FaqItem {
  id: string;
  query: string;
  answer: string;
  isActive: boolean;
  lastAction: string;
}

interface HistoryEntry {
  id: string;
  action: string;
  by: string;
  byUsername: string;
  timestamp: string;
}

export default function Faq() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<FaqItem[]>(`/faq${showAll ? "" : "?activeOnly=true"}`);
      setItems(data);
    } catch {
      addToast("Error al cargar FAQ", "error");
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function openCreate() {
    setEditing(null);
    setQuery("");
    setAnswer("");
    setFormOpen(true);
  }

  function openEdit(item: FaqItem) {
    setEditing(item);
    setQuery(item.query);
    setAnswer(item.answer);
    setFormOpen(true);
  }

  async function handleSave(e: Event) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/faq/${editing.id}`, { query, answer });
        addToast("FAQ actualizado", "success");
      } else {
        await api.post("/faq", { query, answer });
        addToast("FAQ creado", "success");
      }
      setFormOpen(false);
      fetchItems();
    } catch (err) {
      addToast(err instanceof ApiError ? t(err.code) : t("unknown_error"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: FaqItem) {
    try {
      if (item.isActive) {
        await api.delete(`/faq/${item.id}`);
        addToast("FAQ eliminado", "success");
      } else {
        await api.post(`/faq/${item.id}/restore`);
        addToast("FAQ restaurado", "success");
      }
      fetchItems();
    } catch (err) {
      addToast(err instanceof ApiError ? t(err.code) : t("unknown_error"), "error");
    }
  }

  async function openHistory(item: FaqItem) {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      setHistory(await api.get<HistoryEntry[]>(`/faq/${item.id}/history`));
    } catch {
      addToast("Error al cargar historial", "error");
      setHistoryOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  }

  const actionLabels: Record<string, string> = {
    created: "Creado",
    updated: "Actualizado",
    deleted: "Eliminado",
    restore: "Restaurado",
  };

  const columns: Column<FaqItem>[] = [
    {
      key: "query",
      header: "Pregunta",
      render: (item) => {
        const isExpanded = expanded[item.id] ?? false;
        return (
          <div class="flex flex-col gap-1">
            <button
              type="button"
              class="flex items-start gap-2 text-left text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
              onClick={() =>
                setExpanded((prev) => ({ ...prev, [item.id]: !isExpanded }))
              }
            >
              <span class="mt-0.5 text-xs text-[var(--text-muted)]">
                {isExpanded ? "▾" : "▸"}
              </span>
              <span class="line-clamp-2">{item.query}</span>
            </button>
            {isExpanded && (
              <div class="ml-5 rounded-md bg-[var(--bg-tertiary)] px-3 py-2 text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                {item.answer}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (item) => (
        <Badge variant={item.isActive ? "active" : "deleted"}>
          {item.isActive ? "Activo" : "Eliminado"}
        </Badge>
      ),
      class: "w-28",
    },
    {
      key: "actions",
      header: "Acciones",
      render: (item) => (
        <div class="flex gap-2">
          {item.isActive && canManageFaqUpdate.value && (
            <Button variant="ghost" onClick={() => openEdit(item)}>Editar</Button>
          )}
          {canManageFaqDelete.value && item.isActive && (
            <Button
              variant="danger"
              onClick={() => handleToggleActive(item)}
            >
              Eliminar
            </Button>
          )}
          {canManageFaqRestore.value && !item.isActive && (
            <Button
              variant="success"
              onClick={() => handleToggleActive(item)}
            >
              Restaurar
            </Button>
          )}
          {canManageFaqRead.value && (
            <Button variant="ghost" onClick={() => openHistory(item)}>Historial</Button>
          )}
        </div>
      ),
      class: "w-64",
    },
  ];

  return (
    <Layout>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-bold text-[var(--text-primary)]">Preguntas Frecuentes</h1>
          <p class="text-sm text-[var(--text-muted)] mt-0.5">Administra las FAQ del sistema</p>
        </div>
        <div class="flex gap-3">
          <Button variant="ghost" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Solo activos" : "Mostrar todos"}
          </Button>
          {canManageFaqCreate.value && (
            <Button onClick={openCreate}>Crear FAQ</Button>
          )}
        </div>
      </div>

      {loading ? (
        <p class="text-[var(--text-muted)] py-12 text-center">Cargando...</p>
      ) : (
        <Table columns={columns} data={items} keyFn={(i) => i.id} emptyMessage="No hay preguntas frecuentes" />
      )}

      {/* Create/Edit Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Editar FAQ" : "Crear FAQ"}>
        <form onSubmit={handleSave} class="flex flex-col gap-4">
          <Input
            label="Pregunta"
            placeholder="¿Cuál es la pregunta?"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          />
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-[var(--text-secondary)]">Respuesta</label>
            <textarea
              class="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--border-accent)] min-h-[100px] resize-y"
              placeholder="Escribe la respuesta..."
              value={answer}
              onInput={(e) => setAnswer((e.target as HTMLTextAreaElement).value)}
            />
          </div>
          <div class="flex justify-end gap-3 mt-2">
            <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? "Guardar cambios" : "Crear"}</Button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Historial">
        {historyLoading ? (
          <p class="text-[var(--text-muted)] text-center py-4">Cargando...</p>
        ) : history.length === 0 ? (
          <p class="text-[var(--text-muted)] text-center py-4">Sin historial</p>
        ) : (
          <div class="flex flex-col gap-3 max-h-80 overflow-y-auto">
            {history.map((entry) => (
              <div key={entry.id} class="flex items-center justify-between rounded-lg bg-[var(--bg-tertiary)] px-4 py-3 border border-[var(--border-subtle)]">
                <div>
                  <span class="text-sm font-medium text-[var(--text-primary)]">
                    {actionLabels[entry.action] ?? entry.action}
                  </span>
                  <span class="text-xs text-[var(--text-muted)] ml-2">por {entry.byUsername}</span>
                </div>
                <span class="text-xs text-[var(--text-muted)]">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Layout>
  );
}
