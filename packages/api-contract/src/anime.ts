import type { SoftDeleteLastAction } from "./soft-delete";

export type AnimeLastAction = SoftDeleteLastAction;

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
