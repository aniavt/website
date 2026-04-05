import { useEffect, useState, useCallback } from "preact/hooks";
import Layout from "@components/Layout";
import Table, { type Column } from "@components/Table";
import Button from "@components/Button";
import Modal from "@components/Modal";
import Pagination from "@components/Pagination";
import { addToast } from "@store/toast";
import {
   canReadAnime,
   canCreateAnime,
   canUpdateAnime,
   canDeleteAnime,
   canRestoreAnime,
} from "@store/auth";
import {
   type AnimeDto,
   type ChapterDto,
   type CreateAnimeInput,
   type UpdateAnimeInput,
   type CreateChapterInput,
   type UpdateChapterInput,
   listAnimes,
   createAnime,
   updateAnime,
   deleteAnime,
   restoreAnime,
   listChaptersByAnime,
   createChapter,
   updateChapter,
   deleteChapter,
   uploadMediaFile,
   ApiError,
} from "@utils";

const LIMIT = 15;

export default function Anime() {
   const [items, setItems] = useState<AnimeDto[]>([]);
   const [loading, setLoading] = useState(true);
   const [offset, setOffset] = useState(0);
   const [total, setTotal] = useState(0);
   const [showInactive, setShowInactive] = useState(false);

   // ── Create anime modal ──────────────────────────────────────────────────────
   const [createOpen, setCreateOpen] = useState(false);
   const [createTitle, setCreateTitle] = useState("");
   const [createDescription, setCreateDescription] = useState("");
   const [createCoverURL, setCreateCoverURL] = useState("");
   const [createCoverFile, setCreateCoverFile] = useState<File | null>(null);
   const [createCoverPreviewUrl, setCreateCoverPreviewUrl] = useState<string | null>(null);
   const [createGenre, setCreateGenre] = useState("");
   const [createStatus, setCreateStatus] = useState<"watching" | "completed" | "upcoming">("upcoming");
   const [createLoading, setCreateLoading] = useState(false);

   // ── Edit anime modal ────────────────────────────────────────────────────────
   const [editTarget, setEditTarget] = useState<AnimeDto | null>(null);
   const [editTitle, setEditTitle] = useState("");
   const [editDescription, setEditDescription] = useState("");
   const [editCoverURL, setEditCoverURL] = useState("");
   const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
   const [editCoverPreviewUrl, setEditCoverPreviewUrl] = useState<string | null>(null);
   const [editGenre, setEditGenre] = useState("");
   const [editStatus, setEditStatus] = useState<"watching" | "completed" | "upcoming">("upcoming");
   const [editLoading, setEditLoading] = useState(false);

   // ── Delete anime confirm modal ──────────────────────────────────────────────
   const [confirmTarget, setConfirmTarget] = useState<AnimeDto | null>(null);
   const [confirmOpen, setConfirmOpen] = useState(false);
   const [confirmLoading, setConfirmLoading] = useState(false);

   // ── Restore loading ─────────────────────────────────────────────────────────
   const [restoreLoadingId, setRestoreLoadingId] = useState<string | null>(null);

   // ── Chapters modal ──────────────────────────────────────────────────────────
   const [chaptersAnime, setChaptersAnime] = useState<AnimeDto | null>(null);
   const [chapters, setChapters] = useState<ChapterDto[]>([]);
   const [chaptersLoading, setChaptersLoading] = useState(false);

   // Chapter create modal
   const [chapterCreateOpen, setChapterCreateOpen] = useState(false);
   const [chapterCreateNumber, setChapterCreateNumber] = useState("");
   const [chapterCreateTitle, setChapterCreateTitle] = useState("");
   const [chapterCreateVideoURL, setChapterCreateVideoURL] = useState("");
   const [chapterCreateVideoFile, setChapterCreateVideoFile] = useState<File | null>(null);
   const [chapterCreateVideoPreview, setChapterCreateVideoPreview] = useState<string | null>(null);
   const [chapterCreateCoverURL, setChapterCreateCoverURL] = useState("");
   const [chapterCreateCoverFile, setChapterCreateCoverFile] = useState<File | null>(null);
   const [chapterCreateCoverPreview, setChapterCreateCoverPreview] = useState<string | null>(null);
   const [chapterCreateLoading, setChapterCreateLoading] = useState(false);

   // Chapter edit modal
   const [chapterEditTarget, setChapterEditTarget] = useState<ChapterDto | null>(null);
   const [chapterEditNumber, setChapterEditNumber] = useState("");
   const [chapterEditTitle, setChapterEditTitle] = useState("");
   const [chapterEditVideoURL, setChapterEditVideoURL] = useState("");
   const [chapterEditVideoFile, setChapterEditVideoFile] = useState<File | null>(null);
   const [chapterEditVideoPreview, setChapterEditVideoPreview] = useState<string | null>(null);
   const [chapterEditCoverURL, setChapterEditCoverURL] = useState("");
   const [chapterEditCoverFile, setChapterEditCoverFile] = useState<File | null>(null);
   const [chapterEditCoverPreview, setChapterEditCoverPreview] = useState<string | null>(null);
   const [chapterEditLoading, setChapterEditLoading] = useState(false);

   // Chapter delete confirm
   const [chapterDeleteTarget, setChapterDeleteTarget] = useState<ChapterDto | null>(null);
   const [chapterDeleteLoading, setChapterDeleteLoading] = useState(false);

   // ── Labels ──────────────────────────────────────────────────────────────────

   const lastActionLabel: Record<string, string> = {
      created: "Creado",
      updated: "Actualizado",
      deleted: "Eliminado",
      restore: "Restaurado",
   };

   // ── Cover/video preview effects ─────────────────────────────────────────────
   useEffect(() => {
      if (!createCoverFile) { setCreateCoverPreviewUrl(null); return; }
      const url = URL.createObjectURL(createCoverFile);
      setCreateCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
   }, [createCoverFile]);

   useEffect(() => {
      if (!editCoverFile) { setEditCoverPreviewUrl(null); return; }
      const url = URL.createObjectURL(editCoverFile);
      setEditCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
   }, [editCoverFile]);

   useEffect(() => {
      if (!chapterCreateCoverFile) { setChapterCreateCoverPreview(null); return; }
      const url = URL.createObjectURL(chapterCreateCoverFile);
      setChapterCreateCoverPreview(url);
      return () => URL.revokeObjectURL(url);
   }, [chapterCreateCoverFile]);

   useEffect(() => {
      if (!chapterCreateVideoFile) { setChapterCreateVideoPreview(null); return; }
      const url = URL.createObjectURL(chapterCreateVideoFile);
      setChapterCreateVideoPreview(url);
      return () => URL.revokeObjectURL(url);
   }, [chapterCreateVideoFile]);

   useEffect(() => {
      if (!chapterEditCoverFile) { setChapterEditCoverPreview(null); return; }
      const url = URL.createObjectURL(chapterEditCoverFile);
      setChapterEditCoverPreview(url);
      return () => URL.revokeObjectURL(url);
   }, [chapterEditCoverFile]);

   useEffect(() => {
      if (!chapterEditVideoFile) { setChapterEditVideoPreview(null); return; }
      const url = URL.createObjectURL(chapterEditVideoFile);
      setChapterEditVideoPreview(url);
      return () => URL.revokeObjectURL(url);
   }, [chapterEditVideoFile]);

   // ── Fetch animes ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   const fetchItems = useCallback(async () => {
      if (!canReadAnime.value) {
         setItems([]);
         setLoading(false);
         return;
      }
      setLoading(true);
      try {
         const data = await listAnimes(showInactive);
         setTotal(data.length);
         setItems(data.slice(offset, offset + LIMIT));
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al cargar los animes",
            "error",
         );
      } finally {
         setLoading(false);
      }
   }, [offset, showInactive]);

   useEffect(() => {
      fetchItems();
   }, [fetchItems]);

   // ── Fetch chapters for selected anime ─────────────────────────────────────
   async function fetchChapters(animeId: string) {
      setChaptersLoading(true);
      try {
         const data = await listChaptersByAnime(animeId);
         setChapters(data);
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al cargar capítulos",
            "error",
         );
      } finally {
         setChaptersLoading(false);
      }
   }

   // ── Anime CRUD ────────────────────────────────────────────────────────────

   function resetCreateForm() {
      setCreateTitle("");
      setCreateDescription("");
      setCreateCoverURL("");
      setCreateCoverFile(null);
      setCreateCoverPreviewUrl(null);
      setCreateGenre("");
      setCreateStatus("upcoming");
   }

   async function submitCreate(e: Event) {
      e.preventDefault();
      if (!canCreateAnime.value) return;
      if (!createTitle.trim()) {
         addToast("El título es obligatorio", "error");
         return;
      }
      setCreateLoading(true);
      try {
         let coverImageURL = createCoverURL.trim() || undefined;
         if (createCoverFile) {
            const uploaded = await uploadMediaFile(createCoverFile);
            coverImageURL = uploaded.url;
         }
         const input: CreateAnimeInput = {
            title: createTitle.trim(),
            description: createDescription.trim() || undefined,
            coverImageURL,
            genre: createGenre.trim(),
            status: createStatus,
         };
         await createAnime(input);
         addToast("Anime creado correctamente", "success");
         setCreateOpen(false);
         resetCreateForm();
         setOffset(0);
         fetchItems();
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al crear el anime",
            "error",
         );
      } finally {
         setCreateLoading(false);
      }
   }

   // ── Edit ────────────────────────────────────────────────────────────────────

   function openEdit(item: AnimeDto) {
      setEditTarget(item);
      setEditTitle(item.title);
      setEditDescription(item.description ?? "");
      setEditCoverURL(item.coverImageURL ?? "");
      setEditCoverFile(null);
      setEditCoverPreviewUrl(null);
      setEditGenre(item.genre);
      setEditStatus(item.status);
   }

   async function submitEdit(e: Event) {
      e.preventDefault();
      if (!editTarget || !canUpdateAnime.value) return;
      setEditLoading(true);
      try {
         let coverImageURL = editCoverURL.trim() || undefined;
         if (editCoverFile) {
            const uploaded = await uploadMediaFile(editCoverFile);
            coverImageURL = uploaded.url;
         }
         const input: UpdateAnimeInput = {
            title: editTitle.trim() || undefined,
            description: editDescription.trim() || undefined,
            coverImageURL,
            genre: editGenre.trim() || undefined,
            status: editStatus,
         };
         await updateAnime(editTarget.id, input);
         addToast("Anime actualizado correctamente", "success");
         setEditTarget(null);
         setEditCoverFile(null);
         setOffset(0);
         fetchItems();
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al actualizar el anime",
            "error",
         );
      } finally {
         setEditLoading(false);
      }
   }

   // ── Delete ──────────────────────────────────────────────────────────────────

   function askDelete(item: AnimeDto) {
      if (!canDeleteAnime.value) return;
      setConfirmTarget(item);
      setConfirmOpen(true);
   }

   async function runDelete() {
      if (!confirmTarget) return;
      setConfirmLoading(true);
      try {
         await deleteAnime(confirmTarget.id);
         addToast("Anime eliminado correctamente", "success");
         setConfirmOpen(false);
         setConfirmTarget(null);
         setOffset(0);
         fetchItems();
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al eliminar el anime",
            "error",
         );
      } finally {
         setConfirmLoading(false);
      }
   }

   // ── Restore ─────────────────────────────────────────────────────────────────

   async function runRestore(item: AnimeDto) {
      if (!canRestoreAnime.value) return;
      setRestoreLoadingId(item.id);
      try {
         await restoreAnime(item.id);
         addToast("Anime restaurado correctamente", "success");
         setOffset(0);
         fetchItems();
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al restaurar el anime",
            "error",
         );
      } finally {
         setRestoreLoadingId(null);
      }
   }
   // ── Chapter CRUD ────────────────────────────────────────────────────────────────

   function openChapters(item: AnimeDto) {
      setChaptersAnime(item);
      setChapters([]);
      fetchChapters(item.id);
   }

   function resetChapterCreateForm() {
      setChapterCreateNumber("");
      setChapterCreateTitle("");
      setChapterCreateVideoURL("");
      setChapterCreateVideoFile(null);
      setChapterCreateVideoPreview(null);
      setChapterCreateCoverURL("");
      setChapterCreateCoverFile(null);
      setChapterCreateCoverPreview(null);
   }

   async function submitChapterCreate(e: Event) {
      e.preventDefault();
      if (!chaptersAnime || !canCreateAnime.value) return;
      const num = parseInt(chapterCreateNumber, 10);
      if (!chapterCreateNumber || isNaN(num)) {
         addToast("El número de capítulo es obligatorio", "error");
         return;
      }
      setChapterCreateLoading(true);
      try {
         let videoURL = chapterCreateVideoURL.trim() || undefined;
         if (chapterCreateVideoFile) {
            const uploaded = await uploadMediaFile(chapterCreateVideoFile);
            videoURL = uploaded.url;
         }
         let coverImageURL = chapterCreateCoverURL.trim() || undefined;
         if (chapterCreateCoverFile) {
            const uploaded = await uploadMediaFile(chapterCreateCoverFile);
            coverImageURL = uploaded.url;
         }
         const input: CreateChapterInput = {
            number: num,
            title: chapterCreateTitle.trim() || undefined,
            videoURL,
            coverImageURL,
         };
         await createChapter(chaptersAnime.id, input);
         addToast("Capítulo creado correctamente", "success");
         setChapterCreateOpen(false);
         resetChapterCreateForm();
         fetchChapters(chaptersAnime.id);
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al crear el capítulo",
            "error",
         );
      } finally {
         setChapterCreateLoading(false);
      }
   }

   function openChapterEdit(ch: ChapterDto) {
      setChapterEditTarget(ch);
      setChapterEditNumber(String(ch.number));
      setChapterEditTitle(ch.title ?? "");
      setChapterEditVideoURL(ch.videoURL ?? "");
      setChapterEditVideoFile(null);
      setChapterEditVideoPreview(null);
      setChapterEditCoverURL(ch.coverImageURL ?? "");
      setChapterEditCoverFile(null);
      setChapterEditCoverPreview(null);
   }

   async function submitChapterEdit(e: Event) {
      e.preventDefault();
      if (!chapterEditTarget || !canUpdateAnime.value) return;
      setChapterEditLoading(true);
      try {
         let videoURL = chapterEditVideoURL.trim() || undefined;
         if (chapterEditVideoFile) {
            const uploaded = await uploadMediaFile(chapterEditVideoFile);
            videoURL = uploaded.url;
         }
         let coverImageURL = chapterEditCoverURL.trim() || undefined;
         if (chapterEditCoverFile) {
            const uploaded = await uploadMediaFile(chapterEditCoverFile);
            coverImageURL = uploaded.url;
         }
         const num = parseInt(chapterEditNumber, 10);
         const input: UpdateChapterInput = {
            number: isNaN(num) ? undefined : num,
            title: chapterEditTitle.trim() || undefined,
            videoURL,
            coverImageURL,
         };
         await updateChapter(chapterEditTarget.id, input);
         addToast("Capítulo actualizado correctamente", "success");
         setChapterEditTarget(null);
         if (chaptersAnime) fetchChapters(chaptersAnime.id);
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al actualizar el capítulo",
            "error",
         );
      } finally {
         setChapterEditLoading(false);
      }
   }

   async function runChapterDelete() {
      if (!chapterDeleteTarget || !chaptersAnime) return;
      setChapterDeleteLoading(true);
      try {
         await deleteChapter(chapterDeleteTarget.id);
         addToast("Capítulo eliminado correctamente", "success");
         setChapterDeleteTarget(null);
         fetchChapters(chaptersAnime.id);
      } catch (err) {
         addToast(
            err instanceof ApiError ? err.code : "Error al eliminar el capítulo",
            "error",
         );
      } finally {
         setChapterDeleteLoading(false);
      }
   }
   // ── Columns ──────────────────────────────────────────────────────────────────

   const columns: Column<AnimeDto>[] = [
      {
         key: "cover",
         header: "Portada",
         render: (item) =>
            item.coverImageURL ? (
               <img
                  src={item.coverImageURL}
                  alt={item.title}
                  class="h-12 w-8 object-cover rounded"
                  onError={(e) => {
                     (e.target as HTMLImageElement).style.display = "none";
                  }}
               />
            ) : (
               <span class="text-xs text-[var(--text-muted)]">—</span>
            ),
         class: "w-16",
      },
      {
         key: "title",
         header: "Título",
         render: (item) => (
            <span class="text-sm font-medium text-[var(--text-primary)]">{item.title}</span>
         ),
      },
      {
         key: "genre",
         header: "Género",
         render: (item) => (
            <span class="text-sm text-[var(--text-secondary)]">{item.genre || "—"}</span>
         ),
         class: "w-28",
      },
      {
         key: "watchStatus",
         header: "Seguimiento",
         render: (item) => {
            const map: Record<string, { label: string; cls: string }> = {
               watching: { label: "Viendo", cls: "bg-blue-100 text-blue-800" },
               completed: { label: "Completado", cls: "bg-green-100 text-green-800" },
               upcoming: { label: "Próximo", cls: "bg-yellow-100 text-yellow-800" },
            };
            const s = map[item.status];
            return (
               <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s?.cls ?? ""}`}>
                  {s?.label ?? item.status}
               </span>
            );
         },
         class: "w-28",
      },
      {
         key: "description",
         header: "Descripción",
         render: (item) => (
            <span class="text-sm text-[var(--text-secondary)] line-clamp-2 max-w-xs">
               {item.description?.trim() || "—"}
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
               {canReadAnime.value && item.active && (
                  <Button variant="ghost" onClick={() => openChapters(item)}>
                     Capítulos
                  </Button>
               )}
               {canUpdateAnime.value && item.active && (
                  <Button variant="ghost" onClick={() => openEdit(item)}>
                     Editar
                  </Button>
               )}
               {canDeleteAnime.value && item.active && (
                  <Button variant="danger" onClick={() => askDelete(item)}>
                     Eliminar
                  </Button>
               )}
               {canRestoreAnime.value && !item.active && (
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

   if (!canReadAnime.value) {
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
               <h1 class="text-xl font-bold text-[var(--text-primary)]">Anime</h1>
               <p class="text-sm text-[var(--text-muted)] mt-0.5">
                  Administra el catálogo de animes
               </p>
            </div>
            {canCreateAnime.value && (
               <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  Nuevo anime
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
            title="Nuevo anime"
         >
            <form class="flex flex-col gap-4" onSubmit={submitCreate}>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Título <span class="text-[var(--error)]">*</span></span>
                  <input
                     type="text"
                     value={createTitle}
                     onInput={(e) => setCreateTitle((e.target as HTMLInputElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Nombre del anime"
                     required
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Descripción</span>
                  <textarea
                     value={createDescription}
                     onInput={(e) => setCreateDescription((e.target as HTMLTextAreaElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none min-h-[80px]"
                     placeholder="Opcional"
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Género <span class="text-[var(--error)]">*</span></span>
                  <input
                     type="text"
                     value={createGenre}
                     onInput={(e) => setCreateGenre((e.target as HTMLInputElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Ej: Acción, Romance..."
                     required
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Seguimiento <span class="text-[var(--error)]">*</span></span>
                  <select
                     value={createStatus}
                     onChange={(e) => setCreateStatus((e.target as HTMLSelectElement).value as "watching" | "completed" | "upcoming")}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                  >
                     <option value="upcoming">Próximo</option>
                     <option value="watching">Viendo</option>
                     <option value="completed">Completado</option>
                  </select>
               </label>
               <div class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Portada</span>
                  <label class="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors">
                     <span class="text-xs text-[var(--text-muted)]">
                        {createCoverFile ? createCoverFile.name : "Seleccionar imagen..."}
                     </span>
                     <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        onChange={(e) => {
                           const f = (e.target as HTMLInputElement).files?.[0] ?? null;
                           setCreateCoverFile(f);
                           if (f) setCreateCoverURL("");
                        }}
                     />
                  </label>
                  {!createCoverFile && (
                     <input
                        type="text"
                        value={createCoverURL}
                        onInput={(e) => setCreateCoverURL((e.target as HTMLInputElement).value)}
                        class="mt-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                        placeholder="URL o ruta de imagen (opcional)"
                     />
                  )}
               </div>
               {(createCoverPreviewUrl ?? createCoverURL.trim()) && (
                  <div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-tertiary)] h-40 flex items-center justify-center relative">
                     <img
                        src={createCoverPreviewUrl ?? createCoverURL.trim()}
                        alt="Vista previa"
                        class="h-full object-contain"
                        onError={(e) => {
                           (e.target as HTMLImageElement).style.display = "none";
                        }}
                     />
                     {createCoverFile && (
                        <button
                           type="button"
                           onClick={() => setCreateCoverFile(null)}
                           class="absolute top-1 right-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--error)] leading-none"
                           title="Quitar imagen"
                        >
                           ✕
                        </button>
                     )}
                  </div>
               )}
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
               setEditCoverFile(null);
            }}
            title={editTarget ? `Editar: ${editTarget.title}` : "Editar anime"}
         >
            <form class="flex flex-col gap-4" onSubmit={submitEdit}>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Título</span>
                  <input
                     type="text"
                     value={editTitle}
                     onInput={(e) => setEditTitle((e.target as HTMLInputElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Nombre del anime"
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Descripción</span>
                  <textarea
                     value={editDescription}
                     onInput={(e) => setEditDescription((e.target as HTMLTextAreaElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none min-h-[80px]"
                     placeholder="Opcional"
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Género</span>
                  <input
                     type="text"
                     value={editGenre}
                     onInput={(e) => setEditGenre((e.target as HTMLInputElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Ej: Acción, Romance..."
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Seguimiento</span>
                  <select
                     value={editStatus}
                     onChange={(e) => setEditStatus((e.target as HTMLSelectElement).value as "watching" | "completed" | "upcoming")}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                  >
                     <option value="upcoming">Próximo</option>
                     <option value="watching">Viendo</option>
                     <option value="completed">Completado</option>
                  </select>
               </label>
               <div class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Portada</span>
                  <label class="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors">
                     <span class="text-xs text-[var(--text-muted)]">
                        {editCoverFile ? editCoverFile.name : "Seleccionar nueva imagen..."}
                     </span>
                     <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        onChange={(e) => {
                           const f = (e.target as HTMLInputElement).files?.[0] ?? null;
                           setEditCoverFile(f);
                           if (f) setEditCoverURL("");
                        }}
                     />
                  </label>
                  {!editCoverFile && (
                     <input
                        type="text"
                        value={editCoverURL}
                        onInput={(e) => setEditCoverURL((e.target as HTMLInputElement).value)}
                        class="mt-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                        placeholder="URL o ruta de imagen (opcional)"
                     />
                  )}
               </div>
               {(editCoverPreviewUrl ?? editCoverURL.trim()) && (
                  <div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-tertiary)] h-40 flex items-center justify-center relative">
                     <img
                        src={editCoverPreviewUrl ?? editCoverURL.trim()}
                        alt="Vista previa"
                        class="h-full object-contain"
                        onError={(e) => {
                           (e.target as HTMLImageElement).style.display = "none";
                        }}
                     />
                     {editCoverFile && (
                        <button
                           type="button"
                           onClick={() => setEditCoverFile(null)}
                           class="absolute top-1 right-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--error)] leading-none"
                           title="Quitar imagen"
                        >
                           ✕
                        </button>
                     )}
                  </div>
               )}
               {/* Video */}
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
               <strong>{confirmTarget?.title}</strong>? El anime quedará inactivo y podrá ser restaurado.
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

         {/* ── Chapters list Modal ────────────────────────────────────────────── */}
         <Modal
            open={chaptersAnime !== null}
            onClose={() => {
               setChaptersAnime(null);
               setChapters([]);
            }}
            title={chaptersAnime ? `Capítulos: ${chaptersAnime.title}` : "Capítulos"}
         >
            <div class="flex flex-col gap-4">
               {canCreateAnime.value && (
                  <div class="flex justify-end sticky top-0 z-10 bg-[var(--bg-secondary)] pb-2">
                     <Button variant="primary" onClick={() => setChapterCreateOpen(true)}>
                        Nuevo capítulo
                     </Button>
                  </div>
               )}
               {chaptersLoading ? (
                  <p class="text-sm text-[var(--text-muted)] text-center py-4">Cargando capítulos...</p>
               ) : chapters.length === 0 ? (
                  <p class="text-sm text-[var(--text-muted)] text-center py-4">No hay capítulos</p>
               ) : (
                  <div class="flex flex-col gap-2">
                     {chapters.map((ch) => (
                        <div
                           key={ch.id}
                           class="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2"
                        >
                           {ch.coverImageURL ? (
                              <img
                                 src={ch.coverImageURL}
                                 alt={`Cap. ${ch.number}`}
                                 class="h-10 w-7 object-cover rounded flex-shrink-0"
                                 onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                           ) : (
                              <div class="h-10 w-7 bg-[var(--bg-secondary)] rounded flex-shrink-0" />
                           )}
                           <div class="flex-1 min-w-0">
                              <p class="text-sm font-medium text-[var(--text-primary)]">
                                 Cap. {ch.number}{ch.title ? ` — ${ch.title}` : ""}
                              </p>
                              <p class="text-xs text-[var(--text-muted)]">
                                 {ch.videoURL ? "Video disponible" : "Sin video"}
                              </p>
                           </div>
                           <div class="flex gap-2 flex-shrink-0">
                              {canUpdateAnime.value && (
                                 <Button variant="ghost" onClick={() => openChapterEdit(ch)}>
                                    Editar
                                 </Button>
                              )}
                              {canDeleteAnime.value && (
                                 <Button variant="danger" onClick={() => setChapterDeleteTarget(ch)}>
                                    Eliminar
                                 </Button>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </Modal>

         {/* ── Chapter create Modal ───────────────────────────────────────────── */}
         <Modal
            open={chapterCreateOpen}
            onClose={() => {
               if (chapterCreateLoading) return;
               setChapterCreateOpen(false);
               resetChapterCreateForm();
            }}
            title="Nuevo capítulo"
         >
            <form class="flex flex-col gap-4" onSubmit={submitChapterCreate}>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Número <span class="text-[var(--error)]">*</span></span>
                  <input
                     type="number"
                     min="1"
                     value={chapterCreateNumber}
                     onInput={(e) => setChapterCreateNumber((e.target as HTMLInputElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Ej: 1"
                     required
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Título</span>
                  <input
                     type="text"
                     value={chapterCreateTitle}
                     onInput={(e) => setChapterCreateTitle((e.target as HTMLInputElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Opcional"
                  />
               </label>
               <div class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Portada del capítulo</span>
                  <label class="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors">
                     <span class="text-xs text-[var(--text-muted)]">
                        {chapterCreateCoverFile ? chapterCreateCoverFile.name : "Seleccionar imagen..."}
                     </span>
                     <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        onChange={(e) => {
                           const f = (e.target as HTMLInputElement).files?.[0] ?? null;
                           setChapterCreateCoverFile(f);
                           if (f) setChapterCreateCoverURL("");
                        }}
                     />
                  </label>
                  {!chapterCreateCoverFile && (
                     <input
                        type="text"
                        value={chapterCreateCoverURL}
                        onInput={(e) => setChapterCreateCoverURL((e.target as HTMLInputElement).value)}
                        class="mt-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                        placeholder="URL o ruta de imagen (opcional)"
                     />
                  )}
                  {(chapterCreateCoverPreview ?? chapterCreateCoverURL.trim()) && (
                     <div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-tertiary)] h-32 flex items-center justify-center relative mt-1">
                        <img
                           src={chapterCreateCoverPreview ?? chapterCreateCoverURL.trim()}
                           alt="Vista previa"
                           class="h-full object-contain"
                           onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        {chapterCreateCoverFile && (
                           <button type="button" onClick={() => setChapterCreateCoverFile(null)}
                              class="absolute top-1 right-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--error)] leading-none"
                              title="Quitar imagen">✕</button>
                        )}
                     </div>
                  )}
               </div>
               <div class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Video</span>
                  <label class="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors">
                     <span class="text-xs text-[var(--text-muted)]">
                        {chapterCreateVideoFile ? chapterCreateVideoFile.name : "Seleccionar video..."}
                     </span>
                     <input
                        type="file"
                        accept="video/*"
                        class="hidden"
                        onChange={(e) => {
                           const f = (e.target as HTMLInputElement).files?.[0] ?? null;
                           setChapterCreateVideoFile(f);
                           if (f) setChapterCreateVideoURL("");
                        }}
                     />
                  </label>
                  {!chapterCreateVideoFile && (
                     <input
                        type="text"
                        value={chapterCreateVideoURL}
                        onInput={(e) => setChapterCreateVideoURL((e.target as HTMLInputElement).value)}
                        class="mt-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                        placeholder="URL o ruta del video (opcional)"
                     />
                  )}
                  {(chapterCreateVideoPreview ?? chapterCreateVideoURL.trim()) && (
                     <div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-tertiary)] relative mt-1">
                        <video src={chapterCreateVideoPreview ?? chapterCreateVideoURL.trim()} controls class="w-full max-h-40 rounded-lg" />
                        {chapterCreateVideoFile && (
                           <button type="button" onClick={() => setChapterCreateVideoFile(null)}
                              class="absolute top-1 right-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--error)] leading-none"
                              title="Quitar video">✕</button>
                        )}
                     </div>
                  )}
               </div>
               <div class="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => { if (chapterCreateLoading) return; setChapterCreateOpen(false); resetChapterCreateForm(); }}>
                     Cancelar
                  </Button>
                  <Button type="submit" variant="primary" disabled={chapterCreateLoading}>
                     {chapterCreateLoading ? "Creando..." : "Crear"}
                  </Button>
               </div>
            </form>
         </Modal>

         {/* ── Chapter edit Modal ─────────────────────────────────────────────── */}
         <Modal
            open={chapterEditTarget !== null}
            onClose={() => { if (chapterEditLoading) return; setChapterEditTarget(null); }}
            title={chapterEditTarget ? `Editar cap. ${chapterEditTarget.number}` : "Editar capítulo"}
         >
            <form class="flex flex-col gap-4" onSubmit={submitChapterEdit}>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Número</span>
                  <input
                     type="number"
                     min="1"
                     value={chapterEditNumber}
                     onInput={(e) => setChapterEditNumber((e.target as HTMLInputElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                  />
               </label>
               <label class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Título</span>
                  <input
                     type="text"
                     value={chapterEditTitle}
                     onInput={(e) => setChapterEditTitle((e.target as HTMLInputElement).value)}
                     class="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                     placeholder="Opcional"
                  />
               </label>
               <div class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Portada del capítulo</span>
                  <label class="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors">
                     <span class="text-xs text-[var(--text-muted)]">
                        {chapterEditCoverFile ? chapterEditCoverFile.name : "Seleccionar nueva imagen..."}
                     </span>
                     <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        onChange={(e) => {
                           const f = (e.target as HTMLInputElement).files?.[0] ?? null;
                           setChapterEditCoverFile(f);
                           if (f) setChapterEditCoverURL("");
                        }}
                     />
                  </label>
                  {!chapterEditCoverFile && (
                     <input
                        type="text"
                        value={chapterEditCoverURL}
                        onInput={(e) => setChapterEditCoverURL((e.target as HTMLInputElement).value)}
                        class="mt-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                        placeholder="URL o ruta de imagen (opcional)"
                     />
                  )}
                  {(chapterEditCoverPreview ?? chapterEditCoverURL.trim()) && (
                     <div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-tertiary)] h-32 flex items-center justify-center relative mt-1">
                        <img
                           src={chapterEditCoverPreview ?? chapterEditCoverURL.trim()}
                           alt="Vista previa"
                           class="h-full object-contain"
                           onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        {chapterEditCoverFile && (
                           <button type="button" onClick={() => setChapterEditCoverFile(null)}
                              class="absolute top-1 right-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--error)] leading-none"
                              title="Quitar imagen">✕</button>
                        )}
                     </div>
                  )}
               </div>
               <div class="flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
                  <span>Video</span>
                  <label class="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors">
                     <span class="text-xs text-[var(--text-muted)]">
                        {chapterEditVideoFile ? chapterEditVideoFile.name : "Seleccionar nuevo video..."}
                     </span>
                     <input
                        type="file"
                        accept="video/*"
                        class="hidden"
                        onChange={(e) => {
                           const f = (e.target as HTMLInputElement).files?.[0] ?? null;
                           setChapterEditVideoFile(f);
                           if (f) setChapterEditVideoURL("");
                        }}
                     />
                  </label>
                  {!chapterEditVideoFile && (
                     <input
                        type="text"
                        value={chapterEditVideoURL}
                        onInput={(e) => setChapterEditVideoURL((e.target as HTMLInputElement).value)}
                        class="mt-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none"
                        placeholder="URL o ruta del video (opcional)"
                     />
                  )}
                  {(chapterEditVideoPreview ?? chapterEditVideoURL.trim()) && (
                     <div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-tertiary)] relative mt-1">
                        <video src={chapterEditVideoPreview ?? chapterEditVideoURL.trim()} controls class="w-full max-h-40 rounded-lg" />
                        {chapterEditVideoFile && (
                           <button type="button" onClick={() => setChapterEditVideoFile(null)}
                              class="absolute top-1 right-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--error)] leading-none"
                              title="Quitar video">✕</button>
                        )}
                     </div>
                  )}
               </div>
               <div class="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => { if (chapterEditLoading) return; setChapterEditTarget(null); }}>
                     Cancelar
                  </Button>
                  <Button type="submit" variant="primary" disabled={chapterEditLoading}>
                     {chapterEditLoading ? "Guardando..." : "Guardar"}
                  </Button>
               </div>
            </form>
         </Modal>

         {/* ── Chapter delete confirm Modal ───────────────────────────────────── */}
         <Modal
            open={chapterDeleteTarget !== null}
            onClose={() => { if (chapterDeleteLoading) return; setChapterDeleteTarget(null); }}
            title="Eliminar capítulo"
         >
            <p class="text-sm text-[var(--text-secondary)] mb-6">
               ¿Estás seguro de que deseas eliminar el capítulo{" "}
               <strong>{chapterDeleteTarget?.number}</strong>
               {chapterDeleteTarget?.title ? ` — ${chapterDeleteTarget.title}` : ""}?
               Esta acción no se puede deshacer.
            </p>
            <div class="flex justify-end gap-3">
               <Button variant="ghost" onClick={() => { if (chapterDeleteLoading) return; setChapterDeleteTarget(null); }}>
                  Cancelar
               </Button>
               <Button variant="danger" onClick={runChapterDelete} disabled={chapterDeleteLoading}>
                  {chapterDeleteLoading ? "Eliminando..." : "Eliminar"}
               </Button>
            </div>
         </Modal>
      </Layout>
   );
}
