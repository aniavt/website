export type AnimeStatus = "watching" | "completed" | "upcoming";

export interface AnimeDto {
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly coverImageURL?: string | null;
  readonly genre: string;
  readonly status: AnimeStatus;
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

function buildUrl(path: string): string {
  if (typeof window === "undefined") {
    const g =
      typeof globalThis !== "undefined"
        ? (globalThis as { process?: { env?: Record<string, string> } })
        : null;
    const envUrl = g?.process?.env?.PUBLIC_SERVER_URL;
    const base = envUrl || import.meta.env.PUBLIC_SERVER_URL || "";
    return `${base.replace(/\/+$/, "")}${path}`;
  }
  return `/api${path}`;
}

export async function listAnimes(): Promise<AnimeDto[]> {
  const res = await fetch(buildUrl("/anime?activeOnly=true"));
  if (!res.ok) throw new Error("anime_list_failed");
  return res.json();
}

export async function getAnimeBySlug(slug: string): Promise<AnimeDto | null> {
  const all = await listAnimes();
  return all.find((a) => slugify(a.title) === slug) ?? null;
}

export async function getAnime(id: string): Promise<AnimeDto | null> {
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
