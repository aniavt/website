import { useEffect, useState, useCallback } from "preact/hooks";
import Layout from "@components/Layout";
import Table, { type Column } from "@components/Table";
import Button from "@components/Button";
import Modal from "@components/Modal";
import Pagination from "@components/Pagination";
import { addToast } from "@store/toast";
import {
   canReadNavItems,
   canCreateNavItems,
   canUpdateNavItems,
   canDeleteNavItems,
   canRestoreNavItems,
} from "@store/auth";
import {
   type NavItemsDto,
   type CreateNavItemsInput,
   type UpdateNavItemsInput,
   listNavItems,
   createNavItems,
   updateNavItems,
   deleteNavItems,
   restoreNavItems,
   ApiError,
} from "@utils";

const LIMIT = 15;

export default function NavItems() {
   const [items, setItems] = useState<NavItemsDto[]>([]);
   const [loading, setLoading] = useState(true);
   const [offset, setOffset] = useState(0);
   const [total, setTotal] = useState(0);
   const [showInactive, setShowInactive] = useState(false);

   // ── Create navItems modal ──────────────────────────────────────────────────────
   const [createOpen, setCreateOpen] = useState(false);
   const [createTitle, setCreateTitle] = useState("");
   const [createPath, setCreatePath] = useState("");
   const [createPosition, setCreatePosition] = useState<number>(0);
   const [createLoading, setCreateLoading] = useState(false);

   // ── Edit navItems modal ────────────────────────────────────────────────────────
   const [editTarget, setEditTarget] = useState<NavItemsDto | null>(null);
   const [editTitle, setEditTitle] = useState("");
   const [editPath, setEditPath] = useState("");
   const [editPosition, setEditPosition] = useState<number>(0);
   const [editLoading, setEditLoading] = useState(false);

   // ── Delete navItems confirm modal ──────────────────────────────────────────────
   const [confirmTarget, setConfirmTarget] = useState<NavItemsDto | null>(null);
   const [confirmOpen, setConfirmOpen] = useState(false);
   const [confirmLoading, setConfirmLoading] = useState(false);

   // ── Restore loading ─────────────────────────────────────────────────────────
   const [restoreLoadingId, setRestoreLoadingId] = useState<string | null>(null);

   // ── Labels ──────────────────────────────────────────────────────────────────

   const lastActionLabel: Record<string, string> = {
      created: "Creado",
      updated: "Actualizado",
      deleted: "Eliminado",
      restore: "Restaurado",
   };

   // ── Fetch animes ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   const fetchItems = useCallback(async () => {
      if (!canReadNavItems.value) {
         setItems([]);
         setLoading(false);
         return;
      }
      setLoading(true);
      try {
         const data = await listNavItems(showInactive);
         setTotal(data.length);
         setItems(data.slice(offset, offset + LIMIT));
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al cargar la navegación",
            "error",
         );
      } finally {
         setLoading(false);
      }
   }, [offset, showInactive]);

   useEffect(() => {
      fetchItems();
   }, [fetchItems]);

   // ── navItems CRUD ────────────────────────────────────────────────────────────

   function resetCreateForm() {
      setCreateTitle("");
      setCreatePath("");
      setCreatePosition(0);
   }

   async function submitCreate(e: Event) {
      e.preventDefault();
      if (!canCreateNavItems.value) return;
      if (!createTitle.trim()) {
         addToast("El título es obligatorio", "error");
         return;
      }
      if(!createPath.trim()){
         addToast("Es necesaria la ruta", "error");
         return;
      }
      if(!createPosition || createPosition<=0){
         addToast("Es necesaria la posicion", "error");
         return;
      }
      setCreateLoading(true);
      try {
         const input: CreateNavItemsInput = {
            title: createTitle.trim(),
            path: createPath.trim(),
            position: createPosition
         };
         await createNavItems(input);
         addToast("Navegacion creada correctamente", "success");
         setCreateOpen(false);
         resetCreateForm();
         setOffset(0);
         fetchItems();
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al crear el navItems",
            "error",
         );
      } finally {
         setCreateLoading(false);
      }
   }

   // ── Edit ────────────────────────────────────────────────────────────────────

   function openEdit(item: NavItemsDto) {
      setEditTarget(item);
      setEditTitle(item.title);
      setEditPath(item.path)
      setEditPosition(item.position)
   }

   async function submitEdit(e: Event) {
      e.preventDefault();
      if (!editTarget || !canUpdateNavItems.value) return;
      setEditLoading(true);
      try {
         const input: UpdateNavItemsInput = {
            title: editTitle.trim(),
            path : editPath.trim(),
            position: editPosition
         };
         await updateNavItems(editTarget.id, input);
         addToast("Navegacion actualizado correctamente", "success");
         setEditTarget(null);
         setOffset(0);
         fetchItems();
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al actualizar la navegacion",
            "error",
         );
      } finally {
         setEditLoading(false);
      }
   }

   // ── Delete ──────────────────────────────────────────────────────────────────

   function askDelete(item: NavItemsDto) {
      if (!canDeleteNavItems.value) return;
      setConfirmTarget(item);
      setConfirmOpen(true);
   }

   async function runDelete() {
      if (!confirmTarget) return;
      setConfirmLoading(true);
      try {
         await deleteNavItems(confirmTarget.id);
         addToast("Navegacion eliminado correctamente", "success");
         setConfirmOpen(false);
         setConfirmTarget(null);
         setOffset(0);
         fetchItems();
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al eliminar la navegacion",
            "error",
         );
      } finally {
         setConfirmLoading(false);
      }
   }

   // ── Restore ─────────────────────────────────────────────────────────────────

   async function runRestore(item: NavItemsDto) {
      if (!canRestoreNavItems.value) return;
      setRestoreLoadingId(item.id);
      try {
         await restoreNavItems(item.id);
         addToast("Navegacion restaurado correctamente", "success");
         setOffset(0);
         fetchItems();
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al restaurar la navegacion",
            "error",
         );
      } finally {
         setRestoreLoadingId(null);
      }
   }

   // ── Columns ──────────────────────────────────────────────────────────────────

   const columns: Column<NavItemsDto>[] = [
      {
         key: "title",
         header: "Título",
         render: (item) => (
            <span class="text-sm font-medium text-[var(--text-primary)]">{item.title}</span>
         ),
      },
      {
         key: "path",
         header: "Ruta",
         render: (item) => (
            <span class="text-sm text-[var(--text-secondary)]">{item.path || "—"}</span>
         ),
         class: "w-28",
      },
      {
         key: "position",
         header: "Orden",
         render: (item) => (
            <span class="text-sm text-[var(--text-secondary)] line-clamp-2 max-w-xs">
               {item.position || "—"}
            </span>
         ),
      },
      {
         key: "status",
         header: "Estado",
         render: (item) => (
            <span
               class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
                  }`}
            >
               {item.active ? "Activo" : "Inactivo"}
            </span>
         ),
         class: "w-24",
      },
      {
         key: "lastAction",
         header: "Última acción",
         render: (item) => (
            <span class="text-xs text-[var(--text-muted)]">
               {lastActionLabel[item.lastAction] ?? item.lastAction}
            </span>
         ),
         class: "w-32",
      },
      {
         key: "actions",
         header: "Acciones",
         render: (item) => (
            <div class="flex gap-2 flex-wrap">
               {canUpdateNavItems.value && item.active && (
                  <Button variant="ghost" onClick={() => openEdit(item)}>
                     Editar
                  </Button>
               )}
               {canDeleteNavItems.value && item.active && (
                  <Button variant="danger" onClick={() => askDelete(item)}>
                     Eliminar
                  </Button>
               )}
               {canRestoreNavItems.value && !item.active && (
                  <Button
                     variant="primary"
                     onClick={() => runRestore(item)}
                     disabled={restoreLoadingId === item.id}
                  >
                     {restoreLoadingId === item.id ? "Restaurando..." : "Restaurar"}
                  </Button>
               )}
            </div>
         ),
      },
   ];

   // ── Guard ────────────────────────────────────────────────────────────────────

   if (!canReadNavItems.value) {
      return (
         <Layout>
            <div class="py-12 text-center">
               <p class="text-sm text-[var(--text-muted)]">No tienes permiso para ver esta sección.</p>
            </div>
         </Layout>
      );
   }

   // ── Render ───────────────────────────────────────────────────────────────────

   return (
      <Layout>
         {/* Header */}
         <div class="flex items-center justify-between mb-6">
            <div>
               <h1 class="text-xl font-bold text-[var(--text-primary)]">Navegacion</h1>
               <p class="text-sm text-[var(--text-muted)] mt-0.5">
                  Administra el catálogo de Navegacion
               </p>
            </div>
            {canCreateNavItems.value && (
               <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  Nuevo Navegacion
               </Button>
            )}
         </div>

         {/* Filters */}
         <div class="flex items-center gap-4 mb-4">
            <label class="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
               <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => {
                     setShowInactive((e.target as HTMLInputElement).checked);
                     setOffset(0);
                  }}
               />
               <span>Mostrar también inactivos</span>
            </label>
         </div>

         {/* Table */}
         {loading ? (
            <p class="text-[var(--text-muted)] py-12 text-center">Cargando...</p>
         ) : (
            <>
               <Table
                  columns={columns}
                  data={items}
                  keyFn={(item) => item.id}
                  emptyMessage="No hay animes"
               />
               <Pagination offset={offset} limit={LIMIT} total={total} onChange={setOffset} />
            </>
         )}

         {/* Create Modal */}
         <Modal
            open={createOpen}
            onClose={() => {
               if (createLoading) return;
               setCreateOpen(false);
               resetCreateForm();
            }}
            title="Nueva Navegacion"
         >
            <form class="flex flex-col gap-4" onSubmit={submitCreate}>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Título <span class="text-[var(--error)]">*</span></span>
                  <input
                     type="text"
                     value={createTitle}
                     onInput={(e) => setCreateTitle((e.target as HTMLInputElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Nombre del navItems"
                     required
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Ruta <span class="text-[var(--error)]">*</span></span>
                  <input
                     type="text"
                     value={createPath}
                     onInput={(e) => setCreatePath((e.target as HTMLTextAreaElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="navItems-semanal"
                     required
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Posicion <span class="text-[var(--error)]">*</span></span>
                  <input
                     type="number"
                     value={createPosition}
                     onInput={(e) => setCreatePosition(Number((e.target as HTMLInputElement).value))}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Ej: 1"
                     min="0"
                     required
                  />
               </label>
               <div class="flex justify-end gap-3 pt-2">
                  <Button
                     type="button"
                     variant="ghost"
                     onClick={() => {
                        if (createLoading) return;
                        setCreateOpen(false);
                        resetCreateForm();
                     }}
                  >
                     Cancelar
                  </Button>
                  <Button type="submit" variant="primary" disabled={createLoading}>
                     {createLoading ? "Creando..." : "Crear"}
                  </Button>
               </div>
            </form>
         </Modal>

         {/* Edit Modal */}
         <Modal
            open={editTarget !== null}
            onClose={() => {
               if (editLoading) return;
               setEditTarget(null);
            }}
            title={editTarget ? `Editar: ${editTarget.title}` : "Editar Navegacion"}
         >
            <form class="flex flex-col gap-4" onSubmit={submitEdit}>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Título</span>
                  <input
                     type="text"
                     value={editTitle}
                     onInput={(e) => setEditTitle((e.target as HTMLInputElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Nombre del navItems"
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Ruta</span>
                  <input
                     type="text"
                     value={editPath}
                     onInput={(e) => setEditPath((e.target as HTMLTextAreaElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Opcional"
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Posicion </span>
                  <input
                     type="number"
                     value={editPosition}
                     onInput={(e) => setEditPosition(Number((e.target as HTMLInputElement).value))}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Ej: 1"
                     min="0"
                     required
                  />
               </label>
               <div class="flex justify-end gap-3 pt-2">
                  <Button
                     type="button"
                     variant="ghost"
                     onClick={() => {
                        if (editLoading) return;
                        setEditTarget(null);
                     }}
                  >
                     Cancelar
                  </Button>
                  <Button type="submit" variant="primary" disabled={editLoading}>
                     {editLoading ? "Guardando..." : "Guardar"}
                  </Button>
               </div>
            </form>
         </Modal>

         {/* Delete Confirm Modal */}
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
               ¿Estás seguro de que deseas eliminar{" "}
               <strong>{confirmTarget?.title}</strong>? La opcion de navegacion quedará inactivo y podrá ser restaurado.
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
