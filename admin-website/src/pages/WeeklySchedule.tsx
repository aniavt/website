import { useEffect, useState, useCallback } from "preact/hooks";
import Layout from "@components/Layout";
import Table, { type Column } from "@components/Table";
import Button from "@components/Button";
import Modal from "@components/Modal";
import Pagination from "@components/Pagination";
import { addToast } from "@store/toast";
import {
  canReadWeeklySchedule,
  canCreateWeeklySchedule,
  canDeleteWeeklySchedule,
  canViewWeeklyScheduleHistory,
} from "@store/auth";
import {
  type WeeklyScheduleDto,
  type WeeklyScheduleHistoryEntryDto,
  deleteWeeklySchedule,
  getWeeklyScheduleHistory,
  listWeeklySchedules,
  uploadWeeklyScheduleFile,
  restoreWeeklySchedule,
  updateWeeklyScheduleFile,
  ApiError,
  t,
} from "@utils";

const LIMIT = 15;

function getCurrentWeekYear() {
  const now = new Date();
  // Copia para no mutar `now`
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  // Ajustar al jueves de la semana actual (regla ISO-8601)
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = date.getUTCFullYear();
  return { week, year };
}

export default function WeeklySchedule() {
  const { week: currentWeek, year: currentYear } = getCurrentWeekYear();

  const [items, setItems] = useState<WeeklyScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [yearFilter, setYearFilter] = useState<string>(String(currentYear));
  const [showAll, setShowAll] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadWeek, setUploadWeek] = useState<string>(String(currentWeek));
  const [uploadYear, setUploadYear] = useState<string>(String(currentYear));
  const [uploadFileState, setUploadFileState] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState<WeeklyScheduleHistoryEntryDto[]>([]);
  const [historyTarget, setHistoryTarget] = useState<WeeklyScheduleDto | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<WeeklyScheduleDto | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [restoreLoadingId, setRestoreLoadingId] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<WeeklyScheduleDto | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<WeeklyScheduleDto | null>(null);

  const historyActionLabels: Record<string, string> = {
    created: "Creado",
    updated: "Actualizado",
    deleted: "Eliminado",
    restored: "Restaurado",
  };

  const fetchItems = useCallback(async () => {
    if (!canReadWeeklySchedule.value) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const year = yearFilter ? Number(yearFilter) : undefined;
      const data = await listWeeklySchedules(year, showAll);
      // Simple "paginación" en cliente para mantener patrón visual
      const start = offset;
      const end = offset + LIMIT;
      setItems(data.slice(start, end));
      setTotal(data.length);
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("weekly_schedule_load_failed"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [offset, yearFilter, showAll]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function resetUploadForm() {
    setUploadWeek(String(currentWeek));
    setUploadYear(String(currentYear));
    setUploadFileState(null);
    setEditingTarget(null);
  }

  async function submitUpload(e: Event) {
    e.preventDefault();
    if (!canCreateWeeklySchedule.value) return;

    const weekNum = Number(uploadWeek);
    const yearNum = Number(uploadYear);

    if (!weekNum || weekNum < 1 || weekNum > 53) {
      addToast(t("weekly_schedule_invalid_week_client"), "error");
      return;
    }
    if (!yearNum || yearNum < 2000 || yearNum > 2100) {
      addToast(t("weekly_schedule_invalid_year_client"), "error");
      return;
    }
    if (!uploadFileState) {
      addToast(t("weekly_schedule_file_required"), "error");
      return;
    }

    setUploadLoading(true);
    try {
      if (editingTarget) {
        await updateWeeklyScheduleFile(editingTarget.id, uploadFileState);
        addToast(t("weekly_schedule_updated"), "success");
      } else {
        await uploadWeeklyScheduleFile({
          week: weekNum,
          year: yearNum,
          file: uploadFileState,
        });
        addToast(t("weekly_schedule_created"), "success");
      }
      setUploadOpen(false);
      resetUploadForm();
      setEditingTarget(null);
      setOffset(0);
      fetchItems();
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("weekly_schedule_upload_failed"),
        "error",
      );
    } finally {
      setUploadLoading(false);
    }
  }

  async function openHistory(item: WeeklyScheduleDto) {
    if (!canViewWeeklyScheduleHistory.value) return;
    setHistoryTarget(item);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const data = await getWeeklyScheduleHistory(item.id);
      setHistoryItems(data);
    } catch (err) {
      setHistoryOpen(false);
      addToast(
        err instanceof ApiError ? t(err.code) : t("weekly_schedule_history_load_failed"),
        "error",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function askDelete(item: WeeklyScheduleDto) {
    if (!canDeleteWeeklySchedule.value) return;
    setConfirmTarget(item);
    setConfirmOpen(true);
  }

  async function runDelete() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      await deleteWeeklySchedule(confirmTarget.id);
      addToast(t("weekly_schedule_deleted"), "success");
      setConfirmOpen(false);
      setConfirmTarget(null);
      setOffset(0);
      fetchItems();
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("weekly_schedule_delete_failed"),
        "error",
      );
    } finally {
      setConfirmLoading(false);
    }
  }

  async function runRestore(item: WeeklyScheduleDto) {
    setRestoreLoadingId(item.id);
    try {
      await restoreWeeklySchedule(item.id);
      addToast("Horario restaurado", "success");
      setOffset(0);
      fetchItems();
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("weekly_schedule_restore_failed"),
        "error",
      );
    } finally {
      setRestoreLoadingId(null);
    }
  }

  function openView(item: WeeklyScheduleDto) {
    setViewTarget(item);
    setViewOpen(true);
  }

  const columns: Column<WeeklyScheduleDto>[] = [
    {
      key: "weekYear",
      header: "Semana/Año",
      render: (i) => (
        <span class="text-sm text-[var(--text-primary)]">
          {i.week} / {i.year}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (i) => (
        <span
          class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            i.isDeleted
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {i.isDeleted ? "Eliminado" : "Activo"}
        </span>
      ),
      class: "w-28",
    },
    {
      key: "actions",
      header: "Acciones",
      render: (i) => (
        <div class="flex gap-2 flex-wrap">
          <Button variant="ghost" onClick={() => openView(i)}>
            Ver
          </Button>
          {canViewWeeklyScheduleHistory.value && (
            <Button variant="ghost" onClick={() => openHistory(i)}>
              Historial
            </Button>
          )}
          {canDeleteWeeklySchedule.value && !i.isDeleted && (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingTarget(i);
                  setUploadWeek(String(i.week));
                  setUploadYear(String(i.year));
                  setUploadOpen(true);
                }}
              >
                Actualizar
              </Button>
              <Button variant="danger" onClick={() => askDelete(i)}>
                Eliminar
              </Button>
            </>
          )}
          {canDeleteWeeklySchedule.value && i.isDeleted && (
            <Button
              variant="primary"
              onClick={() => runRestore(i)}
              disabled={restoreLoadingId === i.id}
            >
              {restoreLoadingId === i.id ? "Restaurando..." : "Restaurar"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const yearsOptions = (() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear - 1; y <= currentYear + 2; y += 1) years.push(y);
    return years;
  })();

  const weekNumbers = (() => {
    const weeks: number[] = [];
    for (let w = 1; w <= 53; w += 1) weeks.push(w);
    return weeks;
  })();

  if (!canReadWeeklySchedule.value) {
    return (
      <Layout>
        <div class="py-12 text-center">
          <p class="text-sm text-[var(--text-muted)]">{t("weekly_schedule_not_authorized")}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-bold text-[var(--text-primary)]">Horario semanal</h1>
          <p class="text-sm text-[var(--text-muted)] mt-0.5">
            Administra los horarios semanales publicados
          </p>
        </div>
        {canCreateWeeklySchedule.value && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingTarget(null);
              setUploadOpen(true);
            }}
          >
            Subir horario
          </Button>
        )}
      </div>

      <div class="flex flex-wrap gap-3 mb-4 items-center justify-between">
        <div class="flex items-center gap-4">
          <label class="text-sm text-[var(--text-secondary)] flex items-center gap-2">
            <span>Año</span>
            <select
              class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
              value={yearFilter}
              onChange={(e) => {
                setYearFilter((e.target as HTMLSelectElement).value);
                setOffset(0);
              }}
            >
              <option value="">Todos</option>
              {yearsOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label class="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => {
                setShowAll((e.target as HTMLInputElement).checked);
                setOffset(0);
              }}
            />
            <span>Mostrar también eliminados</span>
          </label>
        </div>

        <p class="text-xs text-[var(--text-muted)]">
          Semana actual: <span class="font-semibold text-[var(--text-primary)]">
            {currentWeek} / {currentYear}
          </span>
        </p>
      </div>

      {loading ? (
        <p class="text-[var(--text-muted)] py-12 text-center">Cargando...</p>
      ) : (
        <>
          <Table
            columns={columns}
            data={items}
            keyFn={(i) => i.id}
            emptyMessage="No hay horarios"
          />
          <Pagination offset={offset} limit={LIMIT} total={total} onChange={setOffset} />
        </>
      )}

      <Modal
        open={uploadOpen}
        onClose={() => {
          if (uploadLoading) return;
          setUploadOpen(false);
          resetUploadForm();
        }}
        title={
          editingTarget
            ? `Actualizar horario semana ${editingTarget.week} / ${editingTarget.year}`
            : "Subir horario semanal"
        }
      >
        <form class="flex flex-col gap-4" onSubmit={submitUpload}>
          <div class="flex gap-3">
            <label class="flex-1 text-sm text-[var(--text-secondary)] flex flex-col gap-1">
              <span>Año</span>
              <select
                class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                value={uploadYear}
                onChange={(e) => setUploadYear((e.target as HTMLSelectElement).value)}
                disabled={!!editingTarget}
              >
                <option value="">Selecciona un año</option>
                {yearsOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm text-[var(--text-secondary)]">Semana</span>
            <div class="grid grid-cols-8 gap-1">
              {weekNumbers.map((w) => {
                const selected = Number(uploadWeek) === w;
                return (
                  <button
                    type="button"
                    key={w}
                    onClick={() => setUploadWeek(String(w))}
                    disabled={!!editingTarget}
                    class={`h-8 rounded-md text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>

          <label class="text-sm text-[var(--text-secondary)] flex flex-col gap-1">
            <span>Archivo</span>
            <input
              type="file"
              onChange={(e) => {
                const f = (e.target as HTMLInputElement).files?.[0] ?? null;
                setUploadFileState(f);
              }}
              class="text-sm text-[var(--text-primary)]"
            />
          </label>

          <div class="flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (uploadLoading) return;
                setUploadOpen(false);
                resetUploadForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={uploadLoading}>
              {uploadLoading ? "Subiendo..." : "Subir"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewTarget(null);
        }}
        title={
          viewTarget
            ? `Horario semana ${viewTarget.week} / ${viewTarget.year}`
            : "Horario semanal"
        }
      >
        {viewTarget && (
          <div class="flex flex-col gap-3">
            {viewTarget.fileContentType?.startsWith("image/") && (
              <img
                src={`/api/media/${viewTarget.fileId}`}
                alt="Horario semanal"
                class="max-h-96 w-full object-contain rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]"
              />
            )}

            {viewTarget.fileContentType?.startsWith("video/") && (
              <video
                src={`/api/media/${viewTarget.fileId}`}
                controls
                class="max-h-96 w-full rounded border border-[var(--border-subtle)] bg-black"
              />
            )}

            <a
              href={`/api/media/${viewTarget.fileId}`}
              target="_blank"
              rel="noreferrer"
              class="text-xs text-[var(--accent)] underline self-start"
            >
              Abrir en una pestaña nueva
            </a>
          </div>
        )}
      </Modal>

      <Modal
        open={historyOpen}
        onClose={() => {
          if (historyLoading) return;
          setHistoryOpen(false);
          setHistoryItems([]);
          setHistoryTarget(null);
        }}
        title={
          historyTarget
            ? `Historial semana ${historyTarget.week} / ${historyTarget.year}`
            : "Historial"
        }
      >
        {historyLoading ? (
          <p class="text-[var(--text-muted)] text-center py-4">Cargando historial...</p>
        ) : historyItems.length === 0 ? (
          <p class="text-[var(--text-muted)] text-center py-4">Sin cambios registrados</p>
        ) : (
          <div class="flex flex-col gap-2 max-h-80 overflow-auto">
            {historyItems.map((h) => (
              <div
                key={h.id}
                class="flex items-center justify-between text-sm text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-1"
              >
                <div>
                  <div class="font-medium text-[var(--text-primary)]">
                    {historyActionLabels[h.action] ?? h.action} por {h.byUsername}
                  </div>
                </div>
                <div class="text-xs text-[var(--text-muted)]">
                  {new Date(h.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        title="Confirmar eliminación"
      >
        <p class="text-sm text-[var(--text-secondary)] mb-6">
          ¿Estás seguro de que deseas eliminar el horario de la semana{" "}
          <strong>{confirmTarget?.week}</strong> / <strong>{confirmTarget?.year}</strong>?
        </p>
        <div class="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              if (confirmLoading) return;
              setConfirmOpen(false);
              setConfirmTarget(null);
            }}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={runDelete} disabled={confirmLoading}>
            {confirmLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}

