import { z } from "zod";
import { nonEmptyMax, urlString } from "./zod-helpers";

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

/** HTTP body for POST /anime/:animeId/chapters */
export const CreateChapterInputSchema = z
  .object({
    number: z.number().int(),
    title: nonEmptyMax(200).optional(),
    videoURL: urlString.optional(),
    coverImageURL: urlString.optional(),
  })
  .strict();

export type CreateChapterInput = z.infer<typeof CreateChapterInputSchema>;

/** HTTP body for PATCH /chapters/:id */
export const UpdateChapterInputSchema = z
  .object({
    number: z.number().int().optional(),
    title: nonEmptyMax(200).optional(),
    videoURL: urlString.optional(),
    coverImageURL: urlString.optional(),
  })
  .strict();

export type UpdateChapterInput = z.infer<typeof UpdateChapterInputSchema>;
