import { apiUrl } from "@config";
import { throwApiError } from "@ania/api-contract/error";
import type {
  WeeklyScheduleDto,
  WeeklyScheduleHistoryEntryDto,
  UpdateWeeklyScheduleInput,
} from "@ania/api-contract/weekly-schedule";
import type { UploadMediaResult } from "@ania/api-contract/media";
import type {
  AnimeDto,
  CreateAnimeInput,
  UpdateAnimeInput,
} from "@ania/api-contract/anime";
import type {
  ChapterDto,
  CreateChapterInput,
  UpdateChapterInput,
} from "@ania/api-contract/chapter";
import type {
  NavItemsDto,
  CreateNavItemsInput,
  UpdateNavItemsInput,
} from "@ania/api-contract/nav-items";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${apiUrl}${path}`, opts);

  if (!res.ok) await throwApiError(res);

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

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

export async function updateWeeklySchedule(
  id: string,
  input: UpdateWeeklyScheduleInput,
): Promise<WeeklyScheduleDto> {
  return api.patch<WeeklyScheduleDto>(`/weekly-schedule/${id}`, input);
}

export async function uploadMediaFile(file: File): Promise<UploadMediaResult> {
  const formData = new FormData();
  formData.set("file", file);

  const res = await fetch(`${apiUrl}/media/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) await throwApiError(res);

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

  if (!res.ok) await throwApiError(res);

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

  if (!res.ok) await throwApiError(res);

  return res.json();
}

// Anime

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

// Nav Items

export async function listNavItems(includeInactive = false): Promise<NavItemsDto[]> {
  const params = new URLSearchParams();
  if (!includeInactive) params.set("activeOnly", "true");
  const query = params.toString();
  return api.get<NavItemsDto[]>(`/navItems${query ? `?${query}` : ""}`);
}

export async function getNavItemsById(id: string): Promise<NavItemsDto> {
  return api.get<NavItemsDto>(`/navItems/${id}`);
}

export async function createNavItems(input: CreateNavItemsInput): Promise<NavItemsDto> {
  return api.post<NavItemsDto>("/navItems", input);
}

export async function updateNavItems(id: string, input: UpdateNavItemsInput): Promise<NavItemsDto> {
  return api.patch<NavItemsDto>(`/navItems/${id}`, input);
}

export async function deleteNavItems(id: string): Promise<void> {
  await api.delete<undefined>(`/navItems/${id}`);
}

export async function restoreNavItems(id: string): Promise<NavItemsDto> {
  return api.post<NavItemsDto>(`/navItems/${id}/restore`);
}