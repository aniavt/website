import { apiUrl } from "@config";

class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${apiUrl}${path}`, opts);

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(res.status, data.error ?? "unknown_error");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

export { ApiError };

export interface WeeklyScheduleTagDto {
  readonly label: string;
  readonly bgColor: string;
  readonly txColor: string;
}

export interface WeeklyScheduleDto {
  readonly id: string;
  readonly week: number;
  readonly year: number;
  readonly fileId: string;
  readonly isDeleted: boolean;
  readonly title: string;
  readonly description: string;
  readonly tags: readonly WeeklyScheduleTagDto[];
  readonly fileContentType?: string | null;
}

export interface WeeklyScheduleHistoryEntryDto {
  readonly id: string;
  readonly scheduleId: string;
  readonly week: number;
  readonly year: number;
  readonly fileId: string;
  readonly action: string;
  readonly by: string;
  readonly byUsername: string;
  readonly timestamp: string;
}

export async function listWeeklySchedules(
  year?: number,
  includeDeleted: boolean = false,
): Promise<WeeklyScheduleDto[]> {
  const params = new URLSearchParams();
  if (year !== undefined) params.set("year", String(year));
  if (includeDeleted) params.set("includeDeleted", "true");
  const query = params.toString();
  return api.get<WeeklyScheduleDto[]>(`/weekly-schedule${query ? `?${query}` : ""}`);
}

export async function getWeeklyScheduleById(id: string): Promise<WeeklyScheduleDto> {
  return api.get<WeeklyScheduleDto>(`/weekly-schedule/${id}`);
}

export async function getWeeklyScheduleHistory(
  id: string,
): Promise<WeeklyScheduleHistoryEntryDto[]> {
  return api.get<WeeklyScheduleHistoryEntryDto[]>(`/weekly-schedule/${id}/history`);
}

export async function deleteWeeklySchedule(id: string): Promise<void> {
  await api.delete<undefined>(`/weekly-schedule/${id}`);
}

export async function restoreWeeklySchedule(id: string): Promise<WeeklyScheduleDto> {
  return api.post<WeeklyScheduleDto>(`/weekly-schedule/${id}/restore`);
}

export interface UpdateWeeklyScheduleInput {
  title?: string;
  description?: string;
  tags?: { label: string; bgColor: string; txColor: string }[];
}

export async function updateWeeklySchedule(
  id: string,
  input: UpdateWeeklyScheduleInput,
): Promise<WeeklyScheduleDto> {
  return api.patch<WeeklyScheduleDto>(`/weekly-schedule/${id}`, input);
}

// Vault

export type VaultNodeType = "file" | "folder";

export interface VaultNodeDto {
  readonly id: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly type: VaultNodeType;
  readonly createdAt: string;
  readonly thumbnailId: string | null;
  readonly isPublic: boolean;
}

export interface VaultTagDto {
  readonly id: string;
  readonly name: string;
}

export interface VaultNodeSourceDto {
  readonly id: string;
  readonly nodeId: string;
  readonly type: "external" | "internal";
  readonly server: string | null;
  readonly url: string;
  readonly createdAt: string;
}

export async function listVaultChildren(
  parentId: string | null,
): Promise<VaultNodeDto[]> {
  const params = new URLSearchParams();
  if (parentId !== null) params.set("parentId", parentId);
  const query = params.toString();
  return api.get<VaultNodeDto[]>(`/vault/children${query ? `?${query}` : ""}`);
}

export async function getVaultNodeByParentAndName(
  parentId: string | null,
  name: string,
): Promise<VaultNodeDto | null> {
  const params = new URLSearchParams();
  if (parentId !== null) params.set("parentId", parentId);
  params.set("name", name);
  const query = params.toString();
  return api.get<VaultNodeDto | null>(`/vault/node-by-name?${query}`);
}

export interface CreateVaultFolderInput {
  parentId: string | null;
  name: string;
  isPublic?: boolean;
}

export async function createVaultFolder(
  input: CreateVaultFolderInput,
): Promise<VaultNodeDto> {
  return api.post<VaultNodeDto>("/vault/folders", input);
}

export interface CreateVaultFileNodeInput {
  parentId: string | null;
  name: string;
  sourceType: "external" | "internal";
  server: string | null;
  urlOrFileId?: string;
  file?: File;
  isPublic?: boolean;
}

export async function createVaultFileNode(
  input: CreateVaultFileNodeInput,
): Promise<{ node: VaultNodeDto; source: VaultNodeSourceDto }> {
  if (input.sourceType === "internal" && input.file) {
    const formData = new FormData();
    formData.set("name", input.name);
    if (input.parentId !== null) {
      formData.set("parentId", input.parentId);
    }
    if (input.server !== null) {
      formData.set("server", input.server);
    }
    formData.set("sourceType", input.sourceType);
    if (input.isPublic !== undefined) {
      formData.set("isPublic", String(input.isPublic));
    }
    formData.set("file", input.file);

    const res = await fetch(`${apiUrl}/vault/files`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "unknown_error" }));
      throw new ApiError(res.status, data.error ?? "unknown_error");
    }

    return res.json() as Promise<{ node: VaultNodeDto; source: VaultNodeSourceDto }>;
  }

  return api.post<{ node: VaultNodeDto; source: VaultNodeSourceDto }>(
    "/vault/files",
    input,
  );
}

export async function deleteVaultNode(id: string): Promise<void> {
  await api.delete<undefined>(`/vault/node/${id}`);
}

export interface MoveVaultNodeInput {
  nodeId: string;
  newParentId: string | null;
}

export async function moveVaultNode(input: MoveVaultNodeInput): Promise<VaultNodeDto> {
  return api.post<VaultNodeDto>("/vault/node/move", input);
}

export async function renameVaultNode(
  nodeId: string,
  newName: string,
): Promise<VaultNodeDto> {
  return api.post<VaultNodeDto>("/vault/node/rename", { nodeId, newName });
}

export async function setVaultNodePublic(
  nodeId: string,
  isPublic: boolean,
): Promise<VaultNodeDto> {
  return api.post<VaultNodeDto>("/vault/node/public", { nodeId, isPublic });
}

export async function setVaultThumbnail(
  nodeId: string,
  thumbnailFileId: string | null,
): Promise<VaultNodeDto> {
  return api.post<VaultNodeDto>("/vault/node/thumbnail", { nodeId, thumbnailFileId });
}

export async function listVaultTags(): Promise<VaultTagDto[]> {
  return api.get<VaultTagDto[]>("/vault/tags");
}

export async function createVaultTag(name: string): Promise<VaultTagDto> {
  return api.post<VaultTagDto>("/vault/tags", { name });
}

export async function renameVaultTag(
  tagId: string,
  newName: string,
): Promise<VaultTagDto> {
  return api.patch<VaultTagDto>(`/vault/tags/${tagId}`, { name: newName });
}

export async function deleteVaultTag(tagId: string): Promise<void> {
  await api.delete<undefined>(`/vault/tags/${tagId}`);
}

export async function findVaultNodesByTagId(tagId: string): Promise<VaultNodeDto[]> {
  const params = new URLSearchParams();
  params.set("tagId", tagId);
  const query = params.toString();
  return api.get<VaultNodeDto[]>(`/vault/nodes?${query}`);
}

export async function findVaultNodesByTagName(
  tagName: string,
): Promise<VaultNodeDto[]> {
  const params = new URLSearchParams();
  params.set("tagName", tagName);
  const query = params.toString();
  return api.get<VaultNodeDto[]>(`/vault/nodes?${query}`);
}

export async function addTagToVaultNode(
  nodeId: string,
  tagId: string,
): Promise<void> {
  await api.post<undefined>("/vault/node/tag/add", { nodeId, tagId });
}

export async function removeTagFromVaultNode(
  nodeId: string,
  tagId: string,
): Promise<void> {
  await api.post<undefined>("/vault/node/tag/remove", { nodeId, tagId });
}

export async function getVaultTagsForNode(
  nodeId: string,
): Promise<VaultTagDto[]> {
  return api.get<VaultTagDto[]>(`/vault/node/${nodeId}/tags`);
}

export async function getVaultSourcesForNode(
  nodeId: string,
): Promise<VaultNodeSourceDto[]> {
  return api.get<VaultNodeSourceDto[]>(`/vault/node/${nodeId}/sources`);
}

export interface AddVaultSourceToNodeInput {
  type: "external" | "internal";
  server: string | null;
  urlOrFileId?: string;
  file?: File;
}

export interface UpdateVaultSourceInput {
  type?: "external" | "internal";
  server?: string | null;
  urlOrFileId?: string;
}

export async function addVaultSourceToNode(
  nodeId: string,
  input: AddVaultSourceToNodeInput,
): Promise<VaultNodeSourceDto> {
  if (input.type === "internal" && input.file) {
    const formData = new FormData();
    formData.set("type", input.type);
    if (input.server !== null) {
      formData.set("server", input.server);
    }
    formData.set("file", input.file);

    const res = await fetch(`${apiUrl}/vault/node/${nodeId}/sources`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "unknown_error" }));
      throw new ApiError(res.status, data.error ?? "unknown_error");
    }

    return res.json() as Promise<VaultNodeSourceDto>;
  }

  return api.post<VaultNodeSourceDto>(`/vault/node/${nodeId}/sources`, input);
}

export async function updateVaultSource(
  sourceId: string,
  input: UpdateVaultSourceInput,
): Promise<VaultNodeSourceDto> {
  return api.patch<VaultNodeSourceDto>(`/vault/sources/${sourceId}`, input);
}

export async function deleteVaultSource(sourceId: string): Promise<void> {
  await api.delete<undefined>(`/vault/sources/${sourceId}`);
}

export interface UploadMediaResult {
  readonly id: string;
  readonly name: string;
  readonly contentType: string;
  readonly size: number;
  readonly url: string;
  readonly isPrivate: boolean;
}

export async function uploadMediaFile(file: File): Promise<UploadMediaResult> {
  const formData = new FormData();
  formData.set("file", file);

  const res = await fetch(`${apiUrl}/media/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(res.status, data.error ?? "unknown_error");
  }

  return res.json() as Promise<UploadMediaResult>;
}

