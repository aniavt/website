import { z } from "zod";
import type { SoftDeleteLastAction } from "@ania/domain-shared/soft-delete";
import { ANIME_STATUSES } from "@ania/domain-shared/anime";
import type { AnimeStatus } from "@ania/domain-shared/anime";
import { nonEmptyMax, urlString } from "./zod-helpers";

export interface AnimeDto {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImageURL?: string;
  readonly genre: string;
  readonly status: AnimeStatus;
  readonly active: boolean;
  readonly lastAction: SoftDeleteLastAction;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const animeStatusSchema = z.enum(ANIME_STATUSES);

export const CreateAnimeInputSchema = z
  .object({
    title: nonEmptyMax(200),
    description: z.string().max(5000).optional(),
    coverImageURL: urlString.optional(),
    genre: nonEmptyMax(100),
    status: animeStatusSchema,
  })
  .strict();

export type CreateAnimeInput = z.infer<typeof CreateAnimeInputSchema>;

export const UpdateAnimeInputSchema = z
  .object({
    title: nonEmptyMax(200).optional(),
    description: z.string().max(5000).optional(),
    coverImageURL: urlString.optional(),
    genre: nonEmptyMax(100).optional(),
    status: animeStatusSchema.optional(),
  })
  .strict();

export type UpdateAnimeInput = z.infer<typeof UpdateAnimeInputSchema>;
