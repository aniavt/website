export const ANIME_STATUSES = ["watching", "completed", "upcoming"] as const;
export type AnimeStatus = (typeof ANIME_STATUSES)[number];
