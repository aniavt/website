import { useEffect, useState, useCallback } from "preact/hooks";
import Layout from "@components/Layout";
import Button from "@components/Button";
import Table, { type Column } from "@components/Table";
import Modal from "@components/Modal";
import { addToast } from "@store/toast";
import { canReadVault, canManageVaultNodes } from "@store/auth";
import {
  type VaultNodeDto,
  type VaultTagDto,
  listVaultChildren,
  listVaultTags,
  createVaultFolder,
  createVaultFileNode,
  moveVaultNode,
  renameVaultNode,
  findVaultNodesByTagId,
  createVaultTag,
  renameVaultTag,
  deleteVaultTag,
  ApiError,
  t,
} from "@utils";
import VaultTree from "@components/VaultTree";
import VaultNodeDetails from "@components/VaultNodeDetails";

interface FlatNode extends VaultNodeDto {
  path: string;
}

export default function Vault() {
  const [nodes, setNodes] = useState<VaultNodeDto[]>([]);
  const [selectedNode, setSelectedNode] = useState<VaultNodeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingParentId, setCreatingParentId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState<"folder" | "file">("folder");
  const [createSourceType, setCreateSourceType] = useState<"external" | "internal">("external");
  const [createServer, setCreateServer] = useState("");
  const [createUrl, setCreateUrl] = useState("");
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [tags, setTags] = useState<VaultTagDto[]>([]);
  const [tagFilter, setTagFilter] = useState<string>("");
  const [tagFilterLoading, setTagFilterLoading] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagSaving, setTagSaving] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);

  const canEdit = canManageVaultNodes.value;

  const fetchAll = useCallback(async () => {
    if (!canReadVault.value) {
      setNodes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Cargamos raíz y un primer nivel; el árbol puede expandirse con llamadas adicionales
      const [rootChildren, allTags] = await Promise.all([
        listVaultChildren(null),
        listVaultTags(),
      ]);

      // Para esta primera iteración, asumimos que el backend devolverá de forma plana bajo parent;
      // si necesitas lazy-load podrás reutilizar `listVaultChildren`.
      setNodes(rootChildren);
      setTags(allTags);
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function openCreate(parentId: string | null, type: "folder" | "file") {
    if (!canEdit) return;
    setCreatingParentId(parentId);
    setCreateType(type);
    setCreateName("");
    setCreateSourceType("external");
    setCreateServer("");
    setCreateUrl("");
    setCreateFile(null);
    setCreateModalOpen(true);
  }

  async function submitCreate(e: Event) {
    e.preventDefault();
    if (!canEdit) return;
    if (!createName.trim()) {
      addToast("El nombre es obligatorio", "error");
      return;
    }
    if (createType === "file") {
      if (createSourceType === "external") {
        if (!createUrl.trim()) {
          addToast("La URL es obligatoria para la fuente externa", "error");
          return;
        }
        try {
          // eslint-disable-next-line no-new
          new URL(createUrl);
        } catch {
          addToast("La URL externa no es válida", "error");
          return;
        }
      } else {
        if (!createFile) {
          addToast("Debes seleccionar un archivo para la fuente interna", "error");
          return;
        }
      }
    }

    setCreateLoading(true);
    try {
      if (createType === "folder") {
        const created = await createVaultFolder({
          parentId: creatingParentId,
          name: createName.trim(),
        });
        setNodes((prev) => [...prev, created]);
        addToast("Carpeta creada", "success");
      } else {
        const created = await createVaultFileNode({
          parentId: creatingParentId,
          name: createName.trim(),
          sourceType: createSourceType,
          server: createServer.trim() || null,
          urlOrFileId: createSourceType === "external" ? createUrl.trim() : undefined,
          file: createSourceType === "internal" ? createFile! : undefined,
        });
        setNodes((prev) => [...prev, created.node]);
        addToast("Archivo creado", "success");
      }
      setCreateModalOpen(false);
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    } finally {
      setCreateLoading(false);
    }
  }

  function openMove() {
    if (!canEdit || !selectedNode) return;
    setMoveTargetId(selectedNode.parentId);
    setMoveModalOpen(true);
  }

  async function submitMove(e: Event) {
    e.preventDefault();
    if (!canEdit || !selectedNode) return;
    setMoveLoading(true);
    try {
      const updated = await moveVaultNode({
        nodeId: selectedNode.id,
        newParentId: moveTargetId,
      });
      setNodes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
      setSelectedNode(updated);
      addToast("Nodo movido", "success");
      setMoveModalOpen(false);
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    } finally {
      setMoveLoading(false);
    }
  }

  function openRename() {
    if (!canEdit || !selectedNode) return;
    setRenameName(selectedNode.name);
    setRenameModalOpen(true);
  }

  async function submitRename(e: Event) {
    e.preventDefault();
    if (!canEdit || !selectedNode) return;
    if (!renameName.trim()) {
      addToast("El nombre es obligatorio", "error");
      return;
    }
    setRenameLoading(true);
    try {
      const updated = await renameVaultNode(selectedNode.id, renameName.trim());
      setNodes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
      setSelectedNode(updated);
      addToast("Nodo renombrado", "success");
      setRenameModalOpen(false);
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    } finally {
      setRenameLoading(false);
    }
  }

  async function applyTagFilter(tagId: string) {
    setTagFilter(tagId);
    if (!tagId) {
      void fetchAll();
      return;
    }
    setTagFilterLoading(true);
    try {
      const result = await findVaultNodesByTagId(tagId);
      setNodes(result);
      setSelectedNode(null);
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    } finally {
      setTagFilterLoading(false);
    }
  }

  async function handleCreateTag(e: Event) {
    e.preventDefault();
    if (!canEdit) return;
    const trimmed = newTagName.trim();
    if (!trimmed) {
      addToast("El nombre de la etiqueta es obligatorio", "error");
      return;
    }
    setTagSaving(true);
    try {
      const created = await createVaultTag(trimmed);
      setTags((prev) => [...prev, created]);
      setNewTagName("");
      addToast("Etiqueta creada", "success");
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    } finally {
      setTagSaving(false);
    }
  }

  async function handleStartEditTag(tag: VaultTagDto) {
    if (!canEdit) return;
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  }

  function handleCancelEditTag() {
    setEditingTagId(null);
    setEditingTagName("");
  }

  async function handleSaveEditTag(e: Event) {
    e.preventDefault();
    if (!canEdit || !editingTagId) return;
    const trimmed = editingTagName.trim();
    if (!trimmed) {
      addToast("El nombre de la etiqueta es obligatorio", "error");
      return;
    }
    setTagSaving(true);
    try {
      const updated = await renameVaultTag(editingTagId, trimmed);
      setTags((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      );
      setEditingTagId(null);
      setEditingTagName("");
      addToast("Etiqueta renombrada", "success");
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    } finally {
      setTagSaving(false);
    }
  }

  async function handleDeleteTag(tag: VaultTagDto) {
    if (!canEdit) return;
    setDeletingTagId(tag.id);
    try {
      await deleteVaultTag(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      if (tagFilter === tag.id) {
        setTagFilter("");
        void fetchAll();
      }
      addToast("Etiqueta eliminada", "success");
    } catch (err) {
      addToast(
        err instanceof ApiError ? t(err.code) : t("unknown_error"),
        "error",
      );
    } finally {
      setDeletingTagId(null);
    }
  }

  function buildFlat(nodesList: VaultNodeDto[]): FlatNode[] {
    const byId = new Map<string, VaultNodeDto>();
    nodesList.forEach((n) => byId.set(n.id, n));

    function buildPath(node: VaultNodeDto): string {
      const parts: string[] = [node.name];
      let current = node;
      while (current.parentId) {
        const parent = byId.get(current.parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        current = parent;
      }
      return `/${parts.join("/")}`;
    }

    return nodesList.map((n) => ({
      ...n,
      path: buildPath(n),
    }));
  }

  const flatNodes = buildFlat(nodes);
  const moveOptions = flatNodes.filter((n) => n.type === "folder");
  const selectedFlat = selectedNode
    ? flatNodes.find((n) => n.id === selectedNode.id) ?? null
    : null;

  const columns: Column<FlatNode>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (n) => (
        <span class="text-sm text-[var(--text-primary)] break-all">{n.name}</span>
      ),
    },
    {
      key: "path",
      header: "Ruta",
      render: (n) => (
        <span class="text-xs text-[var(--text-muted)] break-all font-mono">
          {n.path}
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (n) => (
        <span class="text-xs text-[var(--text-secondary)]">
          {n.type === "folder" ? "Carpeta" : "Archivo"}
        </span>
      ),
      class: "w-24",
    },
    {
      key: "visibility",
      header: "Visibilidad",
      render: (n) => (
        <span class="text-xs text-[var(--text-secondary)]">
          {n.isPublic ? "Público" : "Privado"}
        </span>
      ),
      class: "w-24",
    },
  ];

  if (!canReadVault.value) {
    return (
      <Layout>
        <div class="py-12 text-center">
          <p class="text-sm text-[var(--text-muted)]">
            No tienes permisos para ver la bodega.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-bold text-[var(--text-primary)]">Bodega</h1>
          <p class="text-sm text-[var(--text-muted)] mt-0.5">
            Gestiona la estructura de carpetas, archivos, visibilidad y etiquetas.
          </p>
        </div>
        {canEdit && (
          <div class="flex gap-2">
            <Button variant="ghost" onClick={() => openCreate(null, "folder")}>
              Carpeta raíz
            </Button>
            <Button variant="primary" onClick={() => openCreate(null, "file")}>
              Archivo raíz
            </Button>
          </div>
        )}
      </div>

      <div class="flex flex-col gap-3 mb-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2 items-center">
            <span class="text-xs text-[var(--text-secondary)]">Filtrar por etiqueta:</span>
            <select
              class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              value={tagFilter}
              onChange={(e) => applyTagFilter((e.target as HTMLSelectElement).value)}
            >
              <option value="">Todas las etiquetas</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {tagFilterLoading && (
              <span class="text-[10px] text-[var(--text-muted)]">Cargando...</span>
            )}
          </div>
          {selectedFlat && (
            <div class="text-xs text-[var(--text-muted)]">
              Nodo seleccionado:{" "}
              <span class="font-mono text-[var(--text-primary)]">{selectedFlat.path}</span>
            </div>
          )}
        </div>

        {canEdit && (
          <div class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-sm font-semibold text-[var(--text-primary)]">
                Catálogo de etiquetas
              </h2>
              <span class="text-[10px] text-[var(--text-muted)]">
                {tags.length} etiqueta{tags.length === 1 ? "" : "s"}
              </span>
            </div>
            <div class="flex flex-col gap-3">
              <form class="flex flex-wrap items-center gap-2" onSubmit={handleCreateTag}>
                <input
                  type="text"
                  placeholder="Nueva etiqueta"
                  value={newTagName}
                  onInput={(e) =>
                    setNewTagName((e.target as HTMLInputElement).value)
                  }
                  class="flex-1 min-w-[160px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                />
                <Button
                  type="submit"
                  variant="primary"
                  class="px-3 py-1 text-xs"
                  loading={tagSaving}
                >
                  Crear
                </Button>
              </form>

              <div class="max-h-40 overflow-auto mt-1">
                {tags.length === 0 ? (
                  <p class="text-xs text-[var(--text-muted)]">
                    No hay etiquetas creadas todavía.
                  </p>
                ) : (
                  <ul class="flex flex-col gap-1.5">
                    {tags
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((tag) => (
                        <li
                          key={tag.id}
                          class="flex items-center justify-between gap-2 text-xs text-[var(--text-secondary)]"
                        >
                          {editingTagId === tag.id ? (
                            <form
                              class="flex-1 flex items-center gap-2"
                              onSubmit={handleSaveEditTag}
                            >
                              <input
                                type="text"
                                value={editingTagName}
                                onInput={(e) =>
                                  setEditingTagName(
                                    (e.target as HTMLInputElement).value,
                                  )
                                }
                                class="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
                              />
                              <Button
                                type="submit"
                                variant="primary"
                                class="px-2 py-1 text-[11px]"
                                loading={tagSaving}
                              >
                                Guardar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                class="px-2 py-1 text-[11px]"
                                onClick={handleCancelEditTag}
                                disabled={tagSaving}
                              >
                                Cancelar
                              </Button>
                            </form>
                          ) : (
                            <>
                              <span class="flex-1 break-all text-[var(--text-primary)]">
                                {tag.name}
                              </span>
                              <div class="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  class="px-2 py-1 text-[11px]"
                                  onClick={() => handleStartEditTag(tag)}
                                >
                                  Renombrar
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  class="px-2 py-1 text-[11px] text-red-500"
                                  onClick={() => handleDeleteTag(tag)}
                                  loading={deletingTagId === tag.id}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p class="text-[var(--text-muted)] py-12 text-center">Cargando...</p>
      ) : (
        <div class="grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-6">
          <div class="h-[480px]">
            <VaultTree
              nodes={nodes}
              selectedId={selectedNode?.id ?? null}
              onSelect={async (n) => {
                if (!n) {
                  setSelectedNode(null);
                  return;
                }
                setSelectedNode(n);
                if (n.type === "folder") {
                  try {
                    const children = await listVaultChildren(n.id);
                    setNodes((prev) => {
                      const existingIds = new Set(prev.map((node) => node.id));
                      const merged = [...prev];
                      for (const child of children) {
                        if (!existingIds.has(child.id)) {
                          merged.push(child);
                        }
                      }
                      return merged;
                    });
                  } catch (err) {
                    addToast(
                      err instanceof ApiError ? t(err.code) : t("unknown_error"),
                      "error",
                    );
                  }
                }
              }}
              onCreateFolder={(parentId) => openCreate(parentId ?? null, "folder")}
              onCreateFile={(parentId) => openCreate(parentId ?? null, "file")}
            />
          </div>

          <div class="flex flex-col gap-4">
            <div class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-sm font-semibold text-[var(--text-primary)]">
                  Nodos
                </h2>
                <div class="flex gap-2">
                  {selectedNode && canEdit && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        class="px-3 py-1 text-xs"
                        onClick={openRename}
                      >
                        Renombrar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        class="px-3 py-1 text-xs"
                        onClick={openMove}
                      >
                        Mover
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <Table
                columns={columns}
                data={flatNodes}
                keyFn={(n) => n.id}
                emptyMessage="No hay nodos"
              />
            </div>

            <div class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 h-[360px]">
              <VaultNodeDetails
                node={selectedNode}
                onRenamed={(updated) => {
                  setNodes((prev) =>
                    prev.map((n) => (n.id === updated.id ? updated : n)),
                  );
                  setSelectedNode(updated);
                }}
                onDeleted={() => {
                  setSelectedNode(null);
                  fetchAll();
                }}
              />
            </div>
          </div>
        </div>
      )}

      <Modal
        open={createModalOpen}
        onClose={() => {
          if (createLoading) return;
          setCreateModalOpen(false);
        }}
        title={createType === "folder" ? "Nueva carpeta" : "Nuevo archivo"}
      >
        <form class="flex flex-col gap-4" onSubmit={submitCreate}>
          <label class="text-sm text-[var(--text-secondary)] flex flex-col gap-1">
            <span>Nombre</span>
            <input
              type="text"
              value={createName}
              onInput={(e) =>
                setCreateName((e.target as HTMLInputElement).value)
              }
              class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
            />
          </label>

          {createType === "file" && (
            <>
              <label class="text-sm text-[var(--text-secondary)] flex flex-col gap-1">
                <span>Tipo de fuente</span>
                <select
                  class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                  value={createSourceType}
                  onChange={(e) =>
                    setCreateSourceType(
                      (e.target as HTMLSelectElement).value as "external" | "internal",
                    )
                  }
                >
                  <option value="external">Externa (URL)</option>
                  <option value="internal">Interna (fileId)</option>
                </select>
              </label>

              <label class="text-sm text-[var(--text-secondary)] flex flex-col gap-1">
                <span>Servidor (opcional)</span>
                <input
                  type="text"
                  value={createServer}
                  onInput={(e) =>
                    setCreateServer((e.target as HTMLInputElement).value)
                  }
                  class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                />
              </label>

              <label class="text-sm text-[var(--text-secondary)] flex flex-col gap-1">
                {createSourceType === "external" ? (
                  <>
                    <span>URL</span>
                    <input
                      type="text"
                      value={createUrl}
                      onInput={(e) =>
                        setCreateUrl((e.target as HTMLInputElement).value)
                      }
                      class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                      placeholder="https://ejemplo.com/recurso.pdf"
                    />
                  </>
                ) : (
                  <>
                    <span>Archivo interno</span>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = (e.target as HTMLInputElement).files?.[0] ?? null;
                        setCreateFile(file);
                      }}
                      class="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-secondary)]"
                    />
                    <span class="text-xs text-[var(--text-muted)] mt-1">
                      El archivo se subirá al servidor y se asociará como fuente interna del nodo.
                    </span>
                  </>
                )}
              </label>
            </>
          )}

          <div class="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={createLoading}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={moveModalOpen}
        onClose={() => {
          if (moveLoading) return;
          setMoveModalOpen(false);
        }}
        title="Mover nodo"
      >
        <form class="flex flex-col gap-4" onSubmit={submitMove}>
          <label class="text-sm text-[var(--text-secondary)] flex flex-col gap-1">
            <span>Carpeta destino</span>
            <select
              class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
              value={moveTargetId ?? ""}
              onChange={(e) => {
                const v = (e.target as HTMLSelectElement).value;
                setMoveTargetId(v || null);
              }}
            >
              <option value="">(Raíz)</option>
              {moveOptions.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.path}
                </option>
              ))}
            </select>
          </label>
          <div class="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMoveModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={moveLoading}>
              Mover
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={renameModalOpen}
        onClose={() => {
          if (renameLoading) return;
          setRenameModalOpen(false);
        }}
        title="Renombrar nodo"
      >
        <form class="flex flex-col gap-4" onSubmit={submitRename}>
          <label class="text-sm text-[var(--text-secondary)] flex flex-col gap-1">
            <span>Nuevo nombre</span>
            <input
              type="text"
              value={renameName}
              onInput={(e) =>
                setRenameName((e.target as HTMLInputElement).value)
              }
              class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
            />
          </label>
          <div class="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRenameModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={renameLoading}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

