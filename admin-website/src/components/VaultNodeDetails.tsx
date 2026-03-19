import Button from "@components/Button";
import Badge from "@components/Badge";
import Modal from "@components/Modal";
import { useState, useEffect } from "preact/hooks";
import { addToast } from "@store/toast";
import {
  canManageVaultNodes,
} from "@store/auth";
import {
  type VaultNodeDto,
  type VaultTagDto,
  type VaultNodeSourceDto,
  listVaultTags,
  getVaultTagsForNode,
  getVaultSourcesForNode,
  addVaultSourceToNode,
  updateVaultSource,
  deleteVaultSource,
  addTagToVaultNode,
  removeTagFromVaultNode,
  setVaultNodePublic,
  setVaultThumbnail,
  deleteVaultNode,
  uploadMediaFile,
  ApiError,
  t,
} from "@utils";

interface VaultNodeDetailsProps {
  node: VaultNodeDto | null;
  onRenamed: (node: VaultNodeDto) => void;
  onDeleted: () => void;
}

export default function VaultNodeDetails({ node, onRenamed, onDeleted }: VaultNodeDetailsProps) {
  const [allTags, setAllTags] = useState<VaultTagDto[]>([]);
  const [nodeTags, setNodeTags] = useState<VaultTagDto[]>([]);
  const [sources, setSources] = useState<VaultNodeSourceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [tagsModalOpen, setTagsModalOpen] = useState(false);
  const [publicLoading, setPublicLoading] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [thumbnailPreviewOpen, setThumbnailPreviewOpen] = useState(false);
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<VaultNodeSourceDto | null>(null);
  const [sourceType, setSourceType] = useState<"external" | "internal">("external");
  const [sourceServer, setSourceServer] = useState<string>("");
  const [sourceUrlOrFileId, setSourceUrlOrFileId] = useState<string>("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcesSaving, setSourcesSaving] = useState(false);

  useEffect(() => {
    if (!node) {
      setNodeTags([]);
      setSources([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const [all, nodeTagsRes] = await Promise.all([
          listVaultTags(),
          getVaultTagsForNode(node.id),
        ]);
        if (cancelled) return;
        setAllTags(all);
        setNodeTags(nodeTagsRes);

        if (node.type === "file") {
          const sourcesRes = await getVaultSourcesForNode(node.id);
          if (cancelled) return;
          setSources(sourcesRes);
        } else {
          setSources([]);
        }
      } catch (err) {
        if (cancelled) return;
        addToast(
          err instanceof ApiError ? t(err.code) : t("unknown_error"),
          "error",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [node?.id]);

  useEffect(() => {
    if (!sourcesModalOpen) {
      setEditingSource(null);
      setSourceType("external");
      setSourceServer("");
      setSourceUrlOrFileId("");
      setSourceFile(null);
      setSourcesSaving(false);
    }
  }, [sourcesModalOpen]);

  if (!node) {
    return (
      <div class="h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
        Selecciona un nodo para ver sus detalles.
      </div>
    );
  }

  const canEdit = canManageVaultNodes.value;

  async function togglePublic() {
    if (!canEdit) return;
    if (!node) return;
    setPublicLoading(true);
    try {
      const updated = await setVaultNodePublic(node.id, !node.isPublic);
      onRenamed(updated);
      addToast(
        updated.isPublic ? "Nodo marcado como público" : "Nodo marcado como privado",
        "success",
      );
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    } finally {
      setPublicLoading(false);
    }
  }

  async function handleThumbnailChange(e: Event) {
    if (!canEdit) return;
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validaciones básicas en cliente (no reemplazan las del backend)
    if (!file.type.startsWith("image/")) {
      addToast("El thumbnail debe ser una imagen", "error");
      return;
    }
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      addToast("El thumbnail debe pesar como máximo 2MB", "error");
      return;
    }

    setThumbnailLoading(true);
    try {
      if (!node) return;
      const uploaded = await uploadMediaFile(file);
      const updated = await setVaultThumbnail(node.id, uploaded.id);
      onRenamed(updated);
      addToast("Thumbnail actualizado", "success");
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    } finally {
      setThumbnailLoading(false);
    }
  }

  async function removeThumbnail() {
    if (!canEdit || !node || !node.thumbnailId) return;
    setThumbnailLoading(true);
    try {
      const updated = await setVaultThumbnail(node.id, null);
      onRenamed(updated);
      addToast("Thumbnail eliminado", "success");
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    } finally {
      setThumbnailLoading(false);
    }
  }

  async function addTag(tagId: string) {
    if (!canEdit) return;
    try {
      if (!node) return;
      await addTagToVaultNode(node.id, tagId);
      const updated = await getVaultTagsForNode(node.id);
      setNodeTags(updated);
      addToast("Etiqueta añadida", "success");
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    }
  }

  async function removeTag(tagId: string) {
    if (!canEdit) return;
    try {
      if (!node) return;
      await removeTagFromVaultNode(node.id, tagId);
      const updated = await getVaultTagsForNode(node.id);
      setNodeTags(updated);
      addToast("Etiqueta quitada", "success");
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    }
  }

  async function confirmDelete() {
    if (!canEdit) return;
    try {
      if (!node) return;
      await deleteVaultNode(node.id);
      addToast("Nodo eliminado", "success");
      setConfirmDeleteOpen(false);
      onDeleted();
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    }
  }

  const assignedTagIds = new Set(nodeTags.map((t) => t.id));
  const availableTags = allTags.filter((t) => !assignedTagIds.has(t.id));

  return (
    <div class="flex flex-col h-full">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-[var(--text-primary)] break-all">
            {node.name}
          </h2>
          <p class="text-xs text-[var(--text-muted)] mt-1">
            ID: <span class="font-mono">{node.id}</span>
          </p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <Badge variant={node.type === "folder" ? "admin" : "active"}>
            {node.type === "folder" ? "Carpeta" : "Archivo"}
          </Badge>
          <button
            type="button"
            disabled={!canEdit || publicLoading}
            onClick={togglePublic}
            class={`mt-1 text-xs rounded-full px-3 py-1 border transition-colors ${
              node.isPublic
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {publicLoading
              ? "Guardando..."
              : node.isPublic
                ? "Marcado como público"
                : "Marcado como privado"}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] p-3 flex flex-col gap-2">
          <h3 class="text-sm font-semibold text-[var(--text-primary)]">Metadatos</h3>
          <dl class="text-xs text-[var(--text-secondary)] space-y-1.5">
            <div class="flex justify-between gap-2">
              <dt class="font-medium">Tipo</dt>
              <dd>{node.type === "folder" ? "Carpeta" : "Archivo"}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="font-medium">Público</dt>
              <dd>{node.isPublic ? "Sí" : "No"}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="font-medium">Creado</dt>
              <dd>{new Date(node.createdAt).toLocaleString()}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="font-medium">Thumbnail</dt>
              <dd>{node.thumbnailId ? "Asignado" : "—"}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] p-3 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-[var(--text-primary)]">Etiquetas</h3>
            <Button
              type="button"
              variant="ghost"
              class="px-2 py-1 text-xs"
              onClick={() => setTagsModalOpen(true)}
              disabled={loading}
            >
              Gestionar
            </Button>
          </div>
          {nodeTags.length === 0 ? (
            <p class="text-xs text-[var(--text-muted)]">Sin etiquetas asignadas.</p>
          ) : (
            <div class="flex flex-wrap gap-1.5">
              {nodeTags.map((tag) => (
                <Badge key={tag.id} variant="admin">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div class="rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] p-3 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-[var(--text-primary)]">Thumbnail</h3>
            {node.thumbnailId && (
              <span class="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
                Vista previa
              </span>
            )}
          </div>
          <div class="flex items-start gap-3">
            <div class="flex flex-col gap-1">
              {node.thumbnailId ? (
                <button
                  type="button"
                  class="h-24 w-24 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] overflow-hidden flex items-center justify-center cursor-pointer"
                  onClick={() => setThumbnailPreviewOpen(true)}
                >
                  <img
                    src={`/api/media/${node.thumbnailId}`}
                    alt="Thumbnail"
                    class="h-full w-full object-cover"
                    onError={(img) => {
                      (img.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </button>
              ) : (
                <div class="h-24 w-24 rounded-md border border-dashed border-[var(--border-subtle)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] text-[var(--text-muted)]">
                  Sin imagen
                </div>
              )}
            </div>
            <div class="flex flex-col gap-2 flex-1">
              <div class="flex flex-col gap-1">
                <span class="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
                  Cambiar thumbnail
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={!canEdit || thumbnailLoading}
                  onChange={handleThumbnailChange}
                  class="text-xs text-[var(--text-secondary)]"
                />
              </div>
              {node.thumbnailId && (
                <Button
                  type="button"
                  variant="ghost"
                  class="px-2 py-1 text-[11px] self-start"
                  onClick={removeThumbnail}
                  disabled={!canEdit || thumbnailLoading}
                >
                  Quitar thumbnail
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] p-3 flex-1 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-[var(--text-primary)]">Fuentes</h3>
          <div class="flex items-center gap-2">
            {sources.length > 0 && (
              <span class="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                {sources.length} fuente{sources.length === 1 ? "" : "s"}
              </span>
            )}
            {node.type === "file" && canEdit && (
              <Button
                type="button"
                variant="ghost"
                class="px-2 py-1 text-xs"
                onClick={() => {
                  setEditingSource(null);
                  setSourceType("external");
                  setSourceServer("");
                  setSourceUrlOrFileId("");
                  setSourcesModalOpen(true);
                }}
                disabled={loading}
              >
                Añadir fuente
              </Button>
            )}
          </div>
        </div>
        {sources.length === 0 ? (
          <p class="text-xs text-[var(--text-muted)]">
            Este nodo todavía no tiene fuentes asociadas.
          </p>
        ) : (
          <div class="flex flex-col gap-2 max-h-56 overflow-auto">
            {sources.map((s) => (
              <div
                key={s.id}
                class="flex items-center justify-between text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-md px-2 py-1.5 gap-3"
              >
                <div class="flex flex-col gap-0.5 flex-1">
                  <span class="font-mono break-all text-[var(--text-primary)]">
                    {s.url}
                  </span>
                  <span class="text-[10px] text-[var(--text-muted)]">
                    {s.type === "external" ? "Externa" : "Interna"}
                    {s.server ? ` · ${s.server}` : ""}
                  </span>
                </div>
                <span class="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                  {new Date(s.createdAt).toLocaleString()}
                </span>
                {canEdit && (
                  <div class="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      class="px-2 py-1 text-[11px]"
                      onClick={() => {
                        setEditingSource(s);
                        setSourceType(s.type);
                        setSourceServer(s.server ?? "");
                        setSourceUrlOrFileId(s.url);
                        setSourcesModalOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      class="px-2 py-1 text-[11px] text-red-600"
                      onClick={async () => {
                        if (!node) return;
                        try {
                          await deleteVaultSource(s.id);
                          const updatedSources = await getVaultSourcesForNode(node.id);
                          setSources(updatedSources);
                          addToast("Fuente eliminada", "success");
                        } catch (err) {
                          addToast(
                            err instanceof ApiError ? t(err.code) : t("unknown_error"),
                            "error",
                          );
                        }
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div class="flex justify-end mt-3">
        <Button
          type="button"
          variant="danger"
          class="px-3 py-1 text-xs"
          disabled={!canEdit}
          onClick={() => setConfirmDeleteOpen(true)}
        >
          Eliminar nodo
        </Button>
      </div>

      <Modal
        open={tagsModalOpen}
        onClose={() => setTagsModalOpen(false)}
        title="Etiquetas del nodo"
      >
        <div class="flex flex-col gap-4">
          <div>
            <h4 class="text-sm font-semibold text-[var(--text-primary)] mb-2">
              Etiquetas asignadas
            </h4>
            {nodeTags.length === 0 ? (
              <p class="text-xs text-[var(--text-muted)]">
                Este nodo no tiene etiquetas asignadas.
              </p>
            ) : (
              <div class="flex flex-wrap gap-1.5">
                {nodeTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => removeTag(tag.id)}
                    class="inline-flex items-center rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]"
                  >
                    <span class="mr-1">✕</span>
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 class="text-sm font-semibold text-[var(--text-primary)] mb-2">
              Añadir etiquetas
            </h4>
            {availableTags.length === 0 ? (
              <p class="text-xs text-[var(--text-muted)]">
                No hay más etiquetas disponibles para asignar.
              </p>
            ) : (
              <div class="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => addTag(tag.id)}
                    class="inline-flex items-center rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]"
                  >
                    <span class="mr-1">+</span>
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={thumbnailPreviewOpen}
        onClose={() => setThumbnailPreviewOpen(false)}
        title="Vista previa del thumbnail"
      >
        {node.thumbnailId ? (
          <div class="flex items-center justify-center">
            <img
              src={`/api/media/${node.thumbnailId}`}
              alt="Thumbnail"
              class="max-h-[70vh] max-w-full object-contain rounded-md border border-[var(--border-subtle)] bg-[var(--bg-tertiary)]"
            />
          </div>
        ) : (
          <p class="text-sm text-[var(--text-muted)] text-center py-4">
            Este nodo no tiene thumbnail asignado.
          </p>
        )}
      </Modal>

      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Eliminar nodo"
      >
        <p class="text-sm text-[var(--text-secondary)] mb-4">
          ¿Seguro que quieres eliminar este nodo? Si es una carpeta, también se eliminarán todos
          sus hijos.
        </p>
        <div class="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmDeleteOpen(false)}
          >
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>

      <Modal
        open={sourcesModalOpen}
        onClose={() => setSourcesModalOpen(false)}
        title={editingSource ? "Editar fuente" : "Añadir fuente"}
      >
        <form
          class="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canEdit || !node) return;

            if (sourceType === "external") {
              if (!sourceUrlOrFileId.trim()) {
                addToast(
                  "La URL de la fuente no puede estar vacía",
                  "error",
                );
                return;
              }
              try {
                // Validación básica de URL
                // eslint-disable-next-line no-new
                new URL(sourceUrlOrFileId);
              } catch {
                addToast("La URL externa no es válida", "error");
                return;
              }
            } else {
              if (!sourceFile) {
                addToast("Debes seleccionar un archivo para la fuente interna", "error");
                return;
              }
            }

            setSourcesSaving(true);
            try {
              if (editingSource) {
                // Para simplificar, la edición sigue usando solo URL/fileId existente.
                await updateVaultSource(editingSource.id, {
                  type: sourceType,
                  server: sourceServer.trim() || null,
                  urlOrFileId: sourceType === "external" ? sourceUrlOrFileId.trim() : undefined,
                });
              } else {
                if (sourceType === "external") {
                  await addVaultSourceToNode(node.id, {
                    type: "external",
                    server: sourceServer.trim() || null,
                    urlOrFileId: sourceUrlOrFileId.trim(),
                  });
                } else {
                  await addVaultSourceToNode(node.id, {
                    type: "internal",
                    server: sourceServer.trim() || null,
                    file: sourceFile!,
                  });
                }
              }
              const updatedSources = await getVaultSourcesForNode(node.id);
              setSources(updatedSources);
              addToast(
                editingSource ? "Fuente actualizada" : "Fuente añadida",
                "success",
              );
              setSourcesModalOpen(false);
            } catch (err) {
              addToast(
                err instanceof ApiError ? t(err.code) : t("unknown_error"),
                "error",
              );
            } finally {
              setSourcesSaving(false);
            }
          }}
        >
          <div class="flex flex-col gap-2">
            <label class="text-xs font-medium text-[var(--text-primary)]">
              Tipo de fuente
            </label>
            <div class="flex gap-2">
              <button
                type="button"
                class={`flex-1 text-xs px-3 py-1.5 rounded-md border ${
                  sourceType === "external"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
                onClick={() => setSourceType("external")}
                disabled={sourcesSaving}
              >
                Externa (URL)
              </button>
              <button
                type="button"
                class={`flex-1 text-xs px-3 py-1.5 rounded-md border ${
                  sourceType === "internal"
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
                onClick={() => setSourceType("internal")}
                disabled={sourcesSaving}
              >
                Interna (ID de archivo)
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-[var(--text-primary)]">
              Servidor (opcional)
            </label>
            <input
              type="text"
              value={sourceServer}
              onInput={(e) => setSourceServer((e.target as HTMLInputElement).value)}
              disabled={sourcesSaving}
              class="text-xs px-2 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
              placeholder="Ej: origen externo, CDN, etc."
            />
          </div>

          {sourceType === "external" ? (
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-[var(--text-primary)]">
                URL externa
              </label>
              <input
                type="text"
                value={sourceUrlOrFileId}
                onInput={(e) =>
                  setSourceUrlOrFileId((e.target as HTMLInputElement).value)
                }
                disabled={sourcesSaving}
                class="text-xs px-2 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-mono"
                placeholder="https://ejemplo.com/recurso.pdf"
              />
            </div>
          ) : (
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-[var(--text-primary)]">
                Archivo interno
              </label>
              <input
                type="file"
                disabled={sourcesSaving}
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0] ?? null;
                  setSourceFile(file);
                }}
                class="text-xs px-2 py-1.5 rounded-md border border-dashed border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
              />
              <span class="text-[10px] text-[var(--text-muted)]">
                El archivo se subirá al servidor y se asociará como fuente interna.
              </span>
            </div>
          )}

          <div class="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSourcesModalOpen(false)}
              disabled={sourcesSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={sourcesSaving}>
              {sourcesSaving ? "Guardando..." : editingSource ? "Guardar cambios" : "Añadir"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

