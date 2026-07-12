export type VariosStatus = "watching" | "completed" | "upcoming";

export interface VariosDto {
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly coverImageURL?: string | null;
  readonly genre: string;
  readonly status: VariosStatus;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ChapterDto {
  readonly id: string;
  readonly animeId: string;
  readonly number: number;
  readonly title?: string | null;
  readonly videoURL?: string | null;
  readonly coverImageURL?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildUrl(path: string) {
  const PUBLIC_API = import.meta.env.PUBLIC_SERVER_URL || '/api';
  const SERVER_API = import.meta.env.SERVER_URL || 'http://server:3000';
  const base = import.meta.env.SSR ? SERVER_API : PUBLIC_API;
  return `${base}${path}`;
}

export async function listAnimes(): Promise<VariosDto[]> {
  const res = await fetch(buildUrl("/anime?activeOnly=true&isSeasonalAnime=false"));
  if (!res.ok) throw new Error("anime_list_failed");
  return res.json();
}

export async function getAnimeBySlug(slug: string): Promise<VariosDto | null> {
  const all = await listAnimes();
  return all.find((a) => slugify(a.title) === slug) ?? null;
}

export async function getAnime(id: string): Promise<VariosDto | null> {
  const res = await fetch(buildUrl(`/anime/${id}`));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("anime_get_failed");
  return res.json();
}

export async function listChaptersByAnime(
  animeId: string,
): Promise<ChapterDto[]> {
  const res = await fetch(buildUrl(`/anime/${animeId}/chapters`));
  if (!res.ok) throw new Error("chapters_list_failed");
  return res.json();
}