interface UploadWeeklyScheduleInput {
  week: number;
  year: number;
  file: File;
}

export async function uploadWeeklyScheduleFile(
  input: UploadWeeklyScheduleInput,
): Promise<WeeklyScheduleDto> {
  const formData = new FormData();
  formData.set("week", String(input.week));
  formData.set("year", String(input.year));
  formData.set("file", input.file);

  const res = await fetch(`${apiUrl}/weekly-schedule/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(res.status, data.error ?? "unknown_error");
  }

  return res.json();
}

export async function updateWeeklyScheduleFile(
  id: string,
  file: File,
): Promise<WeeklyScheduleDto> {
  const formData = new FormData();
  formData.set("file", file);

  const res = await fetch(`${apiUrl}/weekly-schedule/${id}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "unknown_error" }));
    throw new ApiError(res.status, data.error ?? "unknown_error");
  }

  return res.json();
}

// Anime

export type AnimeLastAction = "created" | "updated" | "deleted" | "restore";

export type AnimeStatus = "watching" | "completed" | "upcoming";

export interface AnimeDto {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImageURL?: string;
  readonly genre: string;
  readonly status: AnimeStatus;
  readonly active: boolean;
  readonly lastAction: AnimeLastAction;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateAnimeInput {
  title: string;
  description?: string;
  coverImageURL?: string;
  genre: string;
  status: AnimeStatus;
}

export interface UpdateAnimeInput {
  title?: string;
  description?: string;
  coverImageURL?: string;
  genre?: string;
  status?: AnimeStatus;
}

export async function listAnimes(includeInactive = false): Promise<AnimeDto[]> {
  const params = new URLSearchParams();
  if (!includeInactive) params.set("activeOnly", "true");
  const query = params.toString();
  return api.get<AnimeDto[]>(`/anime${query ? `?${query}` : ""}`);
}

export async function getAnimeById(id: string): Promise<AnimeDto> {
  return api.get<AnimeDto>(`/anime/${id}`);
}

export async function createAnime(input: CreateAnimeInput): Promise<AnimeDto> {
  return api.post<AnimeDto>("/anime", input);
}

export async function updateAnime(id: string, input: UpdateAnimeInput): Promise<AnimeDto> {
  return api.patch<AnimeDto>(`/anime/${id}`, input);
}

export async function deleteAnime(id: string): Promise<void> {
  await api.delete<undefined>(`/anime/${id}`);
}

export async function restoreAnime(id: string): Promise<AnimeDto> {
  return api.post<AnimeDto>(`/anime/${id}/restore`);
}

// Chapter

export interface ChapterDto {
  readonly id: string;
  readonly animeId: string;
  readonly number: number;
  readonly title?: string;
  readonly videoURL?: string;
  readonly coverImageURL?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateChapterInput {
  number: number;
  title?: string;
  videoURL?: string;
  coverImageURL?: string;
}

export interface UpdateChapterInput {
  number?: number;
  title?: string;
  videoURL?: string;
  coverImageURL?: string;
}

export async function listChaptersByAnime(animeId: string): Promise<ChapterDto[]> {
  return api.get<ChapterDto[]>(`/anime/${animeId}/chapters`);
}

export async function createChapter(animeId: string, input: CreateChapterInput): Promise<ChapterDto> {
  return api.post<ChapterDto>(`/anime/${animeId}/chapters`, input);
}

export async function updateChapter(id: string, input: UpdateChapterInput): Promise<ChapterDto> {
  return api.patch<ChapterDto>(`/chapters/${id}`, input);
}

export async function deleteChapter(id: string): Promise<void> {
  await api.delete<undefined>(`/chapters/${id}`);
}
