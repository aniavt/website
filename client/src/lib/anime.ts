import type { AnimeDto } from "@ania/api-contract/anime";
import type { ChapterDto } from "@ania/api-contract/chapter";
import { slugify } from "./slugify";

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
