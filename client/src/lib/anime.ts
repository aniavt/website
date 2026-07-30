import type { AnimeDto } from "@ania/api-contract/anime";
import type { ChapterDto } from "@ania/api-contract/chapter";
import { throwApiError } from "@ania/api-contract/error";
import { buildApiUrl } from "./buildApiUrl";
import { slugify } from "./slugify";

export async function listAnimes(): Promise<AnimeDto[]> {
  const res = await fetch(buildApiUrl("/anime?activeOnly=true"));
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function getAnimeBySlug(slug: string): Promise<AnimeDto | null> {
  const all = await listAnimes();
  return all.find((a) => slugify(a.title) === slug) ?? null;
}

export async function getAnime(id: string): Promise<AnimeDto | null> {
  const res = await fetch(buildApiUrl(`/anime/${id}`));
  if (res.status === 404) return null;
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function listChaptersByAnime(
  animeId: string,
): Promise<ChapterDto[]> {
  const res = await fetch(buildApiUrl(`/anime/${animeId}/chapters`));
  if (!res.ok) await throwApiError(res);
  return res.json();
}
